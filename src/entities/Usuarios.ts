import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Cargo } from "../types/Cargo.js";
import { OneToMany } from "typeorm";
import { RegistroAcesso } from "./RegistroAcesso.js";

@Entity("usuario")
export class Usuario {
    
    @PrimaryGeneratedColumn("uuid") //faz o banco de dados gerencia automaticamente um id único para cada usuário
    id_usuario!: string;

    @Column({ type: 'text', nullable: false })
    nome!: string;

    @Column({ type: 'text', unique: true, nullable: false })
    matricula!: string;

    @Column({ type: 'text', unique: true, nullable: false })
    email!: string;

    @Column({ type: 'text', nullable: false, select: false })
    senha_hash!: string;
    
    @Column({ type: 'text', nullable: false })
    setor!: string;

    @Column({ type: 'text', enum: Cargo, nullable: false })
    cargo!: Cargo;

    @Column({ type: 'timestamptz', default: () => 'NOW()' })
    criado_em!: Date;

    @OneToMany(() => RegistroAcesso, (registro) => registro.registrado_por)
    registros_realizados!: RegistroAcesso[]; //um usuário (operador) pode realizar milhares de registros no sistema
}