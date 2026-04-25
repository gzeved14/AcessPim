import { Router } from 'express';
import { appDataSource } from '../config/appDataSource.js';
import DashboardController from '../controllers/DashboardController.js';
import { DashboardService } from '../services/DashboardService.js';
const dashboardRoutes = Router();
const analyticsService = new DashboardService(appDataSource);
const dashboardController = new DashboardController(analyticsService);
dashboardRoutes.get('/', dashboardController.getDashboard.bind(dashboardController));
export default dashboardRoutes;
//# sourceMappingURL=dashboardRoutes.js.map