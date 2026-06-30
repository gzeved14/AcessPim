import { z } from "zod";
import { Cargo } from "../types/Cargo";

export const createColaboradorSchema = z.object({
    nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
    matricula: z.string().min(2, "A matrícula deve ter pelo menos 2 caracteres"),
    cargo: z.string().min(1, "O cargo é obrigatório"),
    setor: z.string().min(1, "O setor é obrigatório"),
    foto_url: z.string().url("A foto deve ser uma URL válida").optional().nullable()
});

export const createColaboradorSchemaDTO = createColaboradorSchema;
export const updateColaboradorSchema = createColaboradorSchema.partial().extend({
    ativo: z.boolean().optional()
});

export const SolicitarCadastroRostoSchema = z.object({
    colaborador_id: z.string().uuid("ID do colaborador inválido (Deve ser UUID)")
});
export type SolicitarCadastroRostoDTO = z.infer<typeof SolicitarCadastroRostoSchema>;