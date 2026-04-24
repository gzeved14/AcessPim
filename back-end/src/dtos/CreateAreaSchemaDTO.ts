import { z } from "zod";

export const createAreaSchemaDTO = z.object({
    nome: z.string(),
    descricao: z.string().optional().nullable(),
    nivel_risco: z.enum(['BAIXO', 'MEDIO', 'ALTO', 'CRITICO']),
    capacidade: z.int().positive(),
    responsavel_id: z.uuid(),
    ativa: z.boolean().optional().default(true)
});

export const createAreaSchema = createAreaSchemaDTO;
export const updateAreaSchemaDTO = createAreaSchemaDTO.partial();
export const updateAreaSchema = updateAreaSchemaDTO;