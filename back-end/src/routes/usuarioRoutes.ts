import { Router } from 'express'; //permite criar módulos de rotas separados do app principal
import { appDataSource } from '../config/appDataSource.js'; //injeta no service para que o service possa acessar repo/entidades
// Controlador responsável por mediar as requisições para métodos de usuários.
import UsuarioController from '../controllers/UsuarioController.js';
// Middleware utilizado para verificar se os dados informados num POST/PUT coincidem com a base de segurança pré estabelecida DTO.
import { validateBody } from '../middleware/validateBody.js';
import { CreateUserSchemaDTO, updateUserSchema } from '../dtos/CreateUserSchemaDTO.js';
// O serviço que conterá os métodos atrelados da base que retornam e escrevem banco na base.
import { UsuarioService } from '../services/UsuarioService.js';

// Transforma "userRoutes" num agrupador configurável nativo de rotas express.
const userRoutes = Router();

// Injeta as definições do DataSource em UsuarioService habilitando acesso de rede por trás dos panos.
const userService = new UsuarioService(appDataSource);
// Entrega a estrutura instanciada do service como injeção de dependência no Controller e habilita os construtores de Controller processar as funções.
const userController = new UsuarioController(userService);

// Configura uma chamada via GET e liga no verbo findAllUsers atrelando forçadamente seu local de contexto `.bind()`.
userRoutes.get("/", userController.findAllUsers.bind(userController));

// Configura rota dinâmica atrelada à URL do ID buscado.
userRoutes.get("/:id", userController.findUserById.bind(userController));
// Cria a rota do tipo POST em que primeiro se testa a validação do Payload CreateUserSchemaDTO antes de ser direcionada para o controller realizar a criação.
userRoutes.post("/", validateBody(CreateUserSchemaDTO), userController.createUser.bind(userController));
// Cria a rota de tipo PUT permitindo requisição ativadora de edição do usuário baseada em validação contra um schema parcial de DTO updateUserSchema.
userRoutes.put("/:id", validateBody(updateUserSchema), userController.updateUser.bind(userController));

// Torna as definições exportáveis para que o arquivo index.ts inclua os caminhos do `app.use()` neste pacote gerado de sub-rotas.
export default userRoutes;

//o objetivo do código é criar rotas com endpoints para( listar usuários, buscar por id, criar e atualizar) e exportar esse roteador para ser usado no aqruivo principal (index.ts). ex: app.use('/usuarios', usuarioRoutes)
// qual problema ele resolve? Organiza API em camadas e separa a responsabilidades: Rotas: só definem caminhos + middlewares + qual método do controller chamar. Controller: lida com req/res. Service: lógica de negócio e persistência(via appDataSource)