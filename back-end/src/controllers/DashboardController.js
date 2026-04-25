import { DashboardService } from "../services/DashboardService.js";
export default class DashboardController {
    dashboardService;
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
    }
    async getDashboard(req, res) {
        const dados = await this.dashboardService.getGeneralData();
        return res.status(200).json(dados);
    }
}
//# sourceMappingURL=DashboardController.js.map