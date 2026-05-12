import { z } from "zod";
import { PerfilUsuario } from "../types/PerfilUsuario.js";

export const CreateUserSchemaDTO = z.object({
    nome: z.string().min(1),
    matricula: z.string().min(1),
    email: z.email(),
    senha: z.string().min(6),
    setor: z.string().min(1),
    cargo: z.enum(Object.values(PerfilUsuario) as [string, ...string[]])
});

export const updateUserSchemaDTO = CreateUserSchemaDTO.partial();
export const createUserSchema = CreateUserSchemaDTO;
export const updateUserSchema = updateUserSchemaDTO;