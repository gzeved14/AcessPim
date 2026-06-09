# -*- coding: utf-8 -*-

import requests
import time
import os
import sys
import logging
 
import cv2
import numpy as np
 
# ---------------------------------------------------------------------------
# Configurações
# ---------------------------------------------------------------------------

URL_SERVIDOR = "http://localhost:3000/api/registro" 
BASE_DIR        = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR     = os.path.join(BASE_DIR, "dataset")
MODELO_YML      = os.path.join(BASE_DIR, "classificador_lbph.yml")
MODELO_LABELS   = os.path.join(BASE_DIR, "classificador_lbph_labels.npy")
 
AMOSTRAS_POR_COLABORADOR = 50   # Número de frames capturados por cadastro
CAMERA_INDEX             = 0    # Índice da câmera (0 = padrão do sistema)
 
CASCADE_PATH = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
 
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)
 
 
# ---------------------------------------------------------------------------
# Funções auxiliares
# ---------------------------------------------------------------------------
 
def garantir_diretorios() -> None:
    """Cria as pastas necessárias se não existirem."""
    os.makedirs(DATASET_DIR, exist_ok=True)
 
 
def capturar_amostras(colaborador_id: int) -> int:
    """
    Abre a câmera e captura amostras do rosto do colaborador.
 
    Args:
        colaborador_id: ID numérico do colaborador no banco de dados.
 
    Returns:
        Número de amostras salvas com sucesso.
    """
    pasta_colaborador = os.path.join(DATASET_DIR, str(colaborador_id))
    os.makedirs(pasta_colaborador, exist_ok=True)
 
    # Remove amostras antigas para evitar drift no modelo
    existentes = [f for f in os.listdir(pasta_colaborador) if f.endswith(".jpg")]
    if existentes:
        logger.info("Removendo %d amostras anteriores de ID=%d...", len(existentes), colaborador_id)
        for f in existentes:
            os.remove(os.path.join(pasta_colaborador, f))
 
    cascade = cv2.CascadeClassifier(CASCADE_PATH)
    if cascade.empty():
        raise RuntimeError(f"Falha ao carregar cascade: {CASCADE_PATH}")
 
    cap = cv2.VideoCapture(CAMERA_INDEX)
    if not cap.isOpened():
        raise RuntimeError(f"Câmera {CAMERA_INDEX} não disponível.")
 
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
 
    contador = 0
    logger.info("Câmera aberta. Posicione o rosto e pressione ESPAÇO para capturar.")
    logger.info("Serão capturadas %d amostras. Pressione Q para cancelar.", AMOSTRAS_POR_COLABORADOR)
 
    while contador < AMOSTRAS_POR_COLABORADOR:
        ret, frame = cap.read()
        if not ret:
            logger.warning("Frame inválido da câmera. Tentando novamente...")
            continue
 
        cinza = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = cascade.detectMultiScale(
            cinza,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(80, 80),
        )
 
        # Feedback visual em tempo real
        visualizacao = frame.copy()
        for (x, y, w, h) in faces:
            cv2.rectangle(visualizacao, (x, y), (x + w, y + h), (0, 200, 0), 2)
 
        status_texto = f"ID:{colaborador_id} | Amostras: {contador}/{AMOSTRAS_POR_COLABORADOR}"
        cv2.putText(visualizacao, status_texto, (10, 25),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
        cv2.putText(visualizacao, "ESPACO=Capturar | Q=Sair", (10, 55),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (200, 200, 200), 1)
 
        cv2.imshow("AccessPIM AI — Cadastro de Rosto", visualizacao)
 
        tecla = cv2.waitKey(1) & 0xFF
 
        # ESPAÇO captura manualmente; modo automático captura se face detectada
        capturar_agora = (tecla == ord(' ')) or (len(faces) > 0 and tecla == 255)
 
        if tecla == ord('q') or tecla == 27:   # Q ou ESC cancela
            logger.info("Cadastro cancelado pelo usuário.")
            break
 
        if capturar_agora and len(faces) > 0:
            # Salva a maior face detectada
            x, y, w, h = max(faces, key=lambda b: b[2] * b[3])
            roi = cinza[y:y + h, x:x + w]
            roi_resized = cv2.resize(roi, (200, 200))   # normalizar dimensão para o LBPH
 
            nome_arquivo = os.path.join(pasta_colaborador, f"sample_{contador:03d}.jpg")
            cv2.imwrite(nome_arquivo, roi_resized)
            contador += 1
 
            # Flash de feedback
            cv2.putText(visualizacao, f"Amostra {contador} salva!", (10, 90),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 100), 2)
            cv2.imshow("AccessPIM AI — Cadastro de Rosto", visualizacao)
            cv2.waitKey(80)
 
    cap.release()
    cv2.destroyAllWindows()
    return contador
 
 
