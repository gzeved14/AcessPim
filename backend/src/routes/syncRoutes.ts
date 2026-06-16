import { Router } from 'express';
import { appDataSource } from '../config/appDataSource';
import { SyncController } from '../controllers/SyncController';
import { SyncService } from '../services/SyncService';

const syncRoutes = Router();
const syncService = new SyncService(appDataSource);
const syncController = new SyncController(syncService);

syncRoutes.post("/contingencia", (req, res) => syncController.salvarContingencia(req, res));

export { syncRoutes };