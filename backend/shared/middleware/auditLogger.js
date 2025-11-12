"use strict";
/**
 * HIPAA-Compliant Audit Logging Middleware (T241)
 * Automatically logs all access to Protected Health Information (PHI)
 * Based on HIPAA Security Rule § 164.312(b) - Audit Controls
 *
 * Compliance Requirements:
 * - Log all CREATE, READ, UPDATE, DELETE operations on PHI
 * - Capture: user ID, timestamp, action, resource type, resource ID, IP address
 * - Immutable audit trail (append-only, never delete)
 * - Encrypt PII in audit logs
 * - Retain for 7 years (HIPAA requirement)
 *
 * Protected Resources:
 * - Patient medical records
 * - Prescriptions
 * - Teleconsultation sessions and notes
 * - Treatment plans
 * - Consultation notes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtectedResourceType = void 0;
exports.auditLog = auditLog;
exports.autoAuditLog = autoAuditLog;
exports.batchAuditLog = batchAuditLog;
exports.getAuditLogsForResource = getAuditLogsForResource;
exports.getAuditLogsForUser = getAuditLogsForUser;
exports.generateHIPAAAuditReport = generateHIPAAAuditReport;
const audit_1 = require("../utils/audit");
const AuditTrailEntry_1 = require("../models/AuditTrailEntry");
// ============================================================================
// Protected Resource Types (PHI)
// ============================================================================
/**
 * Resource types that contain Protected Health Information (PHI)
 * All operations on these resources MUST be audited per HIPAA requirements
 */
var ProtectedResourceType;
(function (ProtectedResourceType) {
    ProtectedResourceType["PATIENT_RECORD"] = "patient_medical_record";
    ProtectedResourceType["PRESCRIPTION"] = "prescription";
    ProtectedResourceType["PRESCRIPTION_ITEM"] = "prescription_item";
    ProtectedResourceType["TELECONSULTATION"] = "teleconsultation";
    ProtectedResourceType["CONSULTATION_NOTE"] = "consultation_note";
    ProtectedResourceType["TREATMENT_PLAN"] = "treatment_plan";
    ProtectedResourceType["PATIENT_PROFILE"] = "patient_profile";
    ProtectedResourceType["MEDICAL_HISTORY"] = "medical_history";
    ProtectedResourceType["ALLERGY_RECORD"] = "allergy_record";
    ProtectedResourceType["DIAGNOSIS"] = "diagnosis";
    ProtectedResourceType["LAB_RESULT"] = "lab_result";
})(ProtectedResourceType || (exports.ProtectedResourceType = ProtectedResourceType = {}));
/**
 * HTTP methods mapped to audit actions
 */
const HTTP_METHOD_TO_ACTION = {
    GET: AuditTrailEntry_1.AuditAction.READ,
    POST: AuditTrailEntry_1.AuditAction.CREATE,
    PUT: AuditTrailEntry_1.AuditAction.UPDATE,
    PATCH: AuditTrailEntry_1.AuditAction.UPDATE,
    DELETE: AuditTrailEntry_1.AuditAction.DELETE,
};
// ============================================================================
// Audit Logging Middleware Factory (T241)
// ============================================================================
/**
 * Create audit logging middleware for a specific resource type
 *
 * This middleware should be applied to ALL routes that access PHI.
 * It logs the request details to an immutable audit trail.
 *
 * Usage:
 * ```typescript
 * // Log all prescription access
 * router.get(
 *   '/prescriptions/:id',
 *   authenticateJWT,
 *   auditLog(dataSource, ProtectedResourceType.PRESCRIPTION),
 *   getPrescriptionHandler
 * );
 *
 * router.put(
 *   '/prescriptions/:id',
 *   authenticateJWT,
 *   auditLog(dataSource, ProtectedResourceType.PRESCRIPTION),
 *   updatePrescriptionHandler
 * );
 * ```
 *
 * @param dataSource TypeORM DataSource for database connection
 * @param resourceType Type of protected resource being accessed
 * @param options Optional configuration
 * @returns Express middleware function
 */
