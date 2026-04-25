var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, ManyToOne, Entity, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
let Autorizacao = class Autorizacao {
    id;
    colaborador; // Relacionamento com Colaborador
    colaborador_id;
    area; // Relacionamento com Area
    area_id;
    cargo_permitido;
    validade;
};
__decorate([
    PrimaryGeneratedColumn("uuid"),
    __metadata("design:type", String)
], Autorizacao.prototype, "id", void 0);
__decorate([
    ManyToOne("Colaborador"),
    JoinColumn({ name: 'colaborador_id' }),
    __metadata("design:type", Function)
], Autorizacao.prototype, "colaborador", void 0);
__decorate([
    Column({ type: 'uuid' }),
    __metadata("design:type", String)
], Autorizacao.prototype, "colaborador_id", void 0);
__decorate([
    ManyToOne("Area"),
    JoinColumn({ name: 'area_id' }),
    __metadata("design:type", Function)
], Autorizacao.prototype, "area", void 0);
__decorate([
    Column({ type: 'uuid' }),
    __metadata("design:type", String)
], Autorizacao.prototype, "area_id", void 0);
__decorate([
    Column({ type: "text", nullable: false }),
    __metadata("design:type", String)
], Autorizacao.prototype, "cargo_permitido", void 0);
__decorate([
    Column({ type: "timestamptz", nullable: false }),
    __metadata("design:type", Date)
], Autorizacao.prototype, "validade", void 0);
Autorizacao = __decorate([
    Entity("autorizacao")
], Autorizacao);
export { Autorizacao };
//# sourceMappingURL=Autorizacao.js.map