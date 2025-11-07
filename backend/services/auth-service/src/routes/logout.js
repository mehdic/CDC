"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../index");
const AuditTrailEntry_1 = require("../../../shared/models/AuditTrailEntry");
const jwt_1 = require("../../../shared/utils/jwt");
const router = (0, express_1.Router)();
router.delete('/logout', async (req, res) => {
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
            return res.status(200).json({
                success: true,
                message: 'Logged out successfully',
            });
        }
        const auditRepository = index_1.AppDataSource.getRepository(AuditTrailEntry_1.AuditTrailEntry);
        const auditEntry = auditRepository.create({
            user_id: decoded.userId,
            event_type: 'logout.success',
            action: 'create',
            resource_type: 'authentication',
            resource_id: decoded.userId,
            changes: {
                description: 'User logged out successfully',
            },
            ip_address: req.ip || req.socket.remoteAddress || 'unknown',
            user_agent: req.headers['user-agent'] || 'unknown',
            device_info: {
                ip: req.ip,
                userAgent: req.headers['user-agent'],
            },
        });
        await auditRepository.save(auditEntry);
        console.log(`User ${decoded.userId} logged out successfully`);
        return res.status(200).json({
            success: true,
            message: 'Logged out successfully',
        });
    }
    catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({
            success: false,
            error: 'An error occurred during logout',
        });
    }
});
router.post('/logout-all', async (req, res) => {
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
        const auditRepository = index_1.AppDataSource.getRepository(AuditTrailEntry_1.AuditTrailEntry);
        const auditEntry = auditRepository.create({
            user_id: decoded.userId,
            event_type: 'logout.all_devices',
            action: 'create',
            resource_type: 'authentication',
            resource_id: decoded.userId,
            changes: {
                description: 'User logged out from all devices',
            },
            ip_address: req.ip || req.socket.remoteAddress || 'unknown',
            user_agent: req.headers['user-agent'] || 'unknown',
            device_info: {
                ip: req.ip,
                userAgent: req.headers['user-agent'],
            },
        });
        await auditRepository.save(auditEntry);
        console.log(`User ${decoded.userId} logged out from all devices`);
        return res.status(200).json({
            success: true,
            message: 'Logged out from all devices successfully',
        });
    }
    catch (error) {
        console.error('Logout all error:', error);
        return res.status(500).json({
            success: false,
            error: 'An error occurred during logout',
        });
    }
});
exports.default = router;
//# sourceMappingURL=logout.js.map