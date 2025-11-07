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
    _resourceIndex?: void;
    changes: AuditChanges | null;
    ip_address: string | null;
    user_agent: string | null;
    device_info: DeviceInfo | null;
    created_at: Date;
    hasChanges(): boolean;
    getChangedFields(): string[];
    getOldValue(field: string): any;
    getNewValue(field: string): any;
    isFromPharmacy(pharmacyId: string): boolean;
    isGlobalEvent(): boolean;
    getEventDescription(): string;
    getDevicePlatform(): string | null;
    getBrowser(): string | null;
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