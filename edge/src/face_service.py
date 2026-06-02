# face_service.py
import face_recognition
import os
import numpy as np

class FaceRecognitionService:
    def __init__(self, known_people_folder="images/known"):
        self.known_people_folder = known_people_folder
        self.known_names = []
        self.known_encodings = []
        # Carrega as fotos dos colaboradores autorizados ao iniciar o servidor
        self._scan_known_people()

    def _scan_known_people(self):
        if not os.path.exists(self.known_people_folder):
            os.makedirs(self.known_people_folder)
            return
            
        for file in os.listdir(self.known_people_folder):
            if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                basename = os.path.splitext(file)[0]
                img_path = os.path.join(self.known_people_folder, file)
                
                # Código extraído diretamente do teu script:
                img = face_recognition.load_image_file(img_path)
                encodings = face_recognition.face_encodings(img)
                
                if len(encodings) > 0:
                    self.known_names.append(basename)
                    self.known_encodings.append(encodings[0])
        print(f"📦 Biometria: {len(self.known_names)} colaboradores carregados na memória.")

    def verify_face(self, unknown_image_path, tolerance=0.6):
        """
        Compara uma foto tirada na portaria com o banco de rostos conhecidos
        """
        unknown_image = face_recognition.load_image_file(unknown_image_path)
        unknown_encodings = face_recognition.face_encodings(unknown_image)

        if not unknown_encodings:
            return {"status": "erro", "motivo": "Nenhum rosto detetado na imagem."}

        # Lógica de comparação matemática do teu script:
        distances = face_recognition.face_distance(self.known_encodings, unknown_encodings[0])
        results = list(distances <= tolerance)

        if True in results:
            # Encontra o índice correspondente ao match perfeito
            match_index = results.index(True)
            nome_reconhecido = self.known_names[match_index]
            distancia = distances[match_index]
            return {
                "status": "sucesso",
                "autorizado": True,
                "colaborador": nome_reconhecido,
                "distancia": round(float(distancia), 4)
            }
        
        return {"status": "sucesso", "autorizado": False, "motivo": "Colaborador não identificado."}