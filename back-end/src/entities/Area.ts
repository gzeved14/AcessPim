import { Column, Entity, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Nivel_Risco } from "../types/Nivel_Risco.js";
import { Colaborador } from "./Colaborador.js";
import { RegistroAcesso } from "./RegistroAcesso.js";
import { JoinColumn } from "typeorm";

@Entity("area")
export class Area{
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: 'text', nullable: false })
    nome!: string;

    @Column({ type: 'text', nullable: true})
    descricao!: string;

    @Column({ type: 'text', enum: Nivel_Risco, nullable: false })
    nivel_risco!: Nivel_Risco;

    @Column({ type: 'integer', nullable: false })
    capacidade!: number;

    @ManyToOne(() => Colaborador, (colaborador) => colaborador.areas_sob_responsabilidade, { nullable: false })
    @JoinColumn({ name: 'responsavel_id' }) // Nome da coluna conforme o PRD
    responsavel!: Colaborador; 

    @Column({ type: 'boolean', default: true, nullable: false })
    ativa!: boolean;

    @OneToMany(() => RegistroAcesso, (registro) => registro.area)
    acesso!: RegistroAcesso[]; //permitindo listar todos os eventos ocorridos naquele local específico


}