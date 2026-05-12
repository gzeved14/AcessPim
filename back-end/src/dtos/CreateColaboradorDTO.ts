import { z } from "zod";
import { CargoColaborador } from "../types/CargoColaborador.js";

export const createColaboradorSchema = z.object({
    nome: z.string().min(3),
    matricula: z.string().min(2),
    cargo: z.string().min(3, "Cargo deve ter pelo menos 3 caracteres"),
    setor: z.string(),
    foto_url: z.string().url().optional().nullable()
});

export const createColaboradorSchemaDTO = createColaboradorSchema;
export const updateColaboradorSchema = createColaboradorSchema.partial().extend({
    ativo: z.boolean().optional()
});
