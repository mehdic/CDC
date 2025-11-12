"use strict";
/**
 * Audit Trail Logging Utility
 * Provides immutable audit logging for compliance (HIPAA, GDPR, Swiss regulations)
 * Based on: /specs/002-metapharm-platform/data-model.md
 *
 * IMPORTANT: All audit logs are immutable (append-only). No UPDATE or DELETE operations allowed.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractRequestContext = extractRequestContext;
exports.parseDeviceInfo = parseDeviceInfo;
exports.logAuditEvent = logAuditEvent;
exports.logAuditEventFromRequest = logAuditEventFromRequest;
exports.createChangesObject = createChangesObject;
const AuditTrailEntry_1 = require("../models/AuditTrailEntry");
/**
 * Extract request context (IP address, user agent, device info) from Express request
 *
 * @param req Express request object
 * @returns Object with ipAddress, userAgent, and deviceInfo
 */
function extractRequestContext(req) {
    // Extract IP address (handle X-Forwarded-For for proxies)
    const ipAddress = (req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.headers['x-real-ip'] ||
        req.socket.remoteAddress ||
        null);
    // Extract User-Agent header
    const userAgent = req.headers['user-agent'] || null;
    // Parse device information from User-Agent
    const deviceInfo = parseDeviceInfo(userAgent);
    return {
        ipAddress,
        userAgent,
        deviceInfo,
    };
}
/**
 * Parse device information from User-Agent string
 *
 * @param userAgent User-Agent header string
 * @returns DeviceInfo object with os, browser, platform, etc.
 */
function parseDeviceInfo(userAgent) {
    if (!userAgent)
        return null;
    const deviceInfo = {};
    // Detect OS
    if (/windows/i.test(userAgent)) {
        deviceInfo.os = 'Windows';
    }
    else if (/macintosh|mac os x/i.test(userAgent)) {
        deviceInfo.os = 'macOS';
    }
    else if (/linux/i.test(userAgent)) {
        deviceInfo.os = 'Linux';
    }
    else if (/android/i.test(userAgent)) {
        deviceInfo.os = 'Android';
    }
    else if (/iphone|ipad|ipod/i.test(userAgent)) {
        deviceInfo.os = 'iOS';
    }
    // Detect Browser
    if (/edg/i.test(userAgent)) {
        deviceInfo.browser = 'Edge';
    }
    else if (/chrome/i.test(userAgent)) {
        deviceInfo.browser = 'Chrome';
    }
    else if (/firefox/i.test(userAgent)) {
        deviceInfo.browser = 'Firefox';
    }
    else if (/safari/i.test(userAgent)) {
        deviceInfo.browser = 'Safari';
    }
    // Detect Platform (mobile vs. desktop)
    if (/mobile|android|iphone|ipad|ipod/i.test(userAgent)) {
        deviceInfo.platform = 'mobile';
    }
    else if (/tablet|ipad/i.test(userAgent)) {
        deviceInfo.platform = 'tablet';
    }
    else {
        deviceInfo.platform = 'desktop';
    }
    // Extract app version if present (e.g., "MetaPharmApp/1.2.3")
    const appVersionMatch = userAgent.match(/MetaPharmApp\/(\d+\.\d+\.\d+)/);
    if (appVersionMatch) {
        deviceInfo.app_version = appVersionMatch[1];
    }
    return deviceInfo;
}
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
async function logAuditEvent(dataSource, params) {
    // Validate required parameters
    if (!params.userId) {
        throw new Error('Audit event requires userId');
    }
    if (!params.eventType) {
        throw new Error('Audit event requires eventType');
    }
    if (!params.action) {
        throw new Error('Audit event requires action');
    }
    if (!params.resourceType) {
        throw new Error('Audit event requires resourceType');
    }
    if (!params.resourceId) {
        throw new Error('Audit event requires resourceId');
    }
    // Create audit entry using factory method
    const auditEntry = AuditTrailEntry_1.AuditTrailEntry.create({
        userId: params.userId,
        pharmacyId: params.pharmacyId || null,
        eventType: params.eventType,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        changes: params.changes || null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        deviceInfo: params.deviceInfo || null,
    });
    // Get repository and save (INSERT only - no UPDATE allowed)
    const auditRepository = dataSource.getRepository(AuditTrailEntry_1.AuditTrailEntry);
    const savedEntry = await auditRepository.save(auditEntry);
    return savedEntry;
}
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
async function logAuditEventFromRequest(dataSource, req, params) {
    // Extract request context
    const { ipAddress, userAgent, deviceInfo } = extractRequestContext(req);
    // Log audit event with extracted context
    return logAuditEvent(dataSource, {
        ...params,
        ipAddress,
        userAgent,
        deviceInfo,
    });
}
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
function createChangesObject(oldRecord, newRecord, fields) {
    const changes = {};
    let hasChanges = false;
    for (const field of fields) {
        const oldValue = oldRecord[field];
        const newValue = newRecord[field];
        // Only include if value actually changed
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changes[field] = {
                old: oldValue,
                new: newValue,
            };
            hasChanges = true;
        }
    }
    return hasChanges ? changes : null;
}
//# sourceMappingURL=audit.js.map