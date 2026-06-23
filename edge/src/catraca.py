
import logging
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
 
import cv2
 
# Adiciona /edge/src ao path para imports locais
sys.path.insert(0, str(Path(__file__).parent / "src"))
 
from services.face_service import FaceMatch, FaceService
from network_service import NetworkService, PayloadRegistro
# URL do seu servidor Node.js local
URL_SERVIDOR = "http://localhost:3000/api/registro"
# ---------------------------------------------------------------------------
# Configuração de logging
# ---------------------------------------------------------------------------
 
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("catraca")
 
 
# ---------------------------------------------------------------------------
# Carregamento de configurações via .env
# ---------------------------------------------------------------------------
 
def _carregar_env() -> None:
    """Carrega variáveis do arquivo .env localizado no diretório do script."""
    env_path = Path(__file__).parent / ".env"
    if not env_path.exists():
        logger.warning(".env não encontrado em %s. Usando variáveis de ambiente do sistema.", env_path)
        return
    with open(env_path) as f:
        for linha in f:
            linha = linha.strip()
            if linha and not linha.startswith("#") and "=" in linha:
                chave, _, valor = linha.partition("=")
                os.environ.setdefault(chave.strip(), valor.strip())
 
 
_carregar_env()
 
BACKEND_URL   = os.environ.get("BACKEND_URL", "http://localhost:3000")
JWT_TOKEN     = os.environ.get("JWT_TOKEN", "")
AREA_ID       = int(os.environ.get("AREA_ID", "1"))
CAMERA_INDEX  = int(os.environ.get("CAMERA_INDEX", "0"))
MODELO_YML    = os.environ.get("MODELO_YML", str(Path(__file__).parent / "classificador_lbph.yml"))
DEBUG_VISUAL  = os.environ.get("DEBUG_VISUAL", "false").lower() == "true"
 
# Cooldown: tempo mínimo entre dois registros do mesmo colaborador (evita double-tap)
COOLDOWN_SEGUNDOS = 10
 
 
# ---------------------------------------------------------------------------
# Estado da catraca
# ---------------------------------------------------------------------------
 
class EstadoCatraca:
    """
    Mantém o estado runtime da catraca durante a execução do loop.
    Centraliza a lógica de cooldown e controle do relay.
    """
 
    def __init__(self):
        self._ultimo_registro: dict[int, float] = {}    # colaborador_id → timestamp do último registro
        self.modo_override: bool = False                # True quando operador assume controle manual
 
    def em_cooldown(self, colaborador_id: int) -> bool:
        """Retorna True se o colaborador registrou acesso há menos de COOLDOWN_SEGUNDOS."""
        ultimo = self._ultimo_registro.get(colaborador_id)
        if ultimo is None:
            return False
        return (time.monotonic() - ultimo) < COOLDOWN_SEGUNDOS
 
    def registrar_cooldown(self, colaborador_id: int) -> None:
        """Marca o momento do último registro para o colaborador."""
        self._ultimo_registro[colaborador_id] = time.monotonic()
 
    def acionar_relay(self, liberar: bool) -> None:
        """
        Aciona o relay físico da catraca.
        Em ambiente de desenvolvimento, apenas loga a ação.
        Em produção, substituir pelo comando GPIO/serial específico do hardware.
 
        Args:
            liberar: True = abre a catraca; False = mantém travada.
        """
        if liberar:
            logger.info("🔓 RELAY: CATRACA LIBERADA")
            # Exemplo de integração GPIO (Raspberry Pi):
            # import RPi.GPIO as GPIO
            # GPIO.output(RELAY_PIN, GPIO.HIGH)
            # time.sleep(3)
            # GPIO.output(RELAY_PIN, GPIO.LOW)
        else:
            logger.info("🔒 RELAY: CATRACA TRAVADA")
 
 
# ---------------------------------------------------------------------------
# Lógica de decisão de acesso
# ---------------------------------------------------------------------------
 
