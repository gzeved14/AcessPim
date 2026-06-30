# -*- coding: utf-8 -*-
import os
import sys
import cv2
import numpy as np
import shutil
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "dataset")
CAMERA_INDEX = "http://172.20.10.1:4747/video"
CASCADE_PATH = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
MODELO_YML = os.path.join(BASE_DIR, "classificador_lbph.yml")
MODELO_LABELS = os.path.join(BASE_DIR, "classificador_lbph_labels.npy")
AMOSTRAS_POR_COLABORADOR = 50

def garantir_diretorios():
    os.makedirs(DATASET_DIR, exist_ok=True)

def capturar_amostras(uuid_colaborador: str) -> int:
    pasta_colaborador = os.path.join(DATASET_DIR, uuid_colaborador)
    os.makedirs(pasta_colaborador, exist_ok=True)

    cascade = cv2.CascadeClassifier(CASCADE_PATH)
    cap = cv2.VideoCapture(CAMERA_INDEX, cv2.CAP_FFMPEG)
    
    if not cap.isOpened():
        cap = cv2.VideoCapture(CAMERA_INDEX)
        if not cap.isOpened():
            logger.error(f"ERRO: Câmera indisponível no IP {CAMERA_INDEX}.")
            return 0

    contador = 0
    logger.info("Câmera aberta. Pressione a tecla ESPAÇO para capturar o rosto.")

    while contador < AMOSTRAS_POR_COLABORADOR:
        ret, frame = cap.read()
        if not ret: continue
        
        frame = cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)
        frame = cv2.resize(frame, (400, 500))
        cinza = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = cascade.detectMultiScale(cinza, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))

        visualizacao = frame.copy()
        for (x, y, w, h) in faces:
            cv2.rectangle(visualizacao, (x, y), (x + w, y + h), (0, 200, 0), 2)

        status_texto = f"Amostras: {contador}/{AMOSTRAS_POR_COLABORADOR}"
        cv2.putText(visualizacao, status_texto, (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
        cv2.putText(visualizacao, "ESPACO=Capturar Rosto", (10, 55), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (200, 200, 200), 1)

        cv2.imshow("AccessPIM - Cadastro", visualizacao)
        tecla = cv2.waitKey(1) & 0xFF

        if tecla == ord('q') or tecla == 27:
            break
            
        # Só captura e avança a contagem se apertar espaço e houver um rosto na mira
        if tecla == ord(' ') and len(faces) > 0:
            x, y, w, h = max(faces, key=lambda b: b[2] * b[3])
            roi = cinza[y:y + h, x:x + w]
            roi_resized = cv2.resize(roi, (200, 200))

            nome_arquivo = os.path.join(pasta_colaborador, f"sample_{contador:03d}.jpg")
            cv2.imwrite(nome_arquivo, roi_resized)
            contador += 1
            cv2.waitKey(80) # Pequeno atraso para dar feedback visual

    cap.release()
    cv2.destroyAllWindows()
    return contador

def treinar_modelo():
    logger.info("Iniciando treinamento LBPH e mapeamento de UUIDs...")
    imagens = []
    labels = []
    
    # Carrega o mapa antigo para não sobrepor UUIDs existentes
    mapa_labels = {}
    if os.path.exists(MODELO_LABELS):
        mapa_labels = np.load(MODELO_LABELS, allow_pickle=True).item()
        
    proximo_label = max(mapa_labels.keys()) + 1 if mapa_labels else 0

    pastas = [d for d in os.listdir(DATASET_DIR) if os.path.isdir(os.path.join(DATASET_DIR, d))]
    if not pastas:
        logger.error("Nenhuma pasta de colaborador encontrada.")
        return False

    for uuid_pasta in pastas:
        # Se for um recadastro, mantém o mesmo número inteiro (label) do OpenCV
        label_atual = None
        for key, val in mapa_labels.items():
            if val == uuid_pasta:
                label_atual = key
                break
        
        # Se for colaborador novo, atribui o próximo número inteiro livre
        if label_atual is None:
            label_atual = proximo_label
            mapa_labels[label_atual] = uuid_pasta
            proximo_label += 1

        pasta_path = os.path.join(DATASET_DIR, uuid_pasta)
        amostras = [f for f in os.listdir(pasta_path) if f.endswith(".jpg")]

        for arquivo in amostras:
            img_path = os.path.join(pasta_path, arquivo)
            img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
            if img is not None:
                imagens.append(img)
                labels.append(label_atual)

        logger.info(f"Colaborador {uuid_pasta} mapeado para Label Numérico OpenCV: {label_atual}")

    if not imagens:
        return False

    reconhecedor = cv2.face.LBPHFaceRecognizer_create()
    
    # [MAGIA DA ARQUITETURA]: Usa update() em vez de train() para a IA não esquecer os rostos velhos apagados pela LGPD
    if os.path.exists(MODELO_YML):
        logger.info("Arquivo YML antigo encontrado. Injetando novas faces (Update)...")
        reconhecedor.read(MODELO_YML)
        reconhecedor.update(imagens, np.array(labels))
    else:
        logger.info("Criando cérebro neural a partir do zero (Train)...")
        reconhecedor.train(imagens, np.array(labels))

    reconhecedor.save(MODELO_YML)
    np.save(MODELO_LABELS, mapa_labels)
    
    logger.info(f"Treinamento concluído com sucesso. Memória salva.")
    return True

def purgar_dados_lgpd(uuid_colaborador: str):
    logger.info("[LGPD] Expurgo de dados brutos iniciado...")
    pasta_colaborador = os.path.join(DATASET_DIR, uuid_colaborador)
    if os.path.exists(pasta_colaborador):
        shutil.rmtree(pasta_colaborador)
        logger.info(f"Fotos do rosto do ID {uuid_colaborador} devidamente apagadas do disco físico.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Erro: ID não fornecido.")
        sys.exit(1)

    # 🎯 Agora aceitamos a STRING pura do UUID! Sem crash.
    uuid_colaborador = sys.argv[1]

    garantir_diretorios()
    total = capturar_amostras(uuid_colaborador)
    
    if total > 0:
        if treinar_modelo():
            purgar_dados_lgpd(uuid_colaborador)
            logger.info("====== AUTOMAÇÃO DE BORDA FINALIZADA ======")
            sys.exit(0)
    
    sys.exit(1)