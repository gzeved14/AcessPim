import { AcessoService } from "../services/AcessoService.js";
import { AppError } from "../errors/AppError.js";
export default class AcessoController {
    accessService;
    constructor(accessService) {
        this.accessService = accessService;
    }
    async findAll(req, res) {
        const { dataInicio, dataFim, area_id, colaborador_id } = req.query;
        const records = await this.accessService.listHistory({
            dataInicio: dataInicio,
            dataFim: dataFim,
            area_id: area_id,
            colaborador_id: colaborador_id
        });
        return res.status(200).json(records);
    }
    async create(req, res) {
        const { colaborador_id, area_id, tipo, observacao } = req.body;
        const registrado_por = req.auth?.sub;
        if (!registrado_por) {
            throw new AppError("Operador não identificado no token", 401);
        }
        const newAccess = await this.accessService.registerAccess({
            colaborador_id,
            area_id,
            tipo,
            registrado_por,
            observacao
        });
        return res.status(201).json(newAccess);
    }
    async update(req, res) {
        throw new AppError("Registros de acesso não podem ser editados após criados para preservar a auditoria.", 403);
    }
    async delete(req, res) {
        throw new AppError("Registros de acesso não podem ser removidos.", 403);
    }
}
//# sourceMappingURL=AcessoController.js.map