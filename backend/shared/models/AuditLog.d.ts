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
    isSecurityEvent(): boolean;
    getActionDescription(): string;
}
//# sourceMappingURL=AuditLog.d.ts.map