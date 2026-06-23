import { Router } from 'express';
import userRoutes from './usuarioRoutes';
import authRoutes from './authRoutes';
import collaboradorRoutes from './colaboradorRoutes';
import areaRoutes from './areaRoutes';
import accessRoutes from './acessoRoutes';
import dashboardRoutes from './dashboardRoutes';
import { ensureAuth } from '../middleware/authMiddleware';
import { syncRoutes } from './syncRoutes';

const routes = Router();

// ===========================================================================
// 🔓 1. TOTALMENTE PÚBLICO (Zero middlewares, herda o caminho livre)
// ===========================================================================
routes.use("/auth", authRoutes); // 🟢 Resolve: /api/auth/login sem NENHUMA trava

// ===========================================================================
// 🛡️ 2. ROTAS COM PROTEÇÃO BIOMÉTRICA / M2M (Bypass com Token de Hardware)
// ===========================================================================
// Injetamos o middleware explicitamente aqui para validar o token '1010-ACCESSPIM'
routes.use("/colaborador", ensureAuth, collaboradorRoutes);
routes.use("/registro", ensureAuth, accessRoutes); 
routes.use("/sync", ensureAuth, syncRoutes);

// ===========================================================================
// 🔒 3. ROTAS PRIVADAS ADMINISTRATIVAS (Exigem Token JWT do Usuário Logado)
// ===========================================================================
// Passamos o ensureAuth apenas para os módulos que necessitam de login do painel Angular
routes.use("/usuario", ensureAuth, userRoutes);
routes.use("/area", ensureAuth, areaRoutes);
routes.use("/dashboard", ensureAuth, dashboardRoutes);

export default routes;