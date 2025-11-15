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
exports.generateMFASecret = generateMFASecret;
exports.verifyTOTP = verifyTOTP;
exports.verifyBackupCode = verifyBackupCode;
exports.completeMFAEnrollment = completeMFAEnrollment;
exports.disableMFA = disableMFA;
exports.regenerateBackupCodes = regenerateBackupCodes;
exports.isMFARequiredForRole = isMFARequiredForRole;
exports.isMFAEnabled = isMFAEnabled;
exports.formatBackupCodes = formatBackupCodes;
exports.generateTOTPCode = generateTOTPCode;
exports.getTOTPTimeRemaining = getTOTPTimeRemaining;
exports.getMFASecurityRecommendations = getMFASecurityRecommendations;
exports.validateMFASetup = validateMFASetup;
const speakeasy = __importStar(require("speakeasy"));
const QRCode = __importStar(require("qrcode"));
const crypto = __importStar(require("crypto"));
const security_1 = require("../config/security");
async function generateMFASecret(userEmail, userName) {
    const config = (0, security_1.getMFAConfig)();
    const secret = speakeasy.generateSecret({
        name: `${config.issuer} (${userEmail})`,
        issuer: config.issuer,
        length: 32,
    });
    if (!secret.otpauth_url) {
        throw new Error('Failed to generate OTP auth URL');
    }
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);
    const backupCodes = generateBackupCodes(config.backupCodesCount, config.backupCodeLength);
    return {
        secret: secret.base32,
        qrCodeDataUrl,
        backupCodes,
    };
}
function generateBackupCodes(count = 10, length = 8) {
    const codes = [];
    for (let i = 0; i < count; i++) {
        const code = crypto
            .randomBytes(Math.ceil(length * 0.75))
            .toString('base64')
            .replace(/[^a-zA-Z0-9]/g, '')
            .substring(0, length)
            .toUpperCase();
        codes.push(code);
    }
    return codes;
}
function verifyTOTP(secret, token) {
    if (!secret || !token) {
        return {
            isValid: false,
            message: 'Secret and token are required',
        };
    }
    const config = (0, security_1.getMFAConfig)();
    const isValid = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: config.totpWindow,
        digits: config.totpDigits,
    });
    return {
        isValid,
        message: isValid ? 'Code verified successfully' : 'Invalid or expired code',
    };
}
function verifyBackupCode(backupCodes, code) {
    if (!backupCodes || backupCodes.length === 0) {
        return {
            isValid: false,
            message: 'No backup codes available',
            remainingCodes: [],
        };
    }
    if (!code) {
        return {
            isValid: false,
            message: 'Backup code is required',
            remainingCodes: backupCodes,
        };
    }
    const normalizedCode = code.replace(/\s/g, '').toUpperCase();
    const codeIndex = backupCodes.findIndex((bc) => bc.replace(/\s/g, '').toUpperCase() === normalizedCode);
    if (codeIndex === -1) {
        return {
            isValid: false,
            message: 'Invalid backup code',
            remainingCodes: backupCodes,
        };
    }
    const remainingCodes = [...backupCodes];
    remainingCodes.splice(codeIndex, 1);
    return {
        isValid: true,
        message: `Backup code accepted. ${remainingCodes.length} codes remaining.`,
        remainingCodes,
    };
}
function completeMFAEnrollment(secret, token) {
    const result = verifyTOTP(secret, token);
    return result.isValid;
}
function disableMFA() {
    return true;
}
function regenerateBackupCodes(count = 10, length = 8) {
    return generateBackupCodes(count, length);
}
function isMFARequiredForRole(userRole) {
    const mfaRequiredRoles = ['PHARMACIST', 'DOCTOR', 'NURSE'];
    return mfaRequiredRoles.includes(userRole);
}
function isMFAEnabled(mfaSecret) {
    return mfaSecret !== null && mfaSecret !== undefined && mfaSecret.length > 0;
}
function formatBackupCodes(codes) {
    return codes.map((code) => {
        const mid = Math.floor(code.length / 2);
        return `${code.substring(0, mid)}-${code.substring(mid)}`;
    });
}
function generateTOTPCode(secret) {
    const config = (0, security_1.getMFAConfig)();
    return speakeasy.totp({
        secret,
        encoding: 'base32',
        digits: config.totpDigits,
    });
}
function getTOTPTimeRemaining() {
    const period = 30;
    const currentTime = Math.floor(Date.now() / 1000);
    return period - (currentTime % period);
}
function getMFASecurityRecommendations() {
    return [
        'Use an authenticator app (Google Authenticator, Authy, Microsoft Authenticator)',
        'Save your backup codes in a secure location (password manager, encrypted file)',
        'Never share your backup codes or QR code with anyone',
        'If you lose access to your authenticator app, use a backup code to log in',
        'Regenerate backup codes if you suspect they have been compromised',
        'Enable MFA on all your accounts for maximum security',
        'Use a strong, unique password in combination with MFA',
    ];
}
function validateMFASetup(mfaSecret, backupCodes) {
    const issues = [];
    if (!mfaSecret || mfaSecret.length === 0) {
        issues.push('MFA secret is missing');
    }
    if (!backupCodes || backupCodes.length === 0) {
        issues.push('Backup codes are missing');
    }
    else if (backupCodes.length < 5) {
        issues.push('Low backup code count. Regenerate backup codes to ensure account recovery.');
    }
    return {
        isValid: issues.length === 0,
        issues,
    };
}
//# sourceMappingURL=mfaService.js.map