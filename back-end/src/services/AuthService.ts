import { Repository, DataSource } from "typeorm";
import { compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import { Usuario } from "../entities/Usuario.js"; 
import { AppError } from "../errors/AppError.js";
import { TokenBlacklistService } from "../services/TokenBlacklistService.js"

interface LoginMeta {
    ip: string;
    userAgent: string;
}
/**
 * @class AuthService
 * @description Serviço responsável por gerenciar a autenticação de usuários,
 * incluindo login, geração/validação de tokens JWT e logout.
 */
export class AuthService {
    private userRepo: Repository<Usuario>;
    private tokenBlacklistService: TokenBlacklistService;

    // O construtor recebe a conexão do banco de dados (DataSource) e inicializa
    // o repositório de usuários e o serviço de blacklist de tokens.
    constructor(dataSource: DataSource) {
        this.userRepo = dataSource.getRepository(Usuario);
        this.tokenBlacklistService = new TokenBlacklistService(dataSource);
    }

    /**
     * @method generateAccessToken
     * @description Gera um token de acesso JWT para o usuário.
     * Inclui informações como ID do usuário, email, cargo e matrícula.
     * @param user - O objeto de usuário.
     * @returns string - O token de acesso JWT.
     */
    private generateAccessToken(user: Usuario): string {
        return jwt.sign(
            {
                sub: user.id,
                email: user.email,
                cargo: user.cargo,
                matricula: user.matricula  
            },
            process.env.JWT_ACCESS_SECRET!,
            { expiresIn: "8h" }
        );
    }
   
    /**
     * @method generateRefreshToken
     * @description Gera um token de refresh JWT para o usuário.
     * @param user - O objeto de usuário.
     * @returns string - O token de refresh JWT.
     */
   
    private generateRefreshToken(user: Usuario): string {
        return jwt.sign(
            { sub: user.id },
            process.env.JWT_REFRESH_SECRET!,
            { expiresIn: "7d" }
        );
    }
    /**
     * @method login
     * @description Autentica um usuário com email e senha.
     * Se as credenciais forem válidas, gera e retorna tokens de acesso e refresh.
     * @param email - O email do usuário.
     * @param password - A senha do usuário.
     * @param meta - Metadados do login (IP, User-Agent).
     * @returns Promise<{ accessToken: string, refreshToken: string, usuario: Partial<Usuario> }>
     * @throws AppError se as credenciais forem inválidas.
     */
    async login(email: string, password: string, meta: LoginMeta) {
        // Normaliza o email para reduzir falhas por espaços e diferença de caixa.
        const normalizedEmail = email.trim().toLowerCase();
        // Busca o usuário. O select garante que a senha_hash venha na query
        const user = await this.userRepo.findOne({
            where: { email: normalizedEmail },
            select: ["id", "nome", "email", "senha_hash", "cargo", "matricula"] 
        });
        // Se o usuário não for encontrado, lança um erro de credenciais inválidas.
        if (!user) {
            throw new AppError("Credenciais inválidas", 401); 
        }
        // Compara a senha fornecida com o hash armazenado.
        const isPasswordValid = await compare(password, user.senha_hash);
        if (!isPasswordValid) {
            throw new AppError("Credenciais inválidas", 401);
        }
        // Gera os tokens de acesso e refresh.
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);
        // Retorna os tokens e informações básicas do usuário.
        return { 
            accessToken, 
            refreshToken, 
            usuario: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                cargo: user.cargo
            }
        };
    }
    /**
     * @method blacklistToken
     * @description Adiciona um token à blacklist se ele for válido e tiver uma data de expiração.
     * @param token - O token JWT a ser invalidado.
     * @returns Promise<void>
     */
    private async blacklistToken(token?: string): Promise<void> {
        if (!token) {
            return;
        }
        // Decodifica o token para obter a data de expiração.
        const decoded = jwt.decode(token) as { exp?: number } | null;
        if (!decoded?.exp) {
            return;
        }
        // Adiciona o token à blacklist.
        const expiresAt = new Date(decoded.exp * 1000);
        await this.tokenBlacklistService.add(token, expiresAt);
    }
    /**
     * @method logout
     * @description Invalida os tokens de acesso e refresh do usuário, adicionando-os à blacklist.
     * @param tokens - Objeto contendo os tokens de refresh e acesso.
     * @returns Promise<void>
     */
    async logout(tokens: { refreshToken?: string; accessToken?: string }) {
        try {
            await this.blacklistToken(tokens.refreshToken);
            await this.blacklistToken(tokens.accessToken);
        } catch (error){
            console.error("Erro ao processar logout no servidor:", error);
        }
    }
    /**
     * @method refresh
     * @description Renova o token de acesso usando um token de refresh válido.
     * @param refreshToken - O token de refresh.
     * @returns Promise<{ accessToken: string, refreshToken: string }>
     * @throws AppError se o token de refresh for inválido ou o usuário não for encontrado.
     */
    async refresh(refreshToken: string) {
        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
            const user = await this.userRepo.findOneBy({ id: decoded.sub as string });
            
            // Se o usuário não for encontrado, lança um erro.
            if (!user) 
                throw new AppError("Usuário não encontrado", 404);
            return{
                accessToken: this.generateAccessToken(user),
                refreshToken: this.generateRefreshToken(user)
            };
        } catch {
            throw new AppError("Token inválido", 401);
        }
    }
    /**
     * @method findAllUser
     * @description Busca todos os usuários, selecionando apenas informações públicas.
     * @returns Promise<Partial<Usuario>[]> - Uma lista de usuários.
     */
    async findAllUser() {
        return this.userRepo.find({
            select: ["id", "nome", "matricula", "email", "setor", "cargo", "criado_em"]
        });
    }
    /**
     * @method findUserById
     * @description Busca um usuário pelo ID, selecionando apenas informações públicas.
     * @param id - O ID do usuário.
     * @returns Promise<Partial<Usuario>> - O usuário encontrado.
     */
    async findUserById(id: string) {
        return this.userRepo.findOne({
            where: { id },
            select: ["id", "nome", "matricula", "email", "setor", "cargo", "criado_em"]
        });
    }
}