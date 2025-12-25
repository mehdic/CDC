/**
 * AuditTrailEntry Entity
 * Immutable audit logs for compliance (HIPAA, GDPR, Swiss regulations)
 * Based on: /specs/002-metapharm-platform/data-model.md
 *
 * IMPORTANT: This is an append-only table. No UPDATE or DELETE operations allowed.
 */
import { User } from './User';
import { Pharmacy } from './Pharmacy';
export declare enum AuditAction {
    CREATE = "create",
    READ = "read",
    UPDATE = "update",
    DELETE = "delete"
}
export interface AuditChanges {
    [field: string]: {
        old: any;
        new: any;
    };
}
export interface DeviceInfo {
    os?: string;
    browser?: string;
    app_version?: string;
    device_model?: string;
    platform?: string;
}
export declare class AuditTrailEntry {
    id: string;
    pharmacy_id: string | null;
    pharmacy: Pharmacy | null;
    user_id: string;
    user: User;
    event_type: string;
    action: AuditAction;
    resource_type: string;
    resource_id: string;
    changes: AuditChanges | null;
    ip_address: string | null;
    user_agent: string | null;
    device_info: DeviceInfo | null;
    created_at: Date;
    /**
     * Check if this is an UPDATE action with changes
     */
    hasChanges(): boolean;
    /**
     * Get list of changed fields
     */
    getChangedFields(): string[];
    /**
     * Get old value for a specific field
     */
    getOldValue(field: string): any;
    /**
     * Get new value for a specific field
     */
    getNewValue(field: string): any;
    /**
     * Check if entry is from a specific pharmacy
     */
    isFromPharmacy(pharmacyId: string): boolean;
    /**
     * Check if entry is a global event (no pharmacy context)
     */
    isGlobalEvent(): boolean;
    /**
     * Get formatted event description
     */
    getEventDescription(): string;
    /**
     * Get device platform from device_info
     */
    getDevicePlatform(): string | null;
    /**
     * Get browser from device_info
     */
    getBrowser(): string | null;
    /**
     * Static factory method for creating audit entries
     * (Use this instead of direct instantiation for consistency)
     */
    static create(params: {
        userId: string;
        pharmacyId?: string | null;
        eventType: string;
        action: AuditAction;
        resourceType: string;
        resourceId: string;
        changes?: AuditChanges | null;
        ipAddress?: string | null;
        userAgent?: string | null;
        deviceInfo?: DeviceInfo | null;
    }): AuditTrailEntry;
}
//# sourceMappingURL=AuditTrailEntry.d.ts.map