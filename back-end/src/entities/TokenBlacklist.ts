import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("token_blacklist")
export class TokenBlacklist {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "text", unique: true })
    token!: string; 

    @Column({ type: "timestamptz" })
    expires_at!: Date;

    @CreateDateColumn()
    created_at!: Date;
}