// Importa os injetores do banco de dados do TypeORM para os Repositórios.
import { Repository, DataSource } from "typeorm";
// Importa a entidade foco deste script, bem como módulo de gestão de exceções de requisição.
import { Colaborador } from "../entities/Colaborador.js";
import { AppError } from "../errors/AppError.js";

// Serviço responsável por prover e abstrair as lógicas de negócio do domínio Colaborador para que os controllers sejam mais limpos.
export class ColaboradorService {
    // Variável encapsulada que vai segurar os métodos do banco de dados providos pelo Repository do TypeORM.
    private repo: Repository<Colaborador>;

    // Passa a base de dados de controle no momento de iniciar essa classe e pega seu repositório especifico.
    constructor(dataSource: DataSource) {
        this.repo = dataSource.getRepository(Colaborador);
    }

    //Retornar todos os colaboradores cadastrados para a Tela 3.
    async findAll(){ 
        // Lista todas as informações de colaborador, trazendo com instrução de ORDENAÇÃO ASCENDENTE para o "nome" na query SQL gerada.
        return await this.repo.find({
            order: { nome:  "ASC"}
        });
    }

    //Validar matrícula única e persistir o novo colaborador
    async create(dados: Partial<Colaborador>){
        // Confirma integridade: proibe um save em branco se o nome e matricula de quem vai ser salvo não tiver vindo no parametro.
        if (!dados.nome || !dados.matricula){
            throw new AppError("Nome e matricula são obrigatórios", 400);
        }
        // Garantir que a matrícula seja única na empresa
        // Busca na tabela se já existe registro atrelado a matrícula nova requerida.
        const registrationExists = await this.repo.findOneBy({matricula: dados.matricula});
        if (registrationExists){
            throw new AppError("Esta matrícula ja está cadastrada no sistema", 400);
        }
        // Cadastrar novo colaborador com status ativo por padrão.
        // Adiciona as novas características dos dados recebidos no corpo e por regra de negócio padroniza forçadamente para 'ativo' verdadeiro na hora da criação.
        const newColaborador = this.repo.create({
            ...dados,
            ativo: true
        });
        // Dispara o SQL INSERT no banco de dados com a variável gerada.
        return await this.repo.save(newColaborador);
    }
    
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
    
    //Atualizar dados ou desativar o funcionário
    async update(id: string, dados: Partial<Colaborador>){
        // Utiliza o método "findById" na própria classe como verificação de integridade antes de fazer o processo de "update".
        const colaborador = await this.findById(id);
        // Bloqueia e impede falha SQL verificando manualmente se por acaso a matricula modificada nova do usuário já existia em outro cara aleatório e devolve erro 400 se sim.
        if (dados.matricula && dados.matricula !== colaborador.matricula){
            const registrationInUse = await this.repo.findOneBy({matricula: dados.matricula});
            if(registrationInUse) throw new AppError("A nova matrícula já está em uso", 400);
        }
        // Atualiza os campos sem deletar para manter rastreabilidade
        // Combina usando lógica de objetos e sobrescreve as configurações anteriores do "colaborador" local pelo valor mais recente dos "dados".
        Object.assign(colaborador, dados);
        // Executa o UPSERT ou o UPDATE com os metadados antigos reescritos por suas partes novas.
        return await this.repo.save(colaborador);
    }

    // Desativa um colaborador (soft delete)
    async softDelete(id: string): Promise<void> {
        const colaborador = await this.findById(id); // Reutiliza findById para verificar a existência
        colaborador.ativo = false;
        await this.repo.save(colaborador);
    }
}