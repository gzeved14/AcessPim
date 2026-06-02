# -*- coding: utf-8 -*-
import cv2
import requests
import time

# URL do seu servidor Node.js local
URL_SERVIDOR = "http://localhost:3000/api/registro"

print("[EDGE] Inicializando modelos de Visão Computacional (Haar Cascade)...")

# Carrega o classificador nativo do OpenCV (já vem instalado com o pip install opencv-python)
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Inicializa a Captura da Webcam
video_capture = cv2.VideoCapture(0)

if not video_capture.isOpened():
    print("[ERRO] Não foi possível abrir a webcam do notebook.")
    exit()

print("\n" + "="*50)
print("      SISTEMA DE ACESSO ATIVO — VISÃO COMPUTACIONAL      ")
print("  DICA DE CONTROLE:")
print("  Pressione 'A' no teclado para simular AUTORIZADO (Gabriel)")
print("  Pressione 'N' no teclado para simular NEGADO (Estranho)")
print("  Pressione 'Q' na janela da câmera para fechar.")
print("="*50 + "\n")

ultimo_envio = 0
modo_simulado = "Autorizado"
nome_usuario = "Gabriel"
matricula_atual = "MAT002"

while True:
    ret, frame = video_capture.read()
    if not ret:
        break

    # Efeito espelho para o movimento ficar natural na tela
    frame = cv2.flip(frame, 1)

    # O Haar Cascade exige escala de cinza
    gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Detecta as coordenadas de qualquer rosto na tela
    rostos = face_cascade.detectMultiScale(gray_frame, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40))

    # Verifica se você pressionou alguma tecla com a janela da câmera em foco
    key = cv2.waitKey(1) & 0xFF
    if key == ord('a'):
        modo_simulado = "Autorizado"
        nome_usuario = "Gabriel"
        matricula_atual = "MAT002"
        print("[EDGE] Modo alterado para: GABRIEL (AUTORIZADO)")
    elif key == ord('n'):
        modo_simulado = "Negado"
        nome_usuario = "Desconhecido"
        matricula_atual = "MAT_UNK"
        print("[EDGE] Modo alterado para: DESCONHECIDO (NEGADO)")
    elif key == ord('q'):
        break

    for (x, y, w, h) in rostos:
        # Verde para autorizado, Vermelho para negado
        cor = (0, 255, 16) if modo_simulado == "Autorizado" else (0, 0, 255)
        
        # Desenha a caixa ao redor do rosto detectado
        cv2.rectangle(frame, (x, y), (x+w, y+h), color=cor, thickness=2)
        cv2.putText(frame, f"{nome_usuario} ({modo_simulado})", (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, cor, 2)

        # Envio assíncrono temporizado para a API (1 a cada 5 segundos)
        agora = time.time()
        if agora - ultimo_envio > 5:
            ultimo_envio = agora
            payload = {
                "matricula": matricula_atual,
                "area": "Sala de Servidores",
                "status": modo_simulado
            }
            print(f"\n[EDGE] Rosto Processado na Borda: {nome_usuario}")
            
            try:
                print(f"[EDGE] Despachando log para o servidor central...")
                resposta = requests.post(URL_SERVIDOR, json=payload, timeout=2)
                print(f"[NUVEM] Resposta obtida: {resposta.status_code}")
            except requests.exceptions.ConnectionError:
                print("[ALERTA] Servidor central offline. Salvando dados em cache local.")

    # Renderiza o feed da webcam na janela nativa
    cv2.imshow('AccessPIM AI - Hardware de Borda (OpenCV)', frame)

video_capture.release()
cv2.destroyAllWindows()
print("[EDGE] Script encerrado.")