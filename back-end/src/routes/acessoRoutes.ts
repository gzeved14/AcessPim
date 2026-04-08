import { Router } from 'express';
import { appDataSource } from '../config/appDataSource.js';
import { validateBody } from '../middleware/validateBody.js';
import AcessoController from '../controllers/AcessoController.js';
import { AcessoService } from '../services/AcessoService.js';
import { createRegistroSchemaDTO, updateRegistroSchemaDTO } from '../dtos/CreateRegistroSchemaDTO.js';

const acessoRoutes = Router();

const acessoService = new AcessoService(appDataSource);
const acessoController = new AcessoController(acessoService);


acessoRoutes.get("/", acessoController.findAll.bind(acessoController));
acessoRoutes.get("/:id", acessoController.findById.bind(acessoController));
acessoRoutes.post("/", validateBody(createRegistroSchemaDTO), acessoController.create.bind(acessoController));
acessoRoutes.put("/:id", validateBody(updateRegistroSchemaDTO), acessoController.update.bind(acessoController));
acessoRoutes.delete("/:id", acessoController.delete.bind(acessoController));

export default acessoRoutes;
