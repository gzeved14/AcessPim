import { DataSource } from "typeorm";
import { RegistroAcesso } from "../entities/RegistroAcesso.js";
export declare class DashboardService {
    private accessRepo;
    private areaRepo;
    constructor(dataSource: DataSource);
    getGeneralData(): Promise<{
        cards: {
            totalAccessesToday: number;
            deniedToday: number;
            collaboratorsNow: number;
            mostActiveArea: string;
        };
        areaOccupancy: {
            areaName: string;
            currentOccupancy: number;
            maxCapacity: number;
            percentage: number;
        }[];
        latestAccesses: RegistroAcesso[];
    }>;
}
//# sourceMappingURL=DashboardService.d.ts.map