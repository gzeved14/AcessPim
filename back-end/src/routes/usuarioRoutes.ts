import { Router } from 'express'; //permite criar módulos de rotas separados do app principal
import { appDataSource } from '../config/appDataSource.js'; //injeta no service para que o service possa acessar repo/entidades
import UsuarioController from '../controllers/UsuarioController.js';
import { validateBody } from '../middleware/validateBody.js';
import { createUserSchema, updateUserSchema } from '../dtos/CreateUserSchemaDTO.js';
import { AuthService } from '../services/AuthService.js';

const usuarioRoutes = Router();

const usuarioService = new AuthService(appDataSource); // appDataSource é a conexão com o banco de dados
const usuarioController = new UsuarioController(usuarioService); // UsuarioController recebe a requisição e devolve a resposta, UsuarioService contém a regras de negócios e acesso a dados 

usuarioRoutes.get("/", usuarioController.findALLUser.bind(usuarioController));
usuarioRoutes.get("/:id", usuarioController.findUserById.bind(usuarioController));
usuarioRoutes.post("/", validateBody(createUserSchema), usuarioController.createUser.bind(usuarioController));
usuarioRoutes.put("/:id", validateBody(updateUserSchema), usuarioController.updateUser.bind(usuarioController)); // middleware de validação (validateBody) + schemas (createUserSchema, updateUserSchema) valida o corpo (req.body) antes de chegar no controller

export default usuarioRoutes;

//o objetivo do código é criar totas com endpoints para( listar usuários, buscar por id, criar e atualizar) e exportar esse roteador para ser usado no aqruivo principal (index.ts). ex: app.use('/usuarios', usuarioRoutes)
// qual problema ele resolve? Organiza API em camadas e separa a responsabilidades: Rotas: só definem caminhos + middlewares + qual método do controller chamar. Controller: lida com req/res. Service: lógica de negócio e persistência(via appDataSource)