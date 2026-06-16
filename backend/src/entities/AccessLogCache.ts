import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";
import { SyncStatus } from "../types/SyncStatus";

@Entity("access_log_cache")
export class AccessLogCache {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text", nullable: false })
  matricula!: string;

  @Column({ type: "text", nullable: false })
  area_nome!: string;

  @Column({
    type: "enum",
    enum: SyncStatus,
    default: SyncStatus.PENDING
  })
  status_sync!: SyncStatus;

  @CreateDateColumn({ type: "timestamptz" })
  registrado_em!: Date;
}