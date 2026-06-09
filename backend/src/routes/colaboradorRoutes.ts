import { Router } from 'express';
import { appDataSource } from '../config/appDataSource'
import { ColaboradorService } from '../services/ColaboradorService'
import  ColaboradorController  from '../controllers/ColaboradorController'
import { ensureAuth } from '../middleware/authMiddleware'
import  { createColaboradorSchemaDTO, updateColaboradorSchema }  from '../dtos/CreateColaboradorDTO'
import { validateBody } from '../middleware/validateBody';
import { uploadConfig } from '../config/upload';
import multer from 'multer';

const colaboradorRoutes = Router();
const colaboradorService = new ColaboradorService(appDataSource);
const colaboradorController = new ColaboradorController(colaboradorService);

const upload = multer(uploadConfig);

colaboradorRoutes.use(ensureAuth);

colaboradorRoutes.get("/", colaboradorController.findAll.bind(colaboradorController));
colaboradorRoutes.get('/:id', colaboradorController.findById.bind(colaboradorController));
colaboradorRoutes.post('/', validateBody(createColaboradorSchemaDTO), colaboradorController.create.bind(colaboradorController));
colaboradorRoutes.put('/:id', validateBody(updateColaboradorSchema), colaboradorController.update.bind(colaboradorController));
colaboradorRoutes.patch('/:id/toggle-status', colaboradorController.softDelete.bind(colaboradorController));
colaboradorRoutes.delete('/:id', colaboradorController.delete.bind(colaboradorController));

// 🎯 Rota de Upload de Foto atualizada usando a instância criada acima
colaboradorRoutes.patch(
    '/:id/foto', 
    upload.single('foto'), // ✨ Limpo, elegante e tipado sem erro!
    colaboradorController.updateFoto.bind(colaboradorController)
);

export default colaboradorRoutes;