import { Nivel_Risco } from "../types/Nivel_Risco.js";
import type { Colaborador } from "./Colaborador.js";
import type { RegistroAcesso } from "./RegistroAcesso.js";
export declare class Area {
    id: string;
    nome: string;
    descricao: string;
    nivel_risco: Nivel_Risco;
    capacidade: number;
    responsavel: Colaborador;
    ativa: boolean;
    acesso: RegistroAcesso[];
}
//# sourceMappingURL=Area.d.ts.map