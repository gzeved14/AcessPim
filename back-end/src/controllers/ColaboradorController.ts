import type { Request, Response } from "express";
import { ColaboradorService } from "../services/ColaboradorService.js"
import { AppError } from "../errors/AppError.js";
export default class ColaboradorController {
	constructor(private readonly colaboradorService: ColaboradorService) {}

	async findAll(req: Request, res: Response) {
		const colaborador = await this.colaboradorService.findAll();
		return res.status(200).json(colaborador);
	}

	async findById(req: Request, res: Response) {
		const { id } = req.params;
		if (!id || typeof id !== 'string') {
        	throw new AppError("ID do colaborador inválido ou ausente", 400);
    	}
		const colaborador = await this.colaboradorService.findById(id);
		if (!colaborador){
			throw new AppError("Colaborador não encontrado", 404);
		}
		return res.status(200).json(colaborador);

	}

	async create(req: Request, res: Response) {
		const newColaborador = await this.colaboradorService.create(req.body);
		return res.status(200).json(newColaborador);
	}

	async update(req: Request, res: Response) {
		const id  = req.params.id as string;
		const colaboradorUpdate = await this.colaboradorService.update(id, req.body)
		return res.status(200).json(colaboradorUpdate);
	}
}
