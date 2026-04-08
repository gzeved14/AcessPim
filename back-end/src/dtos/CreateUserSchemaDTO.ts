import { z } from "zod";

export const createUserSchema = z.object({
    nome: z.string().min(1),
    matricula: z.string().min(1),
    email: z.string().email(),
    senha: z.string().min(6),
    setor: z.string().min(1),
    cargo: z.string().min(1)
});

export const updateUserSchema = createUserSchema.partial();