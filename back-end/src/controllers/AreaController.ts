import type { Request, Response } from "express";
import { AreaService } from "../services/AreaService.js"
import { AppError } from "../errors/AppError.js"

export default class AreaController {
	constructor(private readonly areaService: AreaService) {}

	async findAll( req: Request, res: Response) {
		const area = await this.areaService.listAll()
		return res.status(200).json(area);
	}

	async findById( req: Request, res: Response) {
		const { id } = req.params;
		if (!id || typeof id !== 'string') {
        	throw new AppError("ID da área inválido ou ausente", 400);
    	}
		const area = await this.areaService.findById(id);
		if (!area){
			throw new AppError("Área não encontrada", 404);
		}
		return res.status(200).json(area);
	}

	async create( req: Request, res: Response) {
		const newArea = await this.areaService.create(req.body);
		return res.status(201).json(newArea);
	}

	async update( req: Request, res: Response) {
		const id  = req.params.id as string;
		const areaUpdate = await this.areaService.update(id, req.body);
		return res.status(200).json(areaUpdate);
	}

	async delete( req: Request, res: Response) {
		const { id } = req.params;
		if (!id || typeof id !== 'string') {
			throw new AppError("ID da área inválido ou ausente para exclusão.", 400);
		}
		await this.areaService.softDelete(id);
		return res.status(204).send();
	}
}
