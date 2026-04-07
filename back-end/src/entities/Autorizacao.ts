import { Column, ManyToOne, OneToOne,Entity, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { Colaborador } from "./Colaborador.js";
import { Area } from "./Area.js";
@Entity("autorizacao")
export class Autorizacao {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Colaborador)
    @JoinColumn({ name: 'colaborador_id'})
    colaborador!: Colaborador; // Relacionamento com Colaborador

    @Column()
    colaborador_id!: string;

    @ManyToOne(() => Area)
    @JoinColumn({ name: 'area_id'})
    area!: Area; // Relacionamento com Area

    @Column()
    area_id!: string;

    @Column({ type: "text", nullable: false })
    cargo_permitido!: string;

    @Column({ type: "timestamptz", nullable: false })
    validade!: Date;
}