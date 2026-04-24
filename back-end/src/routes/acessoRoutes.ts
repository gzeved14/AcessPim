import { Router } from 'express';
import { appDataSource } from '../config/appDataSource.js';
import { validateBody } from '../middleware/validateBody.js';
import AcessoController from '../controllers/AcessoController.js';
import { AcessoService } from '../services/AcessoService.js';
import { createAccessRecordSchema, updateAccessRecordSchema } from '../dtos/CreateRegistroSchemaDTO.js';
import { ensureAuth } from '../middleware/authMiddleware.js'
const accessRoutes = Router();

const accessService = new AcessoService(appDataSource);
const accessController = new AcessoController(accessService);

accessRoutes.use(ensureAuth);

accessRoutes.get("/", accessController.findAll.bind(accessController));
accessRoutes.post("/", validateBody(createAccessRecordSchema), accessController.create.bind(accessController));
accessRoutes.put("/:id", validateBody(updateAccessRecordSchema), accessController.update.bind(accessController));
accessRoutes.delete("/:id", accessController.delete.bind(accessController));

export default accessRoutes;
