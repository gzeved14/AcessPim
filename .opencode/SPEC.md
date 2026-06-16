Excelente. Com todas as cartas na mesa e os requisitos perfeitamente mapeados para o ecossistema do **AccessPIM-AI** (sua catraca inteligente), as premissas estão validadas. Você eliminou qualquer ambiguidade de arquitetura.

Aqui está o documento **`SPEC.md`** oficial, estruturado exatamente sob as diretrizes da sua skill de *Spec-Driven Development*.

---

# Spec: Serviço de Sincronização e Cache Local (AccessPIM-AI)

## Objective

Desenvolver um serviço de sincronização e cache local resiliente em TypeScript/Node.js para a catraca inteligente de borda. O sistema deve garantir a continuidade da operação física (modo offline) em caso de queda da rede WAN e sincronizar os dados acumulados de forma assíncrona assim que a conexão com a API REST da nuvem for restabelecida, sem travar o processamento do presente.

### User Stories / Critérios de Aceitação

* **Operação Ininterrupta:** Se a API REST da nuvem estiver fora do ar, o usuário ainda deve conseguir validar o acesso localmente via classificador LBPH e a catraca deve liberar o giro.
* **Retenção Inteligente:** Transações e logs de acesso devem ser gravados localmente (Write-Through) e purgados imediatamente após a confirmação de recebimento da API da nuvem.
* **Privacidade e Conformidade (LGPD):** As 50 imagens coletadas para o processamento do algoritmo LBPH devem ser apagadas do disco assim que o arquivo `classificador_lbph.yml` for gerado com sucesso.
* **Priorização de Tempo Real:** No retorno da rede, novos acessos não podem pegar fila; eles devem ser despachados imediatamente, enquanto o cache antigo é esvaziado em segundo plano.

## Tech Stack

* **Runtime:** Node.js (v20+) com TypeScript
* **Process Manager:** PM2 (para execução contínua e reinicialização em caso de falha física)
* **Banco de Dados Local:** Postgres + TypeORM 
* **Comunicação Externa:** API REST baseada em HTTP (Axios / Native Fetch)

## Commands

```bash
# Instalação de dependências
npm install

# Execução em ambiente de desenvolvimento
npm run dev

# Execução dos testes unitários e de integração
npm test -- --coverage

# Build de compilação TypeScript
npm run build

# Inicialização em produção na catraca via PM2
pm2 start dist/main.js --name "accesspim-edge-sync"

```

## Project Structure

```text
src/
├── sync/
│   ├── domain/         # Regras de negócio, entidades e lógica de sincronização
│   ├── infrastructure/ # Implementação do SQLite, chamadas HTTP (Axios) e threads
│   └── presentation/   # Endpoints locais ou listeners internos da catraca
├── test/               # Testes unitários (RED/GREEN) e cenários de queda de rede
└── main.ts             # Ponto de entrada do serviço de borda

```

## Code Style

O código deve priorizar legibilidade, tipagem estrita e o tratamento explícito de estados de erro. Padrão arquitetural voltado a classes de serviço de responsabilidade única.

```typescript
// Exemplo de padrão esperado para o despacho assíncrono com tratamento de estado
export class TransactionSyncService {
  private isSyncingPast = false;

  constructor(
    private readonly localDb: SQLiteRepository,
    private readonly apiClient: CloudApiClient
  ) {}

  async handleNewAccess(accessLog: AccessLogDTO): Promise<SyncResult> {
    // 1. Gravação local obrigatória (Write-Through)
    await this.localDb.save(accessLog);

    try {
      // 2. Tentativa de envio em Tempo Real (Prioridade Máxima)
      const response = await this.apiClient.post('/access', accessLog);
      
      if (response.status === 200) {
        // 3. Purga pós-confirmação imediata
        await this.localDb.delete(accessLog.id);
        return SyncResult.success();
      }
    } catch (error) {
      // 4. Detecção de Falha de Requisição por Timeout/Erro de Rede
      return SyncResult.offlineModeTriggered();
    }
    
    return SyncResult.queued();
  }
}

```

## Testing Strategy

* **Framework:** Vitest ou Jest focado em assincronismo.
* **Testes Unitários (Mínimo 80% de cobertura):** Validar a lógica de purga pós-confirmação e a exclusão do dataset de 50 imagens após a exportação do `.yml` do LBPH.
* **Testes de Integração (Cenários de Rede):** Simular cenários de queda de rede interceptando as chamadas HTTP (usando `msw` ou mock de sockets) para garantir que:
1. O modo offline é ativado após falha por timeout.
2. A thread de Heartbeat dispara a cada 10 segundos.
3. O cache do passado é enviado em lotes (batching) e em ordem cronológica estrita (FIFO) após o HTTP 200 do Heartbeat.



## Boundaries

* **Always do:** * Executar a purga de imagens brutas imediatamente após gerar o arquivo `classificador_lbph.yml`.
* Garantir isolamento de threads/workers para que o reenvio do cache antigo não cause travamento no fluxo principal de processamento da catraca.


* **Ask first:**
* Alterar a estrutura de tabelas do banco SQLite (`AccessLog`, `SyncStatus`).
* Mudar a janela de tempo do Heartbeat ativo (atualmente cravado em 10s).


* **Never do:**
* Armazenar ou trafegar logs de acesso ou dados biométricos sem criptografia ou em texto puro.
* Deixar de deletar as fotos brutas da borda após o treinamento do classificador matemático (violação estrita da LGPD).



## Success Criteria

* **Tempo de Resposta Local:** A catraca deve processar e salvar o log localmente em menos de 50ms quando estiver operando em modo offline.
* **Resiliência de Rede:** O Heartbeat deve se autodesativar assim que reestabelecer o status HTTP 200 com a nuvem.
* **Consumo de Memória:** O dataset local de imagens na borda deve zerar seu uso de disco após cada ciclo de exportação do LBPH.

---

