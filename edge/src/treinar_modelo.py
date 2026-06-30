# -*- coding: utf-8 -*-
import os
import cv2
import numpy as np
from PIL import Image

# ---------------------------------------------------------------------------
# Configuração de Diretórios
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, 'dataset')
MODELO_YML = os.path.join(BASE_DIR, "classificador_lbph.yml")
MODELO_LABELS = os.path.join(BASE_DIR, "classificador_lbph_labels.npy")

def get_imagem_com_id():
    caminhos = []
    # Percorre todas as subpastas dentro de 'dataset' (ex: dataset/10)
    for raiz, _, arquivos in os.walk(DATASET_DIR):
        for arquivo in arquivos:
            if arquivo.endswith('.jpg') or arquivo.endswith('.png'):
                caminhos.append(os.path.join(raiz, arquivo))
                
    faces = []
    ids = []
    mapa_labels = {} # Dicionário para traduzir o ID inteiro para a sua Matrícula/UUID
    
    print(f"[*] Processando {len(caminhos)} fotos encontradas no dataset...")

    for caminho_imagem in caminhos:
        # Abre a imagem e converte para tons de cinza (L)
        imagem_pil = Image.open(caminho_imagem).convert('L')
        imagem_numpy = np.array(imagem_pil, 'uint8')
        
        # O nome da pasta onde a foto está é o ID (ex: '10')
        id_pasta = os.path.basename(os.path.dirname(caminho_imagem))
        id_inteiro = int(id_pasta)
        
        # Aqui você pode mapear futuramente o 'id_inteiro' para o UUID real do PostgreSQL
        # Por enquanto, vamos mapear o 10 para '10' mesmo, ou para o seu UUID se preferir.
        mapa_labels[id_inteiro] = id_pasta 

        faces.append(imagem_numpy)
        ids.append(id_inteiro)
        
    return np.array(ids), faces, mapa_labels

if __name__ == "__main__":
    print("[*] Iniciando treinamento da Inteligência Artificial...")
    
    ids, faces, mapa_labels = get_imagem_com_id()
    
    if len(faces) == 0:
        print("[!] Nenhuma imagem encontrada na pasta dataset. Cancele e tire fotos primeiro.")
        exit()

    # Cria o cérebro da IA
    reconhecedor = cv2.face.LBPHFaceRecognizer_create()
    
    # Alimenta o cérebro com as fotos e os IDs
    reconhecedor.train(faces, ids)
    
    # Salva o aprendizado no disco
    reconhecedor.write(MODELO_YML)
    np.save(MODELO_LABELS, mapa_labels)
    
    print(f"[+] Treinamento concluído com sucesso!")
    print(f"[+] Modelo YML salvo em: {MODELO_YML}")
    print(f"[+] Mapeamento salvo em: {MODELO_LABELS}")
    print(f"[+] Total de rostos diferentes treinados: {len(np.unique(ids))}")