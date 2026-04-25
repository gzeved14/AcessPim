var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Cargo } from "../types/Cargo.js";
import { JoinColumn } from "typeorm";
let Colaborador = class Colaborador {
    id;
    nome;
    matricula;
    setor;
    cargo;
    ativo;
    foto_url;
    criado_em;
    acessos; //O histórico de um colaborador é a soma de todos os seus registros de entrada e saída.
    areas_sob_responsabilidade;
};
__decorate([
    PrimaryGeneratedColumn("uuid") //faz o banco de dados gerencia automaticamente um id único para cada usuário
    ,
    __metadata("design:type", String)
], Colaborador.prototype, "id", void 0);
__decorate([
    Column({ type: 'text', nullable: false }),
    __metadata("design:type", String)
], Colaborador.prototype, "nome", void 0);
__decorate([
    Column({ type: 'text', unique: true, nullable: false }),
    __metadata("design:type", String)
], Colaborador.prototype, "matricula", void 0);
__decorate([
    Column({ type: 'text', nullable: false }),
    __metadata("design:type", String)
], Colaborador.prototype, "setor", void 0);
__decorate([
    Column({ type: 'text', nullable: false }),
    __metadata("design:type", String)
], Colaborador.prototype, "cargo", void 0);
__decorate([
    Column({ type: 'boolean', default: true, nullable: false }),
    __metadata("design:type", Boolean)
], Colaborador.prototype, "ativo", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Colaborador.prototype, "foto_url", void 0);
__decorate([
    CreateDateColumn({ type: 'timestamptz', default: () => 'NOW()' }),
    __metadata("design:type", Date)
], Colaborador.prototype, "criado_em", void 0);
__decorate([
    OneToMany("RegistroAcesso", (registro) => registro.colaborador),
    __metadata("design:type", Array)
], Colaborador.prototype, "acessos", void 0);
__decorate([
    OneToMany("Area", (area) => area.responsavel, { nullable: false }),
    __metadata("design:type", Array)
], Colaborador.prototype, "areas_sob_responsabilidade", void 0);
Colaborador = __decorate([
    Entity("colaborador")
], Colaborador);
export { Colaborador };
//# sourceMappingURL=Colaborador.js.map