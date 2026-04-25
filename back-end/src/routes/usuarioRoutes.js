import { Router } from 'express'; //permite criar módulos de rotas separados do app principal
import { appDataSource } from '../config/appDataSource.js'; //injeta no service para que o service possa acessar repo/entidades
import UsuarioController from '../controllers/UsuarioController.js';
import { validateBody } from '../middleware/validateBody.js';
import { CreateUserSchemaDTO, updateUserSchema } from '../dtos/CreateUserSchemaDTO.js';
import { UsuarioService } from '../services/UsuarioService.js';
const userRoutes = Router();
const userService = new UsuarioService(appDataSource);
const userController = new UsuarioController(userService);
userRoutes.get("/", userController.findAllUsers.bind(userController));
userRoutes.get("/:id", userController.findUserById.bind(userController));
userRoutes.post("/", validateBody(CreateUserSchemaDTO), userController.createUser.bind(userController));
userRoutes.put("/:id", validateBody(updateUserSchema), userController.updateUser.bind(userController));
export default userRoutes;
//o objetivo do código é criar totas com endpoints para( listar usuários, buscar por id, criar e atualizar) e exportar esse roteador para ser usado no aqruivo principal (index.ts). ex: app.use('/usuarios', usuarioRoutes)
// qual problema ele resolve? Organiza API em camadas e separa a responsabilidades: Rotas: só definem caminhos + middlewares + qual método do controller chamar. Controller: lida com req/res. Service: lógica de negócio e persistência(via appDataSource)
//# sourceMappingURL=usuarioRoutes.js.map