import type { Request, Response } from "express";
import { ColaboradorService } from "../services/ColaboradorService"
import { AppError } from "../errors/AppError";

/**
 * @class ColaboradorController
 * @description Controlador responsável por lidar com as requisições relacionadas aos colaboradores.
 */
export default class ColaboradorController {
	constructor(private readonly colaboradorService: ColaboradorService) {}

	/**
	 * @method findAll
	 * @description Busca todos os colaboradores cadastrados (RF22).
	 */
	async findAll(req: Request, res: Response) {
		const colaborador = await this.colaboradorService.findAll();
		return res.status(200).json(colaborador);
	}

	/**
	 * @method findById
	 * @description Busca um colaborador específico pelo seu ID (RF24).
	 */
	async findById(req: Request, res: Response) {
		const { id } = req.params;
		if (!id || typeof id !== 'string') {
        	throw new AppError("ID do colaborador inválido ou ausente", 400);
    	}
		const colaborador = await this.colaboradorService.findById(id);
		// Se o colaborador não for encontrado, retorna 404.
		if (!colaborador){
			throw new AppError("Colaborador não encontrado", 404);
		}
		return res.status(200).json(colaborador);

	}
	/**
	 * @method create
	 * @description Cria um novo colaborador (RF23).
	 */
	async create(req: Request, res: Response) {
		const newColaborador = await this.colaboradorService.create(req.body);
		return res.status(200).json(newColaborador);
	}
	/**
	 * @method update
	 * @description Atualiza os dados de um colaborador existente (RF25).
	 */
	async update(req: Request, res: Response) {
		const id  = req.params.id as string;
		const colaboradorUpdate = await this.colaboradorService.update(id, req.body)
		return res.status(200).json(colaboradorUpdate);
	}
	async updateFoto(req: Request, res: Response) {
		const id  = req.params.id as string;
		
		// O multer disponibiliza as informações do arquivo em req.file
		if (!req.file) {
			return res.status(400).json({ error: 'Nenhuma imagem foi enviada.' });
		}

		// Pegamos apenas o nome do arquivo gerado (com o hash que configuramos)
		const fileName = req.file.filename;

		// Chamamos o service para salvar esse nome no banco de dados (coluna foto_url)
		const colaborador = await this.colaboradorService.updateFoto(id, fileName);

		return res.json(colaborador);
	}

	/**
	 * @method softDelete
	 * @description Desativa um colaborador (soft delete) (RF26).
	 */
	async softDelete(req: Request, res: Response) {
        const { id } = req.params;
        if (!id || typeof id !== 'string') {
            throw new AppError("ID do colaborador inválido ou ausente para desativação.", 400);
        }
        await this.colaboradorService.softDelete(id);
        return res.status(204).send(); // 204 No Content para indicar sucesso sem retorno de corpo
    }
    /**
	 * @method delete
	 * @description Exclui um colaborador permanentemente (hard delete) (RF27).
	 */
    async delete(req: Request, res: Response) {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
        throw new AppError("ID do colaborador inválido ou ausente.", 400);
    }
    await this.colaboradorService.delete(id);
    return res.status(204).send();
	}
}
