import type { Request, Response, NextFunction } from "express";
import { AcessoService } from "../services/AcessoService.js"
import { AppError } from "../errors/AppError.js"
export default class AcessoController {
	constructor(private readonly accessService: AcessoService) {}

	async findAll( req: Request, res: Response, next: NextFunction) {
		   try {
			   console.log("[AcessoController] Requisição recebida em create:", req.body);
			const { dataInicio, dataFim, area_id, colaborador_id} = req.query;

			const records = await this.accessService.listHistory({
				dataInicio: dataInicio as string,
				dataFim: dataFim as string,
				area_id: area_id as string,
				colaborador_id: colaborador_id as string
			});

			return res.status(200).json(records);
		} catch (error) {
			next(error);
		}
	}

	async create( req: Request, res: Response, next: NextFunction) {
		try {
			const { colaborador_id, area_id, tipo, observacao, autorizado } = req.body;
			
			const registrado_por = (req as any).auth?.sub;

			if (!registrado_por){
				throw new AppError("Operador não identificado no token", 401);
			}

			if (typeof autorizado !== 'boolean') {
				throw new AppError("O campo 'autorizado' é obrigatório e deve ser um booleano.", 400);
			}

			const newAccess = await this.accessService.registerAccess({
				colaborador_id,
				area_id,
				tipo,
				registrado_por,
				observacao,
				autorizado
			});

			return res.status(201).json(newAccess);
		} catch (error) {
			next(error);
		}
	}
	
	async update( req: Request, res: Response) {
		throw new AppError("Registros de acesso não podem ser editados após criados para preservar a auditoria.", 403);
    }

	async delete( req: Request, res: Response) {
		throw new AppError("Registros de acesso não podem ser removidos.", 403);
    }
}
