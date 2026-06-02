
import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().min(1, "O e-mail é obrigatório").email("Formato de e-mail inválido"),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres")
});

export const refreshSchema = z.object({
    refreshToken: z.string().min(1, "O refresh token é obrigatório")
});

export const logoutSchema = z
    .object({
        refreshToken: z.string().min(1, "O refresh token é obrigatório").optional()
    })
    .refine((data) => !!data.refreshToken, {
        message: "Informe ao menos o refresh token para logout"
    });

export type LoginDTO = z.infer<typeof loginSchema>;
export type RefreshDTO = z.infer<typeof refreshSchema>;
export type LogoutDTO = z.infer<typeof logoutSchema>;
