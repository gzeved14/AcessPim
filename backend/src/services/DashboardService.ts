import { Repository, DataSource } from "typeorm";
import { RegistroAcesso } from "../entities/RegistroAcesso.js";
import { Area } from "../entities/Area.js";
import { Tipo } from "../types/Tipo.js";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

export class DashboardService {
    private accessRepo: Repository<RegistroAcesso>;
    private areaRepo: Repository<Area>;
    private readonly TIMEZONE = "America/Manaus";

    constructor(dataSource: DataSource) {
        this.accessRepo = dataSource.getRepository(RegistroAcesso);
        this.areaRepo = dataSource.getRepository(Area);
    }

    async getAccessesByHour(period: 'today' | 'week' | 'month' | 'year' = 'today') {
        const nowInManaus = dayjs().tz(this.TIMEZONE);
        const startOfToday = nowInManaus.startOf('day').toDate();
        const endOfToday = nowInManaus.endOf('day').toDate();

        let accesses: any[] = [];

        if (period === 'today') {
            const nowInManaus = dayjs().tz(this.TIMEZONE);
            const startOfToday = nowInManaus.startOf('day').toDate();
            const endOfToday = nowInManaus.endOf('day').toDate();

            accesses = await this.accessRepo
                .createQueryBuilder("access")
                // Simplificamos: dizemos que o dado é UTC e queremos a hora em Manaus
                .select("EXTRACT(HOUR FROM access.timestamp AT TIME ZONE 'America/Manaus')", "hora")
                .addSelect("COUNT(*)", "total")
                .where("access.timestamp >= :startOfToday", { startOfToday })
                .andWhere("access.timestamp <= :endOfToday", { endOfToday })
                .groupBy("hora")
                .orderBy("hora", "ASC")
                .getRawMany();

            return Array.from({ length: 24 }, (_, i) => {
                const found = accesses.find(a => Math.floor(Number(a.hora)) === i);
                return { hora: i, total: found ? Number(found.total) : 0 };
            });
        } 
        
        else if (period === 'week' || period === 'month') {
            const startDate = period === 'week' 
                ? nowInManaus.startOf('week').toDate() 
                : nowInManaus.startOf('month').toDate();

            accesses = await this.accessRepo
                .createQueryBuilder("access")
                .select(`(access.timestamp AT TIME ZONE 'UTC' AT TIME ZONE '${this.TIMEZONE}')::date`, "dia")
                .addSelect("COUNT(*)", "total")
                .where("access.timestamp >= :startDate", { startDate })
                .andWhere("access.timestamp <= :endDate", { endDate: endOfToday })
                .groupBy("dia")
                .orderBy("dia", "ASC")
                .getRawMany();

            const days = [];
            let d = dayjs(startDate);
            while (d.isBefore(nowInManaus) || d.isSame(nowInManaus, 'day')) {
                days.push(d.format('YYYY-MM-DD'));
                d = d.add(1, 'day');
            }

            return days.map(iso => {
                const found = accesses.find(a => {
                    const dataBanco = a.dia instanceof Date ? a.dia.toISOString().slice(0, 10) : a.dia;
                    return dataBanco === iso;
                });
                return { dia: iso, total: found ? Number(found.total) : 0 };
            });
        } 
        
        else if (period === 'year') {
            const year = nowInManaus.year();
            const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

            accesses = await this.accessRepo
                .createQueryBuilder("access")
                .select(`EXTRACT(MONTH FROM access.timestamp AT TIME ZONE 'UTC' AT TIME ZONE '${this.TIMEZONE}')`, "mes")
                .addSelect("COUNT(*)", "total")
                .where(`EXTRACT(YEAR FROM access.timestamp AT TIME ZONE 'UTC' AT TIME ZONE '${this.TIMEZONE}') = :year`, { year })
                .groupBy("mes")
                .orderBy("mes", "ASC")
                .getRawMany();

            return Array.from({ length: 12 }, (_, i) => {
                const mesNumero = i + 1;
                const found = accesses.find(a => Math.floor(Number(a.mes)) === mesNumero);
                return { 
                    mes: mesNumero,
                    mesNome: mesesNomes[i],
                    total: found ? Number(found.total) : 0 
                };
            });
        }
        return [];
    }

