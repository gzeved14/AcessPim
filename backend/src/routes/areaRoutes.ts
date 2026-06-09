import { Router } from 'express';
import { AreaService } from '../services/AreaService'
import { appDataSource } from '../config/appDataSource'
import  AreaController  from '../controllers/AreaController'
import { ensureAuth } from '../middleware/authMiddleware'
import { createAreaSchema, updateAreaSchema } from '../dtos/CreateAreaSchemaDTO';
import { validateBody } from '../middleware/validateBody';

const areaRoutes = Router();
const areaService = new AreaService(appDataSource);
const areaController = new AreaController(areaService);

areaRoutes.use(ensureAuth);

areaRoutes.get('/', areaController.findAll.bind(areaController));
areaRoutes.get('/:id', areaController.findById.bind(areaController));
areaRoutes.post('/', validateBody(createAreaSchema), areaController.create.bind(areaController));
areaRoutes.put('/:id', validateBody(updateAreaSchema), areaController.update.bind(areaController));
areaRoutes.patch('/:id/toggle-status', areaController.delete.bind(areaController));
areaRoutes.delete('/:id', areaController.hardDelete.bind(areaController));
areaRoutes.get('/:id/epis', areaController.obterEpisArea.bind(areaController));

export default areaRoutes;
