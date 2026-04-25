import { z } from "zod";
export declare const CreateUserSchemaDTO: z.ZodObject<{
    nome: z.ZodString;
    matricula: z.ZodString;
    email: z.ZodEmail;
    senha: z.ZodString;
    setor: z.ZodString;
    cargo: z.ZodString;
}, z.core.$strip>;
export declare const updateUserSchemaDTO: z.ZodObject<{
    nome: z.ZodOptional<z.ZodString>;
    matricula: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodEmail>;
    senha: z.ZodOptional<z.ZodString>;
    setor: z.ZodOptional<z.ZodString>;
    cargo: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createUserSchema: z.ZodObject<{
    nome: z.ZodString;
    matricula: z.ZodString;
    email: z.ZodEmail;
    senha: z.ZodString;
    setor: z.ZodString;
    cargo: z.ZodString;
}, z.core.$strip>;
export declare const updateUserSchema: z.ZodObject<{
    nome: z.ZodOptional<z.ZodString>;
    matricula: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodEmail>;
    senha: z.ZodOptional<z.ZodString>;
    setor: z.ZodOptional<z.ZodString>;
    cargo: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
//# sourceMappingURL=CreateUserSchemaDTO.d.ts.map