import type { RequestHandler } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { AppError } from "../errors/AppError.js";
import { TokenBlacklistService } from "../services/TokenBlacklistService.js"
import { appDataSource } from "../config/appDataSource.js"

const getAccessSecret = () => {
    const value = process.env.JWT_ACCESS_SECRET;
    if (!value) {
        throw new AppError("JWT_ACCESS_SECRET nao definido", 500);
    }
    return value;
};

const blacklistService = new TokenBlacklistService(appDataSource);

export const ensureAuth: RequestHandler = async (req, res, next) => {
    const authHeader = req.headers.authorization; //acessa o local onde o frontend deve enviar o token JWT.

    if (!authHeader || !authHeader.startsWith("Bearer ")) { //Verifica se o cabeçalho existe e se inicia com "Bearer ", o padrão mundial para transporte de tokens de portador.
        return next(new AppError("Token ausente", 401));
    }

    const token = authHeader.slice(7).trim();//Utiliza .slice(7).trim() para remover a palavra "Bearer " e isolar apenas o código do token. Se o token estiver ausente, a função interrompe a requisição com um erro 401 (Não Autorizado).
    if (!token) {
        return next(new AppError("Token ausente", 401));
    }

    try {
        const isRevoked = await blacklistService.isBlacklisted(token); // Antes de validar o token, o sistema consulta o blacklistService para ver se aquele token específico foi revogado ->(invalidado) (em um logout anterior).
        if (isRevoked){
            return next(new AppError("Sessão encerrada. Faça login novamente.", 401)); //Este erro sinaliza ao frontend Angular que o usuário deve ser redirecionado imediatamente para a tela de Login
        }  // Se o token estiver na lista negra, a requisição é negada com erro 401, mesmo que o token ainda esteja dentro da validade de 8 horas. Isso cumpre o requisito de invalidação de sessão do plano de integridade de dados.
        const payload = jwt.verify(token, getAccessSecret()) as JwtPayload; // jwt.verify: Utiliza a chave secreta (vinda de variáveis de ambiente) para garantir que o token é autêntico e não foi alterado.
        (req as any).auth = payload; // Ao validar com sucesso, o conteúdo do token (ID do operador, e-mail, cargo) é anexado ao objeto da requisição. Isso permite que o AcessoController saiba exatamente qual operador está realizando o registro (campo registrado_por).
        return next();
    } catch (error) {
        return next(new AppError("Token invalido", 401)); //Caso ocorra qualquer falha (token expirado, assinatura inválida ou erro de banco), o código captura a exceção e retorna um AppError 401.
    }
};