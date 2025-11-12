/**
 * Audit Trail Logging Utility
 * Provides immutable audit logging for compliance (HIPAA, GDPR, Swiss regulations)
 * Based on: /specs/002-metapharm-platform/data-model.md
 *
 * IMPORTANT: All audit logs are immutable (append-only). No UPDATE or DELETE operations allowed.
 */
import { DataSource } from 'typeorm';
import { AuditTrailEntry, AuditAction, AuditChanges, DeviceInfo } from '../models/AuditTrailEntry';
import { Request } from 'express';
/**
 * Parameters for logging an audit event
 */
export interface LogAuditEventParams {
    /**
     * User ID performing the action (required)
     */
    userId: string;
    /**
     * Pharmacy ID for multi-tenant isolation (optional - null for global events)
     */
    pharmacyId?: string | null;
    /**
     * Event type (e.g., "prescription.approved", "record.accessed", "delivery.confirmed")
     */
    eventType: string;
    /**
     * CRUD action performed
     */
    action: AuditAction;
    /**
     * Resource type (e.g., "prescription", "patient_medical_record", "inventory_item")
     */
    resourceType: string;
    /**
     * Resource ID (UUID of the affected resource)
     */
    resourceId: string;
    /**
     * Field-level changes for UPDATE actions (optional)
     * Format: { field_name: { old: previous_value, new: new_value } }
     */
    changes?: AuditChanges | null;
    /**
     * IP address of the request (optional)
     */
    ipAddress?: string | null;
    /**
     * User agent string from request (optional)
     */
    userAgent?: string | null;
    /**
     * Parsed device information (optional)
     */
    deviceInfo?: DeviceInfo | null;
}
/**
 * Extract request context (IP address, user agent, device info) from Express request
 *
 * @param req Express request object
 * @returns Object with ipAddress, userAgent, and deviceInfo
 */
export declare function extractRequestContext(req: Request): {
    ipAddress: string | null;
    userAgent: string | null;
    deviceInfo: DeviceInfo | null;
};
/**
 * Parse device information from User-Agent string
 *
 * @param userAgent User-Agent header string
 * @returns DeviceInfo object with os, browser, platform, etc.
 */
export declare function parseDeviceInfo(userAgent: string | null): DeviceInfo | null;
/**
 * Log an audit event to the immutable audit trail
 *
 * This function creates an AuditTrailEntry record in the database.
 * All audit entries are immutable (append-only) and cannot be updated or deleted.
 *
 * @param dataSource TypeORM DataSource for database connection
 * @param params Audit event parameters
 * @returns Promise<AuditTrailEntry> The created audit entry
 *
 * @example
 * ```typescript
 * // Log a prescription approval
 * await logAuditEvent(dataSource, {
 *   userId: '123e4567-e89b-12d3-a456-426614174000',
 *   pharmacyId: '987fcdeb-51a2-43d7-a456-426614174111',
 *   eventType: 'prescription.approved',
 *   action: AuditAction.UPDATE,
 *   resourceType: 'prescription',
 *   resourceId: 'abc12345-e89b-12d3-a456-426614174222',
 *   changes: {
 *     status: { old: 'in_review', new: 'approved' }
 *   },
 *   ipAddress: '192.168.1.100',
 *   userAgent: 'Mozilla/5.0...',
 *   deviceInfo: { os: 'iOS', browser: 'Safari', platform: 'mobile' }
 * });
 * ```
 */
export declare function logAuditEvent(dataSource: DataSource, params: LogAuditEventParams): Promise<AuditTrailEntry>;
/**
 * Log an audit event from an Express request
 *
 * Convenience function that extracts request context automatically.
 *
 * @param dataSource TypeORM DataSource for database connection
 * @param req Express request object
 * @param params Audit event parameters (without IP/User-Agent - extracted from req)
 * @returns Promise<AuditTrailEntry> The created audit entry
 *
 * @example
 * ```typescript
 * // In an Express route handler
 * app.put('/prescriptions/:id/approve', async (req, res) => {
 *   // ... approval logic ...
 *
 *   await logAuditEventFromRequest(dataSource, req, {
 *     userId: req.user.id,
 *     pharmacyId: req.user.pharmacyId,
 *     eventType: 'prescription.approved',
 *     action: AuditAction.UPDATE,
 *     resourceType: 'prescription',
 *     resourceId: req.params.id,
 *     changes: {
 *       status: { old: 'in_review', new: 'approved' }
 *     }
 *   });
 * });
 * ```
 */
export declare function logAuditEventFromRequest(dataSource: DataSource, req: Request, params: Omit<LogAuditEventParams, 'ipAddress' | 'userAgent' | 'deviceInfo'>): Promise<AuditTrailEntry>;
/**
 * Helper function to create changes object for UPDATE actions
 *
 * Compares old and new values for specified fields and returns AuditChanges object.
 * Only includes fields that actually changed.
 *
 * @param oldRecord Original record before update
 * @param newRecord Updated record after update
 * @param fields Array of field names to track
 * @returns AuditChanges object with field-level changes
 *
 * @example
 * ```typescript
 * const changes = createChangesObject(
 *   { status: 'pending', approved_at: null },
 *   { status: 'approved', approved_at: new Date() },
 *   ['status', 'approved_at']
 * );
 * // Returns: { status: { old: 'pending', new: 'approved' }, approved_at: { old: null, new: '2025-11-07T...' } }
 * ```
 */
export declare function createChangesObject(oldRecord: Record<string, any>, newRecord: Record<string, any>, fields: string[]): AuditChanges | null;
//# sourceMappingURL=audit.d.ts.map