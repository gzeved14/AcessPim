import { Router } from 'express';
import userRoutes from './usuarioRoutes';
import authRoutes from './authRoutes';
import collaboratorRoutes from './colaboradorRoutes';
import areaRoutes from './areaRoutes';
import accessRoutes from './acessoRoutes';
import dashboardRoutes from './dashboardRoutes';
import { ensureAuth } from '../middleware/authMiddleware';

const routes = Router();

// 🔓 1. ROTAS PÚBLICAS (Não exigem token JWT)
routes.use("/auth", authRoutes); // /api/auth/login

// 🎯 MOVA A SUA ROTA DE REGISTRO PARA CÁ (Antes do filtro de segurança):
// Se ela estiver configurada via accessRoutes:
routes.use("/registro", accessRoutes); 

// 🛡️ 2. FILTRO DE SEGURANÇA GLOBAL
routes.use(ensureAuth);

// 🔒 3. ROTAS PRIVADAS (Exigem token JWT)
routes.use("/usuario", userRoutes);
routes.use("/colaborador", collaboratorRoutes);
routes.use("/area", areaRoutes);
routes.use("/dashboard", dashboardRoutes);

export default routes;