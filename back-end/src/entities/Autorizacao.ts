// Importa decoradores para marcar a classe e suas propriedades para virarem tabelas/colunas pelo TypeORM.
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
// Importa as classes referenciadas de colaborador e área para compor chave estrangeira.
import { Colaborador } from "./Colaborador.js";
import { Area } from "./Area.js";

// Define que essa classe representa a entidade (tabela) chamada "autorizacao".
@Entity("autorizacao")
export class Autorizacao {
    // Cria uma chave primária automática onde seu valor será um código alfanumérico global (UUID).
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    // Cria um relacionamento Muitos-para-Um: Uma autorização pertence a um colaborador. `nullable` indica se a regra é global.
    @ManyToOne(() => Colaborador, { nullable: true })
    @JoinColumn({ name: "colaborador_id" })
    colaborador!: Colaborador;

    // Cria um relacionamento Muitos-para-Um conectando qual Área é o alvo da autorização dessa entidade.
    @ManyToOne(() => Area)
    @JoinColumn({ name: "area_id" })
    area!: Area;

    // Define em texto cru qual o cargo especifico tem permissão concedida.
    @Column({ type: "text", nullable: true })
    cargo_permitido!: string;

    // Coluna para armazenar o prazo em que essa autorização deve expirar, caso seja algo temporário.
    @Column({ type: 'timestamptz', nullable: true }) 
    validade?: Date;
}