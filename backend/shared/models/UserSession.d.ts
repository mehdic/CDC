import { User } from './User';
export declare class UserSession {
    id: string;
    user_id: string;
    user: User;
    token: string;
    expires_at: Date;
    is_active: boolean;
    ip_address: string | null;
    user_agent: string | null;
    created_at: Date;
    last_activity_at: Date;
    isExpired(): boolean;
    isValid(): boolean;
    deactivate(): void;
    updateActivity(): void;
    getDuration(): number;
    getDeviceInfo(): {
        browser: string;
        os: string;
    };
}
//# sourceMappingURL=UserSession.d.ts.map