import type { Request, Response } from "express";
import { AreaService } from "../services/AreaService"
import { AppError } from "../errors/AppError"

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

	async obterEpisArea(req: Request, res: Response): Promise<Response> {
	try {
		const id = String(req.params.id);
		const area = await this.areaService.findById(id);
		
		if (!area) {
		return res.status(404).json({ message: "Área não encontrada." });
		}

		// Regra de negócio do Trio: Se a área for crítica/alta, exige equipamentos
		// Mapeamos dinamicamente baseado no nível de risco salvo no Postgres
		let episRequired: string[] = [];
		const risco = String(area.nivel_risco).toUpperCase();

		if (risco === 'ALTO' || risco === 'CRITICO') {
		episRequired = ["capacete", "oculos"];
		} else if (risco === 'MEDIO') {
		episRequired = ["oculos"];
		}

		return res.status(200).json({
		area_id: id,
		area_nome: area.nome,
		epis: episRequired // Chave que o seu NetworkService em Python consome!
		});
	} catch (error) {
		console.error("Erro ao ler requisitos de EPI:", error);
		return res.status(500).json({ message: "Erro ao ler requisitos de EPI." });
	}
	}

	async delete( req: Request, res: Response) {
		const { id } = req.params;
		if (!id || typeof id !== 'string') {
			throw new AppError("ID da área inválido ou ausente para exclusão.", 400);
		}
		await this.areaService.softDelete(id);
		return res.status(204).send();
	}

	async hardDelete(req: Request, res: Response) {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
        throw new AppError("ID da área inválido ou ausente para exclusão.", 400);
    }
    await this.areaService.delete(id);
    return res.status(204).send();
	}
	
}
