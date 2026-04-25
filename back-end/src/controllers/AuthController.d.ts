import type { Request, Response } from "express";
import type { AuthService } from "../services/AuthService.js";
export default class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    refresh(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    logout(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=AuthController.d.ts.map