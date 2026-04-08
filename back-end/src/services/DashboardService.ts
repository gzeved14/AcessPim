import { Repository, DataSource, MoreThanOrEqual } from "typeorm";
import { RegistroAcesso } from "../entities/RegistroAcesso.js";
import { Area } from "../entities/Area.js";

export class DashboardService {
    private acessoRepo: Repository<RegistroAcesso>;
    private areaRepo: Repository<Area>;

    constructor(dataSource: DataSource) {
        this.acessoRepo = dataSource.getRepository(RegistroAcesso);
        this.areaRepo = dataSource.getRepository(Area);
    }

    async getDadosGerais() {
        // Define o início do dia de hoje para os indicadores (RF07)
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        // 1. Total de acessos no dia
        // O uso de 'as any' resolve o erro de tipagem caso o TS não reconheça o campo na entidade
        const totalAcessosDia = await this.acessoRepo.count({
            where: { timestamp: MoreThanOrEqual(hoje) } as any
        });

        // 2. Acessos negados no dia
        const negadosDia = await this.acessoRepo.count({
            where: { 
                timestamp: MoreThanOrEqual(hoje),
                autorizado: false 
            } as any
        });

        // 3. Últimos 10 registros para a lista do Dashboard (Tela 2)
        const ultimosAcessos = await this.acessoRepo.find({
            take: 10,
            order: { timestamp: "DESC" } as any,
            relations: ["colaborador", "area"]
        });

        // 4. Lógica de Ocupação Atual vs Capacidade (Obrigatório para Trio - RF13)
        const areas = await this.areaRepo.find();
        const ocupacaoPorArea = await Promise.all(areas.map(async (area) => {
            
            // Conta colaboradores atualmente na área (entradas autorizadas sem saída correspondente)
            // Nota: Para o MVP de trio, você deve considerar o saldo de entradas e saídas
            const entradas = await this.acessoRepo.count({
                where: { area_id: area.id, tipo: 'entrada', autorizado: true } as any
            });
            const saidas = await this.acessoRepo.count({
                where: { area_id: area.id, tipo: 'saida', autorizado: true } as any
            });

            const presentes = Math.max(0, entradas - saidas);

            return {
                areaNome: area.nome,
                ocupacaoAtual: presentes,
                capacidadeMax: area.capacidade,
                percentual: area.capacidade > 0 ? (presentes / area.capacidade) * 100 : 0
            };
        }));

        // Retorna o objeto consolidado para o endpoint GET /dashboard
        return {
            cards: {
                totalAcessosDia,
                negadosDia,
                colaboradoresAgora: ocupacaoPorArea.reduce((acc, curr) => acc + curr.ocupacaoAtual, 0),
                areaMaisMovimentada: areas.length > 0 && areas[0]?.nome ? areas[0].nome : "Nenhuma área" 
            },
            ocupacaoAreas: ocupacaoPorArea, // Dados para a barra de progresso (Trio)
            ultimosAcessos
        };
    }
}