def decidir_acesso(
    match: FaceMatch,
    epis_ausentes: list[str],
    estado: EstadoCatraca,
) -> tuple[bool, str]:
    """
    Aplica as regras de negócio para decidir se o acesso é liberado.
 
    Regras (em ordem de verificação):
      1. Colaborador deve ser reconhecido com >= 90% de confiança
      2. Colaborador não pode estar em cooldown
      3. Todos os EPIs obrigatórios devem estar presentes
 
    Args:
        match:         Resultado do reconhecimento facial.
        epis_ausentes: Lista de EPIs não detectados.
        estado:        Estado runtime da catraca.
 
    Returns:
        Tupla (autorizado: bool, observacao: str).
    """
    if not match.reconhecido:
        return False, f"Rosto não reconhecido (confiança: {match.confianca_pct:.0f}%)"
 
    if estado.em_cooldown(match.colaborador_id):
        return False, f"Registro em cooldown para colaborador ID={match.colaborador_id}"
 
    if epis_ausentes:
        epis_str = ", ".join(epis_ausentes)
        return False, f"EPI(s) obrigatório(s) ausente(s): {epis_str}"
 
    return True, ""
 
 
# ---------------------------------------------------------------------------
# Processamento de frame
# ---------------------------------------------------------------------------
 
def processar_frame(
    frame,
    face_svc: FaceService,
    network_svc: NetworkService,
    epis_obrigatorios: list[str],
    estado: EstadoCatraca,
) -> None:
    """
    Pipeline completo de processamento de um frame:
      1. Reconhecimento facial
      2. Verificação de EPIs
      3. Decisão de acesso
      4. Acionamento do relay
      5. Envio do registro ao backend
 
    Args:
        frame:              Frame BGR capturado da câmera.
        face_svc:           Instância do FaceService.
        network_svc:        Instância do NetworkService.
        epis_obrigatorios:  EPIs requeridos pela área.
        estado:             Estado runtime da catraca.
    """
    # --- 1. Reconhecimento facial ---
    match = face_svc.reconhecer(frame)
    if match is None:
        return   # Nenhuma face no frame — aguarda próximo ciclo
 
    # --- 2. Verificação de EPIs ---
    epi_status = face_svc.verificar_epis(frame, epis_obrigatorios)
 
    # --- 3. Decisão de acesso ---
    autorizado, observacao = decidir_acesso(match, epi_status.epis_ausentes, estado)
 
    # --- 4. Acionamento do relay ---
    estado.acionar_relay(autorizado)
 
    # --- 5. Cooldown para evitar registros duplicados ---
    if match.reconhecido:
        estado.registrar_cooldown(match.colaborador_id)
 
    # --- 6. Construção e envio do payload ---
    payload = PayloadRegistro(
        colaborador_id=match.colaborador_id if match.reconhecido else -1,
        area_id=AREA_ID,
        tipo="entrada",                              # Lógica de entrada/saída: expandir com sensor de direção
        autorizado=autorizado,
        timestamp=datetime.now(timezone.utc).isoformat(),
        observacao=observacao if observacao else None,
    )
 
    sucesso = network_svc.enviar_registro(payload)
 
    nivel_log = logging.INFO if autorizado else logging.WARNING
    logger.log(
        nivel_log,
        "Acesso %s | Colaborador=%d | Área=%d | EPI=%s | Rede=%s | Obs: %s",
        "LIBERADO" if autorizado else "NEGADO",
        payload.colaborador_id,
        AREA_ID,
        "OK" if epi_status.aprovado else f"AUSENTE={epi_status.epis_ausentes}",
        "OK" if sucesso else "OFFLINE(fila)",
        observacao or "-",
    )
 
    # --- 7. Feedback visual (modo debug) ---
    if DEBUG_VISUAL:
        frame_anotado = face_svc.desenhar_resultado(frame, match, epi_status)
        cv2.imshow("AccessPIM AI — Monitor", frame_anotado)
 
 
