import { AppError } from "../errors/AppError.js";
export default class UsuarioController {
    userService;
    constructor(userService) {
        this.userService = userService;
    }
    async findAllUsers(_req, res) {
        const users = await this.userService.findAll();
        return res.status(200).json(users);
    }
    async findUserById(req, res) {
        const { id } = req.params;
        if (!id || typeof id !== 'string') {
            throw new AppError("O ID do usuário deve ser uma string válida", 400);
        }
        const user = await this.userService.findById(req.params.id);
        if (!user) {
            throw new AppError("Usuário não encontrado", 404);
        }
        return res.status(200).json(user);
    }
    async createUser(req, res) {
        const newUser = await this.userService.create(req.body);
        return res.status(200).json(newUser);
    }
    async updateUser(req, res) {
        const { id } = req.params;
        if (!id || typeof id !== "string") {
            throw new AppError("O ID do usuário deve ser uma string válida", 400);
        }
        const updatedUser = await this.userService.update(id, req.body);
        return res.status(200).json(updatedUser);
    }
}
//# sourceMappingURL=UsuarioController.js.map