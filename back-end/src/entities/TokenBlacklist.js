var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";
let TokenBlacklist = class TokenBlacklist {
    id;
    token;
    expires_at;
    created_at;
};
__decorate([
    PrimaryGeneratedColumn("uuid"),
    __metadata("design:type", String)
], TokenBlacklist.prototype, "id", void 0);
__decorate([
    Column({ type: "text", unique: true }),
    __metadata("design:type", String)
], TokenBlacklist.prototype, "token", void 0);
__decorate([
    Column({ type: "timestamptz" }),
    __metadata("design:type", Date)
], TokenBlacklist.prototype, "expires_at", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], TokenBlacklist.prototype, "created_at", void 0);
TokenBlacklist = __decorate([
    Entity("token_blacklist")
], TokenBlacklist);
export { TokenBlacklist };
//# sourceMappingURL=TokenBlacklist.js.map