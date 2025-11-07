"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const index_1 = require("../index");
const User_1 = require("../../../shared/models/User");
const AuditTrailEntry_1 = require("../../../shared/models/AuditTrailEntry");
const auth_1 = require("../../../shared/utils/auth");
const jwt_1 = require("../../../shared/utils/jwt");
const router = (0, express_1.Router)();
const loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts. Please try again in 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
});
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { email, password, pharmacyId } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required',
            });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format',
            });
        }
        const userRepository = index_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepository.findOne({
            where: { email: email.toLowerCase() },
            relations: ['primary_pharmacy'],
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
            });
        }
        if (!user.isActive()) {
            return res.status(401).json({
                success: false,
                error: 'Account is inactive or suspended',
            });
        }
        if (!user.password_hash) {
            return res.status(401).json({
                success: false,
                error: 'Password authentication not available. Please use HIN e-ID.',
            });
        }
        const isPasswordValid = await (0, auth_1.comparePassword)(password, user.password_hash);
        if (!isPasswordValid) {
            await createAuditEntry(user.id, 'login.failed', 'Failed password verification', req);
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
            });
        }
        if (user.isHealthcareProfessional() && !user.mfa_enabled) {
            return res.status(403).json({
                success: false,
                error: 'MFA is required for healthcare professionals. Please enable MFA.',
                requiresMFASetup: true,
            });
        }
        if (user.mfa_enabled && (user.mfa_secret_encrypted || user.mfa_secret)) {
            const tempToken = (0, jwt_1.generateAccessToken)(user.id, user.email, user.role, user.primary_pharmacy_id);
            await createAuditEntry(user.id, 'login.mfa_required', 'MFA verification required', req);
            return res.status(200).json({
                success: true,
                requiresMFA: true,
                tempToken,
            });
        }
        const tokens = (0, jwt_1.generateTokenPair)(user.id, user.email, user.role, pharmacyId || user.primary_pharmacy_id);
        user.updateLastLogin();
        await userRepository.save(user);
        await createAuditEntry(user.id, 'login.success', 'User logged in successfully', req);
        return res.status(200).json({
            success: true,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                pharmacyId: user.primary_pharmacy_id,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            error: 'An error occurred during login',
        });
    }
});
async function createAuditEntry(userId, eventType, description, req) {
    try {
        const auditRepository = index_1.AppDataSource.getRepository(AuditTrailEntry_1.AuditTrailEntry);
        const auditEntry = auditRepository.create({
            user_id: userId,
            event_type: eventType,
            action: 'create',
            resource_type: 'authentication',
            resource_id: userId,
            changes: { description },
            ip_address: req.ip || req.socket.remoteAddress || 'unknown',
            user_agent: req.headers['user-agent'] || 'unknown',
            device_info: {
                ip: req.ip,
                userAgent: req.headers['user-agent'],
            },
        });
        await auditRepository.save(auditEntry);
    }
    catch (error) {
        console.error('Failed to create audit entry:', error);
    }
}
exports.default = router;
//# sourceMappingURL=login.js.map