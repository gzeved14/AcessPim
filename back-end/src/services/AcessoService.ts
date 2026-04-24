import { RegistroAcesso } from "../entities/RegistroAcesso.js";
import { Tipo } from "../types/Tipo.js";
import { Repository, DataSource } from "typeorm";
import { Colaborador } from "../entities/Colaborador.js";
import { Area } from "../entities/Area.js";
import { AppError } from "../errors/AppError.js";
import { Autorizacao } from "../entities/Autorizacao.js";


export class AcessoService {
    private accessRepo: Repository<RegistroAcesso>;
    private collaboratorRepo: Repository<Colaborador>;
    private authorizationRepo: Repository<Autorizacao>;

    constructor(dataSource: DataSource) {
        this.accessRepo = dataSource.getRepository(RegistroAcesso);
        this.collaboratorRepo = dataSource.getRepository(Colaborador);
        this.authorizationRepo = dataSource.getRepository(Autorizacao);
    }

    async registerAccess(data: {
        colaborador_id: string;
        area_id: string;
        tipo: 'entrada' | 'saida';
        registrado_por: string;
        observacao?: string;
    }) {
        // Implementação do método de registro de acesso
        const collaborator = await this.collaboratorRepo.findOneBy({ id: data.colaborador_id});
        if (!collaborator || !collaborator.ativo){
            throw new AppError("Colaborador inexistente ou inativo", 400);
        }

        const permission = await this.authorizationRepo.findOne({
            where: {
                colaborador_id: data.colaborador_id,
                area_id: data.area_id,
                cargo_permitido: collaborator.cargo
            }
        });

        const isAuthorized = !!permission;

        if (!isAuthorized && data.tipo === 'entrada' && !data.observacao) {
            throw new AppError("É obrigatório informar uma observação para acessos negados.", 400);
    }

        const accessType = data.tipo === "entrada" ? Tipo.ENTRADA : Tipo.SAIDA;

        const newAccess = this.accessRepo.create({
            colaborador: { id: data.colaborador_id } as Colaborador,
            area: { id: data.area_id } as Area,
            tipo: accessType,
            autorizado: isAuthorized,
            registrado_por: { id: data.registrado_por } as any,
            observacao: data.observacao || null
            
        });
        return await this.accessRepo.save(newAccess);
    }

    async listHistory(filters: {
        dataInicio?: string;
        dataFim?: string;
        area_id?: string;
        colaborador_id?: string;
    }){
        const query = this.accessRepo.createQueryBuilder("access")
            .leftJoinAndSelect("access.colaborador", "collaborator")
            .leftJoinAndSelect("access.area", "area")
            .orderBy("access.timestamp", "DESC");

        if (filters.area_id){
            query.andWhere("access.area_id = :area_id", { area_id: filters.area_id });
        }

        if (filters.colaborador_id){
            query.andWhere("access.colaborador_id = :colaborador_id", { colaborador_id: filters.colaborador_id });
        }
        if (filters.dataInicio && filters.dataFim) {
            query.andWhere("access.timestamp BETWEEN :start AND :end", {
                start: filters.dataInicio,
                end: filters.dataFim
            });
        } 
        return await query.getMany();
    }
}