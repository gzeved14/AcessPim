import type { RequestHandler } from "express";
import type { ZodTypeAny } from "zod";

export const validateBody = (schema: ZodTypeAny): RequestHandler => {
	return (req, _res, next) => {
		try {
			req.body = schema.parse(req.body);
			return next();
		} catch (error) {
			return next(error);
		}
	};
};
