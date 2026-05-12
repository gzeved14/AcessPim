// Importa decoradores para marcar a classe e suas propriedades para virarem tabelas/colunas pelo TypeORM.
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
// Importa as classes referenciadas de colaborador e área para compor chave estrangeira.
import { Colaborador } from "./Colaborador.js";
import { Area } from "./Area.js";
import { CargoColaborador } from "../types/CargoColaborador.js";

// Define que essa classe representa a entidade (tabela) chamada "autorizacao".
@Entity("autorizacao")
export class Autorizacao {
    // Cria uma chave primária automática onde seu valor será um código alfanumérico global (UUID).
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    // Relacionamento opcional para autorização específica a um colaborador. Se nulo, a regra é por cargo + área.
    @ManyToOne(() => Colaborador, { nullable: true, eager: false })
    @JoinColumn({ name: "colaborador_id" })
    colaborador?: Colaborador;

    // Cria um relacionamento Muitos-para-Um conectando qual Área é o alvo da autorização dessa entidade.
    @ManyToOne(() => Area, { eager: false })
    @JoinColumn({ name: "area_id" })
    area!: Area;

    // Define qual cargo DE COLABORADOR tem permissão para transitar nesta área (TECNICO_MANUTENCAO, AUXILIAR_PRODUCAO, etc).
    @Column({ type: "enum", enum: CargoColaborador, nullable: true })
    cargo?: CargoColaborador;

    // Coluna para armazenar o prazo em que essa autorização deve expirar, caso seja algo temporário.
    @Column({ type: 'timestamptz', nullable: true }) 
    validade?: Date;

    // Timestamp de criação automático para auditoria.
    @CreateDateColumn({ type: 'timestamptz' })
    criada_em!: Date;
}