import type { Request, Response } from "express";
import { DashboardService } from "../services/DashboardService.js"

/**
 * @class DashboardController
 * @description Controlador responsável por lidar com as requisições relacionadas ao dashboard.
 */
export default class DashboardController {
	constructor(private readonly dashboardService: DashboardService) {}
	
	// Define um tipo para os períodos permitidos, correspondendo à assinatura do serviço
	// Este método verifica se o valor do período fornecido na query é válido.
	private isValidPeriod(period: string): period is 'today' | 'week' | 'month' | 'year' {
        return ['today', 'week', 'month', 'year'].includes(period);
    }

    /**
     * @method getDashboard
     * @description Obtém os dados para o dashboard com base no período especificado na query.
     * Aceita um parâmetro de query `period` que pode ser 'today', 'week', 'month' ou 'year'.
     */
    async getDashboard(req: Request, res: Response) {
        // Aceita ?period=today|week|month|year
        const periodFromQuery = req.query.period as string | undefined;
        const period = (periodFromQuery && this.isValidPeriod(periodFromQuery)) ? periodFromQuery : 'today';
        console.log(`[DashboardController] Received request for dashboard. Period from query: '${periodFromQuery}', Resolved period: '${period}'`);
        
        const dados = await this.dashboardService.getGeneralData(period);
        return res.status(200).json(dados);
    }
}
