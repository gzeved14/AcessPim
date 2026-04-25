var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from "typeorm";
import { JoinColumn } from "typeorm";
import { Tipo } from "../types/Tipo.js";
let RegistroAcesso = class RegistroAcesso {
    id;
    colaborador;
    area;
    tipo;
    autorizado;
    timestamp;
    registrado_por; // Corrigido para Usuario
    observacao;
};
__decorate([
    PrimaryGeneratedColumn("uuid"),
    __metadata("design:type", String)
], RegistroAcesso.prototype, "id", void 0);
__decorate([
    ManyToOne("Colaborador"),
    JoinColumn({ name: 'colaborador_id' }),
    __metadata("design:type", Function)
], RegistroAcesso.prototype, "colaborador", void 0);
__decorate([
    ManyToOne("Area"),
    JoinColumn({ name: 'area_id' }),
    __metadata("design:type", Function)
], RegistroAcesso.prototype, "area", void 0);
__decorate([
    Column({ type: 'enum', enum: Tipo }),
    __metadata("design:type", String)
], RegistroAcesso.prototype, "tipo", void 0);
__decorate([
    Column({ type: 'boolean' }),
    __metadata("design:type", Boolean)
], RegistroAcesso.prototype, "autorizado", void 0);
__decorate([
    Column({ name: "registrado_em", type: "timestamptz", default: () => "CURRENT_TIMESTAMP" }),
    __metadata("design:type", Date)
], RegistroAcesso.prototype, "timestamp", void 0);
__decorate([
    ManyToOne("Usuario"),
    JoinColumn({ name: 'registrado_por' }),
    __metadata("design:type", Function)
], RegistroAcesso.prototype, "registrado_por", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], RegistroAcesso.prototype, "observacao", void 0);
RegistroAcesso = __decorate([
    Entity("registro_acesso")
], RegistroAcesso);
export { RegistroAcesso };
//# sourceMappingURL=RegistroAcesso.js.map