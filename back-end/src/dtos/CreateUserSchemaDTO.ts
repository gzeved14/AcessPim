
// Importa o validador Zod e o enum de perfis de usuário
import { z } from "zod";
import { PerfilUsuario } from "../types/PerfilUsuario.js";


// Schema de validação para criação de usuário
export const CreateUserSchemaDTO = z.object({
    nome: z.string().min(1), // Nome do usuário (obrigatório)
    matricula: z.string().min(1), // Matrícula do usuário (obrigatório)
    email: z.email(), // E-mail válido (obrigatório)
    senha: z.string().min(6), // Senha com no mínimo 6 caracteres
    setor: z.string().min(1), // Setor do usuário (obrigatório)
    cargo: z.enum(Object.values(PerfilUsuario) as [string, ...string[]]) // Cargo deve ser um dos valores do enum PerfilUsuario
});


// Schema para atualização parcial de usuário
export const updateUserSchemaDTO = CreateUserSchemaDTO.partial();
// Alias para facilitar importação
export const createUserSchema = CreateUserSchemaDTO;
export const updateUserSchema = updateUserSchemaDTO;