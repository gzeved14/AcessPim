import { z } from "zod";

export const createRegistroSchemaDTO = z.object({
    // Permite UUID (Angular) ou string/número convertido para string (Borda)
    colaborador_id: z.union([z.string().uuid(), z.string(), z.number().transform(v => String(v))]),
    area_id:        z.union([z.string().uuid(), z.string(), z.number().transform(v => String(v))]),
    tipo:           z.enum(["ENTRADA", "SAIDA", "entrada", "saida"]).transform(v => v.toUpperCase()),
    autorizado:     z.preprocess(
                        (val) => val === "true" || val === true || val === 1,
                        z.boolean()
                    ),
    observacao:     z.string().optional().nullable(),
}).passthrough();

export const createSyncCacheSchemaDTO = z.object({
    matricula: z.string().min(1),
    area: z.string().min(1),
})

export const updateAccessRecordSchema = createRegistroSchemaDTO.partial();
export const createAccessRecordSchema = createRegistroSchemaDTO;
export const updateAccessRecordSchemaDTO = updateAccessRecordSchema;
export type CreateSyncCacheDTO = z.infer<typeof createSyncCacheSchemaDTO>;
