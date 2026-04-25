import { DataSource } from "typeorm";
import { Area } from "../entities/Area.js";
export declare class AreaService {
    private areaRepo;
    constructor(dataSource: DataSource);
    listAll(): Promise<Area[]>;
    findById(id: string): Promise<Area>;
    create(dados: Partial<Area>): Promise<Area>;
    update(id: string, dados: Partial<Area>): Promise<Area>;
}
//# sourceMappingURL=AreaService.d.ts.map