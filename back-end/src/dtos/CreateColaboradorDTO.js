import { z } from "zod";
import { Cargo } from "../types/Cargo.js";
export const createColaboradorSchema = z.object({
    nome: z.string().min(3),
    matricula: z.string().min(2),
    cargo: z.enum(Cargo),
    setor: z.string(),
    foto_url: z.string().url().optional().nullable()
});
export const createColaboradorSchemaDTO = createColaboradorSchema;
export const updateColaboradorSchemaDTO = createColaboradorSchemaDTO.partial();
export const updateColaboradorSchema = updateColaboradorSchemaDTO;
//# sourceMappingURL=CreateColaboradorDTO.js.map