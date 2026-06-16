import { SyncService } from "../services/SyncService";
import { Request, Response } from "express";
import { DataSource} from "typeorm";
import { createSyncCacheSchemaDTO, CreateSyncCacheDTO } from "../dtos/CreateRegistroSchemaDTO";

 /** 
 * @class SyncController
 * @description Controlador responsável por lidar com as requisições relacionadas à sincronização dos acessos.
*/

export class SyncController{
    private syncService: SyncService;

    constructor(syncService: SyncService) {
        this.syncService = syncService;
    }

    /**
     * @method salvarContigencia
     *@description Endpoint para salvar o log direto no cache local quando a borda detecta queda     
     */ 
   async salvarContingencia(req: Request, res: Response): Promise<Response> {
    try {
        const dadosValidados: CreateSyncCacheDTO  = createSyncCacheSchemaDTO.parse(req.body);
        const { matricula, area } = dadosValidados;

        const logCacheado = await this.syncService.salvarNoCacheLocal(matricula, area);


        return res.status(200).json({
            status: "OFFLINE_AUTHORIZED",
            message: "Salvo no SyncController: Contingência local gravada.",
            cache_id: logCacheado.id
        });
    } catch (error: any) {
        return res.status(400).json({ status: "ERROR", message: error.message });
    }
  }
}