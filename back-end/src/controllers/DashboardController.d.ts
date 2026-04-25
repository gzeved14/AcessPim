import type { Request, Response } from "express";
import { DashboardService } from "../services/DashboardService.js";
export default class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getDashboard(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=DashboardController.d.ts.map