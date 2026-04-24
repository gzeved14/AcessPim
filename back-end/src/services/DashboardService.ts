import { Repository, DataSource, MoreThanOrEqual } from "typeorm";
import { RegistroAcesso } from "../entities/RegistroAcesso.js";
import { Area } from "../entities/Area.js";

export class DashboardService {
    private accessRepo: Repository<RegistroAcesso>;
    private areaRepo: Repository<Area>;

    constructor(dataSource: DataSource) {
        this.accessRepo = dataSource.getRepository(RegistroAcesso);
        this.areaRepo = dataSource.getRepository(Area);
    }

    async getGeneralData() {
        // Define o início do dia de hoje para os indicadores (RF07)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Total de acessos no dia
        // O uso de 'as any' resolve o erro de tipagem caso o TS não reconheça o campo na entidade
        const totalAccessesToday = await this.accessRepo.count({
            where: { timestamp: MoreThanOrEqual(today) } as any
        });

        // 2. Acessos negados no dia
        const deniedToday = await this.accessRepo.count({
            where: { 
                timestamp: MoreThanOrEqual(today),
                autorizado: false 
            } as any
        });

        // 3. Últimos 10 registros para a lista do Dashboard (Tela 2)
        const latestAccesses = await this.accessRepo.find({
            take: 10,
            order: { timestamp: "DESC" } as any,
            relations: ["colaborador", "area"]
        });

        // 4. Lógica de Ocupação Atual vs Capacidade (Obrigatório para Trio - RF13)
        const areas = await this.areaRepo.find();
        const occupancyByArea = await Promise.all(areas.map(async (area) => {
            
            // Conta colaboradores atualmente na área (entradas autorizadas sem saída correspondente)
            // Nota: Para o MVP de trio, você deve considerar o saldo de entradas e saídas
            const entries = await this.accessRepo.count({
                where: { area_id: area.id, tipo: 'entrada', autorizado: true } as any
            });
            const exits = await this.accessRepo.count({
                where: { area_id: area.id, tipo: 'saida', autorizado: true } as any
            });

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