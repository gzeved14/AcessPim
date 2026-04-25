var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Cargo } from "../types/Cargo.js";
import { OneToMany } from "typeorm";
import { RegistroAcesso } from "./RegistroAcesso.js";
let Usuario = class Usuario {
    id;
    nome;
    matricula;
    email;
    senha_hash;
    setor;
    cargo;
    criado_em;
    registros_realizados; //um usuário (operador) pode realizar milhares de registros no sistema
};
__decorate([
    PrimaryGeneratedColumn("uuid") //faz o banco de dados gerencia automaticamente um id único para cada usuário
    ,
    __metadata("design:type", String)
], Usuario.prototype, "id", void 0);
__decorate([
    Column({ type: 'text', nullable: false }),
    __metadata("design:type", String)
], Usuario.prototype, "nome", void 0);
__decorate([
    Column({ type: 'text', unique: true, nullable: false }),
    __metadata("design:type", String)
], Usuario.prototype, "matricula", void 0);
__decorate([
    Column({ type: 'text', unique: true, nullable: false }),
    __metadata("design:type", String)
], Usuario.prototype, "email", void 0);
__decorate([
    Column({ type: 'text', nullable: false, select: false }),
    __metadata("design:type", String)
], Usuario.prototype, "senha_hash", void 0);
__decorate([
    Column({ type: 'text', nullable: false }),
    __metadata("design:type", String)
], Usuario.prototype, "setor", void 0);
__decorate([
    Column({ type: 'text', enum: Cargo, nullable: false }),
    __metadata("design:type", String)
], Usuario.prototype, "cargo", void 0);
__decorate([
    Column({ type: 'timestamptz', default: () => 'NOW()' }),
    __metadata("design:type", Date)
], Usuario.prototype, "criado_em", void 0);
__decorate([
    OneToMany(() => RegistroAcesso, (registro) => registro.registrado_por),
    __metadata("design:type", Array)
], Usuario.prototype, "registros_realizados", void 0);
Usuario = __decorate([
    Entity("usuario")
], Usuario);
export { Usuario };
//# sourceMappingURL=Usuario.js.map