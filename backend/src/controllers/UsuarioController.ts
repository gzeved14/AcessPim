import type { Request, Response } from "express";
import type { UsuarioService } from "../services/UsuarioService";
import { AppError } from "../errors/AppError";

/**
 * @class UsuarioController
 * @description Controlador responsável por lidar com as requisições relacionadas aos usuários.
 */
export default class UsuarioController {
	private userService: UsuarioService;
	
	constructor(userService: UsuarioService) {
		this.userService = userService;
	}
	/**
	 * @method findAllUsers
	 * @description Busca todos os usuários cadastrados.
	 */
	async findAllUsers(_req: Request, res: Response) {
		const users = await this.userService.findAll();
		return res.status(200).json(users);
	}
	/**
	 * @method findUserById
	 * @description Busca um usuário específico pelo seu ID.
	 */
	async findUserById(req: Request, res: Response) {
		const { id } = req.params;
		if (!id || typeof id !== 'string'){
			throw new AppError("O ID do usuário deve ser uma string válida", 400);
		}
		const user = await this.userService.findById(req.params.id as string);
		// Se o usuário não for encontrado, retorna 404.
		if (!user) {
			throw new AppError("Usuário não encontrado", 404);
		}
		return res.status(200).json(user);

	}
	/**
	 * @method createUser
	 * @description Cria um novo usuário.
	 */
	async createUser(req: Request, res: Response) {
		const newUser = await this.userService.create(req.body);
		return res.status(200).json(newUser);
	}
	/**
	 * @method updateUser
	 * @description Atualiza os dados de um usuário existente.
	 */
	async updateUser(req: Request, res: Response) {
		const { id } = req.params;

		if (!id || typeof id !== "string") {
			throw new AppError("O ID do usuário deve ser uma string válida", 400);
		}

		const updatedUser = await this.userService.update(id, req.body);
		return res.status(200).json(updatedUser);
	}
}
