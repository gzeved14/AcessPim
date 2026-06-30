import json
import logging
import os
import sqlite3
import threading
import time
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Any, Optional
 
import requests
 
logger = logging.getLogger(__name__)
 
# ---------------------------------------------------------------------------
# Configurações
# ---------------------------------------------------------------------------
 
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
FILA_DB     = os.path.join(BASE_DIR, "..", "fila_offline.db")   # SQLite local da catraca
 
TIMEOUT_REQUEST  = 5      # segundos — máximo que a borda espera pelo backend
MAX_TENTATIVAS   = 3      # tentativas antes de ir para fila offline
BACKOFF_BASE     = 1.0    # segundos — backoff exponencial: 1s, 2s, 4s...
INTERVALO_SYNC   = 30     # segundos entre ciclos de sincronização da fila offline
 
 
# ---------------------------------------------------------------------------
# Estrutura do payload de registro
# ---------------------------------------------------------------------------
 
@dataclass
class PayloadRegistro:
    """Representa um evento de acesso a ser enviado ao backend."""
    colaborador_id: int
    area_id: int
    tipo: str               # "entrada" | "saida"
    autorizado: bool
    timestamp: str          # ISO 8601 com timezone
    observacao: Optional[str] = None
 
 
# ---------------------------------------------------------------------------
# Gerenciamento da fila offline (SQLite)
# ---------------------------------------------------------------------------
 
