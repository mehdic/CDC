"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const speakeasy = __importStar(require("speakeasy"));
const QRCode = __importStar(require("qrcode"));
const index_1 = require("../index");
const User_1 = require("../../../shared/models/User");
const AuditTrailEntry_1 = require("../../../shared/models/AuditTrailEntry");
const jwt_1 = require("../../../shared/utils/jwt");
const jwt_2 = require("../../../shared/utils/jwt");
const auth_1 = require("../../../shared/utils/auth");
const encryption_1 = require("../../../shared/utils/encryption");
const router = (0, express_1.Router)();
const MFA_ISSUER = process.env.MFA_ISSUER || 'MetaPharm Connect';
const MFA_WINDOW = parseInt(process.env.MFA_WINDOW || '1', 10);
async function getMFASecret(user) {
    if (user.mfa_secret_encrypted) {
        try {
            return await (0, encryption_1.decryptField)(user.mfa_secret_encrypted);
        }
        catch (error) {
            console.error('Failed to decrypt MFA secret:', error);
            throw new Error('Failed to decrypt MFA secret');
        }
    }
    return user.mfa_secret;
}
async function setMFASecret(user, secret) {
    try {
        user.mfa_secret_encrypted = await (0, encryption_1.encryptField)(secret);
        user.mfa_secret = null;
    }
    catch (error) {
        console.error('Failed to encrypt MFA secret:', error);
        throw new Error('Failed to encrypt MFA secret');
    }
}
router.post('/verify', async (req, res) => {
    try {
        const { tempToken, code } = req.body;
        if (!tempToken || !code) {
            return res.status(400).json({
                success: false,
                error: 'Temporary token and TOTP code are required',
            });
        }
        let decoded;
        try {
            decoded = (0, jwt_1.verifyAccessToken)(tempToken);
        }
        catch (error) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired temporary token',
            });
        }
        const userRepository = index_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepository.findOne({
            where: { id: decoded.userId },
        });
        if (!user || !user.isActive()) {
            return res.status(401).json({
                success: false,
                error: 'User not found or inactive',
            });
        }
        if (!user.mfa_enabled || (!user.mfa_secret_encrypted && !user.mfa_secret)) {
            return res.status(400).json({
                success: false,
                error: 'MFA is not enabled for this user',
            });
        }
        const mfaSecret = await getMFASecret(user);
        if (!mfaSecret) {
            return res.status(500).json({
                success: false,
                error: 'Failed to retrieve MFA secret',
            });
        }
        const isValid = speakeasy.totp.verify({
            secret: mfaSecret,
            encoding: 'base32',
            token: code,
            window: MFA_WINDOW,
        });
        if (!isValid) {
            await createAuditEntry(user.id, 'mfa.verification_failed', 'Invalid TOTP code', req);
            return res.status(401).json({
                success: false,
                error: 'Invalid verification code',
            });
        }
        const tokens = (0, jwt_2.generateTokenPair)(user.id, user.email, user.role, user.primary_pharmacy_id);
        user.updateLastLogin();
        await userRepository.save(user);
        await createAuditEntry(user.id, 'mfa.verification_success', 'MFA verification successful', req);
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
        console.error('MFA verification error:', error);
        return res.status(500).json({
            success: false,
            error: 'An error occurred during MFA verification',
        });
    }
});
router.post('/setup', async (req, res) => {
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
        const userRepository = index_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepository.findOne({
            where: { id: decoded.userId },
        });
        if (!user || !user.isActive()) {
            return res.status(401).json({
                success: false,
                error: 'User not found or inactive',
            });
        }
        const secret = speakeasy.generateSecret({
            name: `${MFA_ISSUER} (${user.email})`,
            issuer: MFA_ISSUER,
            length: 32,
        });
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');
        await setMFASecret(user, secret.base32);
        user.mfa_enabled = false;
        await userRepository.save(user);
        await createAuditEntry(user.id, 'mfa.setup', 'MFA secret generated', req);
        return res.status(200).json({
            success: true,
            secret: secret.base32,
            qrCode: qrCodeUrl,
            message: 'Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)',
        });
    }
    catch (error) {
        console.error('MFA setup error:', error);
        return res.status(500).json({
            success: false,
            error: 'An error occurred during MFA setup',
        });
    }
});
router.post('/enable', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const { code } = req.body;
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                error: 'Authorization header required',
            });
        }
        if (!code) {
            return res.status(400).json({
                success: false,
                error: 'Verification code is required',
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
        const userRepository = index_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepository.findOne({
            where: { id: decoded.userId },
        });
        if (!user || !user.isActive()) {
            return res.status(401).json({
                success: false,
                error: 'User not found or inactive',
            });
        }
        if (!user.mfa_secret_encrypted && !user.mfa_secret) {
            return res.status(400).json({
                success: false,
                error: 'MFA setup required first. Call /auth/mfa/setup',
            });
        }
        const mfaSecret = await getMFASecret(user);
        if (!mfaSecret) {
            return res.status(500).json({
                success: false,
                error: 'Failed to retrieve MFA secret',
            });
        }
        const isValid = speakeasy.totp.verify({
            secret: mfaSecret,
            encoding: 'base32',
            token: code,
            window: MFA_WINDOW,
        });
        if (!isValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid verification code',
            });
        }
        user.mfa_enabled = true;
        await userRepository.save(user);
        await createAuditEntry(user.id, 'mfa.enabled', 'MFA enabled successfully', req);
        return res.status(200).json({
            success: true,
            message: 'MFA enabled successfully',
        });
    }
    catch (error) {
        console.error('MFA enable error:', error);
        return res.status(500).json({
            success: false,
            error: 'An error occurred while enabling MFA',
        });
    }
});
router.delete('/disable', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const { password } = req.body;
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                error: 'Authorization header required',
            });
        }
        if (!password) {
            return res.status(400).json({
                success: false,
                error: 'Password confirmation is required to disable MFA',
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
        const userRepository = index_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepository.findOne({
            where: { id: decoded.userId },
        });
        if (!user || !user.isActive()) {
            return res.status(401).json({
                success: false,
                error: 'User not found or inactive',
            });
        }
        if (user.isHealthcareProfessional()) {
            return res.status(403).json({
                success: false,
                error: 'Healthcare professionals must have MFA enabled',
            });
        }
        if (!user.password_hash) {
            return res.status(400).json({
                success: false,
                error: 'Password authentication not available',
            });
        }
        const isPasswordValid = await (0, auth_1.comparePassword)(password, user.password_hash);
        if (!isPasswordValid) {
            await createAuditEntry(user.id, 'mfa.disable_failed', 'Invalid password for MFA disable', req);
            return res.status(401).json({
                success: false,
                error: 'Invalid password',
            });
        }
        user.mfa_enabled = false;
        user.mfa_secret = null;
        user.mfa_secret_encrypted = null;
        await userRepository.save(user);
        await createAuditEntry(user.id, 'mfa.disabled', 'MFA disabled', req);
        return res.status(200).json({
            success: true,
            message: 'MFA disabled successfully',
        });
    }
    catch (error) {
        console.error('MFA disable error:', error);
        return res.status(500).json({
            success: false,
            error: 'An error occurred while disabling MFA',
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
//# sourceMappingURL=mfa.js.map