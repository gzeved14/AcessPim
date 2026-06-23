# -*- coding: utf-8 -*-
import os 
import sys 
import time
import logging 
import cv2
import numpy as np
import requests

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.join(BASE_DIR, 'src')
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s", datefmt="%H:%M:%S")
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configurações de Bancada
# ---------------------------------------------------------------------------
URL_BACKEND = "http://localhost:3000"
MODELO_YML = os.path.join(BASE_DIR, "classificador_lbph.yml")
MODELO_LABELS = os.path.join(BASE_DIR, "classificador_lbph_labels.npy")
CASCADE_PATH = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
CAMERA_INDEX = "http://172.20.10.1:4747/video" # IP do Hotspot do seu celular

THRESHOLD_CONFIANCA = 45.0 # Limiar estável para LBPH aceitar o rosto
COOLDOWN_REGISTRO = 10     # Segundos de espera para registrar a mesma pessoa

# ---------------------------------------------------------------------------
# Inicialização dos Componentes
# ---------------------------------------------------------------------------
if not os.path.exists(MODELO_YML) or not os.path.exists(MODELO_LABELS):
    logger.error("Modelos de reconhecimento não encontrados. Certifique-se de treinar o modelo antes de executar.")
    sys.exit(1)

reconhecedor = cv2.face.LBPHFaceRecognizer_create()
reconhecedor.read(MODELO_YML)
mapa_labels = np.load(MODELO_LABELS, allow_pickle=True).item()

cascade = cv2.CascadeClassifier(CASCADE_PATH)
cap = cv2.VideoCapture(CAMERA_INDEX)

if not cap.isOpened():
    logger.error("Câmera indisponível no endereço: %s", CAMERA_INDEX)
    sys.exit(1)

logger.info("Scanner Facial Ativo. Monitorando acessos...")

# Controle de Cooldown local e Estados de Hardware Simulados
historico_registro = {}
catraca_liberada = False
timestamp_liberacao = 0.0

# ---------------------------------------------------------------------------
# Loop Principal Contínuo
# ---------------------------------------------------------------------------
try:
    while True:
        ret, frame = cap.read()
        if not ret: 
            continue
        
        agora = time.time()

        # ⏳ SIMULAÇÃO NATIVA: Se a tranca passou 5s aberta, bloqueia automaticamente
        if catraca_liberada and (agora - timestamp_liberacao > 5.0):
            catraca_liberada = False
            logger.info("🔒 [MECANISMO] Tempo esgotado. Catraca travada novamente.")

        cinza = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = cascade.detectMultiScale(cinza, scaleFactor=1.1, minNeighbors=5, minSize=(100, 100))
        
        for (x, y, w, h) in faces:
            roi = cinza[y:y+h, x:x+w]
            roi_resized = cv2.resize(roi, (200, 200))
            
            # Executa a predição matemática do LBPH
            label_sequencial, confianca = reconhecedor.predict(roi_resized)
            
            cor_moldura = (0, 0, 255) # Vermelho por padrão (não identificado)
            nome_exibicao = "Desconhecido"
            
            if confianca <= THRESHOLD_CONFIANCA:
                colaborador_id = mapa_labels.get(label_sequencial, None)
                if colaborador_id:
                    nome_exibicao = f"ID: {colaborador_id}"
                    cor_moldura = (0, 255, 0) # Verde para identificado
                    
                    # Verificar se o colaborador saiu do tempo de Cooldown
                    ultimo_registro = historico_registro.get(colaborador_id, 0.0)
                    
                    if (agora - ultimo_registro) > COOLDOWN_REGISTRO:
                        logger.info("🎯 [ROSTO RECONHECIDO] Enviando validação para o Node.js para o ID: %s", colaborador_id)
                        historico_registro[colaborador_id] = agora
                        
                        # 📡 Conexão com o Back-end utilizando o Token de Máquina (M2M) do seu middleware
                        try:
                            payload = {"colaborador_id": colaborador_id}
                            headers = {"Authorization": "Bearer 1010-ACCESSPIM"}
                            
                            # Rota do endpoint centralizador de acessos do Node
                            resposta = requests.post(f"{URL_BACKEND}/api/colaboradores/registro-acesso", json=payload, headers=headers, timeout=3)
                            
                            if resposta.status_code == 201 or resposta.status_code == 200:
                                logger.info("🔓 [NODE RESPONSE] Acesso Autorizado!")
                                catraca_liberada = True
                                timestamp_liberacao = time.time()
                            else:
                                logger.warning("🔒 [NODE RESPONSE] Acesso Bloqueado pelas Regras de Negócio do Back-end.")
                                
                        except requests.exceptions.RequestException as e:
                            logger.error("🚨 Falha ao conectar na API do Node.js (Servidor Offline): %s", e)

            cv2.rectangle(frame, (x, y), (x+w, y+h), cor_moldura, 2)
            cv2.putText(frame, f"{nome_exibicao} ({int(confianca)})", (x, y-10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, cor_moldura, 2)

        # 🎨 RENDERIZAÇÃO DA COBERTURA VISUAL DA CATRACA NO OPENCV
        if catraca_liberada:
            # Barra Verde Indicativa de Acesso Liberado
            cv2.rectangle(frame, (0, 0), (frame.shape[1], 45), (0, 255, 0), -1)
            cv2.putText(frame, "🔓 TRANCA LIBERADA - COLOQUE O EPI E PASSE", (15, 30), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
        else:
            # Barra Vermelha de Catraca Bloqueada / Standby
            cv2.rectangle(frame, (0, 0), (frame.shape[1], 45), (0, 0, 255), -1)
            cv2.putText(frame, "🔒 CATRACA BLOQUEADA - AGUARDANDO BIOMETRIA", (15, 30), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

        # Renderiza a janela do terminal de monitoramento local
        cv2.imshow("AccessPIM AI - Loop de Reconhecimento", frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
        
except KeyboardInterrupt:
    logger.info("Encerrando scanner passivo...")

finally:
    cap.release()
    cv2.destroyAllWindows()