import { z } from "zod";

export const createRegistroSchemaDTO = z.object({
    colaborador_id: z.string().uuid(),
    area_id:        z.string().uuid(),
    tipo:           z.enum(["ENTRADA", "SAIDA", "entrada", "saida"]),
    //  autorizado adicionado e coercido para boolean
    autorizado:     z.preprocess(
                        (val) => val === "true" || val === true,
                        z.boolean()
                    ),
    //  removido registrado_por — vem do JWT, não do body
    observacao:     z.string().optional().nullable(),
}).passthrough();

export const updateRegistroSchemaDTO = createRegistroSchemaDTO.partial();
export const createAccessRecordSchema = createRegistroSchemaDTO;
export const updateAccessRecordSchema = updateRegistroSchemaDTO;