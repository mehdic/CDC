/**
 * AuditLog Entity
 * Tracks user actions for master account management
 * Separate from AuditTrailEntry (used for prescription/pharmacy audits)
 */
import { User } from './User';
export declare class AuditLog {
    id: string;
    user_id: string;
    user: User;
    action: string;
    resource: string | null;
    resource_id: string | null;
    details: any;
    ip_address: string | null;
    user_agent: string | null;
    created_at: Date;
    /**
     * Check if action is a security-related event
     */
    isSecurityEvent(): boolean;
    /**
     * Get human-readable action description
     */
    getActionDescription(): string;
}
//# sourceMappingURL=AuditLog.d.ts.map