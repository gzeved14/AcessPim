import { ColaboradorService } from "../services/ColaboradorService.js";
import { AppError } from "../errors/AppError.js";
export default class ColaboradorController {
    colaboradorService;
    constructor(colaboradorService) {
        this.colaboradorService = colaboradorService;
    }
    async findAll(req, res) {
        const colaborador = await this.colaboradorService.findAll();
        return res.status(200).json(colaborador);
    }
    async findById(req, res) {
        const { id } = req.params;
        if (!id || typeof id !== 'string') {
            throw new AppError("ID do colaborador inválido ou ausente", 400);
        }
        const colaborador = await this.colaboradorService.findById(id);
        if (!colaborador) {
            throw new AppError("Colaborador não encontrado", 404);
        }
        return res.status(200).json(colaborador);
    }
    async create(req, res) {
        const newColaborador = await this.colaboradorService.create(req.body);
        return res.status(200).json(newColaborador);
    }
    async update(req, res) {
        const id = req.params.id;
        const colaboradorUpdate = await this.colaboradorService.update(id, req.body);
        return res.status(200).json(colaboradorUpdate);
    }
}
//# sourceMappingURL=ColaboradorController.js.map