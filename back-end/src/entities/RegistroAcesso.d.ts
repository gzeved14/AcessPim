import { Tipo } from "../types/Tipo.js";
import type { Colaborador } from "./Colaborador.js";
import type { Area } from "./Area.js";
import type { Usuario } from "./Usuario.js";
export declare class RegistroAcesso {
    id: string;
    colaborador: Colaborador;
    area: Area;
    tipo: Tipo;
    autorizado: boolean;
    timestamp: Date;
    registrado_por: Usuario;
    observacao: string | null;
}
//# sourceMappingURL=RegistroAcesso.d.ts.map