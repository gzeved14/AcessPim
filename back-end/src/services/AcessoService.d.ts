import { RegistroAcesso } from "../entities/RegistroAcesso.js";
import { DataSource } from "typeorm";
export declare class AcessoService {
    private accessRepo;
    private collaboratorRepo;
    private authorizationRepo;
    constructor(dataSource: DataSource);
    registerAccess(data: {
        colaborador_id: string;
        area_id: string;
        tipo: 'entrada' | 'saida';
        registrado_por: string;
        observacao?: string;
    }): Promise<RegistroAcesso>;
    listHistory(filters: {
        dataInicio?: string;
        dataFim?: string;
        area_id?: string;
        colaborador_id?: string;
    }): Promise<RegistroAcesso[]>;
}
//# sourceMappingURL=AcessoService.d.ts.map