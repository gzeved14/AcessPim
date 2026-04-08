import { z } from "zod";

export const createRegistroSchemaDTO = z.object({
    colaborador_id: z.string().uuid(),
    area_id: z.string().uuid(),
    tipo: z.enum(["entrada", "saida"]),
    registrado_por: z.string().uuid(),
    observacao: z.string().optional().nullable()
});

export const updateRegistroSchemaDTO = createRegistroSchemaDTO.partial();