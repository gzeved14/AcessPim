import { z } from "zod";

export const createAcessoSchema = z.object({
    colaborador_id: z.string().uuid(),
    area_id: z.string().uuid(),
    tipo: z.enum(['entrada', 'saida']),
    autorizado: z.boolean(),
    observacao: z.string().optional().nullable()
});