function auditLog(dataSource, resourceType, options) {
    const { resourceIdParam = 'id', eventTypePrefix = resourceType, captureRequestBody = false, captureResponseBody = false, } = options || {};
    return async (req, res, next) => {
        try {
            // Skip audit logging for unauthenticated requests (will fail auth later)
            if (!req.user) {
                next();
                return;
            }
            // Extract resource ID from request
            const resourceId = req.params[resourceIdParam] ||
                req.body?.id ||
                req.query?.id ||
                'unknown';
            // Determine action based on HTTP method
            const action = HTTP_METHOD_TO_ACTION[req.method] || AuditTrailEntry_1.AuditAction.READ;
            // Build event type (e.g., "prescription.read", "prescription.update")
            const eventType = `${eventTypePrefix}.${action}`;
            // Extract request context (IP, user agent, device info)
            const context = (0, audit_1.extractRequestContext)(req);
            // Capture original response.json to intercept response
            const originalJson = res.json;
            let responseData = null;
            if (captureResponseBody) {
                res.json = function (data) {
                    responseData = data;
                    return originalJson.call(this, data);
                };
            }
            // Log the audit event BEFORE processing the request
            // This ensures we log even if the request fails
            const auditPromise = (0, audit_1.logAuditEvent)(dataSource, {
                userId: req.user.userId,
                pharmacyId: req.user.pharmacyId || null,
                eventType,
                action,
                resourceType,
                resourceId,
                changes: captureRequestBody
                    ? (0, audit_1.createChangesObject)({}, req.body, Object.keys(req.body || {}))
                    : null,
                ipAddress: context.ipAddress,
                userAgent: context.userAgent,
                deviceInfo: context.deviceInfo,
            });
            // Don't wait for audit log to complete (async logging)
            // But log errors if they occur
            auditPromise.catch((error) => {
                console.error('Audit logging failed:', error, {
                    userId: req.user?.userId,
                    action,
                    resourceType,
                    resourceId,
                    path: req.path,
                });
                // Don't fail the request if audit logging fails
                // But in production, this should trigger an alert
            });
            // Continue processing the request
            next();
        }
        catch (error) {
            console.error('Audit middleware error:', error);
            // Don't fail the request if audit middleware has an error
            next();
        }
    };
}
// ============================================================================
// Automatic Audit Logging Middleware (T241)
// ============================================================================
/**
 * Automatic audit logging middleware
 * Detects PHI resources from URL path and automatically logs access
 *
 * This is a convenience middleware that can be applied globally.
 * It inspects the request path and automatically determines if it's a PHI resource.
 *
 * Usage:
 * ```typescript
 * app.use(autoAuditLog(dataSource));
 * ```
 *
 * Path patterns detected:
 * - /api/v1/prescriptions/:id → ProtectedResourceType.PRESCRIPTION
 * - /api/v1/patients/:id/records → ProtectedResourceType.PATIENT_RECORD
 * - /api/v1/teleconsultations/:id → ProtectedResourceType.TELECONSULTATION
 *
 * @param dataSource TypeORM DataSource
 * @returns Express middleware
 */
function autoAuditLog(dataSource) {
    // Map URL path patterns to resource types
    const pathPatterns = [
        {
            pattern: /\/api\/v\d+\/prescriptions\/([^/]+)/,
            resourceType: ProtectedResourceType.PRESCRIPTION,
            extractResourceId: (path) => {
                const match = path.match(/\/prescriptions\/([^/]+)/);
                return match ? match[1] : null;
            },
        },
        {
            pattern: /\/api\/v\d+\/patients\/([^/]+)\/records/,
            resourceType: ProtectedResourceType.PATIENT_RECORD,
            extractResourceId: (path) => {
                const match = path.match(/\/patients\/([^/]+)/);
                return match ? match[1] : null;
            },
        },
        {
            pattern: /\/api\/v\d+\/teleconsultations\/([^/]+)/,
            resourceType: ProtectedResourceType.TELECONSULTATION,
            extractResourceId: (path) => {
                const match = path.match(/\/teleconsultations\/([^/]+)/);
                return match ? match[1] : null;
            },
        },
        {
            pattern: /\/api\/v\d+\/consultation-notes\/([^/]+)/,
            resourceType: ProtectedResourceType.CONSULTATION_NOTE,
            extractResourceId: (path) => {
                const match = path.match(/\/consultation-notes\/([^/]+)/);
                return match ? match[1] : null;
            },
        },
        {
            pattern: /\/api\/v\d+\/treatment-plans\/([^/]+)/,
            resourceType: ProtectedResourceType.TREATMENT_PLAN,
            extractResourceId: (path) => {
                const match = path.match(/\/treatment-plans\/([^/]+)/);
                return match ? match[1] : null;
            },
        },
    ];
    return async (req, res, next) => {
        try {
            // Skip if not authenticated
            if (!req.user) {
                next();
                return;
            }
            const path = req.path;
            // Check if path matches any PHI resource pattern
            for (const { pattern, resourceType, extractResourceId } of pathPatterns) {
                if (pattern.test(path)) {
                    const resourceId = extractResourceId(path) || 'unknown';
                    const action = HTTP_METHOD_TO_ACTION[req.method] || AuditTrailEntry_1.AuditAction.READ;
                    const eventType = `${resourceType}.${action}`;
                    const context = (0, audit_1.extractRequestContext)(req);
                    // Log audit event asynchronously
                    (0, audit_1.logAuditEvent)(dataSource, {
                        userId: req.user.userId,
                        pharmacyId: req.user.pharmacyId || null,
                        eventType,
                        action,
                        resourceType,
                        resourceId,
                        changes: null,
                        ipAddress: context.ipAddress,
                        userAgent: context.userAgent,
                        deviceInfo: context.deviceInfo,
                    }).catch((error) => {
                        console.error('Auto audit logging failed:', error);
                    });
                    // Only log once per request
                    break;
                }
            }
            next();
        }
        catch (error) {
            console.error('Auto audit middleware error:', error);
            next();
        }
    };
}
// ============================================================================
// Batch Audit Logging
// ============================================================================
/**
 * Log multiple audit events in a batch
 * Useful for bulk operations (e.g., bulk prescription approval)
 *
 * @param dataSource TypeORM DataSource
 * @param req Express request
 * @param resourceType Resource type
 * @param resourceIds Array of resource IDs
 * @param action Audit action
 */
