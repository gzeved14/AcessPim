import type { Request, Response } from "express";

export default class UsuarioController {
	constructor(private readonly usuarioService: unknown) {}

	async findALLUser(_req: Request, res: Response) {
		return res.status(501).json({ message: "Not implemented" });
	}

	async findUserById(_req: Request, res: Response) {
		return res.status(501).json({ message: "Not implemented" });
	}

	async createUser(_req: Request, res: Response) {
		return res.status(501).json({ message: "Not implemented" });
	}

	async updateUser(_req: Request, res: Response) {
		return res.status(501).json({ message: "Not implemented" });
	}
}
