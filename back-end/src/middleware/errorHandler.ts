import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError.js";

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => { // erros previstos, como erros de validação ou erros personalizados
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            message: err.message,
            details: err.details,
        });
    }

    if (err instanceof ZodError) { // caso o cliente envie algo inválido, a validação do Zod vai lançar um erro, e aqui a gente captura ele e retorna uma resposta adequada para o cliente
        return res.status(400).json({
            message: "Validation error",
            details: err.flatten()
        });
    }

    console.error(err); // caso o erro seja inesperado, a gente loga ele no console para poder investigar depois, mas não expõe detalhes do erro para o cliente, para evitar vazamento de informações sensíveis 
    return res.status(500).json({ message: "Erro interno" });
};