    async getGeneralData(period: 'today' | 'week' | 'month' | 'year' = 'today') {
        const nowInManaus = dayjs().tz(this.TIMEZONE);
        const startOfToday = nowInManaus.startOf('day').toDate();
        const endOfToday = nowInManaus.endOf('day').toDate();

        let filterStartDate: Date;
        switch (period) {
            case 'week': filterStartDate = nowInManaus.startOf('week').toDate(); break;
            case 'month': filterStartDate = nowInManaus.startOf('month').toDate(); break;
            case 'year': filterStartDate = nowInManaus.startOf('year').toDate(); break;
            default: filterStartDate = startOfToday;
        }

        // 1. Função auxiliar de contagem para evitar repetição e erros de conversão
        const countRecords = async (start: Date, onlyDenied = false) => {
            let qb = this.accessRepo.createQueryBuilder("access")
                .where("access.timestamp >= :start", { start })
                .andWhere("access.timestamp <= :end", { end: endOfToday });
            
            if (onlyDenied) {
                qb = qb.andWhere("access.autorizado = :auth", { auth: false });
            }
            
            return qb.getCount();
        };

        // 2. Busca área mais ativa
        const activeAreaData = await this.accessRepo
            .createQueryBuilder("access")
            .select("area.nome", "nome")
            .addSelect("COUNT(access.id)", "total")
            .innerJoin("access.area", "area")
            .where("access.timestamp >= :filterStartDate", { filterStartDate })
            .andWhere("access.timestamp <= :endOfToday", { endOfToday })
            .groupBy("area.id")
            .addGroupBy("area.nome")
            .orderBy("total", "DESC")
            .limit(1)
            .getRawOne();

        const mostActiveArea = activeAreaData ? activeAreaData.nome : "Nenhuma área";

        // 3. Ocupação atual (usando o método count do repositório que é mais seguro)
        const areas = await this.areaRepo.find({ where: { ativa: true } });
        const occupancyByArea = await Promise.all(areas.map(async (area) => {
            const entries = await this.accessRepo.count({ 
                where: { area: { id: area.id } as any, tipo: Tipo.ENTRADA, autorizado: true } 
            });
            const exits = await this.accessRepo.count({ 
                where: { area: { id: area.id } as any, tipo: Tipo.SAIDA, autorizado: true } 
            });
            const presentCount = Math.max(0, entries - exits);
            return {
                areaName: area.nome,
                currentOccupancy: presentCount,
                maxCapacity: area.capacidade,
                percentage: area.capacidade > 0 ? (presentCount / area.capacidade) * 100 : 0
            };
        }));

        // 4. Últimos acessos
        const latestAccesses = await this.accessRepo.find({
            relations: ["colaborador", "area"],
            order: { timestamp: "DESC" },
            take: 10
        });

        // 5. Retorno consolidado (chamando as contagens corrigidas)
        return {
            cards: {
                totalAccessesToday: await countRecords(startOfToday),
                deniedToday: await countRecords(startOfToday, true),
                totalAccessesThisWeek: await countRecords(nowInManaus.startOf('week').toDate()),
                totalAccessesThisMonth: await countRecords(nowInManaus.startOf('month').toDate()),
                totalAccessesThisYear: await countRecords(nowInManaus.startOf('year').toDate()),
                collaboratorsNow: occupancyByArea.reduce((acc, curr) => acc + curr.currentOccupancy, 0),
                mostActiveArea
            },
            areaOccupancy: occupancyByArea,
            latestAccesses,
            accessesByHour: await this.getAccessesByHour(period)
        };
    }
} 