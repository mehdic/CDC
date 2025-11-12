/**
 * UserSession Entity
 * Tracks active user sessions for session management and security
 */
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
    /**
     * Check if session is expired
     */
    isExpired(): boolean;
    /**
     * Check if session is valid (active and not expired)
     */
    isValid(): boolean;
    /**
     * Deactivate session (logout)
     */
    deactivate(): void;
    /**
     * Update last activity timestamp
     */
    updateActivity(): void;
    /**
     * Get session duration in seconds
     */
    getDuration(): number;
    /**
     * Get device/browser info from user agent
     */
    getDeviceInfo(): {
        browser: string;
        os: string;
    };
}
//# sourceMappingURL=UserSession.d.ts.map