# ---------------------------------------------------------------------------
# Loop principal
# ---------------------------------------------------------------------------
 
def main() -> None:
    logger.info("=" * 55)
    logger.info("  AccessPIM AI — Catraca Iniciando")
    logger.info("  Backend: %s | Área: %d", BACKEND_URL, AREA_ID)
    logger.info("=" * 55)
 
    # --- Validações de pré-condição ---
    if not JWT_TOKEN:
        logger.error("JWT_TOKEN não definido no .env. A catraca não pode se autenticar.")
        sys.exit(1)
 
    # --- Inicialização dos serviços ---
    try:
        face_svc = FaceService()
        face_svc.carregar_modelo(MODELO_YML)
    except FileNotFoundError as e:
        logger.error("Modelo LBPH não encontrado: %s", e)
        logger.error("Execute 'python cadastrar_rosto.py' antes de iniciar a catraca.")
        sys.exit(1)
    except RuntimeError as e:
        logger.error("Falha ao inicializar FaceService: %s", e)
        sys.exit(1)
 
    network_svc = NetworkService(base_url=BACKEND_URL, jwt_token=JWT_TOKEN)
    network_svc.iniciar_sync_automatico()
 
    # --- Obtém EPIs obrigatórios da área (com fallback offline) ---
    epis_obrigatorios = network_svc.obter_epis_obrigatorios(AREA_ID)
    if epis_obrigatorios:
        logger.info("EPIs obrigatórios para área %d: %s", AREA_ID, epis_obrigatorios)
    else:
        logger.warning(
            "Não foi possível obter EPIs da área %d. Operando sem validação de EPI.", AREA_ID
        )
 
    # --- Câmera ---
    cap = cv2.VideoCapture(CAMERA_INDEX)
    if not cap.isOpened():
        logger.error("Câmera %d não disponível. Verifique a conexão.", CAMERA_INDEX)
        sys.exit(1)
 
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    cap.set(cv2.CAP_PROP_FPS, 15)
 
    estado = EstadoCatraca()
 
    logger.info("Loop principal iniciado. Pressione Q para encerrar.")
 
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                logger.warning("Frame inválido. Verificando câmera...")
                time.sleep(0.5)
                continue

            # 🔥 CORREÇÃO CRÍTICA: Captura a tecla SEMPRE para manter a janela do OpenCV responsiva
            # Mesmo se DEBUG_VISUAL for false, capturar o waitKey evita travamento de buffers
            tecla = cv2.waitKey(1) & 0xFF

            # --- 1. Escapes globais de encerramento ---
            if tecla == ord('q') or tecla == 27: # 'q' ou ESC
                logger.info("Encerrando por comando do operador.")
                break

            # --- 2. Modo override manual (Apenas se visualização estiver ativa) ---
            if DEBUG_VISUAL and tecla == ord('o'):
                # Override manual: libera a catraca e registra sem reconhecimento facial
                logger.warning("🚨 OVERRIDE MANUAL acionado pelo operador!")
                estado.acionar_relay(liberar=True)
                
                payload_override = PayloadRegistro(
                    colaborador_id=-1,
                    area_id=AREA_ID,
                    tipo="entrada",
                    autorizado=True,
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    observacao="Override manual pelo operador de segurança",
                )
                network_svc.enviar_registro(payload_override)
                continue

            # --- 3. Processamento normal do pipeline de IA ---
            processar_frame(frame, face_svc, network_svc, epis_obrigatorios, estado)

            # Pequena pausa para aliviar o uso de CPU em single-core/embarcados
            time.sleep(0.1)

    except KeyboardInterrupt:
        logger.info("Interrompido por KeyboardInterrupt (Ctrl+C).")
    finally:
        cap.release()
        if DEBUG_VISUAL:
            cv2.destroyAllWindows()
        network_svc.parar_sync_automatico()
        logger.info("Catraca encerrada com segurança.")
 
 
if __name__ == "__main__":
    main()