import { z } from "zod";
import { Cargo } from "../types/Cargo.js";
export declare const createColaboradorSchema: z.ZodObject<{
    nome: z.ZodString;
    matricula: z.ZodString;
    cargo: z.ZodEnum<typeof Cargo>;
    setor: z.ZodString;
    foto_url: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const createColaboradorSchemaDTO: z.ZodObject<{
    nome: z.ZodString;
    matricula: z.ZodString;
    cargo: z.ZodEnum<typeof Cargo>;
    setor: z.ZodString;
    foto_url: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const updateColaboradorSchemaDTO: z.ZodObject<{
    nome: z.ZodOptional<z.ZodString>;
    matricula: z.ZodOptional<z.ZodString>;
    cargo: z.ZodOptional<z.ZodEnum<typeof Cargo>>;
    setor: z.ZodOptional<z.ZodString>;
    foto_url: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
}, z.core.$strip>;
export declare const updateColaboradorSchema: z.ZodObject<{
    nome: z.ZodOptional<z.ZodString>;
    matricula: z.ZodOptional<z.ZodString>;
    cargo: z.ZodOptional<z.ZodEnum<typeof Cargo>>;
    setor: z.ZodOptional<z.ZodString>;
    foto_url: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
}, z.core.$strip>;
//# sourceMappingURL=CreateColaboradorDTO.d.ts.map