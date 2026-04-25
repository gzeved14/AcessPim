import type { Request, Response } from "express";
import { AcessoService } from "../services/AcessoService.js";
export default class AcessoController {
    private readonly accessService;
    constructor(accessService: AcessoService);
    findAll(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    create(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    update(req: Request, res: Response): Promise<void>;
    delete(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=AcessoController.d.ts.map