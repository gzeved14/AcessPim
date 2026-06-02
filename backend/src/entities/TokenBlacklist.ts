import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

// Especifica e conecta a Classe com a Tabela correspondente "token_blacklist" dentro do banco.
@Entity("token_blacklist")
export class TokenBlacklist {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "text", unique: true, nullable: false })
    token!: string;

    @Column({ type: "timestamptz", nullable: false })
    expires_at!: Date;

    @CreateDateColumn({ type: "timestamptz", default: () => "NOW()" })
    created_at!: Date;
}