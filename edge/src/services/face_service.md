# Módulo: services/face_service.py

Este módulo encapsula toda a lógica de visão computacional para reconhecimento facial e verificação de Equipamentos de Proteção Individual (EPIs) na aplicação AccessPIM AI.

## Funcionalidades Principais:

- **Detecção Facial:** Utiliza Haar Cascades (do OpenCV) para localizar rostos em frames de vídeo.
- **Reconhecimento Facial (LBPH):** Carrega um modelo LBPH pré-treinado (salvo em formato `.yml`) e um mapa de labels (ID do colaborador) para identificar indivíduos.
- **Cálculo de Confiança:** Determina um score de confiança para o reconhecimento facial, normalizado em percentual (0-100%), e compara com um limiar mínimo (`CONFIANCA_MINIMA_PCT`).
- **Detecção de EPIs:**
    - Suporta a detecção de óculos (`haarcascade_eye.xml`), colete (`haarcascade_upperbody.xml`) e luvas (`haarcascade_hand.xml`) usando cascades nativas do OpenCV ou do pacote `opencv-contrib-python`.
    - **Capacete:** Não possui uma cascade nativa adequada no OpenCV; o módulo loga um aviso e nega o acesso por segurança (fail-safe) se capacete for obrigatório.
    - Verifica EPIs obrigatórios para uma área específica.
- **Estruturas de Dados:** Define `dataclasses` para retornar os resultados de forma estruturada:
    - `FaceMatch`: Contém informações sobre a face detectada, ID do colaborador, confiança e bounding box.
    - `EpiStatus`: Indica quais EPIs foram detectados, quais estão ausentes e se o status geral é aprovado.
- **Feedback Visual (Debug):** Inclui um método (`desenhar_resultado`) para anotar frames com bounding boxes, nomes e status de EPIs, útil para depuração.

## Estrutura do Código:

1.  **Constantes e Configurações:**
    *   `EPI_CASCADES`: Dicionário mapeando nomes lógicos de EPIs para seus respectivos arquivos XML de cascade.
    *   `LBPH_SCORE_MAXIMO`, `CONFIANCA_MINIMA_PCT`: Parâmetros para o reconhecimento facial.
2.  **Classe `FaceService`:**
    *   `__init__`: Inicializa o classificador facial e carrega o modelo LBPH e o mapa de labels (se existirem).
    *   `carregar_modelo`: Lê os arquivos `.yml` e `.npy` do modelo LBPH.
    *   `modelo_carregado`: Verifica se o modelo está pronto para uso.
    *   `detectar_faces`: Detecta rostos em um frame e retorna suas bounding boxes.
    *   `reconhecer`: Executa a detecção facial e o reconhecimento LBPH, retornando um `FaceMatch`.
    *   `verificar_epis`: Detecta os EPIs especificados em uma lista de obrigatórios, retornando um `EpiStatus`.
    *   `desenhar_resultado`: (Para Debug) Anota um frame com os resultados da detecção e reconhecimento.

## Observações:

- O carregamento do modelo LBPH e do mapa de labels é feito apenas uma vez na inicialização do serviço.
- O sistema depende de arquivos de cascade XML (para faces e EPIs) que devem estar acessíveis no sistema de arquivos.
- A detecção de EPIs é baseada em heurísticas e pode exigir treinamento de cascades customizadas para maior precisão em cenários específicos (ex: capacetes).
- O módulo está projetado para ser usado em conjunto com outros componentes, como a `catraca.py` e `reconhecer_rosto.py`.
