import { Usuario } from "../entities/Usuario.js";
import { DataSource } from "typeorm";
type CreateUserInput = {
    nome: string;
    matricula: string;
    email: string;
    senha: string;
    setor: string;
    cargo: Usuario["cargo"];
};
type UpdateUserInput = {
    nome?: string;
    matricula?: string;
    email?: string;
    senha?: string;
    setor?: string;
    cargo?: Usuario["cargo"];
};
export declare class UsuarioService {
    private repo;
    constructor(dataSource: DataSource);
    create(data: CreateUserInput): Promise<{
        id: string;
        nome: string;
        matricula: string;
        email: string;
        setor: string;
        cargo: import("../types/Cargo.js").Cargo;
        criado_em: Date;
        registros_realizados: import("../entities/RegistroAcesso.js").RegistroAcesso[];
    }>;
    findById(id: string): Promise<Usuario>;
    findAll(): Promise<Usuario[]>;
    findByEmailForLogin(email: string): Promise<Usuario | null>;
    update(id: string, data: UpdateUserInput): Promise<{
        id: string;
        nome: string;
        matricula: string;
        email: string;
        setor: string;
        cargo: import("../types/Cargo.js").Cargo;
        criado_em: Date;
        registros_realizados: import("../entities/RegistroAcesso.js").RegistroAcesso[];
    }>;
}
export {};
//# sourceMappingURL=UsuarioService.d.ts.map