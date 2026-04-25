import { DataSource } from "typeorm";
import { Usuario } from "../entities/Usuario.js";
interface LoginMeta {
    ip: string;
    userAgent: string;
}
export declare class AuthService {
    private userRepo;
    private tokenBlacklistService;
    constructor(dataSource: DataSource);
    private generateAccessToken;
    private generateRefreshToken;
    login(email: string, password: string, meta: LoginMeta): Promise<{
        accessToken: string;
        refreshToken: string;
        usuario: {
            id: string;
            nome: string;
            email: string;
            cargo: import("../types/Cargo.js").Cargo;
        };
    }>;
    private blacklistToken;
    logout(tokens: {
        refreshToken?: string;
        accessToken?: string;
    }): Promise<void>;
    refresh(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    findAllUser(): Promise<Usuario[]>;
    findUserById(id: string): Promise<Usuario | null>;
}
export {};
//# sourceMappingURL=AuthService.d.ts.map