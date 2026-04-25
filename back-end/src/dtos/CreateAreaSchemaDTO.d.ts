import { z } from "zod";
export declare const createAreaSchemaDTO: z.ZodObject<{
    nome: z.ZodString;
    descricao: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    nivel_risco: z.ZodEnum<{
        BAIXO: "BAIXO";
        MEDIO: "MEDIO";
        ALTO: "ALTO";
        CRITICO: "CRITICO";
    }>;
    capacidade: z.ZodInt;
    responsavel_id: z.ZodUUID;
    ativa: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export declare const createAreaSchema: z.ZodObject<{
    nome: z.ZodString;
    descricao: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    nivel_risco: z.ZodEnum<{
        BAIXO: "BAIXO";
        MEDIO: "MEDIO";
        ALTO: "ALTO";
        CRITICO: "CRITICO";
    }>;
    capacidade: z.ZodInt;
    responsavel_id: z.ZodUUID;
    ativa: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export declare const updateAreaSchemaDTO: z.ZodObject<{
    nome: z.ZodOptional<z.ZodString>;
    descricao: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    nivel_risco: z.ZodOptional<z.ZodEnum<{
        BAIXO: "BAIXO";
        MEDIO: "MEDIO";
        ALTO: "ALTO";
        CRITICO: "CRITICO";
    }>>;
    capacidade: z.ZodOptional<z.ZodInt>;
    responsavel_id: z.ZodOptional<z.ZodUUID>;
    ativa: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
}, z.core.$strip>;
export declare const updateAreaSchema: z.ZodObject<{
    nome: z.ZodOptional<z.ZodString>;
    descricao: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    nivel_risco: z.ZodOptional<z.ZodEnum<{
        BAIXO: "BAIXO";
        MEDIO: "MEDIO";
        ALTO: "ALTO";
        CRITICO: "CRITICO";
    }>>;
    capacidade: z.ZodOptional<z.ZodInt>;
    responsavel_id: z.ZodOptional<z.ZodUUID>;
    ativa: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
}, z.core.$strip>;
//# sourceMappingURL=CreateAreaSchemaDTO.d.ts.map