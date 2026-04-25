import { Repository, DataSource } from "typeorm";
import { Colaborador } from "../entities/Colaborador.js";
import { AppError } from "../errors/AppError.js";
export class ColaboradorService {
    repo;
    constructor(dataSource) {
        this.repo = dataSource.getRepository(Colaborador);
    }
    //Retornar todos os colaboradores cadastrados para a Tela 3.
    async findAll() {
        return await this.repo.find({
            order: { nome: "ASC" }
        });
    }
    //Validar matrícula única e persistir o novo colaborador
    async create(dados) {
        if (!dados.nome || !dados.matricula) {
            throw new AppError("Nome e matricula são obrigatórios", 400);
        }
        // Garantir que a matrícula seja única na empresa
        const registrationExists = await this.repo.findOneBy({ matricula: dados.matricula });
        if (registrationExists) {
            throw new AppError("Esta matrícula ja está cadastrada no sistema", 400);
        }
        // Cadastrar novo colaborador com status ativo por padrão.
        const newColaborador = this.repo.create({
            ...dados,
            ativo: true
        });
        return await this.repo.save(newColaborador);
    }
    //Buscar detalhes para edição na Tela 4
    async findById(id) {
        const colaborador = await this.repo.findOneBy({ id: id });
        if (!colaborador) {
            throw new AppError("Colaborador não encontrado", 404);
        }
        return colaborador;
    }
    //Atualizar dados ou desativar o funcionário
    async update(id, dados) {
        const colaborador = await this.findById(id);
        if (dados.matricula && dados.matricula !== colaborador.matricula) {
            const registrationInUse = await this.repo.findOneBy({ matricula: dados.matricula });
            if (registrationInUse)
                throw new AppError("A nova matrícula já está em uso", 400);
        }
        // Atualiza os campos sem deletar para manter rastreabilidade
        Object.assign(colaborador, dados);
        return await this.repo.save(colaborador);
    }
}
//# sourceMappingURL=ColaboradorService.js.map