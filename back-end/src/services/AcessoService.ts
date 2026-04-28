// Importa utilitários do TypeORM para lidar com persistência de dados no banco de dados e aplicar filtros em consultas.
import { Repository, DataSource, Between, ILike } from "typeorm";
// Importa entidades necessárias do banco de dados e os tipos de suporte e tratamento de erro.
import { RegistroAcesso } from "../entities/RegistroAcesso.js";
import { AppError } from "../errors/AppError.js";
import { Colaborador } from "../entities/Colaborador.js";
import { Area } from "../entities/Area.js";
import { Usuario } from "../entities/Usuario.js";
import { Tipo } from "../types/Tipo.js";

// Interface que define a estrutura de dados esperada no input para registrar um novo acesso.
interface RegisterAccessInput {
    colaborador_id: string;    // ID do colaborador (quem está entrando ou saindo)
    area_id: string;           // ID da área que ele tentou acessar
    tipo: 'entrada' | 'saida'; // Tipo da movimentação de registro
    autorizado: boolean;       // Booleano se a entrada foi autorizada de fato
    registrado_por: string;    // ID do usuário (sistema ou guarda) que inseriu o acesso
    observacao?: string;       // Texto descritivo (obrigatório se não foi autorizado)
}

// Interface que define de que maneiras a listagem do histórico de acessos poderá ser filtrada.
interface ListHistoryFilters {
    dataInicio?: string;
    dataFim?: string;
    nome_area?: string;
    nome_colaborador?: string;
}

// Classe de serviço responsável pelas regras de negócio e manipulação da entidade RegistroAcesso.
export class AcessoService {
    // Declara a variável privada do repositório responsável por salvar e buscar instâncias de RegistroAcesso.
    private repo: Repository<RegistroAcesso>;

    // O construtor recebe a conexão do banco de dados (DataSource) e inicializa o repositório da entidade.
    constructor(dataSource: DataSource) {
        this.repo = dataSource.getRepository(RegistroAcesso);
    }

    // Função assíncrona responsável por criar e salvar um novo registro de acesso com base nas informações recebidas.
    async registerAccess(data: RegisterAccessInput) {
        // Adiciona um log detalhado para facilitar a depuração (Passo 5)
        console.log("[AcessoService.registerAccess] Dados recebidos:", data);

        // Desestrutura o objeto recebido extraindo apenas as variáveis declaradas.
        const { colaborador_id, area_id, tipo, autorizado, registrado_por, observacao } = data;

        // Valida uma regra de negócios: acessos que foram barrados/negados exigem obrigatoriamente um texto explicativo.
        if (!autorizado && !observacao) {
            throw new AppError("A observação é obrigatória para acessos não autorizados.", 400);
        }

        // Cria (instancia na memória) o novo registro de acesso montando a relação com outras entidades usando os respectivos IDs.
        const newAccess = this.repo.create({
            colaborador: { id: colaborador_id } as Colaborador,
            area: { id: area_id } as Area,
            tipo: tipo === 'entrada' ? Tipo.ENTRADA : Tipo.SAIDA,
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
            throw new AppError("Erro interno ao tentar salvar o registro de acesso.", 500);
        }
    }

    // Função assíncrona para buscar todos os acessos anteriores passados, com suporte para diferentes filtros dinâmicos.
    async listHistory(filters: ListHistoryFilters) {
        // Inicializa o objeto `where` responsável pelas cláusulas SQL.
        const where: any = {};
        // Caso um intervalo de datas exista nos filtros, aplica o comparador "Between" referenciando o inicio e o fim.
        if (filters.dataInicio && filters.dataFim) where.timestamp = Between(new Date(filters.dataInicio), new Date(filters.dataFim));
        // Se o nome de uma área for recebido nos filtros, restringe usando o operador ILIKE para buscas parciais.
        if (filters.nome_area) where.area = { nome: ILike(`%${filters.nome_area}%`) };
        // Se um colaborador especifico for recebido, filtra pelo nome dele também via ILIKE.
        if (filters.nome_colaborador) where.colaborador = { nome: ILike(`%${filters.nome_colaborador}%`) };

        // Realiza o SELECT no repositório aplicando a condição customizada. Também popula as referências de relações e ordena pelo mais recente primeiro.
        return await this.repo.find({ where, relations: ["colaborador", "area", "registrado_por"], order: { timestamp: "DESC" } });
    }
}