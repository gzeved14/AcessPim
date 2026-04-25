import { DataSource } from "typeorm";
import { Colaborador } from "../entities/Colaborador.js";
export declare class ColaboradorService {
    private repo;
    constructor(dataSource: DataSource);
    findAll(): Promise<Colaborador[]>;
    create(dados: Partial<Colaborador>): Promise<Colaborador>;
    findById(id: string): Promise<Colaborador>;
    update(id: string, dados: Partial<Colaborador>): Promise<Colaborador>;
}
//# sourceMappingURL=ColaboradorService.d.ts.map