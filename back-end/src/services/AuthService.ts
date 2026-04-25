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

export class AuthService {
    private userRepo: Repository<Usuario>;
    private tokenBlacklistService: TokenBlacklistService;

    constructor(dataSource: DataSource) {
        this.userRepo = dataSource.getRepository(Usuario);
        this.tokenBlacklistService = new TokenBlacklistService(dataSource);
    }

    private generateAccessToken(user: Usuario): string {
        return jwt.sign(
            { 
                sub: user.id, 
                email: user.email, 
                cargo: user.cargo 
            },
            process.env.JWT_ACCESS_SECRET!,
            { expiresIn: "8h" } //
        );
    }

   
    private generateRefreshToken(user: Usuario): string {
        return jwt.sign(
            { sub: user.id },
            process.env.JWT_REFRESH_SECRET!,
            { expiresIn: "7d" }
        );
    }


    async login(email: string, password: string, meta: LoginMeta) {
        // Busca o usuário. O select garante que a senha_hash venha na query
        const user = await this.userRepo.findOne({
            where: { email },
            select: ["id", "nome", "email", "senha_hash", "cargo"] 
        });

        if (!user) {
            throw new AppError("Credenciais inválidas", 401); 
        }

        const isPasswordValid = await compare(password, user.senha_hash);
        if (!isPasswordValid) {
            throw new AppError("Credenciais inválidas", 401);
        }

        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);

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

    private async blacklistToken(token?: string): Promise<void> {
        if (!token) {
            return;
        }

        const decoded = jwt.decode(token) as { exp?: number } | null;
        if (!decoded?.exp) {
            return;
        }

        const expiresAt = new Date(decoded.exp * 1000);
        await this.tokenBlacklistService.add(token, expiresAt);
    }

    async logout(tokens: { refreshToken?: string; accessToken?: string }) {
        try {
            await this.blacklistToken(tokens.refreshToken);
            await this.blacklistToken(tokens.accessToken);
        } catch (error){
            console.error("Erro ao processar logout no servidor:", error);
        }
    }

    async refresh(refreshToken: string) {
        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
            const user = await this.userRepo.findOneBy({ id: decoded.sub as string });
            
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

    async findAllUser() {
        return this.userRepo.find({
            select: ["id", "nome", "matricula", "email", "setor", "cargo", "criado_em"]
        });
    }

    async findUserById(id: string) {
        return this.userRepo.findOne({
            where: { id },
            select: ["id", "nome", "matricula", "email", "setor", "cargo", "criado_em"]
        });
    }
}