# AccessPIM-AI - Task List

## Módulo 1: Persistência e Infraestrutura Local

- [ ] Task 1: Configurar Entidade e Repositório Postgres via TypeORM para Logs de Acesso
  - Acceptance: Criar a classe de entidade `AccessLogEntity` mapeando os campos `id` (UUID), `timestamp`, `matricula` e `status_sync` (enum: PENDING, SYNCED) usando TypeORM. Configurar o pool de conexão local com PostgreSQL. O tempo de escrita local deve ser inferior a 50ms.
  - Verify: Executar comando de teste unitário/integração persistindo logs em um banco Postgres de teste para validar se os estados iniciais são salvos com `PENDING`.
  - Files: `src/sync/infrastructure/entities/AccessLogEntity.ts`, `src/sync/infrastructure/repositories/PostgresRepository.ts`, `src/test/postgres-repo.spec.ts`

- [ ] Task 2: Implementar Detector de Queda por Timeout e Gatilho Offline
  - Acceptance: Envelopar a chamada HTTP POST da API de nuvem. Se a requisição falhar por timeout ou erro de rede (WAN fora), o serviço deve capturar o erro, salvar o log no Postgres local com status `PENDING` e retornar uma flag de autorização offline com sucesso para a catraca liberar o giro físico.
  - Verify: Mockar uma falha de rede via HTTP interceptor (falha por timeout) e certificar-se de que a catraca recebe a liberação e o registro foi salvo localmente no Postgres.
  - Files: `src/sync/infrastructure/CloudApiClient.ts`, `src/sync/domain/TransactionSyncService.ts`, `src/test/network-failure.spec.ts`

## Módulo 2: Sincronização Assíncrona e Heartbeat

- [ ] Task 3: Desenvolver a Thread de Heartbeat Ativo (Ping 10s)
  - Acceptance: Ao entrar em modo offline, disparar uma rotina assíncrona que bate a cada 10 segundos em um endpoint leve da API da nuvem. Assim que a nuvem retornar HTTP 200, a rotina deve desativar o Heartbeat e acionar o evento de redescobrimento de rede.
  - Verify: Executar teste de tempo simulando 30 segundos de queda e garantir que o ping disparou exatamente 3 vezes antes de restaurar o estado ao receber o mock HTTP 200.
  - Files: `src/sync/infrastructure/HeartbeatHandler.ts`, `src/test/heartbeat.spec.ts`

- [ ] Task 4: Implementar Despachante Assíncrono do Cache do Passado (FIFO Batching via TypeORM)
  - Acceptance: Criar o consumidor de fila em segundo plano. Ele deve buscar os registros `PENDING` no Postgres local em ordem cronológica estrita (FIFO), enviá-los em lotes (*batches*) para a nuvem e, para cada lote confirmado com sucesso, executar a deleção física imediata das linhas do Postgres local para liberar armazenamento. Novos acessos paralelos em tempo real devem ignorar essa fila e ir direto para a API.
  - Verify: Salvar 5 logs antigos em cache no Postgres. Simular o retorno da rede. Garantir que os 5 logs antigos foram deletados do banco local após o envio em lote e que um 6º log (gerado em tempo real no meio do processo) foi enviado instantaneamente sem esperar a limpeza da fila.
  - Files: `src/sync/domain/QueueConsumer.ts`, `src/test/fifo-sync.spec.ts`

## Módulo 3: Ciclo de Vida Biométrico (LGPD & Otimização)

- [ ] Task 5: Implementar o Hook de Purga Pós-Treinamento LBPH
  - Acceptance: Criar a função de descarte que monitora a geração do arquivo matemático `classificador_lbph.yml`. Assim que o arquivo for exportado e validado em disco, o serviço deve deletar de forma definitiva a pasta contendo as 50 imagens brutas utilizadas no dataset de treinamento daquele usuário.
  - Verify: Criar um teste unitário que gere um arquivo `.yml` fictício em uma pasta temporária com 50 arquivos de imagem falsos e certificar-se de que, após a execução do hook, apenas o arquivo `.yml` permanece no disco.
  - Files: `src/sync/domain/BiometricPurgeHook.ts`, `src/test/purge-hook.spec.ts`