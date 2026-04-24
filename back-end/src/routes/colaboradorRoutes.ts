import { Router } from 'express';
import { appDataSource } from '../config/appDataSource.js'
import { ColaboradorService } from '../services/ColaboradorService.js'
import  ColaboradorController  from '../controllers/ColaboradorController.js'
import { ensureAuth } from '../middleware/authMiddleware.js'
import  { createColaboradorSchemaDTO, updateColaboradorSchema }  from '../dtos/CreateColaboradorDTO.js'
import { validateBody } from '../middleware/validateBody.js';


const colaboradorRoutes = Router();
const colaboradorService = new ColaboradorService(appDataSource);
const colaboradorController = new ColaboradorController(colaboradorService);

colaboradorRoutes.use(ensureAuth);

colaboradorRoutes.get("/", colaboradorController.findAll.bind(colaboradorController));
colaboradorRoutes.get('/:id', colaboradorController.findById.bind(colaboradorController));
colaboradorRoutes.post('/', validateBody(createColaboradorSchemaDTO), colaboradorController.create.bind(colaboradorController));
colaboradorRoutes.put('/:id', validateBody(updateColaboradorSchema), colaboradorController.update.bind(colaboradorController));


export default colaboradorRoutes;
