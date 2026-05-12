// Importa os injetores do banco de dados do TypeORM para os Repositórios.
import { Repository, DataSource } from "typeorm";
// Importa a entidade foco deste script, bem como módulo de gestão de exceções de requisição.
import { Colaborador } from "../entities/Colaborador.js";
import { AppError } from "../errors/AppError.js";

/**
 * @class ColaboradorService
 * @description Serviço responsável por prover e abstrair as lógicas de negócio do domínio Colaborador
 * para que os controllers sejam mais limpos.
 */
// Serviço responsável por prover e abstrair as lógicas de negócio do domínio Colaborador para que os controllers sejam mais limpos.
export class ColaboradorService {
    // Variável encapsulada que vai segurar os métodos do banco de dados providos pelo Repository do TypeORM.
    private repo: Repository<Colaborador>;

    // O construtor recebe a conexão do banco de dados (DataSource) e inicializa o repositório da entidade.
    // Passa a base de dados de controle no momento de iniciar essa classe e pega seu repositório especifico.
    constructor(dataSource: DataSource) {
        this.repo = dataSource.getRepository(Colaborador);
    }
    /**
     * @method findAll
     * @description Retorna todos os colaboradores cadastrados, ordenados por nome (RF22).
     * @returns Promise<Colaborador[]> - Uma lista de colaboradores.
     */
    //Retornar todos os colaboradores cadastrados para a Tela 3.
    async findAll(){ 
        // Lista todas as informações de colaborador, trazendo com instrução de ORDENAÇÃO ASCENDENTE para o "nome" na query SQL gerada.
        return await this.repo.find({
            order: { nome:  "ASC"}
        });
    }
    /**
     * @method create
     * @description Valida a matrícula única e persiste um novo colaborador (RF23).
     * @param dados - Os dados do novo colaborador.
     * @returns Promise<Colaborador> - O colaborador recém-criado.
     * @throws AppError se o nome/matrícula forem ausentes ou a matrícula já existir.
     */
    //Validar matrícula única e persistir o novo colaborador
    async create(dados: Partial<Colaborador>){
        // Confirma integridade: proibe um save em branco se o nome e matricula de quem vai ser salvo não tiver vindo no parametro.
        if (!dados.nome || !dados.matricula){
            throw new AppError("Nome e matricula são obrigatórios", 400);
        }
        // Garante que a matrícula seja única na empresa (RF23).
        // Busca na tabela se já existe registro atrelado a matrícula nova requerida.
        const registrationExists = await this.repo.findOneBy({matricula: dados.matricula});
        if (registrationExists){
            throw new AppError("Esta matrícula ja está cadastrada no sistema", 400);
        }
        // Cadastra novo colaborador com status ativo por padrão (RF23).
        // Adiciona as novas características dos dados recebidos no corpo e por regra de negócio padroniza forçadamente para 'ativo' verdadeiro na hora da criação.
        const newColaborador = this.repo.create({
            ...dados,
            ativo: true
        });
        // Dispara o SQL INSERT no banco de dados.
        return await this.repo.save(newColaborador);
    }
    /**
     * @method findById
     * @description Busca um colaborador pelo seu ID (RF24).
     * @param id - O ID do colaborador a ser buscado.
     * @returns Promise<Colaborador> - O colaborador encontrado.
     * @throws AppError se o colaborador não for encontrado.
     */
    //Buscar detalhes para edição na Tela 4
    async findById(id: string){
        // Executa uma pesquisa buscando no DB estritamente pela chave ID especificada por parametro da função.
        const colaborador = await this.repo.findOneBy({id: id as any});
        // Retorna um status de objeto Não Encontrado (Erro 404) caso o banco não retorne ninguém em sua respectiva query.
        if(!colaborador ){
            throw new AppError("Colaborador não encontrado",404);
        }
        return colaborador;
    }
    /**
     * @method update
     * @description Atualiza os dados de um colaborador existente (RF25).
     * Inclui validação para garantir que a matrícula continue única.
     * @param id - O ID do colaborador a ser atualizado.
     * @param dados - Os dados para atualização do colaborador.
     * @returns Promise<Colaborador> - O colaborador atualizado.
     * @throws AppError se a nova matrícula já estiver em uso.
     */
    //Atualizar dados ou desativar o funcionário
    async update(id: string, dados: Partial<Colaborador>){
        // Utiliza o método "findById" na própria classe como verificação de integridade antes de fazer o processo de "update".
        const colaborador = await this.findById(id);
        // Bloqueia e impede falha SQL verificando manualmente se por acaso a matricula modificada nova do usuário já existia em outro cara aleatório e devolve erro 400 se sim.
        if (dados.matricula && dados.matricula !== colaborador.matricula){
            const registrationInUse = await this.repo.findOneBy({matricula: dados.matricula});
            if(registrationInUse) throw new AppError("A nova matrícula já está em uso", 400);
        }
        // Atualiza os campos do colaborador sem deletar para manter rastreabilidade.
        // Combina usando lógica de objetos e sobrescreve as configurações anteriores do "colaborador" local pelo valor mais recente dos "dados".
        Object.assign(colaborador, dados);
        console.log(`[ColaboradorService] Update - Colaborador ID: ${id}, Dados recebidos:`, dados);
        console.log(`[ColaboradorService] Update - Colaborador.ativo antes de salvar: ${colaborador.ativo}`);
        // Salva as alterações no banco de dados.
        return await this.repo.save(colaborador);
    }
    /**
     * @method softDelete
     * @description Desativa um colaborador (soft delete), definindo seu status 'ativo' como falso (RF26).
     * @param id - O ID do colaborador a ser desativado.
     * @returns Promise<void>
     */
    // Desativa um colaborador (soft delete)
    async softDelete(id: string): Promise<void> {
        const colaborador = await this.findById(id); // Reutiliza findById para verificar a existência
        colaborador.ativo = false;
        await this.repo.save(colaborador);
    }
    /**
     * @method delete
     * @description Exclui um colaborador permanentemente (hard delete) (RF27).
     * @param id - O ID do colaborador a ser excluído.
     * @returns Promise<void>
     * @throws AppError se o colaborador não for encontrado.
     */
    // Exclui um colaborador (hard delete)
    async delete(id: string): Promise<void> {
        const result = await this.repo.delete(id);
        if (result.affected === 0) {
            throw new AppError("Colaborador não encontrado para exclusão", 404);
        }
    }

    async updateFoto(id: string, fotoUrl: string) {
        const colaborador = await this.repo.findOne({ where: { id } });
        
        if (!colaborador) {
            throw new AppError("Colaborador não encontrado", 404);
        }

        colaborador.foto_url = fotoUrl;
        return this.repo.save(colaborador);
    }
}