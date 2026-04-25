import { Cargo } from "../types/Cargo.js";
import type { Area } from "./Area.js";
import type { RegistroAcesso } from "./RegistroAcesso.js";
export declare class Colaborador {
    id: string;
    nome: string;
    matricula: string;
    setor: string;
    cargo: Cargo;
    ativo: boolean;
    foto_url: string | null;
    criado_em: Date;
    acessos: RegistroAcesso[];
    areas_sob_responsabilidade: Area[];
}
//# sourceMappingURL=Colaborador.d.ts.map