async function batchAuditLog(dataSource, req, resourceType, resourceIds, action) {
    if (!req.user) {
        throw new Error('Cannot log audit event for unauthenticated request');
    }
    const context = (0, audit_1.extractRequestContext)(req);
    const eventType = `${resourceType}.${action}.batch`;
    const promises = resourceIds.map((resourceId) => (0, audit_1.logAuditEvent)(dataSource, {
        userId: req.user.userId,
        pharmacyId: req.user.pharmacyId || null,
        eventType,
        action,
        resourceType,
        resourceId,
        changes: null,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        deviceInfo: context.deviceInfo,
    }));
    await Promise.all(promises);
}
// ============================================================================
// Audit Log Query Helpers
// ============================================================================
/**
 * Query audit logs for a specific resource
 * Useful for compliance reporting and security investigations
 *
 * @param dataSource TypeORM DataSource
 * @param resourceType Resource type
 * @param resourceId Resource ID
 * @param options Query options
 * @returns Array of audit trail entries
 */
async function getAuditLogsForResource(dataSource, resourceType, resourceId, options) {
    const { limit = 100, offset = 0, startDate, endDate, action, userId } = options || {};
    const queryBuilder = dataSource
        .getRepository('AuditTrailEntry')
        .createQueryBuilder('audit')
        .where('audit.resource_type = :resourceType', { resourceType })
        .andWhere('audit.resource_id = :resourceId', { resourceId })
        .orderBy('audit.created_at', 'DESC')
        .limit(limit)
        .offset(offset);
    if (startDate) {
        queryBuilder.andWhere('audit.created_at >= :startDate', { startDate });
    }
    if (endDate) {
        queryBuilder.andWhere('audit.created_at <= :endDate', { endDate });
    }
    if (action) {
        queryBuilder.andWhere('audit.action = :action', { action });
    }
    if (userId) {
        queryBuilder.andWhere('audit.user_id = :userId', { userId });
    }
    return queryBuilder.getMany();
}
/**
 * Get audit logs for a user
 * Useful for tracking user activity
 *
 * @param dataSource TypeORM DataSource
 * @param userId User ID
 * @param options Query options
 * @returns Array of audit trail entries
 */
async function getAuditLogsForUser(dataSource, userId, options) {
    const { limit = 100, offset = 0, startDate, endDate, resourceType } = options || {};
    const queryBuilder = dataSource
        .getRepository('AuditTrailEntry')
        .createQueryBuilder('audit')
        .where('audit.user_id = :userId', { userId })
        .orderBy('audit.created_at', 'DESC')
        .limit(limit)
        .offset(offset);
    if (startDate) {
        queryBuilder.andWhere('audit.created_at >= :startDate', { startDate });
    }
    if (endDate) {
        queryBuilder.andWhere('audit.created_at <= :endDate', { endDate });
    }
    if (resourceType) {
        queryBuilder.andWhere('audit.resource_type = :resourceType', { resourceType });
    }
    return queryBuilder.getMany();
}
// ============================================================================
// HIPAA Compliance Reporting
// ============================================================================
/**
 * Generate HIPAA audit report
 * Useful for compliance audits
 *
 * @param dataSource TypeORM DataSource
 * @param startDate Report start date
 * @param endDate Report end date
 * @returns Audit summary statistics
 */
async function generateHIPAAAuditReport(dataSource, startDate, endDate) {
    const result = await dataSource
        .getRepository('AuditTrailEntry')
        .createQueryBuilder('audit')
        .select('audit.resource_type', 'resourceType')
        .addSelect('audit.action', 'action')
        .addSelect('COUNT(*)', 'count')
        .where('audit.created_at >= :startDate', { startDate })
        .andWhere('audit.created_at <= :endDate', { endDate })
        .groupBy('audit.resource_type')
        .addGroupBy('audit.action')
        .getRawMany();
    return {
        period: {
            start: startDate,
            end: endDate,
        },
        summary: result,
        totalEvents: result.reduce((sum, r) => sum + parseInt(r.count, 10), 0),
    };
}
//# sourceMappingURL=auditLogger.js.map