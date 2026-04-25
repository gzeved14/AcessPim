import { Cargo } from "../types/Cargo.js";
import { RegistroAcesso } from "./RegistroAcesso.js";
export declare class Usuario {
    id: string;
    nome: string;
    matricula: string;
    email: string;
    senha_hash: string;
    setor: string;
    cargo: Cargo;
    criado_em: Date;
    registros_realizados: RegistroAcesso[];
}
//# sourceMappingURL=Usuario.d.ts.map