import { Router } from 'express';
import { appDataSource } from '../config/appDataSource';
import { validateBody } from '../middleware/validateBody';
import AcessoController from '../controllers/AcessoController';
import { AcessoService } from '../services/AcessoService';
import { createAccessRecordSchema, updateAccessRecordSchema } from '../dtos/CreateRegistroSchemaDTO';
import { ensureAuth } from '../middleware/authMiddleware'
import { BiometriaController } from '../controllers/BiometriaController';

const accessRoutes = Router();

const accessService = new AcessoService(appDataSource);
const accessController = new AcessoController(accessService);
const biometriaController = new BiometriaController();

accessRoutes.use(ensureAuth);
accessRoutes.get("/colaborador/:colaboradorId/historico", accessController.findByColaborador.bind(accessController));
accessRoutes.get("/", accessController.findAll.bind(accessController));
accessRoutes.get('/colaborador/:id/permissoes', (req, res, next) => accessController.listarPermissoes(req, res, next));
accessRoutes.post('/permissoes/vincular', (req, res, next) => accessController.salvarPermissoes(req, res, next));
accessRoutes.post("/preview", accessController.checkAuthorization.bind(accessController));
accessRoutes.post("/", validateBody(createAccessRecordSchema), accessController.create.bind(accessController));
accessRoutes.post("/biometria/iniciar", biometriaController.iniciarLeitor.bind(biometriaController));
accessRoutes.post("/biometria/parar", biometriaController.pararLeitor.bind(biometriaController));
accessRoutes.post("/biometria/cadastrar", biometriaController.cadastrarRosto.bind(biometriaController));
accessRoutes.post("/biometria/excluir", biometriaController.excluirBiometria.bind(biometriaController));
accessRoutes.put("/:id", validateBody(updateAccessRecordSchema), accessController.update.bind(accessController));
accessRoutes.delete("/:id", accessController.delete.bind(accessController));
accessRoutes.get("/gestor/minha-area", accessController.findByGestor.bind(accessController));
accessRoutes.get("/gestor/colaborador/:colaboradorId", accessController.findByColaboradorAndArea.bind(accessController));

export default accessRoutes;
