import { z } from "zod";

export const createRegistroSchemaDTO = z.object({
    colaborador_id: z.uuid(),
    area_id: z.uuid(),
    tipo: z.enum(["entrada", "saida"]),
    registrado_por: z.uuid(),
    observacao: z.string().optional().nullable()
});

export const updateRegistroSchemaDTO = createRegistroSchemaDTO.partial();
export const createAccessRecordSchema = createRegistroSchemaDTO;
export const updateAccessRecordSchema = updateRegistroSchemaDTO;
