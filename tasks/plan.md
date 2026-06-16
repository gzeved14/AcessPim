# Technical Implementation Plan - AccessPIM-AI

## 1. Componentes e Dependências
*   **Database Module (`better-sqlite3` + TypeORM):** Camada de persistência local na borda. Base para o armazenamento de transações offline e metadados de sincronização.
*   **API Client Module (`axios` / `fetch`):** Interface de comunicação com a API REST da nuvem. Possui interceptores de timeout para detectar quedas de rede instantaneamente.
*   **Heartbeat Thread Handler:** Módulo isolado (Thread/Worker ou intervalo não-bloqueante) que assume o monitoramento da WAN a cada 10 segundos ao entrar em modo offline.
*   **Queue Consumer (FIFO Batcher):** Processo em segundo plano que esvazia o cache acumulado em lote de forma assíncrona quando a catraca está ociosa, garantindo prioridade absoluta para novas requisições em tempo real.
*   **Biometric Purge Hook:** Gatilho acionado imediatamente após a exportação do arquivo `classificador_lbph.yml` para expurgar as 50 fotos brutas.

## 2. Estratégia de Mitigação de Riscos
*   **Risco de Concorrência:** A thread de reenvio do passado travar o processamento do presente.
    *   *Mitigação:* Isolar o reenvio em um loop assíncrono controlado com limites de lote (*batch sizing*) e dar retorno imediato via *early return* para novos acessos locais.
*   **Risco de Vazamento de Dados (LGPD):** Falha na deleção de imagens se o processo cair no meio do treinamento do classificador.
    *   *Mitigação:* Implementar um bloco `try...finally` robusto e uma rotina de checagem na inicialização do serviço para limpar qualquer dataset órfão do disco.