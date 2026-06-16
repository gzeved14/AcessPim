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
// 🔓 1. ROTAS PÚBLICAS (Não exigem token JWT de usuário)
// ===========================================================================
routes.use("/auth", authRoutes); // /api/auth/login
routes.use("/sync", syncRoutes);

// 🎯 SOLUÇÃO DEFINITIVA PARA A BUSCA PÚBLICA DA BORDA:
// Em vez de criar uma rota GET isolada que quebra o escopo do req.params,
// nós montamos o sub-roteador do colaborador ANTES do filtro de segurança global.
// O middleware 'ensureAuth' configurado dentro do 'authMiddleware' já vai interceptar 
// o token de hardware '1010-ACCESSPIM' e dar o bypass com sucesso!
routes.use("/colaborador", collaboradorRoutes);

// Se ela estiver configurada via accessRoutes:
routes.use("/registro", accessRoutes); 


// ===========================================================================
// 🛡️ 2. FILTRO DE SEGURANÇA GLOBAL
// ===========================================================================
// Como a rota "/colaborador" agora está acima, ela herda apenas o bypass do token M2M.
// As demais rotas administrativas abaixo continuam exigindo o Token JWT convencional do painel.
routes.use(ensureAuth);


// ===========================================================================
// 🔒 3. ROTAS PRIVADAS (Exigem token JWT do painel administrativo)
// ===========================================================================
routes.use("/usuario", userRoutes);
routes.use("/area", areaRoutes);
routes.use("/dashboard", dashboardRoutes);

export default routes;