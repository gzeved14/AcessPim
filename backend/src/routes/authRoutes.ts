import { Router } from 'express';
import { appDataSource } from '../config/appDataSource';
import AuthController from '../controllers/AuthController';
import { AuthService } from '../services/AuthService';
import { validateBody } from '../middleware/validateBody';
import { loginSchema, refreshSchema, logoutSchema} from '../dtos/AuthSchemaDTO';
import { ensureAuth } from '../middleware/authMiddleware';

const router = Router();

const authService = new AuthService(appDataSource);
const authController = new AuthController(authService);

router.post("/login", validateBody(loginSchema), authController.login.bind(authController));
router.post("/refresh", validateBody(refreshSchema), authController.refresh.bind(authController));

router.post("/logout", ensureAuth, validateBody(logoutSchema), authController.logout.bind(authController));

export default router;