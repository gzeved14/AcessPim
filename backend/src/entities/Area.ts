import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Nivel_Risco } from "../types/Nivel_Risco.js";
import { JoinColumn } from "typeorm";
import type { Colaborador } from "./Colaborador.js";
import type { RegistroAcesso } from "./RegistroAcesso.js";

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

    @ManyToOne("Colaborador", (colaborador: Colaborador) => colaborador.areas_sob_responsabilidade, { nullable: false })
    @JoinColumn({ name: 'responsavel_id' }) // Nome da coluna conforme o PRD
    responsavel!: Colaborador; 

    @Column({ type: 'boolean', default: true, nullable: false })
    ativa!: boolean;

    @OneToMany("RegistroAcesso", (registro: RegistroAcesso) => registro.area)
    acesso!: RegistroAcesso[]; //permitindo listar todos os eventos ocorridos naquele local específico


}