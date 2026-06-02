import { LessThan, DataSource, Repository } from "typeorm";
import { TokenBlacklist } from "../entities/TokenBlacklist.js";

/**
 * @class TokenBlacklistService
 * @description Serviço responsável por gerenciar a lista de tokens JWT inválidos (blacklist).
 * Utilizado para garantir que tokens de acesso e refresh sejam invalidados após logout ou expiração.
 */
export class TokenBlacklistService {
    private blacklistRepo: Repository<TokenBlacklist>;

    // O construtor recebe a conexão do banco de dados (DataSource) e inicializa o repositório.
    constructor(dataSource: DataSource) {
        this.blacklistRepo = dataSource.getRepository(TokenBlacklist);
    }

    /**
     * @method add
     * @description Adiciona um token à blacklist com sua data de expiração.
     * @param token - O token JWT a ser adicionado.
     * @param expiresAt - A data de expiração do token.
     * @returns Promise<void>
     */
    async add(token: string, expiresAt: Date): Promise<void> {
        const blacklistEntry = this.blacklistRepo.create({ token, expires_at: expiresAt });
        await this.blacklistRepo.save(blacklistEntry);
    }

    /**
     * @method isBlacklisted
     * @description Verifica se um token está presente na blacklist.
     * @param token - O token JWT a ser verificado.
     * @returns Promise<boolean> - True se o token estiver na blacklist, false caso contrário.
     */
    async isBlacklisted(token: string): Promise<boolean> {
        const found = await this.blacklistRepo.findOneBy( { token  });
        return !!found;
    }   

    /**
     * @method clearExpiredTokens
     * @description Remove todos os tokens expirados da blacklist.
     * Esta função deve ser executada periodicamente para manter a blacklist limpa.
     * @returns Promise<void>
     */
    async clearExpiredTokens(): Promise<void>{
        await this.blacklistRepo.delete({
            expires_at: LessThan(new Date())
        } as any);
    }
}