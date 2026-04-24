import type { Request, Response } from "express";
import { DashboardService } from "../services/DashboardService.js"
export default class DashboardController {
	constructor(private readonly dashboardService: DashboardService) {}

	async getDashboard( req: Request, res: Response) {
		const dados = await this.dashboardService.getGeneralData();
		
		return res.status(200).json(dados);
	}
}
