import { Router } from 'express';
import { AreaService } from '../services/AreaService.js';
import { appDataSource } from '../config/appDataSource.js';
import AreaController from '../controllers/AreaController.js';
import { ensureAuth } from '../middleware/authMiddleware.js';
import { createAreaSchema, updateAreaSchema } from '../dtos/CreateAreaSchemaDTO.js';
import { validateBody } from '../middleware/validateBody.js';
const areaRoutes = Router();
const areaService = new AreaService(appDataSource);
const areaController = new AreaController(areaService);
areaRoutes.use(ensureAuth);
areaRoutes.get('/', areaController.findAll.bind(areaController));
areaRoutes.get('/:id', areaController.findById.bind(areaController));
areaRoutes.post('/', validateBody(createAreaSchema), areaController.create.bind(areaController));
areaRoutes.put('/:id', validateBody(updateAreaSchema), areaController.update.bind(areaController));
export default areaRoutes;
//# sourceMappingURL=areaRoutes.js.map