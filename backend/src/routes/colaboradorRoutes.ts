import { Router } from 'express';
import { appDataSource } from '../config/appDataSource';
import { ColaboradorService } from '../services/ColaboradorService';
import ColaboradorController from '../controllers/ColaboradorController';
import { ensureAuth } from '../middleware/authMiddleware';
import { createColaboradorSchemaDTO, updateColaboradorSchema } from '../dtos/CreateColaboradorDTO';
import { validateBody } from '../middleware/validateBody';
import { uploadConfig } from '../config/upload';
import multer from 'multer';

const colaboradorRoutes = Router();
const colaboradorService = new ColaboradorService(appDataSource);
const colaboradorController = new ColaboradorController(colaboradorService);

const upload = multer(uploadConfig);

//  Filtro de segurança global para todas as rotas de colaboradores

//  Consultas e Persistência Padrão
colaboradorRoutes.get("/", colaboradorController.findAll.bind(colaboradorController));
colaboradorRoutes.get('/:id', colaboradorController.findById.bind(colaboradorController));
colaboradorRoutes.post('/', validateBody(createColaboradorSchemaDTO), colaboradorController.create.bind(colaboradorController));
colaboradorRoutes.put('/:id', validateBody(updateColaboradorSchema), colaboradorController.update.bind(colaboradorController));
colaboradorRoutes.patch('/:id/toggle-status', colaboradorController.softDelete.bind(colaboradorController));
colaboradorRoutes.delete('/:id', colaboradorController.delete.bind(colaboradorController));

//  Upload de Foto de Perfil
colaboradorRoutes.patch(
    '/:id/foto', 
    upload.single('foto'), 
    colaboradorController.updateFoto.bind(colaboradorController)
);

// ===========================================================================
//  ECOSSISTEMA BIOMÉTRICO (ORQUESTRAÇÃO BORDA <-> CENTRAL)
// ===========================================================================

/**
 * 🟢 Gatilho de início de cadastro de face (Invocado pelo Operador/Admin)
 */
colaboradorRoutes.post("/cadastrar-rosto", colaboradorController.iniciarCadastroFacial.bind(colaboradorController));

/**
 * 🔵 Solicitação de varredura manual / Teste de calibração ativa
 * Liberado para OPERADOR, GESTOR e ADMIN monitorarem a guarita
 */
colaboradorRoutes.post('/:id/reconhecer', async (req, res, next) => {
    try {
        // ✨ Corrigido: Usando a instância correta 'colaboradorController'
        return await colaboradorController.iniciarReconhecimentoManual(req, res);
    } catch (error) {
        next(error);
    }
});

/**
 * 🔴 Exclusão / Expugo definitivo da biometria facial na borda (LGPD Compliance)
 * Restrito estritamente a ADMIN e GESTOR
 */
colaboradorRoutes.delete('/:id/facial', async (req, res, next) => {
    try {
        // Intercepta a role do usuário injetada pelo token JWT no ensureAuth
        const usuarioLogado = (req as any).user; 

        if (!usuarioLogado || (usuarioLogado.role !== 'ADMIN' && usuarioLogado.role !== 'GESTOR')) {
            return res.status(403).json({
                status: 'DENIED',
                message: 'Acesso negado: Apenas administradores ou gestores possuem nível de acesso (RBAC) para deletar assinaturas biométricas.'
            });
        }

        return await colaboradorController.removerBiometriaFacial(req, res);
    } catch (error) {
        next(error);
    }
});

export default colaboradorRoutes;