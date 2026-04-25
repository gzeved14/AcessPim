const sanitizeUser = (user) => {
    if (!user || typeof user !== "object")
        return user;
    const { senha_hash, ...rest } = user;
    return rest;
};
export default class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async login(req, res) {
        // Captura metadados conforme sua lógica anterior (opcional, mas boa prática)
        const meta = {
            ip: req.ip || "0.0.0.0",
            userAgent: String(req.headers["user-agent"] || "unknown")
        };
        const result = await this.authService.login(req.body.email, req.body.password, meta);
        return res.status(200).json({
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            user: sanitizeUser(result.usuario)
        });
    }
    async refresh(req, res) {
        const result = await this.authService.refresh(req.body.refreshToken);
        return res.status(200).json(result);
    }
    async logout(req, res) {
        const authHeader = req.headers.authorization; //busca o campo authorization no header
        const accessToken = authHeader?.startsWith("Bearer ") //verifica se a string começa com Bearer || a ? verifica se o valor de authHeader não é nulo ou se authHeader existe
            ? authHeader.slice(7).trim() // se sim, ele remove e pega apenas a string do Token || aqui ? serve como condição se for verdade 
            : undefined; // caso não comece com Bearer, a variável accessToken receberá o valor undefined || aqui : serve como condição se for falso
        const tokens = {
            refreshToken: req.body.refreshToken
        };
        if (accessToken) {
            tokens.accessToken = accessToken;
        }
        await this.authService.logout(tokens);
        return res.status(204).send();
    }
}
//# sourceMappingURL=AuthController.js.map