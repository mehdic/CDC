import { DataSource } from 'typeorm';
import { AuditTrailEntry, AuditAction, AuditChanges, DeviceInfo } from '../models/AuditTrailEntry';
import { Request } from 'express';
export interface LogAuditEventParams {
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
}
export declare function extractRequestContext(req: Request): {
    ipAddress: string | null;
    userAgent: string | null;
    deviceInfo: DeviceInfo | null;
};
export declare function parseDeviceInfo(userAgent: string | null): DeviceInfo | null;
export declare function logAuditEvent(dataSource: DataSource, params: LogAuditEventParams): Promise<AuditTrailEntry>;
export declare function logAuditEventFromRequest(dataSource: DataSource, req: Request, params: Omit<LogAuditEventParams, 'ipAddress' | 'userAgent' | 'deviceInfo'>): Promise<AuditTrailEntry>;
export declare function createChangesObject(oldRecord: Record<string, any>, newRecord: Record<string, any>, fields: string[]): AuditChanges | null;
//# sourceMappingURL=audit.d.ts.map