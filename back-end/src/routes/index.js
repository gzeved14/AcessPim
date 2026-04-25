import { Router } from 'express';
import userRoutes from './usuarioRoutes.js';
import authRoutes from './authRoutes.js';
import collaboratorRoutes from './colaboradorRoutes.js';
import areaRoutes from './areaRoutes.js';
import accessRoutes from './acessoRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import { ensureAuth } from '../middleware/authMiddleware.js';
const routes = Router();
routes.use("/auth", authRoutes);
routes.use("/usuario", ensureAuth, userRoutes);
routes.use("/colaborador", collaboratorRoutes);
routes.use("/area", areaRoutes);
routes.use("/registro", accessRoutes);
routes.use("/dashboard", ensureAuth, dashboardRoutes);
export default routes;
//# sourceMappingURL=index.js.map