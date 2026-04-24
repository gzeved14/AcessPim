import { LessThan, DataSource, Repository } from "typeorm";
import { TokenBlacklist } from "../entities/TokenBlacklist.js";

export class TokenBlacklistService {
    private blacklistRepo: Repository<TokenBlacklist>;

    constructor(dataSource: DataSource) {
        this.blacklistRepo = dataSource.getRepository(TokenBlacklist);
    }

    async add(token: string, expiresAt: Date): Promise<void> {
        const blacklistEntry = this.blacklistRepo.create({ token, expires_at: expiresAt });
        await this.blacklistRepo.save(blacklistEntry);
    }

    async isBlacklisted(token: string): Promise<boolean> {
        const found = await this.blacklistRepo.findOneBy( { token  });
        return !!found;
    }   

    async clearExpiredTokens(): Promise<void>{
        await this.blacklistRepo.delete({
            expires_at: LessThan(new Date())
        } as any);
    }
}