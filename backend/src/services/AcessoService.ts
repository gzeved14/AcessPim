// Importa utilitários do TypeORM para lidar com persistência de dados no banco de dados e aplicar filtros em consultas.
import { Repository, DataSource, Between, ILike, In } from "typeorm";
// Importa entidades necessárias do banco de dados e os tipos de suporte e tratamento de erro.
import { RegistroAcesso } from "../entities/RegistroAcesso";
import { AppError } from "../errors/AppError";
import { Colaborador } from "../entities/Colaborador";
import { Area } from "../entities/Area";
import { Usuario } from "../entities/Usuario";
import { Autorizacao } from "../entities/Autorizacao";
import { Tipo } from "../types/Tipo";

// Interface que define a estrutura de dados esperada no input para registrar um novo acesso.
interface RegisterAccessInput {
    colaborador_id: string;    // ID do colaborador (quem está entrando ou saindo).
    area_id: string;           // ID da área que ele tentou acessar.
    tipo: string;              // Tipo da movimentação de registro (ENTRADA/SAIDA).
    autorizado: boolean;       // Booleano se a entrada foi autorizada de fato.
    registrado_por: string;    // ID do usuário (sistema ou guarda) que inseriu o acesso.
    observacao?: string;       // Texto descritivo (obrigatório se não foi autorizado).
}

// Interface que define de que maneiras a listagem do histórico de acessos poderá ser filtrada.
interface ListHistoryFilters {
    dataInicio?: string;
    dataFim?: string;
    nome_area?: string;
    nome_colaborador?: string;
    areaIds?: string[]; // Filtro opcional por múltiplas áreas (para gestor de área).
}

// Classe de serviço responsável pelas regras de negócio e manipulação da entidade RegistroAcesso.
export class AcessoService {
    // Declara a variável privada do repositório responsável por salvar e buscar instâncias de RegistroAcesso.
    private repo: Repository<RegistroAcesso>;
    private autorizacaoRepo: Repository<Autorizacao>;
    // O construtor recebe a conexão do banco de dados (DataSource) e inicializa o repositório da entidade.
    constructor(dataSource: DataSource) {
        this.repo = dataSource.getRepository(RegistroAcesso);
        this.autorizacaoRepo = dataSource.getRepository(Autorizacao);
    }

    /**
     * @method canAccessArea
     * @description Verifica se um colaborador tem permissão para acessar uma área específica.
     * A permissão é baseada no cargo do colaborador e nas autorizações cadastradas (RF08).
     * 
     * @param colaboradorId - ID do colaborador
     * @param areaId - ID da área
     * @returns boolean - true se tem permissão, false caso contrário
     */
    async canAccessArea(colaboradorId: string, areaId: string): Promise<boolean> {
        // Busca o colaborador com seu cargo
        const colaborador = await this.repo.manager.findOne(Colaborador, {
            where: { id: colaboradorId },
        });
        // Se o colaborador não for encontrado, lança um erro.
        if (!colaborador) {
            throw new AppError("Colaborador não encontrado", 404);
        }
        // Verifica se existe uma autorização para o cargo do colaborador na área especificada.
        // Verifica se existe uma autorização para este cargo nesta área
        const autorizacao = await this.autorizacaoRepo.findOne({
            where: [ 
                { area: { id: areaId }, colaborador: { id: colaboradorId } },
                { area: { id: areaId }, cargo: colaborador.cargo }
            ],
        });
        // Se não houver autorização, retorna falso.
        if (!autorizacao) {
            return false; // Sem autorização
        }
        // Verifica se a autorização não expirou.
        // Verifica se a autorização não expirou
        if (autorizacao.validade && new Date(autorizacao.validade) < new Date()) {
            return false; // Expirada
        }
        // Se todas as verificações passarem, o colaborador tem permissão.
        return true; // Autorizado
    }

