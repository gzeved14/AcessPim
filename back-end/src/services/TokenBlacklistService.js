import { LessThan, DataSource, Repository } from "typeorm";
import { TokenBlacklist } from "../entities/TokenBlacklist.js";
export class TokenBlacklistService {
    blacklistRepo;
    constructor(dataSource) {
        this.blacklistRepo = dataSource.getRepository(TokenBlacklist);
    }
    async add(token, expiresAt) {
        const blacklistEntry = this.blacklistRepo.create({ token, expires_at: expiresAt });
        await this.blacklistRepo.save(blacklistEntry);
    }
    async isBlacklisted(token) {
        const found = await this.blacklistRepo.findOneBy({ token });
        return !!found;
    }
    async clearExpiredTokens() {
        await this.blacklistRepo.delete({
            expires_at: LessThan(new Date())
        });
    }
}
//# sourceMappingURL=TokenBlacklistService.js.map