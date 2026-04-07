import { z } from "zod";

export const createColaboradorSchema = z.object({
    nome: z.string().min(3),
    matricula: z.string().min(2),
    cargo: z.string(),
    setor: z.string(),
    foto_url: z.string().url().optional().nullable()
});
