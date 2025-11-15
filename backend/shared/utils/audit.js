"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractRequestContext = extractRequestContext;
exports.parseDeviceInfo = parseDeviceInfo;
exports.logAuditEvent = logAuditEvent;
exports.logAuditEventFromRequest = logAuditEventFromRequest;
exports.createChangesObject = createChangesObject;
const AuditTrailEntry_1 = require("../models/AuditTrailEntry");
function extractRequestContext(req) {
    const ipAddress = (req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.headers['x-real-ip'] ||
        req.socket.remoteAddress ||
        null);
    const userAgent = req.headers['user-agent'] || null;
    const deviceInfo = parseDeviceInfo(userAgent);
    return {
        ipAddress,
        userAgent,
        deviceInfo,
    };
}
function parseDeviceInfo(userAgent) {
    if (!userAgent)
        return null;
    const deviceInfo = {};
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
    if (/mobile|android|iphone|ipad|ipod/i.test(userAgent)) {
        deviceInfo.platform = 'mobile';
    }
    else if (/tablet|ipad/i.test(userAgent)) {
        deviceInfo.platform = 'tablet';
    }
    else {
        deviceInfo.platform = 'desktop';
    }
    const appVersionMatch = userAgent.match(/MetaPharmApp\/(\d+\.\d+\.\d+)/);
    if (appVersionMatch) {
        deviceInfo.app_version = appVersionMatch[1];
    }
    return deviceInfo;
}
async function logAuditEvent(dataSource, params) {
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
    const auditRepository = dataSource.getRepository(AuditTrailEntry_1.AuditTrailEntry);
    const savedEntry = await auditRepository.save(auditEntry);
    return savedEntry;
}
async function logAuditEventFromRequest(dataSource, req, params) {
    const { ipAddress, userAgent, deviceInfo } = extractRequestContext(req);
    return logAuditEvent(dataSource, {
        ...params,
        ipAddress,
        userAgent,
        deviceInfo,
    });
}
function createChangesObject(oldRecord, newRecord, fields) {
    const changes = {};
    let hasChanges = false;
    for (const field of fields) {
        const oldValue = oldRecord[field];
        const newValue = newRecord[field];
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