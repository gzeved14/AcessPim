import os
import logging
from dataclasses import dataclass, field
from typing import Optional
 
import cv2
import numpy as np
 
logger = logging.getLogger(__name__)
 
# ---------------------------------------------------------------------------
# Estruturas de resultado
# ---------------------------------------------------------------------------
 
@dataclass
class FaceMatch:
    """Resultado do reconhecimento facial."""
    colaborador_id: int       # ID local mapeado no treino; -1 = desconhecido
    confianca: float          # Score bruto LBPH (menor = melhor)
    confianca_pct: float      # Percentual legível: 100 - score normalizado
    reconhecido: bool         # True apenas se confiança >= threshold configurado
    bbox: tuple               # (x, y, w, h) da face detectada no frame
 
 
@dataclass
class EpiStatus:
    """Status de detecção de EPIs para uma área."""
    epis_detectados: list[str] = field(default_factory=list)
    epis_ausentes: list[str]   = field(default_factory=list)
    aprovado: bool             = False  # True somente se TODOS os obrigatórios foram detectados
 
 
# ---------------------------------------------------------------------------
# Cascades para detecção de EPIs
#
# Mapeamento: nome lógico do EPI → arquivo XML do OpenCV
#
# STATUS DE CADA CASCADE:
#
# "capacete" → SEM cascade nativa adequada no OpenCV pré-treinado.
#   Requer cascade customizada treinada com dataset de capacetes industriais.
#   AÇÃO NECESSÁRIA: treinar via `opencv_traincascade` com imagens do PIM
#   e salvar em edge/cascades/haarcascade_capacete.xml.
#   Enquanto não disponível, string vazia → fail-safe nega acesso com log claro.
#
# "oculos"   → haarcascade_eye.xml (nativa OpenCV)
#   Detecta a região dos olhos. Proxy válido para óculos de proteção:
#   se os óculos estiverem no rosto, a região ocular permanece detectável.
#   Limitação: óculos escuros ou de solda podem bloquear a detecção.
#
# "colete"   → haarcascade_upperbody.xml (nativa OpenCV)
#   Detecta o tronco superior. Proxy aceitável para colete de segurança:
#   a silhueta do tronco com colete difere o suficiente para detecções
#   básicas em condições controladas de iluminação.
#   Limitação: sensível a distância da câmera e ângulo do colaborador.
#
# "luvas"    → haarcascade_hand.xml (opencv-contrib)
#   Cascade específica para mãos, disponível no pacote opencv-contrib-python.
#   É a detecção mais próxima do ideal dentro do escopo nativo.
#   Limitação: luvas muito escuras ou reflexivas podem reduzir a acurácia.
# ---------------------------------------------------------------------------
EPI_CASCADES: dict[str, str] = {
    "capacete": "",                           # sem cascade adequada — fail-safe nega acesso
    "oculos":   "haarcascade_eye.xml",
    "colete":   "haarcascade_upperbody.xml",
    "luvas":    "haarcascade_hand.xml",
}
 
 
class FaceService:
    """
    Encapsula toda a lógica de visão computacional da borda.
 
    Uso típico:
        svc = FaceService()
        svc.carregar_modelo("classificador_lbph.yml")
 
        ret, frame = cap.read()
        match = svc.reconhecer(frame)
        if match and match.reconhecido:
            epi = svc.verificar_epis(frame, epis_obrigatorios=["oculos", "colete"])
    """
 
    LBPH_SCORE_MAXIMO: float   = 50.0
    CONFIANCA_MINIMA_PCT: float = 90.0
 
    def __init__(self, cascade_path: Optional[str] = None):
        """
        Args:
            cascade_path: Caminho absoluto ou relativo ao XML do Haar Cascade facial.
                          Se None, usa o padrão do OpenCV instalado.
        """
        self._modelo_lbph: Optional[cv2.face.LBPHFaceRecognizer] = None
        self._mapa_labels: dict[int, int] = {}  # label_treino → colaborador_id
 
        if cascade_path is None:
            cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
 
        if not os.path.exists(cascade_path):
            raise FileNotFoundError(f"Cascade facial não encontrado: {cascade_path}")
 
        self._cascade_face = cv2.CascadeClassifier(cascade_path)
        if self._cascade_face.empty():
            raise RuntimeError(f"Falha ao carregar CascadeClassifier: {cascade_path}")
 
        logger.info("FaceService inicializado. Cascade: %s", cascade_path)
 
    # ------------------------------------------------------------------
    # Gerenciamento do modelo LBPH
    # ------------------------------------------------------------------
 
    def carregar_modelo(self, caminho_yml: str) -> None:
        """
        Carrega o modelo LBPH previamente treinado pelo cadastrar_rosto.py.
 
        Raises:
            FileNotFoundError: Se o arquivo não existir (sistema ainda não treinado).
        """
        if not os.path.exists(caminho_yml):
            raise FileNotFoundError(
                f"Modelo LBPH não encontrado em '{caminho_yml}'. "
                "Execute cadastrar_rosto.py para treinar o sistema antes de usar a catraca."
            )
 
        self._modelo_lbph = cv2.face.LBPHFaceRecognizer_create()
        self._modelo_lbph.read(caminho_yml)
 
        mapa_path = caminho_yml.replace(".yml", "_labels.npy")
        if os.path.exists(mapa_path):
            dados = np.load(mapa_path, allow_pickle=True).item()
            self._mapa_labels = dados
            logger.info("Mapa de labels carregado: %d colaborador(es)", len(self._mapa_labels))
        else:
            logger.warning(
                "Arquivo de mapa de labels não encontrado (%s). "
                "O label retornado será usado diretamente como colaborador_id.", mapa_path
            )
 
        logger.info("Modelo LBPH carregado: %s", caminho_yml)
 
    def modelo_carregado(self) -> bool:
        """Retorna True se o modelo LBPH já foi carregado."""
        return self._modelo_lbph is not None
 
    # ------------------------------------------------------------------
    # Detecção e reconhecimento facial
    # ------------------------------------------------------------------
 
    def detectar_faces(self, frame: np.ndarray) -> list[tuple]:
        """
        Detecta todas as faces no frame usando Haar Cascade.
 
        Returns:
            Lista de tuplas (x, y, w, h) ou lista vazia se nenhuma face encontrada.
        """
        cinza = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = self._cascade_face.detectMultiScale(
            cinza,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(80, 80),
            flags=cv2.CASCADE_SCALE_IMAGE
        )
 
        # Checagem robusta do tipo numpy array para evitar AttributeError
        if isinstance(faces, np.ndarray) and len(faces) > 0:
            return [tuple(f) for f in faces]
        return []
 
    def reconhecer(self, frame: np.ndarray) -> Optional[FaceMatch]:
        """
        Detecta a face dominante no frame e tenta reconhecê-la via LBPH.
 
        Lógica de confiança (LBPH é uma distância — menor = melhor):
          - score == 0.0   → match perfeito (100%)
          - score >= 50.0  → muito distante do cadastro (0%)
          - confianca_pct  = clamp(100 - (score / LBPH_SCORE_MAXIMO) * 100, 0, 100)
 
        Returns:
            FaceMatch com o resultado, ou None se nenhuma face for detectada.
        """
        if not self.modelo_carregado():
            logger.error("reconhecer() chamado sem modelo LBPH carregado.")
            return None
 
        faces = self.detectar_faces(frame)
        if not faces:
            return None
 
        # Pega a face de maior área (mais próxima da câmera)
        face_principal = max(faces, key=lambda b: b[2] * b[3])
 
        # Garante que o bounding box possui exatamente 4 elementos
        if len(face_principal) != 4:
            return None
 
        x, y, w, h = face_principal
 
        cinza = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        roi = cinza[y:y + h, x:x + w]
 
        label, score = self._modelo_lbph.predict(roi)
 
        # Clamp: protege o cálculo para nunca retornar percentual fora de [0, 100]
        confianca_pct = 100.0 - (score / self.LBPH_SCORE_MAXIMO) * 100.0
        confianca_pct = max(0.0, min(100.0, confianca_pct))
 
        reconhecido = (
            score < self.LBPH_SCORE_MAXIMO
            and confianca_pct >= self.CONFIANCA_MINIMA_PCT
        )
 
        colaborador_id = self._mapa_labels.get(label, label)
 
        match = FaceMatch(
            colaborador_id=colaborador_id if reconhecido else -1,
            confianca=score,
            confianca_pct=confianca_pct,
            reconhecido=reconhecido,
            bbox=(x, y, w, h),
        )
 
        logger.debug(
            "Reconhecimento: label=%d score=%.2f confianca=%.1f%% reconhecido=%s",
            label, score, confianca_pct, reconhecido
        )
        return match
 
    # ------------------------------------------------------------------
    # Detecção de EPIs
    # ------------------------------------------------------------------
 
    def verificar_epis(
        self,
        frame: np.ndarray,
        epis_obrigatorios: list[str],
    ) -> EpiStatus:
        """
        Verifica presença dos EPIs obrigatórios parametrizados para a área.
 
        Comportamento fail-safe: se o cascade de um EPI não estiver disponível
        ou não estiver mapeado, o EPI é marcado como ausente e o acesso é negado.
        Nunca aprovado por omissão.
 
        Args:
            frame:             Frame BGR da câmera.
            epis_obrigatorios: Lista de EPIs exigidos pela área (ex: ["oculos", "colete"]).
 
        Returns:
            EpiStatus com detectados, ausentes e flag aprovado.
        """
        cinza = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        detectados: list[str] = []
        ausentes: list[str] = []
 
        for epi in epis_obrigatorios:
            cascade_xml = EPI_CASCADES.get(epi)
 
            # Cascade não mapeada ou string vazia (ex: capacete sem cascade dedicada)
            if cascade_xml is None or cascade_xml == "":
                logger.warning(
                    "EPI '%s' não possui cascade treinada disponível. "
                    "Acesso negado por segurança (fail-safe). "
                    "Para habilitar, treine uma cascade customizada e registre em EPI_CASCADES.",
                    epi
                )
                ausentes.append(epi)
                continue
 
            # Tenta localizar o XML: primeiro em edge/cascades/, depois no OpenCV padrão
            caminho_local = os.path.join(os.path.dirname(__file__), "..", "cascades", cascade_xml)
            caminho_cv2   = cv2.data.haarcascades + cascade_xml
 
            caminho = caminho_local if os.path.exists(caminho_local) else (
                caminho_cv2 if os.path.exists(caminho_cv2) else None
            )
 
            if caminho is None:
                logger.warning(
                    "Arquivo de cascade para EPI '%s' (%s) não encontrado. Negando.",
                    epi, cascade_xml
                )
                ausentes.append(epi)
                continue
 
            cascade_epi = cv2.CascadeClassifier(caminho)
            if cascade_epi.empty():
                logger.warning("Cascade para EPI '%s' carregou vazia. Negando.", epi)
                ausentes.append(epi)
                continue
 
            objetos = cascade_epi.detectMultiScale(
                cinza,
                scaleFactor=1.05,
                minNeighbors=4,
                minSize=(30, 30),
            )
 
            # Checagem robusta — mesma correção aplicada no detectar_faces
            if isinstance(objetos, np.ndarray) and len(objetos) > 0:
                detectados.append(epi)
            else:
                ausentes.append(epi)
 
        return EpiStatus(
            epis_detectados=detectados,
            epis_ausentes=ausentes,
            aprovado=(len(ausentes) == 0),
        )
 
    # ------------------------------------------------------------------
    # Utilitários de debug visual
    # ------------------------------------------------------------------
 
    def desenhar_resultado(
        self,
        frame: np.ndarray,
        match: Optional[FaceMatch],
        epi_status: Optional[EpiStatus] = None,
    ) -> np.ndarray:
        """
        Anota o frame com os resultados de reconhecimento e EPIs.
        Usar apenas em modo DEBUG_VISUAL=true — não em produção embarcada.
 
        Returns:
            Frame anotado (cópia — não modifica o original).
        """
        saida = frame.copy()
 
        if match is None:
            cv2.putText(saida, "Nenhuma face detectada", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 165, 255), 2)
            return saida
 
        x, y, w, h = match.bbox
        cor_box = (0, 200, 0) if match.reconhecido else (0, 0, 220)
        cv2.rectangle(saida, (x, y), (x + w, y + h), cor_box, 2)
 
        label_texto = (
            f"ID:{match.colaborador_id} {match.confianca_pct:.0f}%"
            if match.reconhecido
            else f"Desconhecido {match.confianca_pct:.0f}%"
        )
        cv2.putText(saida, label_texto, (x, y - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, cor_box, 2)
 
        if epi_status is not None:
            y_txt = y + h + 20
            for epi in epi_status.epis_detectados:
                cv2.putText(saida, f"[OK] {epi}", (x, y_txt),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 200, 0), 1)
                y_txt += 18
            for epi in epi_status.epis_ausentes:
                cv2.putText(saida, f"[X] {epi} AUSENTE", (x, y_txt),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 220), 1)
                y_txt += 18
 
        return saida
 