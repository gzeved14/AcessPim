import type { Request, Response } from "express";
import type { UsuarioService } from "../services/UsuarioService.js";
export default class UsuarioController {
    private userService;
    constructor(userService: UsuarioService);
    findAllUsers(_req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    findUserById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    createUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    updateUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=UsuarioController.d.ts.map