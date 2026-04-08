import type { Request, Response } from "express";

export default class DashboardController {
	constructor(private readonly dashboardService: unknown) {}

	async getDashboard(_req: Request, res: Response) {
		return res.status(501).json({ message: "Not implemented" });
	}
}
