var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Nivel_Risco } from "../types/Nivel_Risco.js";
import { JoinColumn } from "typeorm";
let Area = class Area {
    id;
    nome;
    descricao;
    nivel_risco;
    capacidade;
    responsavel;
    ativa;
    acesso; //permitindo listar todos os eventos ocorridos naquele local específico
};
__decorate([
    PrimaryGeneratedColumn("uuid"),
    __metadata("design:type", String)
], Area.prototype, "id", void 0);
__decorate([
    Column({ type: 'text', nullable: false }),
    __metadata("design:type", String)
], Area.prototype, "nome", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Area.prototype, "descricao", void 0);
__decorate([
    Column({ type: 'text', enum: Nivel_Risco, nullable: false }),
    __metadata("design:type", String)
], Area.prototype, "nivel_risco", void 0);
__decorate([
    Column({ type: 'integer', nullable: false }),
    __metadata("design:type", Number)
], Area.prototype, "capacidade", void 0);
__decorate([
    ManyToOne("Colaborador", (colaborador) => colaborador.areas_sob_responsabilidade, { nullable: false }),
    JoinColumn({ name: 'responsavel_id' }) // Nome da coluna conforme o PRD
    ,
    __metadata("design:type", Function)
], Area.prototype, "responsavel", void 0);
__decorate([
    Column({ type: 'boolean', default: true, nullable: false }),
    __metadata("design:type", Boolean)
], Area.prototype, "ativa", void 0);
__decorate([
    OneToMany("RegistroAcesso", (registro) => registro.area),
    __metadata("design:type", Array)
], Area.prototype, "acesso", void 0);
Area = __decorate([
    Entity("area")
], Area);
export { Area };
//# sourceMappingURL=Area.js.map