import { Column, Entity, ManyToMany, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from "typeorm";
import { Colaborador } from "./Colaborador.js";
import { Area } from "./Area.js";
import { JoinColumn } from "typeorm";
import { Tipo } from "../types/Tipo.js";
import { Usuario } from "./Usuario.js";

@Entity("registro_acesso")
export class RegistroAcesso {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Colaborador)
    @JoinColumn({ name: 'colaborador_id' })
    colaborador!: Colaborador;

    @ManyToOne(() => Area)
    @JoinColumn({ name: 'area_id' })
    area!: Area;

    @Column({ type: 'enum', enum: Tipo })
    tipo!: Tipo;

    @Column({ type: 'boolean' })
    autorizado!: boolean;

    @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
    timestamp!: Date;

    @ManyToOne(() => Usuario)
    @JoinColumn({ name: 'registrado_por' })
    registrado_por!: Usuario; // Corrigido para Usuario

    @Column({ type: 'text', nullable: true })
    observacao!: string | null;
}