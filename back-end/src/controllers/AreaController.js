import { AreaService } from "../services/AreaService.js";
import { AppError } from "../errors/AppError.js";
export default class AreaController {
    areaService;
    constructor(areaService) {
        this.areaService = areaService;
    }
    async findAll(req, res) {
        const area = await this.areaService.listAll();
        return res.status(200).json(area);
    }
    async findById(req, res) {
        const { id } = req.params;
        if (!id || typeof id !== 'string') {
            throw new AppError("ID da área inválido ou ausente", 400);
        }
        const area = await this.areaService.findById(id);
        if (!area) {
            throw new AppError("Área não encontrada", 404);
        }
        return res.status(200).json(area);
    }
    async create(req, res) {
        const newArea = await this.areaService.create(req.body);
        return res.status(201).json(newArea);
    }
    async update(req, res) {
        const id = req.params.id;
        const areaUpdate = await this.areaService.update(id, req.body);
        return res.status(200).json(areaUpdate);
    }
}
//# sourceMappingURL=AreaController.js.map