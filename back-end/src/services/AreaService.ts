import { Repository, DataSource } from "typeorm";
import { Area } from "../entities/Area.js";
import { AppError } from "../errors/AppError.js";

export class AreaService {
    private areaRepo: Repository<Area>;

    constructor(dataSource: DataSource) {
        this.areaRepo = dataSource.getRepository(Area);
    }


    async listAll() {
        // Usar QueryBuilder para garantir que todos os campos, incluindo 'ativa', sejam selecionados.
        return await this.areaRepo.createQueryBuilder("area")
            .leftJoinAndSelect("area.responsavel", "responsavel")
            .orderBy("area.nome", "ASC")
            .getMany();
    }


    async findById(id: string) {
        const area = await this.areaRepo.findOne({
            where: { id },
            relations: ["responsavel"]
        });
        if (!area) throw new AppError("Área não encontrada", 404);
        return area;
    }

    async create(dados: Partial<Area>) {
        // Validação: Nível de risco aceita apenas valores específicos (cite: 50, 287)
        const niveisValidos = ['baixo', 'medio', 'alto', 'critico'];
        if (dados.nivel_risco && !niveisValidos.includes(dados.nivel_risco)) {
            throw new AppError("Nível de risco inválido", 400);
        }

        // Validação: Capacidade deve ser número positivo (cite: 53, 287)
        if (dados.capacidade !== undefined && dados.capacidade <= 0) {
            throw new AppError("A capacidade deve ser um número inteiro positivo", 400);
        }

        const novaArea = this.areaRepo.create(dados);
        return await this.areaRepo.save(novaArea);
    }


    async update(id: string, dados: Partial<Area>) {
        const area = await this.findById(id);

        // Áreas inativas não devem aparecer no registro de acesso (cite: 56)
        Object.assign(area, dados);
        return await this.areaRepo.save(area);
    }

    /**
     * Inativa uma área em vez de deletá-la fisicamente (Soft Delete).
     * Isso preserva a integridade do histórico de acessos.
     */
    async softDelete(id: string): Promise<void> {
        const area = await this.findById(id);
        area.ativa = false;
        await this.areaRepo.save(area);
    }
}