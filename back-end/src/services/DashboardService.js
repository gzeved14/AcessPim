import { Repository, DataSource } from "typeorm";
import { RegistroAcesso } from "../entities/RegistroAcesso.js";
import { Area } from "../entities/Area.js";
import { Tipo } from "../types/Tipo.js";
export class DashboardService {
    accessRepo;
    areaRepo;
    constructor(dataSource) {
        this.accessRepo = dataSource.getRepository(RegistroAcesso);
        this.areaRepo = dataSource.getRepository(Area);
    }
    async getGeneralData() {
        // Define o início do dia de hoje para os indicadores (RF07)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // 1. Total de acessos no dia
        const totalAccessesToday = await this.accessRepo
            .createQueryBuilder("access")
            .where("access.timestamp >= :today", { today })
            .getCount();
        // 2. Acessos negados no dia
        const deniedToday = await this.accessRepo
            .createQueryBuilder("access")
            .where("access.timestamp >= :today", { today })
            .andWhere("access.autorizado = :autorizado", { autorizado: false })
            .getCount();
        // 3. Últimos 10 registros para a lista do Dashboard (Tela 2)
        const latestAccesses = await this.accessRepo
            .createQueryBuilder("access")
            .leftJoinAndSelect("access.colaborador", "colaborador")
            .leftJoinAndSelect("access.area", "area")
            .orderBy("access.timestamp", "DESC")
            .take(10)
            .getMany();
        // 4. Lógica de Ocupação Atual vs Capacidade (Obrigatório para Trio - RF13)
        const areas = await this.areaRepo.find();
        const occupancyByArea = await Promise.all(areas.map(async (area) => {
            // Conta colaboradores atualmente na área (entradas autorizadas sem saída correspondente)
            // O saldo é calculado com base nos registros autorizados de entrada e saída.
            const entries = await this.accessRepo
                .createQueryBuilder("access")
                .where("access.area_id = :areaId", { areaId: area.id })
                .andWhere("access.tipo = :tipo", { tipo: Tipo.ENTRADA })
                .andWhere("access.autorizado = :autorizado", { autorizado: true })
                .getCount();
            const exits = await this.accessRepo
                .createQueryBuilder("access")
                .where("access.area_id = :areaId", { areaId: area.id })
                .andWhere("access.tipo = :tipo", { tipo: Tipo.SAIDA })
                .andWhere("access.autorizado = :autorizado", { autorizado: true })
                .getCount();
            const presentCount = Math.max(0, entries - exits);
            return {
                areaName: area.nome,
                currentOccupancy: presentCount,
                maxCapacity: area.capacidade,
                percentage: area.capacidade > 0 ? (presentCount / area.capacidade) * 100 : 0
            };
        }));
        // Retorna o objeto consolidado para o endpoint GET /dashboard
        return {
            cards: {
                totalAccessesToday,
                deniedToday,
                collaboratorsNow: occupancyByArea.reduce((acc, curr) => acc + curr.currentOccupancy, 0),
                mostActiveArea: areas.length > 0 && areas[0]?.nome ? areas[0].nome : "Nenhuma área"
            },
            areaOccupancy: occupancyByArea, // Dados para a barra de progresso (Trio)
            latestAccesses
        };
    }
}
//# sourceMappingURL=DashboardService.js.map