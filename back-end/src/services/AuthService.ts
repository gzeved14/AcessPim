import { Repository, DataSource } from "typeorm";
import { compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import { Usuario } from "../entities/Usuario.js"; 
import { AppError } from "../errors/AppError.js";


interface LoginMeta {
    ip: string;
    userAgent: string;
}

export class AuthService {
    private userRepo: Repository<Usuario>;

    constructor(dataSource: DataSource) {
        this.userRepo = dataSource.getRepository(Usuario);
    }

    private gerarAccessToken(usuario: Usuario): string {
        return jwt.sign(
            { 
                sub: usuario.id, 
                email: usuario.email, 
                cargo: usuario.cargo 
            },
            process.env.JWT_ACCESS_SECRET!,
            { expiresIn: "8h" } //
        );
    }

    /**
     * Gera um Refresh Token com validade extendida (ex: 7 dias).
     */
    private gerarRefreshToken(usuario: Usuario): string {
        return jwt.sign(
            { sub: usuario.id },
            process.env.JWT_REFRESH_SECRET!,
            { expiresIn: "7d" }
        );
    }

    /**
     * Lógica de Login: valida credenciais e gera tokens.
     */
    async login(email: string, senha: string, meta: LoginMeta) {
        // Busca o usuário. O select garante que a senha_hash venha na query
        const usuario = await this.userRepo.findOne({
            where: { email },
            select: ["id", "nome", "email", "senha_hash", "cargo"] 
        });

        if (!usuario) {
            throw new AppError("Credenciais inválidas", 401); //
        }

        // RNF 02: Comparação de hash segura
        const senhaCorreta = await compare(senha, usuario.senha_hash);
        if (!senhaCorreta) {
            throw new AppError("Credenciais inválidas", 401);
        }

        console.log(`Usuário ${usuario.email} logado do IP: ${meta.ip} usando ${meta.userAgent}`);
        
        const accessToken = this.gerarAccessToken(usuario);
        const refreshToken = this.gerarRefreshToken(usuario);

        return { 
            accessToken, 
            refreshToken, 
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                cargo: usuario.cargo
            }
        };
    }

    /**
     * Invalidação de Refresh Token (Logout)
     * No MVP básico, o logout limpa o token no frontend. 
     * Para trios, pode-se implementar blacklist no banco.
     */
    async logout(refreshToken: string) {
        if (!refreshToken) {
        return;
        }
        try {
            jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
            console.log("Sessão encerada com sicesso.");
        } catch (error){
            console.error("Erro ao processar logout no servidor:", error);
        }
    }

    async refresh(refreshToken: string) {
        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
            const usuario = await this.userRepo.findOneBy({ id: decoded.sub as string });
            
            if (!usuario) 
                throw new AppError("Usuário não encontrado", 404);
            return{
                accessToken: this.gerarAccessToken(usuario),
                refreshToken: this.gerarRefreshToken(usuario)

            };
        } catch {
            throw new AppError("Token inválido", 401);
        }
    }
}