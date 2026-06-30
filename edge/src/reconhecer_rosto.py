# -*- coding: utf-8 -*-
import os 
import sys 
import time
import logging 
import cv2
import numpy as np
import requests

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------------------
# Configurações de Log
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s", datefmt="%H:%M:%S")
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configurações de Bancada e Integração
# ---------------------------------------------------------------------------
URL_BACKEND = "http://localhost:3001/api"
MODELO_YML = os.path.join(BASE_DIR, "classificador_lbph.yml")
MODELO_LABELS = os.path.join(BASE_DIR, "classificador_lbph_labels.npy")
CASCADE_PATH = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"

# 🎯 Stream do DroidCam no Celular
# Nota: Se o Wi-Fi falhar, altere de "http://..." para 0 para usar o DroidCam via Cabo USB
CAMERA_INDEX = "http://172.20.10.1:4747/video" 

# ID da Área no PostgreSQL (Ex: Sala de Alta Tensão)
AREA_ID_ALVO = "7aed5dab-311a-4ed2-8b7f-828129832998" 

THRESHOLD_CONFIANCA = 60.0 
COOLDOWN_REGISTRO = 8     # Tempo em segundos para a mesma pessoa passar de novo

def main():
    # ---------------------------------------------------------------------------
    # 1. Inicialização dos Modelos de IA
    # ---------------------------------------------------------------------------
    if not os.path.exists(MODELO_YML) or not os.path.exists(MODELO_LABELS):
        logger.error("Modelos não encontrados. Execute o Cadastro Facial via Angular primeiro.")
        sys.exit(1)

    reconhecedor = cv2.face.LBPHFaceRecognizer_create()
    reconhecedor.read(MODELO_YML)
    mapa_labels = np.load(MODELO_LABELS, allow_pickle=True).item()

    cascade = cv2.CascadeClassifier(CASCADE_PATH)
    
    # ---------------------------------------------------------------------------
    # 2. Conexão com o Hardware (Celular)
    # ---------------------------------------------------------------------------
    logger.info(f"Conectando à câmera: {CAMERA_INDEX}")
    
    # cv2.CAP_FFMPEG ajuda muito o OpenCV a entender streams HTTP no Windows
    cap = cv2.VideoCapture(CAMERA_INDEX, cv2.CAP_FFMPEG)

    if not cap.isOpened():
        logger.warning("Falha com CAP_FFMPEG, tentando modo padrão...")
        cap = cv2.VideoCapture(CAMERA_INDEX)
        if not cap.isOpened():
            logger.error(f"Câmera indisponível: {CAMERA_INDEX}. Verifique o Wi-Fi ou mude CAMERA_INDEX para 0 (USB).")
            sys.exit(1)

    cv2.namedWindow("AccessPIM AI - Simulador de Catraca", cv2.WINDOW_AUTOSIZE)

    # ---------------------------------------------------------------------------
    # 3. Estados da Catraca e Memória de Curto Prazo
    # ---------------------------------------------------------------------------
    historico_registro = {}
    estado_catraca = "ESPERA"  # ESPERA, LIBERADA, BLOQUEADA
    timestamp_estado = 0.0
    nome_usuario_detectado = ""

    logger.info("🎬 SIMULADOR VISUAL DE CATRACA INICIADO. Aguardando faces...")

    try:
        while True:
            ret, camera_frame = cap.read()
            if not ret: 
                logger.warning("Falha ao ler frame da câmera. Tentando novamente...")
                time.sleep(0.5)
                continue
            
            # Ajuste de imagem para Totem Vertical
            camera_frame = cv2.rotate(camera_frame, cv2.ROTATE_90_CLOCKWISE)
            camera_frame = cv2.resize(camera_frame, (400, 500))
            
            agora = time.time()

            # Reseta o painel após 4 segundos
            if estado_catraca != "ESPERA" and (agora - timestamp_estado > 4.0):
                estado_catraca = "ESPERA"
                nome_usuario_detectado = ""

            cinza = cv2.cvtColor(camera_frame, cv2.COLOR_BGR2GRAY)
            faces = cascade.detectMultiScale(cinza, scaleFactor=1.1, minNeighbors=5, minSize=(90, 90))
            
            cor_moldura = (0, 165, 255) # Laranja padrão
            
            # ---------------------------------------------------------------------------
            # 4. Pipeline de Reconhecimento e Integração REST
            # ---------------------------------------------------------------------------
            for (x, y, w, h) in faces:
                roi = cinza[y:y+h, x:x+w]
                roi_resized = cv2.resize(roi, (200, 200))
                
                label_sequencial, confianca = reconhecedor.predict(roi_resized)
                
                # Exibe a distância de erro sobre a face
                cv2.putText(camera_frame, f"Dist: {int(confianca)}", (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, cor_moldura, 2)
                
                if confianca <= THRESHOLD_CONFIANCA:
                    colaborador_id = mapa_labels.get(label_sequencial, None)
                    
                    if colaborador_id:
                        ultimo_registro = historico_registro.get(colaborador_id, 0.0)
                        
                        # Evita "Double-Tap" (vários registros num espaço de 8 segundos)
                        if (agora - ultimo_registro) > COOLDOWN_REGISTRO and estado_catraca == "ESPERA":
                            historico_registro[colaborador_id] = agora
                            timestamp_estado = agora
                            
                            # Preparando o POST para o Node.js
                            try:
                                payload = {
                                    "colaborador_id": str(colaborador_id), 
                                    "area_id": AREA_ID_ALVO, 
                                    "tipo": "ENTRADA",
                                    "autorizado": True,
                                    "observacao": f"Acesso via Biometria (Dist: {int(confianca)})"
                                }
                                
                                headers = {
                                    "Authorization": "Bearer 1010-ACCESSPIM"
                                }
                                
                                endpoint_registro = f"{URL_BACKEND}/registro"
                                resposta = requests.post(endpoint_registro, json=payload, headers=headers, timeout=4)
                                
                                if resposta.status_code in [200, 201]:
                                    estado_catraca = "LIBERADA"
                                    nome_usuario_detectado = "ACESSO REGISTRADO"
                                    logger.info(f"[✅] Sucesso: Acesso do ID {colaborador_id} gravado na nuvem.")
                                else:
                                    estado_catraca = "BLOQUEADA"
                                    nome_usuario_detectado = "ACESSO NEGADO"
                                    logger.warning(f"[⚠️] Entrada recusada pelo Node.js. Status: {resposta.status_code}")
                                    
                            except requests.exceptions.RequestException as e:
                                estado_catraca = "BLOQUEADA"
                                nome_usuario_detectado = "ERRO DE REDE"
                                logger.error(f"[❌] Falha de comunicação com o servidor. Erro: {e}")

                # Altera a cor do quadrado no rosto de acordo com a catraca
                if estado_catraca == "LIBERADA":
                    cor_moldura = (0, 255, 0) # Verde
                elif estado_catraca == "BLOQUEADA":
                    cor_moldura = (0, 0, 255) # Vermelho

                cv2.rectangle(camera_frame, (x, y), (x+w, y+h), cor_moldura, 2)

            # ---------------------------------------------------------------------------
            # 5. CONSTRUÇÃO DO PAINEL VISUAL DA CATRACA (Interface do Totem)
            # ---------------------------------------------------------------------------
            painel_fisico = np.zeros((180, 400, 3), dtype=np.uint8)
            
            if estado_catraca == "ESPERA":
                cv2.rectangle(painel_fisico, (10, 10), (390, 170), (130, 50, 0), -1) 
                cv2.putText(painel_fisico, "[ APARELHO PRONTO ]", (95, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                cv2.putText(painel_fisico, "APRESENTE SUA BIOMETRIA", (70, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)
                cv2.putText(painel_fisico, "STATUS: TRANCA ATIVA", (90, 140), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 165, 255), 1)

            elif estado_catraca == "LIBERADA":
                cv2.rectangle(painel_fisico, (10, 10), (390, 170), (0, 120, 0), -1) 
                cv2.putText(painel_fisico, ">>> ACESSO PERMITIDO <<<", (65, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                cv2.putText(painel_fisico, "CATRACA LIBERADA", (100, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                seta = "---> --->" if int(time.time() * 2) % 2 == 0 else " ---> ---> "
                cv2.putText(painel_fisico, seta, (140, 145), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

            elif estado_catraca == "BLOQUEADA":
                cv2.rectangle(painel_fisico, (10, 10), (390, 170), (0, 0, 150), -1) 
                cv2.putText(painel_fisico, "X    ACESSO BLOQUEADO    X", (60, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                cv2.putText(painel_fisico, nome_usuario_detectado, (115, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                cv2.putText(painel_fisico, "CONSULTE A PORTARIA", (100, 140), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)

            # Junta o vídeo da câmera (topo) com o painel físico da catraca (base)
            totem_completo = np.vstack((camera_frame, painel_fisico))

            cv2.imshow("AccessPIM AI - Simulador de Catraca", totem_completo)
            
            # ESC ou 'q' para sair
            tecla = cv2.waitKey(1) & 0xFF
            if tecla == ord('q') or tecla == 27:
                logger.info("Encerrando por comando do operador.")
                break
            
    except KeyboardInterrupt:
        logger.info("Encerrando simulador (Ctrl+C)...")
    finally:
        cap.release()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main()