import { Router } from 'express';
import { appDataSource } from '../config/appDataSource.js';
import AuthController from '../controllers/AuthController.js';
import { AuthService } from '../services/AuthService.js';
import { validateBody } from '../middleware/validateBody.js';
import { loginSchema, refreshSchema, logoutSchema } from '../dtos/AuthSchemaDTO.js';
const router = Router(); //adiciona rotas nesse router para depois exportar e usar no index.ts
const authService = new AuthService(appDataSource); //AuthService pode acessar o banco (ex: encontrar user, armazenar token, etc)
const authController = new AuthController(authService); //Usa o service para executar a lógica
router.post("/login", validateBody(loginSchema), authController.login.bind(authController));
router.post("/refresh", validateBody(refreshSchema), authController.refresh.bind(authController));
router.post("/logout", validateBody(logoutSchema), authController.logout.bind(authController));
export default router;
//# sourceMappingURL=authRoutes.js.map