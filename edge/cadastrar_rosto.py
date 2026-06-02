# -*- coding: utf-8 -*-
import cv2
import requests
import time
import os

URL_SERVIDOR = "http://localhost:3000/api/registro"

print("[EDGE] Carregando algoritmos de reconhecimento...")
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Inicializa o reconhecedor facial LBPH do OpenCV
recognizer = cv2.face.LBPHFaceRecognizer_create()

if not os.path.exists('classificador_lbph.yml'):
    print("❌ [ERRO] Arquivo de treinamento não encontrado. Execute o 'cadastrar_rosto.py' primeiro!")
    exit()

recognizer.read('classificador_lbph.yml')

video_capture = cv2.VideoCapture(0)
ultimo_envio = 0

print("\n" + "="*50)
print("      SISTEMA DE ACESSO BIO-INTELIGENTE ATIVO      ")
print("  A IA agora vai reconhecer quem é você na câmera!")
print("="*50 + "\n")

while True:
    ret, frame = video_capture.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    rostos = face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(50, 50))

    for (x, y, w, h) in rostos:
        # A IA tenta adivinhar de quem é o rosto
        rosto_analise = gray[y:y+h, x:x+w]
        id_predito, confianca = recognizer.predict(rosto_analise)

        # No algoritmo LBPH, quanto MENOR a distância/confiança, mais parecido é.
        # Valor abaixo de 75 costuma ser um excelente match.
        if id_predito == 1 and confianca < 75:
            nome_usuario = "Eduardo"
            modo_acesso = "Autorizado"
            matricula_atual = "MAT001"
            cor = (0, 255, 16) # Verde
        else:
            nome_usuario = "Desconhecido"
            modo_acesso = "Negado"
            matricula_atual = "MAT_UNK"
            cor = (0, 0, 255) # Vermelho

        # Desenha os elementos visuais na tela
        cv2.rectangle(frame, (x, y), (x+w, y+h), cor, 2)
        cv2.putText(frame, f"{nome_usuario} ({int(confianca)})", (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, cor, 2)

        # Envio em tempo real para o seu servidor Express ativo
        agora = time.time()
        if agora - ultimo_envio > 5:
            ultimo_envio = agora
            payload = {
                "matricula": matricula_atual,
                "area": "Sala de Servidores",
                "status": modo_acesso
            }
            try:
                print(f"\n[EDGE] IA detectou: {nome_usuario} (Confiança: {int(confianca)})")
                resposta = requests.post(URL_SERVIDOR, json=payload, timeout=2)
                print(f"[NUVEM] Resposta recebida da API: {resposta.status_code}")
            except requests.exceptions.ConnectionError:
                print("[ALERTA] Servidor central offline.")

    cv2.imshow('AccessPIM AI - Hardware de Borda (OpenCV)', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

video_capture.release()
cv2.destroyAllWindows() 