"use strict";
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
const HTTP_METHOD_TO_ACTION = {
    GET: AuditTrailEntry_1.AuditAction.READ,
    POST: AuditTrailEntry_1.AuditAction.CREATE,
    PUT: AuditTrailEntry_1.AuditAction.UPDATE,
    PATCH: AuditTrailEntry_1.AuditAction.UPDATE,
    DELETE: AuditTrailEntry_1.AuditAction.DELETE,
};
function auditLog(dataSource, resourceType, options) {
    const { resourceIdParam = 'id', eventTypePrefix = resourceType, captureRequestBody = false, captureResponseBody = false, } = options || {};
    return async (req, res, next) => {
        try {
            if (!req.user) {
                next();
                return;
            }
            const resourceId = req.params[resourceIdParam] ||
                req.body?.id ||
                req.query?.id ||
                'unknown';
            const action = HTTP_METHOD_TO_ACTION[req.method] || AuditTrailEntry_1.AuditAction.READ;
            const eventType = `${eventTypePrefix}.${action}`;
            const context = (0, audit_1.extractRequestContext)(req);
            const originalJson = res.json;
            let responseData = null;
            if (captureResponseBody) {
                res.json = function (data) {
                    responseData = data;
                    return originalJson.call(this, data);
                };
            }
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
            auditPromise.catch((error) => {
                console.error('Audit logging failed:', error, {
                    userId: req.user?.userId,
                    action,
                    resourceType,
                    resourceId,
                    path: req.path,
                });
            });
            next();
        }
        catch (error) {
            console.error('Audit middleware error:', error);
            next();
        }
    };
}
function autoAuditLog(dataSource) {
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
            if (!req.user) {
                next();
                return;
            }
            const path = req.path;
            for (const { pattern, resourceType, extractResourceId } of pathPatterns) {
                if (pattern.test(path)) {
                    const resourceId = extractResourceId(path) || 'unknown';
                    const action = HTTP_METHOD_TO_ACTION[req.method] || AuditTrailEntry_1.AuditAction.READ;
                    const eventType = `${resourceType}.${action}`;
                    const context = (0, audit_1.extractRequestContext)(req);
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