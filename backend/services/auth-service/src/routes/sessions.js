"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../index");
const jwt_1 = require("../../../shared/utils/jwt");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                error: 'Authorization header required',
            });
        }
        const token = authHeader.replace('Bearer ', '');
        let decoded;
        try {
            decoded = (0, jwt_1.verifyAccessToken)(token);
        }
        catch (error) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token',
            });
        }
        const auditRepository = index_1.AppDataSource.getRepository('AuditTrailEntry');
        const loginEvents = await auditRepository
            .createQueryBuilder('audit')
            .where('audit.user_id = :userId', { userId: decoded.userId })
            .andWhere("audit.event_type LIKE 'login%'")
            .andWhere("audit.event_type NOT LIKE '%failed'")
            .orderBy('audit.created_at', 'DESC')
            .limit(10)
            .getMany();
        const sessions = loginEvents.map((event, index) => ({
            tokenId: event.id,
            device: extractDeviceInfo(event.user_agent),
            ipAddress: event.ip_address || 'Unknown',
            createdAt: event.created_at,
            expiresAt: calculateExpiryDate(event.created_at),
            isCurrent: index === 0,
        }));
        return res.status(200).json({
            success: true,
            sessions,
            totalSessions: sessions.length,
        });
    }
    catch (error) {
        console.error('Sessions list error:', error);
        return res.status(500).json({
            success: false,
            error: 'An error occurred while fetching sessions',
        });
    }
});
function extractDeviceInfo(userAgent) {
    if (!userAgent)
        return 'Unknown Device';
    if (userAgent.includes('iPhone'))
        return 'iPhone';
    if (userAgent.includes('iPad'))
        return 'iPad';
    if (userAgent.includes('Android'))
        return 'Android Device';
    if (userAgent.includes('Windows'))
        return 'Windows PC';
    if (userAgent.includes('Macintosh'))
        return 'Mac';
    if (userAgent.includes('Linux'))
        return 'Linux PC';
    return 'Unknown Device';
}
function calculateExpiryDate(createdAt) {
    const expiry = new Date(createdAt);
    expiry.setDate(expiry.getDate() + 7);
    return expiry;
}
exports.default = router;
//# sourceMappingURL=sessions.js.map