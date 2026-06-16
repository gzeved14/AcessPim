// Importa os tipos originais das requisições Express.
import type { RequestHandler } from "express";
// Importa biblioteca "jsonwebtoken" para descriptografar/validar tokens e ler seus dados.
import jwt, { type JwtPayload } from "jsonwebtoken";
// Importa classe de modelo de tratativa de erros e códigos customizados.
import { AppError } from "../errors/AppError";
// Importa serviço que lida com invalidação (Blacklist) de chaves antigas.
import { TokenBlacklistService } from "../services/TokenBlacklistService"
// Importa configurações da conexão principal do TypeORM.
import { appDataSource } from "../config/appDataSource"

// Criação de rotina auxiliar que vai ler do arquivo ".env" qual a chave secreta dos JWT da plataforma.
const getAccessSecret = () => {
    const value = process.env.JWT_ACCESS_SECRET;
    // Para a aplicação e reporta erro 500 no caso do administrador não ter setado as variáveis de ambiente necessárias.
    if (!value) {
        throw new AppError("JWT_ACCESS_SECRET nao definido", 500);
    }
    return value;
};

// Transforma e liga a variável responsável por gerenciar sessões invalidadas.
const blacklistService = new TokenBlacklistService(appDataSource);

// Middleware que captura e avalia as credenciais HTTP antes das rotas entrarem em seus controllers para checar autorização de usuário.
// Middleware que captura e avalia as credenciais HTTP antes das rotas entrarem em seus controllers para checar autorização de usuário.
export const ensureAuth: RequestHandler = async (req, res, next) => {
    console.log("[ensureAuth] Requisição recebida:", req.method, req.originalUrl, req.headers.authorization);
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.warn("⚠️ Token ausente ou mal formatado");
        return next(new AppError("Token ausente", 401));
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
        console.warn("⚠️ Token ausente após slice");
        return next(new AppError("Token ausente", 401));
    }

    // 🎯 BYPASS DE SEGURANÇA PARA A CATRACA / BORDA (ADICIONE ESTE BLOCO AQUI):
    // Se o token corresponder à assinatura estática de hardware da borda, libera o fluxo imediatamente!
    if (token === "1010-ACCESSPIM") {
        console.log("🤖 [M2M AUTH] Borda autenticada com sucesso via token estático de hardware.");
        
        // Injeta um payload fictício no request caso seus controllers dependam do objeto 'req.auth'
        (req as any).auth = { sub: "borda-device", role: "HARDWARE_DEVICE" }; 
        
        return next(); // Pula o muro de validação JWT e vai direto para a rota!
    }

    try {
        const isRevoked = await blacklistService.isBlacklisted(token);
        if (isRevoked) {
            console.warn("⚠️ Token está na blacklist");
            return next(new AppError("Sessão encerrada. Faça login novamente.", 401));
        }

        const payload = jwt.verify(token, getAccessSecret()) as JwtPayload;
        console.log("[ensureAuth] Payload JWT decodificado:", payload);
        (req as any).auth = payload;
        return next();
    } catch (error) {
        console.error("⚠️ Erro ao validar token:", error);
        return next(new AppError("Token invalido", 401));
    }
};