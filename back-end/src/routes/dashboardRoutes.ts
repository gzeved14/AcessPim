import { Router } from 'express';
import { appDataSource } from '../config/appDataSource.js';
import DashboardController from '../controllers/DashboardController.js';
import { DashboardService } from '../services/DashboardService.js';
import { ensureAuth } from '../middleware/authMiddleware.js'


const dashboardRoutes = Router();

const analyticsService = new DashboardService(appDataSource);
const dashboardController = new DashboardController(analyticsService);

dashboardRoutes.use(ensureAuth)

dashboardRoutes.get('/', dashboardController.getDashboard.bind(dashboardController));

export default dashboardRoutes;