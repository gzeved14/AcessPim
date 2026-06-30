import { Request, Response, NextFunction } from 'express';
import { AcessoService } from '../services/AcessoService';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { AppError } from "../errors/AppError";

dayjs.extend(utc);
dayjs.extend(timezone);

// =========================================================================
// FUNÇÕES UTILITÁRIAS DE SUPORTE (FUSO HORÁRIO DE MANAUS UTC-4)
// =========================================================================

function toManausTime(date: Date | string | null | undefined): string | null {
    if (!date) return null;
    return dayjs(date).utc().tz('America/Manaus').format('YYYY-MM-DDTHH:mm:ss');
}

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
                novoObj[key] = ajustaTimestampsManaus(novoObj[key]);
            }
        }
        return novoObj;
    }
    return obj;
}

// =========================================================================
// CONTROLADOR PRINCIPAL DE ACESSOS
// =========================================================================

export default class AcessoController {
    constructor(private readonly accessService: AcessoService) {}

    /**
     * @method create
     * @description Cria um novo registro de acesso com Lógica Automática de Entrada/Saída.
     */
    async create(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const { colaborador_id, area_id, observacao, autorizado } = req.body;
            
            const authPayload = (req as any).auth;
            const ID_USUARIO_SISTEMA = "2d5071d4-93ad-4900-8667-85416743242b";
            const registrado_por = authPayload?.sub || ID_USUARIO_SISTEMA;

            if (!registrado_por) {
                throw new AppError("Operador não identificado", 401);
            }

            // 1. Busca o último registro deste colaborador nesta área específica
            const ultimoRegistro = await this.accessService.findUltimoRegistro(colaborador_id, area_id);

            // 2. Se o último foi ENTRADA, o próximo é SAIDA. Caso contrário, é ENTRADA.
            const tipoCalculado = (ultimoRegistro && ultimoRegistro.tipo === 'ENTRADA') ? 'SAIDA' : 'ENTRADA';

            const inputDados = {
                colaborador_id: String(colaborador_id),
                area_id: String(area_id),
                tipo: tipoCalculado, // Agora o sistema decide o tipo!
                autorizado: Boolean(autorizado),
                registrado_por: String(registrado_por),
                observacao: observacao || `Acesso automático: ${tipoCalculado}`
            };

            const newAccess = await this.accessService.registerAccess(inputDados);

            return res.status(201).json({
                status: "Sucesso!",
                mensagem: `Registro de ${tipoCalculado} consolidado com sucesso!`,
                dados: ajustaTimestampsManaus(newAccess)
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @method findAll
     * @description Busca todos os registros de acesso, aplicando filtros opcionais e regras de acesso por cargo (RF10, RF14).
     */
    async findAll(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const { dataInicio, dataFim, nome_area, nome_colaborador } = req.query;
            const auth = (req as any).auth;

            let listHistoryParams: any = {
                dataInicio: dataInicio as string,
                dataFim: dataFim as string,
                nome_area: nome_area as string,
                nome_colaborador: nome_colaborador as string
            };

            // Se for gestor de área, filtra apenas pelas áreas sob sua responsabilidade (RF14)
            if (auth?.cargo === "GESTOR_DE_AREA" && auth?.matricula) {
                const dataSource = this.accessService["repo"].manager.connection;
                const colaboradorRepo = dataSource.getRepository("Colaborador");
                const areaRepo = dataSource.getRepository("Area");
                
                const colaborador = await colaboradorRepo.findOne({ where: { matricula: auth.matricula } });
                if (colaborador) {
                    const areas = await areaRepo.find({ where: { responsavel: { id: colaborador.id } } });
                    const areaIds = areas.map(a => a.id);
                    if (areaIds.length > 0) {
                        listHistoryParams.areaIds = areaIds;
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
     */
    async checkAuthorization(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
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
     * @method update
     * @description Impede a edição de registros de acesso para preservar a auditoria (RF06).
     */
    async update(req: Request, res: Response): Promise<Response> {
        throw new AppError("Registros de acesso não podem ser editados após criados para preservar a auditoria.", 403);
    }

    /**
     * @method delete
     * @description Impede a remoção de registros de acesso para preservar a auditoria (RF06).
     */
    async delete(req: Request, res: Response): Promise<Response> {
        throw new AppError("Registros de acesso não podem ser removidos.", 403);
    }

    /**
     * @method findByColaborador
     * @description Retorna o histórico de acessos de um colaborador específico (RF12).
     */
    async findByColaborador(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
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
    async findByGestor(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
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
     * @description Retorna o histórico de acessos de um colaborador, filtrado pela área do gestor (RF15).
     */
    async findByColaboradorAndArea(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const { colaboradorId } = req.params;
            const matricula = (req as any).auth?.matricula;
            
            if (!colaboradorId || typeof colaboradorId !== 'string') {
                throw new AppError("ID do colaborador inválido ou ausente", 400);
            }
            if (!matricula) throw new AppError("Matrícula não encontrada no token.", 401);
            
            const records = await this.accessService.getHistoryByColaboradorAndArea(colaboradorId, matricula);
            return res.status(200).json(ajustaTimestampsManaus(records));
        } catch (error) {
            next(error);
        }
    }

    /**
     * @method listarpermissoes
     * @description Lista as permissões de acesso para o colaborador logado (RF16).
     */
    async listarPermissoes(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try { 
            const { id } = req.params;
            if (!id || typeof id !== 'string') {
                throw new AppError("O ID do colaborador é obrigatório.", 400);
            }

            const permissoes = await this.accessService.buscarPermissoesAtuais(id);

            const idsMapeados = permissoes.map(auth => ({

                id: auth.id, 
                areaId: auth.area.id
            }));

            return res.status(200).json(idsMapeados);
        } catch (error) {
            next(error);
        }
    }

    /**
     * @method salvarPermissoes
     * @description Atualiza as permissões de acesso para o colaborador logado (RF17).
     */
    async salvarPermissoes(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try { 
            const { colaboradorId, areasIds } = req.body;

            if (!colaboradorId){
                throw new AppError("O Id do colaboradorId é obrigatório no corpo da requisição.", 400);
            }

            if (!Array.isArray(areasIds)) {
                throw new AppError("O campo areasIds deve ser um array contendo os IDs das áreas.", 400);
            }

            await this.accessService.atualizarPermissoesAreas(colaboradorId, areasIds);

            return res.status(200).json({
                status: "Sucesso!",
                message: "Direitos de trânsito em áreas restritas atualizados com sucesso!"
            });
        } catch (error) {
            next(error);
        }
    }
}