def treinar_modelo() -> tuple[int, dict]:
    """
    Lê todas as amostras do dataset e treina (ou re-treina) o modelo LBPH.
 
    Returns:
        Tupla (total_amostras_usadas, mapa_labels).
        mapa_labels: {label_int: colaborador_id_int}
    """
    imagens: list[np.ndarray] = []
    labels: list[int] = []
    mapa_labels: dict[int, int] = {}   # label sequencial → colaborador_id real
 
    pastas = [
        d for d in os.listdir(DATASET_DIR)
        if os.path.isdir(os.path.join(DATASET_DIR, d)) and d.isdigit()
    ]
 
    if not pastas:
        raise RuntimeError(
            f"Nenhuma pasta de colaborador encontrada em '{DATASET_DIR}'. "
            "Cadastre pelo menos um colaborador antes de treinar."
        )
 
    label_sequencial = 0
    for pasta in sorted(pastas, key=int):
        colaborador_id = int(pasta)
        mapa_labels[label_sequencial] = colaborador_id
        pasta_path = os.path.join(DATASET_DIR, pasta)
 
        amostras_pasta = [
            f for f in os.listdir(pasta_path) if f.endswith(".jpg")
        ]
 
        for arquivo in sorted(amostras_pasta):
            img_path = os.path.join(pasta_path, arquivo)
            img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
            if img is None:
                logger.warning("Amostra corrompida ignorada: %s", img_path)
                continue
            imagens.append(img)
            labels.append(label_sequencial)
 
        logger.info(
            "Colaborador ID=%d → label=%d | %d amostras carregadas",
            colaborador_id, label_sequencial, len(amostras_pasta)
        )
        label_sequencial += 1
 
    if not imagens:
        raise RuntimeError("Nenhuma imagem válida encontrada no dataset. Verifique as amostras.")
 
    logger.info("Treinando LBPH com %d imagens de %d colaborador(es)...", len(imagens), label_sequencial)
 
    reconhecedor = cv2.face.LBPHFaceRecognizer_create(
        radius=1,
        neighbors=8,
        grid_x=8,
        grid_y=8,
        threshold=50.0,    # alinhado com FaceService.LBPH_SCORE_MAXIMO
    )
    reconhecedor.train(imagens, np.array(labels))
    reconhecedor.save(MODELO_YML)
 
    # Salva o mapa de labels como arquivo companion
    np.save(MODELO_LABELS, mapa_labels)
 
    logger.info("Modelo salvo em: %s", MODELO_YML)
    logger.info("Mapa de labels salvo em: %s", MODELO_LABELS)
 
    return len(imagens), mapa_labels
 
 
# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
 
def main() -> None:
    garantir_diretorios()
 
    print("\n" + "=" * 55)
    print("  AccessPIM AI — Cadastro de Colaborador (Borda)")
    print("=" * 55)
 
    # Solicita o ID do colaborador com validação
    while True:
        entrada = input("\nInforme o colaborador_id (número inteiro): ").strip()
        if entrada.isdigit() and int(entrada) > 0:
            colaborador_id = int(entrada)
            break
        print("  [ERRO] ID inválido. Digite um número inteiro positivo.")
 
    print(f"\n  Colaborador selecionado: ID = {colaborador_id}")
    print("  Iniciando captura de câmera...")
    print("  Dica: Mova levemente a cabeça entre capturas para variar as amostras.\n")
 
    try:
        amostras_capturadas = capturar_amostras(colaborador_id)
    except RuntimeError as e:
        logger.error("Erro na captura: %s", e)
        sys.exit(1)
 
    if amostras_capturadas == 0:
        logger.warning("Nenhuma amostra capturada. O modelo não será re-treinado.")
        sys.exit(0)
 
    logger.info("%d amostras capturadas para ID=%d.", amostras_capturadas, colaborador_id)
 
    print("\n  Treinando modelo LBPH com todas as amostras do dataset...")
    try:
        total, mapa = treinar_modelo()
    except RuntimeError as e:
        logger.error("Erro no treino: %s", e)
        sys.exit(1)
 
    print("\n" + "=" * 55)
    print(f"  Treino concluído! {total} amostras | {len(mapa)} colaborador(es)")
    print(f"  Modelo salvo: {MODELO_YML}")
    print("=" * 55 + "\n")
 
 
if __name__ == "__main__":
    main()