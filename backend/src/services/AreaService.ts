import { Repository, DataSource } from "typeorm";
import { Area } from "../entities/Area";
import { AppError } from "../errors/AppError";

// Importa o tipo Colaborador para uso nos DTOs
import { Colaborador } from "../entities/Colaborador";
import { Nivel_Risco } from "../types/Nivel_Risco";

// Define um DTO (Data Transfer Object) para a criação de uma Área.
// Isso torna explícito o formato dos dados esperados do frontend/controlador.
interface CreateAreaDTO {
    nome: string;
    descricao?: string;
    nivel_risco: Nivel_Risco;
    capacidade: number;
    responsavel_id: string; // O frontend envia o ID do responsável como string
    ativa?: boolean;
}

// Define um DTO para a atualização de uma Área, permitindo atualizações parciais.
interface UpdateAreaDTO extends Partial<CreateAreaDTO> {}

/**
 * @class AreaService
 * @description Serviço responsável por gerenciar as operações CRUD e regras de negócio para a entidade Área.
 */
export class AreaService {
    private areaRepo: Repository<Area>;

    // O construtor recebe a conexão do banco de dados (DataSource) e inicializa o repositório da entidade.
    constructor(dataSource: DataSource) {
        this.areaRepo = dataSource.getRepository(Area);
    }

    /**
     * @method listAll
     * @description Lista todas as áreas, incluindo o responsável e ordenando pelo nome (RF16).
     * @returns Promise<Area[]> - Uma lista de todas as áreas.
     */
    async listAll() {
        // Usar QueryBuilder para garantir que todos os campos, incluindo 'ativa', sejam selecionados.
        return await this.areaRepo.createQueryBuilder("area")
            .leftJoinAndSelect("area.responsavel", "responsavel")
            .orderBy("area.nome", "ASC")
            .getMany();
    }

    /**
     * @method findById
     * @description Busca uma área pelo seu ID, incluindo os dados do responsável (RF17).
     * @param id - O ID da área a ser buscada.
     * @returns Promise<Area> - A área encontrada.
     * @throws AppError se a área não for encontrada.
     */
    async findById(id: string) {
        const area = await this.areaRepo.findOne({
            where: { id },
            relations: ["responsavel"]
        });
        // Se a área não for encontrada, lança um erro 404.
        if (!area) throw new AppError("Área não encontrada", 404);
        return area;
    }

    /**
     * @method create
     * @description Cria uma nova área com base nos dados fornecidos (RF18).
     * Realiza validações para nível de risco, capacidade e responsável.
     * @param dados - Os dados da nova área (DTO).
     * @returns Promise<Area> - A área recém-criada.
     * @throws AppError se os dados forem inválidos.
     */
    async create(dados: CreateAreaDTO) { // Espera o DTO de criação
        // Validação: Nível de risco aceita apenas valores específicos (cite: 50, 287)
        const niveisValidos = ['BAIXO', 'MEDIO', 'ALTO', 'CRITICO'];
        if (dados.nivel_risco && !niveisValidos.includes(dados.nivel_risco)) {
            throw new AppError("Nível de risco inválido", 400);
        }

        // Validação: Capacidade deve ser número positivo (cite: 53, 287)
        if (Number.isInteger(dados.capacidade) !== undefined && dados.capacidade <= 0) {
            throw new AppError("A capacidade deve ser um número inteiro positivo", 400);
        }
        // Validação: responsavel_id é obrigatório, pois a coluna é NOT NULL no DB.
        // Validação: responsavel_id é obrigatório, pois a coluna é NOT NULL no DB
        if (!dados.responsavel_id) {
            throw new AppError("O responsável pela área é obrigatório.", 400);
        }
        // Cria a entidade Area, mapeando explicitamente responsavel_id para a relação 'responsavel'.
        // Cria a entidade Area, mapeando explicitamente responsavel_id para a relação 'responsavel'
        const novaArea = this.areaRepo.create({
            ...dados,
            nivel_risco: dados.nivel_risco, // Removido .toLowerCase()
            ativa: dados.ativa ?? true,
            // Define 'ativa' como true por padrão se não fornecido
            // Mapeia o ID do responsável para a relação 'responsavel' que o TypeORM espera
            responsavel: { id: dados.responsavel_id } as Colaborador
        });

        // Salva a nova área no repositório.
        return await this.areaRepo.save(novaArea);
    }

    /**
     * @method update
     * @description Atualiza os dados de uma área existente (RF19).
     * @param id - O ID da área a ser atualizada.
     * @param dados - Os dados para atualização da área (DTO parcial).
     * @returns Promise<Area> - A área atualizada.
     */
    async update(id: string, dados: UpdateAreaDTO) { // Espera o DTO de atualização
        const area = await this.findById(id);

        // Se responsavel_id for fornecido nos dados de atualização, atualize a relação
        if (dados.responsavel_id) {
            area.responsavel = { id: dados.responsavel_id } as Colaborador;
        }
        // Usa Object.assign para atualizar as outras propriedades. Excluímos responsavel_id para evitar conflitos.
        // Isso permite atualizações parciais sem sobrescrever a relação 'responsavel' incorretamente.
        const { responsavel_id, ...otherDados } = dados;
        Object.assign(area, otherDados);
        // Salva as alterações no repositório.
        return await this.areaRepo.save(area);
    }

    /**
     * Inativa uma área em vez de deletá-la fisicamente (Soft Delete).
     * Isso preserva a integridade do histórico de acessos (RF20).
     * @param id - O ID da área a ser desativada.
     * @returns Promise<void>
     */
    async softDelete(id: string): Promise<void> {
        const area = await this.findById(id); //
        // Define o status 'ativa' como falso.
        area.ativa = false;
        await this.areaRepo.save(area);
    }
    // Exclui uma área (hard delete), renomeado de hardDelete para delete
    async delete(id: string): Promise<void> { //
        const result = await this.areaRepo.delete(id); //
        if (result.affected === 0) { //
            // Se nenhum registro for afetado, a área não foi encontrada.
            throw new AppError("Área não encontrada para exclusão", 404); //
        } //
    } //
}