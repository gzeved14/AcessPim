import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import type { Request, Response, NextFunction } from "express";
import { AcessoService } from "../services/AcessoService.js"
import { AppError } from "../errors/AppError.js"

dayjs.extend(utc);
dayjs.extend(timezone);

// Função utilitária para converter datas para o fuso de Manaus (UTC-4)
function toManausTime(date: Date | string | null | undefined): string | null {
	if (!date) return null;
	// Usa dayjs para converter UTC para America/Manaus
	return dayjs(date).utc().tz('America/Manaus').format('YYYY-MM-DDTHH:mm:ss');
}

// Aplica a conversão em um ou mais registros
function ajustaTimestampsManaus(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(ajustaTimestampsManaus);
    }
    if (obj && typeof obj === 'object') {
        const novoObj = { ...obj };
        for (const key in novoObj) {
            if (key === 'timestamp' && novoObj[key]) {
                novoObj[key] = toManausTime(novoObj[key]);
            } else if (typeof novoObj[key] === 'object') {
                // Se houver um objeto dentro (ex: objeto colaborador), limpa ele também
                novoObj[key] = ajustaTimestampsManaus(novoObj[key]);
            }
        }
        return novoObj;
    }
    return obj;
}

/**
 * @class AcessoController
 * @description Controlador responsável por lidar com as requisições relacionadas aos registros de acesso.
 */
export default class AcessoController {
	constructor(private readonly accessService: AcessoService) {}

	/**
	 * @method findAll
	 * @description Busca todos os registros de acesso, aplicando filtros opcionais e regras de acesso por cargo (RF10, RF14).
	 */
	async findAll( req: Request, res: Response, next: NextFunction) {
		try {
			console.log("[AcessoController] Requisição recebida em create:", req.body);
			const { dataInicio, dataFim, nome_area, nome_colaborador } = req.query;
			const auth = (req as any).auth;

			let listHistoryParams: any = {
				dataInicio: dataInicio as string,
				dataFim: dataFim as string,
				nome_area: nome_area as string,
				nome_colaborador: nome_colaborador as string
			};
			// Se o usuário for um "GESTOR_DE_AREA", filtra os registros apenas pelas áreas sob sua responsabilidade (RF14).
			// Se for gestor de área, filtra apenas pelas áreas sob sua responsabilidade
			if (auth?.cargo === "GESTOR_DE_AREA" && auth?.matricula) {
				const dataSource = this.accessService["repo"].manager.connection;
				const colaboradorRepo = dataSource.getRepository("Colaborador");
				const areaRepo = dataSource.getRepository("Area");
				const colaborador = await colaboradorRepo.findOne({ where: { matricula: auth.matricula } });
				if (colaborador) {
					const areas = await areaRepo.find({ where: { responsavel: { id: colaborador.id } } });
					const areaIds = areas.map(a => a.id);
					if (areaIds.length > 0) {
						listHistoryParams.areaIds = areaIds; // Adiciona os IDs das áreas ao filtro.
					}
				}
			}
			const records = await this.accessService.listHistory(listHistoryParams);

			return res.status(200).json(ajustaTimestampsManaus(records));
		} catch (error) {
			next(error);
		}
	}

	/**
	 * @method checkAuthorization
	 * @description Realiza uma pré-visualização da autorização de acesso (RF11).
	 * Verifica se um acesso seria autorizado ou negado ANTES de ser registrado, útil para o operador.
	 */
	async checkAuthorization(req: Request, res: Response, next: NextFunction) {
		try {
			const { colaborador_id, area_id, tipo } = req.body;

			if (!colaborador_id || !area_id || !tipo) {
				throw new AppError("colaborador_id, area_id e tipo são obrigatórios", 400);
			}

			const preview = await this.accessService.checkAuthorizationPreview(
				colaborador_id,
				area_id,
				tipo
			);

			return res.status(200).json(preview);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * @method create
	 * @description Cria um novo registro de acesso (RF01, RF02, RF03, RF04, RF05, RF06).
	 * O operador que registra o acesso é identificado pelo token JWT.
	 */
	async create(req: Request, res: Response, next: NextFunction) {
    	try {
			const { colaborador_id, area_id, tipo, observacao, autorizado } = req.body;
			const registrado_por = (req as any).auth?.sub;

			if (!registrado_por) {
				throw new AppError("Operador não identificado no token", 401);
			}
			// A validação do campo 'autorizado' como boolean é feita pelo Zod (middleware de validação).
			//  removida a checagem manual — o Zod já garante que é boolean
			const newAccess = await this.accessService.registerAccess({
				colaborador_id,
				area_id,
				tipo,
				registrado_por,
				observacao,
				autorizado
			});

			return res.status(201).json(ajustaTimestampsManaus(newAccess));
		} catch (error) {
			next(error);
		}
	}
	
	/**
	 * @method update
	 * @description Impede a edição de registros de acesso para preservar a auditoria (RF06).
	 */
	async update( req: Request, res: Response) {
		throw new AppError("Registros de acesso não podem ser editados após criados para preservar a auditoria.", 403);
    }

	/**
	 * @method delete
	 * @description Impede a remoção de registros de acesso para preservar a auditoria (RF06).
	 */
	async delete( req: Request, res: Response) {
		throw new AppError("Registros de acesso não podem ser removidos.", 403);
    }
	/**
	 * @method findByColaborador
	 * @description Retorna o histórico de acessos de um colaborador específico (RF12).
	 */
	async findByColaborador(req: Request, res: Response, next: NextFunction) {
		try {
			const { colaboradorId } = req.params;
			if (!colaboradorId || typeof colaboradorId !== 'string') {
				throw new AppError("ID do colaborador inválido ou ausente", 400);
			}
			const records = await this.accessService.getHistoryByColaborador(colaboradorId);
			return res.status(200).json(ajustaTimestampsManaus(records));
		} catch (error) {
			next(error);
		}
	}
	/**
	 * @method findByGestor
	 * @description Retorna o histórico de acessos para a área sob responsabilidade do gestor logado (RF14).
	 */
	async findByGestor(req: Request, res: Response, next: NextFunction) {
		try {
			const matricula = (req as any).auth?.matricula;
			if (!matricula) throw new AppError("Matrícula não encontrada no token.", 401);
			const records = await this.accessService.getHistoryByGestor(matricula);
			return res.status(200).json(ajustaTimestampsManaus(records));
		} catch (error) {
			next(error);
		}
	}
	/**
	 * @method findByColaboradorAndArea
	 * @description Retorna o histórico de acessos de um colaborador específico, filtrado pela área
	 * que o gestor logado é responsável (RF15).
	 */
	async findByColaboradorAndArea(req: Request, res: Response, next: NextFunction) {
		try {
			const { colaboradorId } = req.params;
			if (!colaboradorId || typeof colaboradorId !== 'string') {
				throw new AppError("ID do colaborador inválido ou ausente", 400);
			}
			const matricula = (req as any).auth?.matricula;
			if (!matricula) throw new AppError("Matrícula não encontrada no token.", 401);
			if (!colaboradorId) throw new AppError("ID do colaborador inválido ou ausente.", 400);
			const records = await this.accessService.getHistoryByColaboradorAndArea(colaboradorId, matricula);
			return res.status(200).json(ajustaTimestampsManaus(records));
		} catch (error) {
			next(error);
		}
	}
}