class FilaOffline:
    """
    Fila persistente em SQLite para eventos que não puderam ser enviados ao backend.
    Thread-safe via lock explícito.
    """
 
    def __init__(self, caminho_db: str = FILA_DB):
        self._db = os.path.abspath(caminho_db)
        self._lock = threading.Lock()
        self._inicializar_schema()
 
    def _conectar(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self._db, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn
 
    def _inicializar_schema(self) -> None:
        """Cria a tabela de fila se não existir."""
        with self._lock:
            with self._conectar() as conn:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS fila_eventos (
                        id          INTEGER PRIMARY KEY AUTOINCREMENT,
                        payload     TEXT    NOT NULL,
                        criado_em   TEXT    NOT NULL,
                        tentativas  INTEGER NOT NULL DEFAULT 0,
                        ultimo_erro TEXT
                    )
                """)
                conn.commit()
        logger.debug("Schema da fila offline verificado: %s", self._db)
 
    def enfileirar(self, payload: PayloadRegistro) -> int:
        """
        Adiciona um evento à fila offline.
 
        Returns:
            ID do registro inserido.
        """
        with self._lock:
            with self._conectar() as conn:
                cursor = conn.execute(
                    "INSERT INTO fila_eventos (payload, criado_em) VALUES (?, ?)",
                    (json.dumps(asdict(payload)), datetime.now(timezone.utc).isoformat())
                )
                conn.commit()
                row_id = cursor.lastrowid
        logger.warning("Evento enfileirado offline. ID=%d | Colaborador=%d | Área=%d",
                       row_id, payload.colaborador_id, payload.area_id)
        return row_id
 
    def listar_pendentes(self, limite: int = 50) -> list[sqlite3.Row]:
        """Retorna os eventos mais antigos ainda não sincronizados."""
        with self._lock:
            with self._conectar() as conn:
                return conn.execute(
                    "SELECT * FROM fila_eventos ORDER BY id ASC LIMIT ?", (limite,)
                ).fetchall()
 
    def remover(self, evento_id: int) -> None:
        """Remove um evento da fila após sincronização bem-sucedida."""
        with self._lock:
            with self._conectar() as conn:
                conn.execute("DELETE FROM fila_eventos WHERE id = ?", (evento_id,))
                conn.commit()
 
    def registrar_falha(self, evento_id: int, erro: str) -> None:
        """Incrementa tentativas e registra o último erro para diagnóstico."""
        with self._lock:
            with self._conectar() as conn:
                conn.execute(
                    "UPDATE fila_eventos SET tentativas = tentativas + 1, ultimo_erro = ? WHERE id = ?",
                    (erro[:500], evento_id)
                )
                conn.commit()
 
    def total_pendentes(self) -> int:
        """Retorna o total de eventos aguardando sincronização."""
        with self._lock:
            with self._conectar() as conn:
                row = conn.execute("SELECT COUNT(*) as total FROM fila_eventos").fetchone()
                return row["total"]
 
 
# ---------------------------------------------------------------------------
# NetworkService — interface principal
# ---------------------------------------------------------------------------
 
class NetworkService:
    """
    Interface de comunicação entre a borda e o backend central.
 
    Uso:
        svc = NetworkService(base_url="http://192.168.1.100:3001", jwt_token="...")
        svc.iniciar_sync_automatico()  # inicia thread de sync em background
 
        ok = svc.enviar_registro(payload)
        # Se ok=False, o payload já foi salvo na fila offline automaticamente.
    """
 
    def __init__(self, base_url: str, jwt_token: str, caminho_db: str = FILA_DB):
        """
        Args:
            base_url:    URL base do backend (ex: "http://192.168.1.100:3001")
            jwt_token:   Token JWT gerado na autenticação da catraca
            caminho_db:  Caminho para o banco SQLite da fila offline
        """
        self._base_url   = base_url.rstrip("/")
        self._headers    = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {jwt_token}",
        }
        self._fila       = FilaOffline(caminho_db)
        self._sync_thread: Optional[threading.Thread] = None
        self._parar_sync  = threading.Event()
 
    # ------------------------------------------------------------------
    # Envio de registros
    # ------------------------------------------------------------------
 
    def enviar_registro(self, payload: PayloadRegistro) -> bool:
        """
        Envia um evento de acesso ao backend com retry automático.
 
        Comportamento:
          - Tenta até MAX_TENTATIVAS vezes com backoff exponencial
          - Se todas as tentativas falharem, persiste na fila offline
          - Nunca lança exceção — retorna bool para o chamador
 
        Args:
            payload: Dados do evento de acesso.
 
        Returns:
            True se enviado com sucesso; False se foi para a fila offline.
        """
        for tentativa in range(1, MAX_TENTATIVAS + 1):
            try:
                resposta = requests.post(
                    f"{self._base_url}/api/registro",
                    json=asdict(payload),
                    headers=self._headers,
                    timeout=TIMEOUT_REQUEST,
                )
                if resposta.status_code in (200, 201):
                    logger.info(
                        "Registro enviado com sucesso (tentativa %d). Colaborador=%d Área=%d Tipo=%s",
                        tentativa, payload.colaborador_id, payload.area_id, payload.tipo
                    )
                    return True
                else:
                    logger.warning(
                        "Backend retornou status %d na tentativa %d.",
                        resposta.status_code, tentativa
                    )
 
            except requests.exceptions.Timeout:
                logger.warning("Timeout na tentativa %d/%d.", tentativa, MAX_TENTATIVAS)
            except requests.exceptions.ConnectionError:
                logger.warning("Backend inacessível na tentativa %d/%d.", tentativa, MAX_TENTATIVAS)
            except requests.exceptions.RequestException as e:
                logger.error("Erro de requisição inesperado (tentativa %d): %s", tentativa, e)
 
            # Backoff exponencial entre tentativas (exceto na última)
            if tentativa < MAX_TENTATIVAS:
                espera = BACKOFF_BASE * (2 ** (tentativa - 1))
                logger.debug("Aguardando %.1fs antes da próxima tentativa...", espera)
                time.sleep(espera)
 
        # Todas as tentativas falharam — vai para a fila offline
        self._fila.enfileirar(payload)
        return False
 
    # ------------------------------------------------------------------
    # Consultas ao backend
    # ------------------------------------------------------------------
 
    def obter_epis_obrigatorios(self, area_id: int) -> list[str]:
        """
        Consulta o backend sobre quais EPIs são obrigatórios para uma área.
        Em caso de falha, retorna lista vazia (a catraca decide localmente).
 
        Args:
            area_id: ID da área restrita.
 
        Returns:
            Lista de nomes de EPIs (ex: ["capacete", "oculos"]).
        """
        try:
            resp = requests.get(
                f"{self._base_url}/api/areas/{area_id}/epis",
                headers=self._headers,
                timeout=TIMEOUT_REQUEST,
            )
            if resp.status_code == 200:
                dados = resp.json()
                return dados.get("epis_obrigatorios", [])
        except requests.exceptions.RequestException as e:
            logger.warning("Falha ao consultar EPIs da área %d: %s", area_id, e)
 
        return []
 
    def verificar_colaborador_ativo(self, colaborador_id: int) -> Optional[dict[str, Any]]:
        """
        Verifica no backend se o colaborador está ativo e autorizado para a área.
        Retorna None em caso de falha de rede (catraca usa cache local).
 
        Args:
            colaborador_id: ID do colaborador.
 
        Returns:
            Dict com dados do colaborador ou None se inacessível.
        """
        try:
            
            url_consulta = f"{self._base_url}/colaborador/{colaborador_id}"
            
            resp = requests.get(
                url_consulta,
                headers=self._headers,
                timeout=TIMEOUT_REQUEST,
            )
            print(f"👉 [STATUS DO NODE]: {resp.status_code} | Corpo: {resp.text}")
            
            if resp.status_code == 200:
                return resp.json()
        except requests.exceptions.RequestException as e:
            logger.warning("Falha ao verificar colaborador %d: %s", colaborador_id, e)
 
        return None
 
    # ------------------------------------------------------------------
    # Sincronização assíncrona da fila offline
    # ------------------------------------------------------------------
 
    def iniciar_sync_automatico(self) -> None:
        """
        Inicia uma thread daemon que tenta sincronizar a fila offline
        periodicamente a cada INTERVALO_SYNC segundos.
        Chame este método uma vez na inicialização da catraca.
        """
        if self._sync_thread and self._sync_thread.is_alive():
            logger.warning("Thread de sync já está em execução.")
            return
 
        self._parar_sync.clear()
        self._sync_thread = threading.Thread(
            target=self._loop_sync,
            name="NetworkSync",
            daemon=True,    # encerra automaticamente quando o processo principal encerra
        )
        self._sync_thread.start()
        logger.info("Thread de sincronização offline iniciada (intervalo: %ds).", INTERVALO_SYNC)
 
    def parar_sync_automatico(self) -> None:
        """Sinaliza para a thread de sync encerrar no próximo ciclo."""
        self._parar_sync.set()
 
    def _loop_sync(self) -> None:
        """
        Loop interno da thread de sincronização.
        Executa a cada INTERVALO_SYNC segundos ou até ser sinalizado para parar.
        """
        while not self._parar_sync.is_set():
            pendentes = self._fila.total_pendentes()
            if pendentes > 0:
                logger.info("Sync: %d evento(s) pendente(s) na fila offline.", pendentes)
                self._sincronizar_fila()
            else:
                logger.debug("Sync: fila offline vazia.")
 
            # Aguarda o próximo ciclo ou sinalização de parada
            self._parar_sync.wait(timeout=INTERVALO_SYNC)
 
    def _sincronizar_fila(self) -> None:
        """
        Tenta enviar cada evento da fila offline ao backend.
        Eventos enviados com sucesso são removidos da fila.
        """
        eventos = self._fila.listar_pendentes(limite=50)
 
        for evento in eventos:
            try:
                dados = json.loads(evento["payload"])
                payload = PayloadRegistro(**dados)
            except (json.JSONDecodeError, TypeError) as e:
                logger.error("Payload corrompido na fila (ID=%d): %s", evento["id"], e)
                self._fila.remover(evento["id"])
                continue
 
            try:
                resposta = requests.post(
                    f"{self._base_url}/api/registro",
                    json=asdict(payload),
                    headers=self._headers,
                    timeout=TIMEOUT_REQUEST,
                )
                if resposta.status_code in (200, 201):
                    self._fila.remover(evento["id"])
                    logger.info(
                        "Sync OK: evento ID=%d sincronizado. Colaborador=%d",
                        evento["id"], payload.colaborador_id
                    )
                else:
                    self._fila.registrar_falha(
                        evento["id"],
                        f"HTTP {resposta.status_code}: {resposta.text[:200]}"
                    )
            except requests.exceptions.RequestException as e:
                self._fila.registrar_falha(evento["id"], str(e))
                logger.warning(
                    "Sync falhou para evento ID=%d: %s. Será tentado no próximo ciclo.", evento["id"], e
                )
                # Se o backend caiu, para o ciclo atual para não gerar flood de erros
                break
    
    