import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Cargo } from "../types/Cargo.js";
import { Area } from "./Area.js";
import { RegistroAcesso } from "./RegistroAcesso.js";
import { JoinColumn } from "typeorm";

@Entity("colaborador")
export class Colaborador {
    
    @PrimaryGeneratedColumn("uuid") //faz o banco de dados gerencia automaticamente um id único para cada usuário
    id!: string;

    @Column({ type: 'text', nullable: false })
    nome!: string;

    @Column({ type: 'text', unique: true, nullable: false })
    matricula!: string;
    
    @Column({ type: 'text', nullable: false })
    setor!: string;

    @Column({ type: 'text', enum: Cargo, nullable: false })
    cargo!: Cargo;

    @Column({ type: 'boolean', default: true, nullable: false })
    ativo!: boolean;

    @Column({ type: 'text', nullable: true })
    foto_url!: string | null;

    @CreateDateColumn({ type: 'timestamptz', default: () => 'NOW()' })
    criado_em!: Date;

    @OneToMany(() => RegistroAcesso, (registro) => registro.colaborador)
    acessos!: RegistroAcesso[]; //O histórico de um colaborador é a soma de todos os seus registros de entrada e saída.

    @OneToMany(() => Area, (area) => area.responsavel, { nullable: false })
    areas_sob_responsabilidade!: Area[]; 

}