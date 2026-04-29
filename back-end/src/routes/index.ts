import { Router } from 'express';
import userRoutes from './usuarioRoutes.js';
import authRoutes from './authRoutes.js';
import collaboratorRoutes from './colaboradorRoutes.js';
import areaRoutes from './areaRoutes.js';
import accessRoutes from './acessoRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import { ensureAuth } from '../middleware/authMiddleware.js';
import { appDataSource } from '../config/appDataSource.js';

const routes = Router();

// Rota pública na raiz para testar o status do banco de dados livremente
routes.get("/db-status", async (req, res) => {
    try {
        if (appDataSource.isInitialized) {
            await appDataSource.query("SELECT 1 AS conectado");
            res.status(200).json({ status: "sucesso", mensagem: "Banco de dados conectado e respondendo perfeitamente!" });
        } else {
            res.status(500).json({ status: "erro", mensagem: "A conexão (DataSource) não foi inicializada." });
        }
    } catch (error) {
        res.status(500).json({ status: "erro", mensagem: "Falha de comunicação com o banco de dados.", detalhes: error });
    }
});

routes.use("/auth", authRoutes);
routes.use("/usuario", ensureAuth, userRoutes);
routes.use("/colaborador", collaboratorRoutes);
routes.use("/area", areaRoutes);
routes.use("/registro", accessRoutes);
routes.use("/dashboard", ensureAuth, dashboardRoutes);

export default routes;