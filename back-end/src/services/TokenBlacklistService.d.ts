import { DataSource } from "typeorm";
export declare class TokenBlacklistService {
    private blacklistRepo;
    constructor(dataSource: DataSource);
    add(token: string, expiresAt: Date): Promise<void>;
    isBlacklisted(token: string): Promise<boolean>;
    clearExpiredTokens(): Promise<void>;
}
//# sourceMappingURL=TokenBlacklistService.d.ts.map