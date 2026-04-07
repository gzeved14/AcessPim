import { RegistroAcesso } from "../entities/RegistroAcesso.js";
import { Tipo } from "../types/Tipo.js";
import { Repository, DataSource } from "typeorm";
import { Colaborador } from "../entities/Colaborador.js";
import { Area } from "../entities/Area.js";
import { AppError } from "../errors/AppError.js";
import { Autorizacao } from "../entities/Autorizacao.js";


export class AcessoService {
    private acessoRepo: Repository<RegistroAcesso>;
    private colaboradorRepo: Repository<Colaborador>;
    private autorizacaoRepo: Repository<Autorizacao>;

    constructor(dataSource: DataSource) {
        this.acessoRepo = dataSource.getRepository(RegistroAcesso);
        this.colaboradorRepo = dataSource.getRepository(Colaborador);
        this.autorizacaoRepo = dataSource.getRepository(Autorizacao);
    }

    async registarAcesso(dados: {
        colaborador_id: string;
        area_id: string;
        tipo: 'entrada' | 'saida';
        registrado_por: string;
        observacao?: string;
    }) {
        // Implementação do método de registro de acesso
        const colaborador = await this.colaboradorRepo.findOneBy({ id: dados.colaborador_id});
        if (!colaborador || !colaborador.ativo){
            throw new AppError("Colaborador inexistente ou inativo", 400);
        }

        const permissao = await this.autorizacaoRepo.findOne({
            where: {
                colaborador_id: dados.colaborador_id,
                area_id: dados.area_id,
                cargo_permitido: colaborador.cargo
            }
        });

        const autorizado = !!permissao;

        if (!autorizado && dados.tipo === 'entrada' && !dados.observacao) {
            throw new AppError("É obrigatório informar uma observação para acessos negados.", 400);
    }

        const tipoAcesso = dados.tipo === "entrada" ? Tipo.ENTRADA : Tipo.SAIDA;

        const novoAcesso = this.acessoRepo.create({
            colaborador: { id: dados.colaborador_id } as Colaborador,
            area: { id: dados.area_id } as Area,
            tipo: tipoAcesso,
            autorizado: autorizado,
            registrado_por: { id: dados.registrado_por } as any,
            observacao: dados.observacao || null
            
        });
        return await this.acessoRepo.save(novoAcesso);
    }

    async listarHistorico(filtros: {
        dataInicio?: string;
        dataFim?: string;
        area_id?: string;
        colaborador_id?: string;
    }){
        const query = this.acessoRepo.createQueryBuilder("acesso")
            .leftJoinAndSelect("acesso.colaborador", "colaborador")
            .leftJoinAndSelect("acesso.area", "area")
            .orderBy("acesso.timestamp", "DESC");

        if (filtros.area_id){
            query.andWhere("acesso.area_id = :area_id", { area_id: filtros.area_id });
        }

        if (filtros.colaborador_id){
            query.andWhere("acesso.colaborador_id = :colaborador_id", { colaborador_id: filtros.colaborador_id });
        }
        if (filtros.dataInicio && filtros.dataFim) {
            query.andWhere("acesso.timestamp BETWEEN :inicio AND :fim", {
                inicio: filtros.dataInicio,
                fim: filtros.dataFim
            });
        } 
        return await query.getMany();
    }
}