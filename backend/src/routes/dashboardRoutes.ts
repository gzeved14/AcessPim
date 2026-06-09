import { Router } from 'express';
import { appDataSource } from '../config/appDataSource';
import DashboardController from '../controllers/DashboardController';
import { DashboardService } from '../services/DashboardService';
import { ensureAuth } from '../middleware/authMiddleware'


const dashboardRoutes = Router();

const analyticsService = new DashboardService(appDataSource);
const dashboardController = new DashboardController(analyticsService);

dashboardRoutes.use(ensureAuth)

dashboardRoutes.get('/', dashboardController.getDashboard.bind(dashboardController));

export default dashboardRoutes;