import type { Request, Response } from "express";
import type { AuthService } from "../services/AuthService.js";


const sanitizeUser = (usuario: any) => {
    if (!usuario || typeof usuario !== "object") return usuario;
    const { senha_hash, ...rest } = usuario;
    return rest;
};

export default class AuthController {
    constructor(private authService: AuthService) {}

    async login(req: Request, res: Response) {
        // Captura metadados conforme sua lógica anterior (opcional, mas boa prática)
        const meta = {
            ip: req.ip,
            userAgent: String(req.headers["user-agent"] || "")
        };

        const result = await this.authService.login(
            req.body.email,
            req.body.password,
            meta
        );

        return res.status(200).json({
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            usuario: sanitizeUser(result.usuario)
        });
    }

    async refresh(req: Request, res: Response) {
        const result = await (
            this.authService as AuthService & {
                refresh: (refreshToken: string) => Promise<unknown>;
            }
        ).refresh(req.body.refreshToken);

        return res.status(200).json(result);
    }

    async logout(req: Request, res: Response) {
        await this.authService.logout(req.body.refreshToken);
        return res.status(204).send();
    }
}
