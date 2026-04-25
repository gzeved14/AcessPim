import type { Request, Response } from "express";
import { AreaService } from "../services/AreaService.js";
export default class AreaController {
    private readonly areaService;
    constructor(areaService: AreaService);
    findAll(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    findById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    create(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    update(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=AreaController.d.ts.map