    /**
     * @method registerAccess
     * @description Cria e salva um novo registro de acesso com base nas informações recebidas (RF01, RF02, RF03, RF04, RF05, RF06).
     */
    async registerAccess(data: RegisterAccessInput) {
        // Adiciona um log detalhado para facilitar a depuração (Passo 5)
        console.log("[AcessoService.registerAccess] Dados recebidos:", data);

        // Desestrutura o objeto recebido extraindo apenas as variáveis declaradas.
        const { colaborador_id, area_id, tipo, autorizado, registrado_por, observacao } = data;
        // Valida uma regra de negócios: acessos que foram barrados/negados exigem obrigatoriamente um texto explicativo (RF04).
        // Valida uma regra de negócios: acessos que foram barrados/negados exigem obrigatoriamente um texto explicativo.
        if (!autorizado && !observacao) {
            throw new AppError("A observação é obrigatória para acessos não autorizados.", 400);
        }
        // Verifica permissão de transição: se for ENTRADA e autorizado, valida se o colaborador tem permissão (RF08).
        // E impede múltiplas entradas sem saída (regra de exclusividade de presença)
        if (tipo.toUpperCase() === 'ENTRADA' && autorizado) {
            // 1. Impede múltiplas entradas sem saída
            // Busca se existe alguma ENTRADA autorizada sem SAÍDA correspondente para esse colaborador
            const entradaSemSaida = await this.repo.createQueryBuilder("access")
                .where("access.colaborador_id = :colaborador_id", { colaborador_id })
                .andWhere("access.tipo = :tipoEntrada", { tipoEntrada: Tipo.ENTRADA })
                .andWhere("access.autorizado = :autorizado", { autorizado: true })
                .andWhere(qb => {
                    // Não existe uma SAÍDA autorizada posterior para a mesma entrada
                    return `NOT EXISTS (
                        SELECT 1 FROM registro_acesso saida
                        WHERE saida.colaborador_id = access.colaborador_id
                          AND saida.tipo = '${Tipo.SAIDA}'
                          AND saida.autorizado = true
                          AND saida.registrado_em > access.registrado_em
                    )`;
                })
                .getOne();
            if (entradaSemSaida) {
                throw new AppError("Colaborador já está em uma área. É necessário registrar a saída antes de uma nova entrada.", 409);
            }

            // 2. Permissão de acesso à área
            const temPermissao = await this.canAccessArea(colaborador_id, area_id);
            if (!temPermissao) {
                // Neste caso, a entrada NÃO é permitida pelas autorizações cadastradas
                console.warn(`[AcessoService] Colaborador ${colaborador_id} não tem permissão para acessar área ${area_id}`);
                throw new AppError("Colaborador não tem autorização para acessar esta área.", 403);
            }
        }

        // Verifica capacidade apenas para entradas autorizadas
        if (tipo.toUpperCase() === 'ENTRADA' && autorizado) {
            const area = await this.repo.manager.findOne(Area, { where: { id: area_id } });
            if (!area) throw new AppError("Área não encontrada.", 404);

            const entries = await this.repo.createQueryBuilder("access")
                .where("access.area_id = :area_id", { area_id })
                .andWhere("access.tipo = :tipo", { tipo: Tipo.ENTRADA })
                .andWhere("access.autorizado = :autorizado", { autorizado: true })
                .getCount();

            const exits = await this.repo.createQueryBuilder("access")
                .where("access.area_id = :area_id", { area_id })
                .andWhere("access.tipo = :tipo", { tipo: Tipo.SAIDA })
                .andWhere("access.autorizado = :autorizado", { autorizado: true })
                .getCount();

            const ocupacaoAtual = Math.max(0, entries - exits);

            if (ocupacaoAtual >= area.capacidade) {
                throw new AppError(`Capacidade máxima da área atingida (${area.capacidade} pessoas).`, 422);
            }
        }

        
        // Cria (instancia na memória) o novo registro de acesso montando a relação com outras entidades usando os respectivos IDs.
        const newAccess = this.repo.create({
            colaborador: { id: colaborador_id } as Colaborador,
            area: { id: area_id } as Area,
            tipo: tipo.toUpperCase() === 'ENTRADA' ? Tipo.ENTRADA : Tipo.SAIDA,
            autorizado,
            registrado_por: { id: registrado_por } as Usuario,
            observacao: observacao || null,
        });

        // Persiste esse objeto no banco de dados e o devolve formatado.
        try {
            return await this.repo.save(newAccess);
        } catch (error: any) {
            // Captura erros estruturais do banco, como violação de Chave Estrangeira (Passo 3)
            console.error("[AcessoService.registerAccess] Erro no banco de dados:", error);
            if (error.code === '23503') { // Código de erro do PostgreSQL para foreign_key_violation
                throw new AppError("Erro de validação: Colaborador, Área ou Usuário (registrado_por) não encontrado no banco de dados.", 400);
            }
            // Captura erros de violação de NOT NULL.
            if (error.code === '23502') { // Código de erro do PostgreSQL para not_null_violation
                throw new AppError(`Erro de validação: O campo '${error.column}' é obrigatório e não pode ser nulo no banco.`, 400);
            }
            // Captura erros de tipo inválido (ex: Enum divergente).
            if (error.code === '22P02') { // Código do PostgreSQL para representação de texto inválida (ex: Enum divergente)
                throw new AppError("Erro de validação: O tipo de acesso informado diverge das regras do banco de dados (verifique maiúsculas/minúsculas do Enum).", 400);
            }
            throw new AppError("Erro interno ao tentar salvar o registro de acesso.", 500);
        }
    }
    /**
     * @method listHistory
     * @description Busca todos os acessos anteriores com suporte para diferentes filtros dinâmicos (RF10).
     */
    // Função assíncrona para buscar todos os acessos anteriores passados, com suporte para diferentes filtros dinâmicos.
    async listHistory(filters: ListHistoryFilters) {
        const where: any = {};
        if (filters.dataInicio && filters.dataFim) where.timestamp = Between(new Date(filters.dataInicio), new Date(filters.dataFim));
        if (filters.nome_area) where.area = { nome: ILike(`%${filters.nome_area}%`) };
        if (filters.nome_colaborador) where.colaborador = { nome: ILike(`%${filters.nome_colaborador}%`) };
        // NOVO: filtro por múltiplas áreas (para gestor de área)
        if (filters.areaIds && Array.isArray(filters.areaIds) && filters.areaIds.length > 0) {
            where.area = { ...(where.area || {}), id: In(filters.areaIds) }; // Usa 'In' para múltiplos IDs.
        }
        return await this.repo.find({ where, relations: ["colaborador", "area", "registrado_por"], order: { timestamp: "DESC" } });
    }
    /**
     * @method checkAuthorizationPreview
     * @description Verifica se um acesso será autorizado ou negado (preview antes de registrar) (RF11).
     * Retorna detalhes sobre a autorização, incluindo motivo e capacidade.
     * 
     * @param colaboradorId - ID do colaborador
     * @param areaId - ID da área
     * @param tipo - Tipo de movimento (ENTRADA ou SAIDA)
     * @returns Objeto com informações sobre autorização
     */
    async checkAuthorizationPreview(colaboradorId: string, areaId: string, tipo: string) {
        // Busca o colaborador com seu cargo.
        const colaborador = await this.repo.manager.findOne(Colaborador, {
            where: { id: colaboradorId },
        });
        // Se o colaborador não for encontrado, lança um erro.
        if (!colaborador) {
            throw new AppError("Colaborador não encontrado", 404);
        }
        // Busca a área.
        // Busca área
        const area = await this.repo.manager.findOne(Area, {
            where: { id: areaId },
        });
        // Se a área não for encontrada, lança um erro.
        if (!area) {
            throw new AppError("Área não encontrada", 404);
        }

        const result = {
            colaborador_id: colaboradorId,
            area_id: areaId,
            colaborador_nome: colaborador.nome,
            colaborador_cargo: colaborador.cargo,
            area_nome: area.nome,
            tipo: tipo.toUpperCase(),
            autorizado: false as boolean,
            motivo: "" as string,
            detalhes: {} as any,
        };

        // SAÍDA sempre é autorizada (sem validação de permissão)
        if (tipo.toUpperCase() === 'SAIDA') {
            result.autorizado = true;
            result.motivo = "Saída sempre permitida.";
            return result;
        }


        // Para ENTRADA, verifica se já está em alguma área (impede múltiplas entradas sem saída)
        if (tipo.toUpperCase() === 'ENTRADA') {
            const entradaSemSaida = await this.repo.createQueryBuilder("access")
                .where("access.colaborador_id = :colaborador_id", { colaborador_id: colaboradorId })
                .andWhere("access.tipo = :tipoEntrada", { tipoEntrada: Tipo.ENTRADA })
                .andWhere("access.autorizado = :autorizado", { autorizado: true })
                .andWhere(qb => {
                    return `NOT EXISTS (
                        SELECT 1 FROM registro_acesso saida
                        WHERE saida.colaborador_id = access.colaborador_id
                          AND saida.tipo = '${Tipo.SAIDA}'
                          AND saida.autorizado = true
                          AND saida.registrado_em > access.registrado_em
                    )`;
                })
                .getOne();
            if (entradaSemSaida) {
                result.autorizado = false;
                result.motivo = `Acesso negado. O colaborador ${colaborador.nome} não possui direitos de trânsito vinculados a esta área.`;
                return result;
            }
        }

        // Para ENTRADA, verifica permissões
        if (tipo.toUpperCase() === 'ENTRADA') {
            // Verifica permissão de transição
            const temPermissao = await this.canAccessArea(colaboradorId, areaId);
            
            if (!temPermissao) {
                result.autorizado = false;
                result.motivo = `Colaborador com cargo "${colaborador.cargo}" não tem autorização para acessar a área "${area.nome}".`;
                return result;
            }

            // Verifica capacidade
            const entries = await this.repo.createQueryBuilder("access")
                .where("access.area_id = :area_id", { area_id: areaId })
                .andWhere("access.tipo = :tipo", { tipo: Tipo.ENTRADA })
                .andWhere("access.autorizado = :autorizado", { autorizado: true })
                .getCount();

            const exits = await this.repo.createQueryBuilder("access")
                .where("access.area_id = :area_id", { area_id: areaId })
                .andWhere("access.tipo = :tipo", { tipo: Tipo.SAIDA })
                .andWhere("access.autorizado = :autorizado", { autorizado: true })
                .getCount();

            const ocupacaoAtual = Math.max(0, entries - exits);

            if (ocupacaoAtual >= area.capacidade) {
                result.autorizado = false;
                result.motivo = `Capacidade máxima da área atingida (${area.capacidade}/${area.capacidade} pessoas).`;
                result.detalhes = { ocupacao_atual: ocupacaoAtual, capacidade: area.capacidade };
                return result;
            }

            // Tudo certo, autorizado
            result.autorizado = true;
            result.motivo = `Autorizado. Ocupação: ${ocupacaoAtual + 1}/${area.capacidade}`;
            result.detalhes = { ocupacao_futura: ocupacaoAtual + 1, capacidade: area.capacidade };
            return result;
        }

        return result;
    }

