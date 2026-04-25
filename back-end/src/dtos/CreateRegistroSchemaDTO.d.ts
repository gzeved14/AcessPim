import { z } from "zod";
export declare const createRegistroSchemaDTO: z.ZodObject<{
    colaborador_id: z.ZodUUID;
    area_id: z.ZodUUID;
    tipo: z.ZodEnum<{
        entrada: "entrada";
        saida: "saida";
    }>;
    registrado_por: z.ZodUUID;
    observacao: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const updateRegistroSchemaDTO: z.ZodObject<{
    colaborador_id: z.ZodOptional<z.ZodUUID>;
    area_id: z.ZodOptional<z.ZodUUID>;
    tipo: z.ZodOptional<z.ZodEnum<{
        entrada: "entrada";
        saida: "saida";
    }>>;
    registrado_por: z.ZodOptional<z.ZodUUID>;
    observacao: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
}, z.core.$strip>;
export declare const createAccessRecordSchema: z.ZodObject<{
    colaborador_id: z.ZodUUID;
    area_id: z.ZodUUID;
    tipo: z.ZodEnum<{
        entrada: "entrada";
        saida: "saida";
    }>;
    registrado_por: z.ZodUUID;
    observacao: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const updateAccessRecordSchema: z.ZodObject<{
    colaborador_id: z.ZodOptional<z.ZodUUID>;
    area_id: z.ZodOptional<z.ZodUUID>;
    tipo: z.ZodOptional<z.ZodEnum<{
        entrada: "entrada";
        saida: "saida";
    }>>;
    registrado_por: z.ZodOptional<z.ZodUUID>;
    observacao: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
}, z.core.$strip>;
//# sourceMappingURL=CreateRegistroSchemaDTO.d.ts.map