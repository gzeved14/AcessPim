import { Repository, DataSource } from "typeorm";
import { Area } from "../entities/Area.js";
import { AppError } from "../errors/AppError.js";

export class AreaService {
    private areaRepo: Repository<Area>;

    constructor(dataSource: DataSource) {
        this.areaRepo = dataSource.getRepository(Area);
    }


    async listAll() {
        return await this.areaRepo.find({
            relations: ["responsavel"], // Traz o colaborador supervisor (cite: 38)
            order: { nome: "ASC" }
        });
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
}