import type { Request, Response } from "express";
import type { UsuarioService } from "../services/UsuarioService.js";
import { AppError } from "../errors/AppError.js";

export default class UsuarioController {
	private userService: UsuarioService;
	
	constructor(userService: UsuarioService) {
		this.userService = userService;
	}

	async findAllUsers(_req: Request, res: Response) {
		const users = await this.userService.findAll();
		return res.status(200).json(users);
	}

	async findUserById(req: Request, res: Response) {
		const { id } = req.params;
		if (!id || typeof id !== 'string'){
			throw new AppError("O ID do usuário deve ser uma string válida", 400);
		}
		const user = await this.userService.findById(req.params.id as string);
		if (!user) {
			throw new AppError("Usuário não encontrado", 404);
		}
		return res.status(200).json(user);

	}

	async createUser(req: Request, res: Response) {
		const newUser = await this.userService.create(req.body);
		return res.status(200).json(newUser);
	}

	async updateUser(req: Request, res: Response) {
		const { id } = req.params;

		if (!id || typeof id !== "string") {
			throw new AppError("O ID do usuário deve ser uma string válida", 400);
		}

		const updatedUser = await this.userService.update(id, req.body);
		return res.status(200).json(updatedUser);
	}
}
