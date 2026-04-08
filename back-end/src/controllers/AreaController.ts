import type { Request, Response } from "express";

export default class AreaController {
	constructor(private readonly areaService: unknown) {}

	async findAll(_req: Request, res: Response) {
		return res.status(501).json({ message: "Not implemented" });
	}

	async findById(_req: Request, res: Response) {
		return res.status(501).json({ message: "Not implemented" });
	}

	async create(_req: Request, res: Response) {
		return res.status(501).json({ message: "Not implemented" });
	}

	async update(_req: Request, res: Response) {
		return res.status(501).json({ message: "Not implemented" });
	}
}
