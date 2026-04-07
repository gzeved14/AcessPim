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

    @ManyToOne(() => Colaborador, (colaborador) => colaborador.acessos)
    @JoinColumn({ name: 'colaborador_id' }) // Nome da coluna no banco PostgreSQL
    colaborador!: Colaborador;

    @ManyToOne(() => Area, (area) => area.acesso, { nullable: false })
    @JoinColumn({ name: 'area_id' }) // Nome da coluna no banco PostgreSQL
    area!: Area;

    @Column({ type: 'text', enum: Tipo, nullable: false })
    tipo!: Tipo;

    @Column({ type: 'boolean', nullable: false })
    autorizado!: boolean;

    @CreateDateColumn({ type: 'timestamptz', default: () => 'NOW()' })
    registrado_em!: Date;
    
    @ManyToOne(() => Usuario, (usuario) => usuario.registros_realizados)
    @JoinColumn({ name: 'registrado_por' }) // Nome da coluna no banco PostgreSQL
    registrado_por!: Colaborador;

    @Column({ type: 'text', nullable: true })
    observacao!: string | null;
    
}