    /**
     * Retorna o histórico de acessos de um colaborador específico.
     * @param colaboradorId - ID do colaborador
     * @param limit - Número máximo de registros a retornar (padrão: 10)
     * @returns Promise<RegistroAcesso[]> - Lista de registros de acesso
     */
    async getHistoryByColaborador(colaboradorId: string, limit: number = 10): Promise<RegistroAcesso[]> {
        return await this.repo.find({
            where: { colaborador: { id: colaboradorId } },
            relations: ["colaborador", "area", "registrado_por"],
            order: { timestamp: "DESC" }
        });
    }
    async getHistoryByGestor(matricula: string) {
    // Busca o colaborador pela matrícula do usuário logado
        const colaborador = await this.repo.manager.findOne(Colaborador, {
            where: { matricula }
        });

        if (!colaborador) throw new AppError("Colaborador não encontrado para esta matrícula.", 404);

        // Busca a área onde esse colaborador é responsável
        const area = await this.repo.manager.findOne(Area, {
            where: { responsavel: { id: colaborador.id } }
        });

        if (!area) throw new AppError("Nenhuma área vinculada a este gestor.", 404);

        // Retorna histórico filtrado por essa área
        return await this.repo.find({
            where: { area: { id: area.id } },
            relations: ["colaborador", "area", "registrado_por"],
            order: { timestamp: "DESC" }
        });
    }

