import { Router } from 'express';
import usuarioRoutes from './usuarioRoutes.js';
import authRoutes from './authRoutes.js';
import colaboradorRoutes from './colaboradorRoutes.js';
import areaRoutes from './areaRoutes.js';
import registroRoutes from './acessoRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';

const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/usuario", usuarioRoutes);
routes.use("/colaborador", colaboradorRoutes);
routes.use("/area", areaRoutes);
routes.use("/registro", registroRoutes);
routes.use("/dashboard", dashboardRoutes);

export default routes;