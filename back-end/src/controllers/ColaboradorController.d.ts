import type { Request, Response } from "express";
import { ColaboradorService } from "../services/ColaboradorService.js";
export default class ColaboradorController {
    private readonly colaboradorService;
    constructor(colaboradorService: ColaboradorService);
    findAll(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    findById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    create(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    update(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=ColaboradorController.d.ts.map