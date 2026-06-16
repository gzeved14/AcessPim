import { DataSource, Repository } from "typeorm";
import { AccessLogCache } from "../entities/AccessLogCache";
import { SyncStatus } from "../types/SyncStatus";
import axios from "axios";

export class SyncService {
    private cacheRepo: Repository<AccessLogCache>;
    private cloudUrl = "https://api.nuvem-central.com/v1/acessos"; // URL fictícia da sua API na Nuvem
    private isOffline = false;
    private heartbeatTimer: NodeJS.Timeout | null = null;

    constructor(dataSource: DataSource) {
        this.cacheRepo = dataSource.getRepository(AccessLogCache);
    }

    /**
     * @method tentarEnviarNuvem
     * @description Tenta despachar o acesso em tempo real para a nuvem. Se falhar por timeout (2s), ativa o modo offline.
     */
    async tentarEnviarNuvem(matricula: string, areaNome: string): Promise<boolean> {
        try {
            // Define um timeout estrito de 2000ms para não travar o giro da catraca
            const response = await axios.post(this.cloudUrl, {
                matricula,
                area: areaNome,
                registrado_em: new Date()
            }, { timeout: 2000 });

            return response.status === 201;
        } catch (error) {
            console.warn(` [DETECTOR DE QUEDA] Falha de comunicação com a Nuvem. Erro: ${(error as Error).message}`);
            
            // Ativa o estado offline e dispara o Heartbeat se ele já não estiver rodando
            if (!this.isOffline) {
                this.isOffline = true;
                this.iniciarHeartbeat();
            }
            return false;
        }
    }

    /**
     * @method salvarNoCacheLocal
     * @description Fallback Offline: Salva a contingência no PostgreSQL local em < 50ms.
     */
    async salvarNoCacheLocal(matricula: string, areaNome: string): Promise<AccessLogCache> {
        const novoLog = this.cacheRepo.create({
            matricula,
            area_nome: areaNome,
            status_sync: SyncStatus.PENDING
        });
        return await this.cacheRepo.save(novoLog);
    }

    /**
     * @method iniciarHeartbeat
     * @description Task 3: Thread assíncrona (Ping 10s) que monitora a restauração da WAN.
     */
    private iniciarHeartbeat(): void {
        console.log(" [HEARTBEAT] Rotina de monitoramento de rede ativada (Intervalo: 10s).");
        
        this.heartbeatTimer = setInterval(async () => {
            try {
                // Endpoint leve (healthcheck) apenas para ver se a nuvem responde
                const response = await axios.get("https://api.nuvem-central.com/v1/health", { timeout: 1500 });
                
                if (response.status === 200) {
                    console.log(" [REDESCOBRIMENTO] Conexão com a nuvem restabelecida com sucesso!");
                    this.pararHeartbeat();
                    
                    // Dispara a desova assíncrona do passado em lote (FIFO Batching)
                    this.sincronizarFilaPendente();
                }
            } catch (error) {
                console.log(" [HEARTBEAT] Nuvem continua fora do ar. Nova tentativa em 10 segundos...");
            }
        }, 10000); // 10 segundos estritos conforme o critério de aceitação
    }

    /**
     * @method pararHeartbeat
     * @description Desativa a thread de ping e volta o sistema para o modo Online estável.
     */
    private pararHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        this.isOffline = false;
    }

    /**
     * @method sincronizarFilaPendente
     * @description Task 4: Despachante FIFO. Envia o passado acumulado em lotes e purga do banco local.
     */
    private async sincronizarFilaPendente(): Promise<void> {
        console.log(" [SINCRONIZADOR] Iniciando esvaziamento do cache local (Processamento FIFO)...");

        const logsPendentes = await this.cacheRepo.find({
            where: { status_sync: SyncStatus.PENDING },
            order: { registrado_em: "ASC" } // Ordem cronológica estrita
        });

        if (logsPendentes.length === 0) {
            console.log("✅ [SINCRONIZADOR] Nenhum log pendente encontrado no PostgreSQL local.");
            return;
        }

        for (const log of logsPendentes) {
            try {
                // Envia para a nuvem o registro histórico
                const enviado = await axios.post(this.cloudUrl, {
                    matricula: log.matricula,
                    area: log.area_nome,
                    registrado_em: log.registrado_em
                }, { timeout: 3000 });

                if (enviado.status === 201) {
                    // Deleção física imediata para liberar espaço em disco na borda (Critério de Aceitação)
                    await this.cacheRepo.delete(log.id);
                    console.log(` [PURGA LOCAL] Log ${log.id} desovado na nuvem e removido do Postgres local.`);
                }
            } catch (error) {
                console.error(` [FALHA FILA] Erro ao sincronizar log ${log.id}. Abortando lote para tentar mais tarde.`);
                // Se um item do lote falhar, interrompe para não perder a ordem FIFO e deixa o Heartbeat reativar
                this.isOffline = true;
                this.iniciarHeartbeat();
                break;
            }
        }
    }
}