    async getHistoryByColaboradorAndArea(colaboradorId: string, matriculaGestor: string) {
        
        console.log("[getHistoryByColaboradorAndArea] matriculaGestor:", matriculaGestor);

        const colaborador = await this.repo.manager.findOne(Colaborador, {
            where: { matricula: matriculaGestor }
        });
        if (!colaborador) throw new AppError("Gestor não encontrado.", 404);

        console.log("[getHistoryByColaboradorAndArea] colaborador encontrado:", colaborador?.nome, colaborador?.id);

        const area = await this.repo.manager.findOne(Area, {
            where: { responsavel: { id: colaborador.id } }
        });
        console.log("[getHistoryByColaboradorAndArea] area encontrada:", area?.nome);
        if (!area) throw new AppError("Nenhuma área vinculada a este gestor.", 404);

        return await this.repo.find({
            where: {
                colaborador: { id: colaboradorId },
                area: { id: area.id }
            },
            relations: ["colaborador", "area", "registrado_por"],
            order: { timestamp: "DESC" }
        });
    }

    /**
     * @method findUltimoRegistro
     * @description Retorna o último registro de acesso de um colaborador específico.
     * @param colaboradorId - ID do colaborador
     */
    async findUltimoRegistro(colaboradorId: string, areaId: string) {
        return await this.repo.findOne({
            where: { 
                colaborador: { id: colaboradorId }, 
                area: { id: areaId } 
            },
            order: { timestamp: 'DESC' }
        });
    }

    /**
     * @method atualizarPermissoesArea
     * @description Limpa e redefine os acessos explícitos de um colaborador ( Many-to-Many via tabela pivô)
     */
    async atualizarPermissoesAreas(colaboradorId: string, areaIds: string[]): Promise<void> {
        
        await this.autorizacaoRepo.delete({ colaborador: { id: colaboradorId } });
        
        if (areaIds && areaIds.length > 0) {
            const novasAutorizacoes = areaIds.map((idDaArea) => {
                return this.autorizacaoRepo.create({
                    colaborador: { id: colaboradorId } as Colaborador,
                    area: {id: idDaArea } as Area
                });
            });

            await this.autorizacaoRepo.save(novasAutorizacoes);
        }
    }

    /**
     * @method buscarPermissoesAtuais
     * @description Retorna a matriz de áreas autorizadas de um funcionário para marcar os checkboxes
     */
    async buscarPermissoesAtuais(colaboradorId: string): Promise<Autorizacao[]> {
        return await this.autorizacaoRepo.find({
            where: { colaborador: { id: colaboradorId } },
            relations: ["area"]
        });
    }
}