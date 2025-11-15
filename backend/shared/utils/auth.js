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
exports.validatePassword = validatePassword;
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
exports.needsRehash = needsRehash;
exports.estimatePasswordStrength = estimatePasswordStrength;
exports.generateSecurePassword = generateSecurePassword;
exports.sanitizePasswordForLogging = sanitizePasswordForLogging;
exports.getPasswordRequirements = getPasswordRequirements;
const bcrypt = __importStar(require("bcrypt"));
const BCRYPT_SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 128;
const PASSWORD_REQUIREMENTS = {
    minLength: MIN_PASSWORD_LENGTH,
    requireUppercase: true,
    requireLowercase: true,
    requireDigits: true,
    requireSpecialChars: true,
};
function validatePassword(password) {
    const errors = [];
    if (!password || password.length < PASSWORD_REQUIREMENTS.minLength) {
        errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
    }
    if (password && password.length > MAX_PASSWORD_LENGTH) {
        errors.push(`Password must not exceed ${MAX_PASSWORD_LENGTH} characters`);
    }
    if (!password) {
        return { isValid: false, errors };
    }
    if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (PASSWORD_REQUIREMENTS.requireDigits && !/\d/.test(password)) {
        errors.push('Password must contain at least one digit');
    }
    if (PASSWORD_REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }
    const commonWeakPasswords = [
        'password123',
        'admin123456',
        'welcome12345',
        'changeme123',
    ];
    if (commonWeakPasswords.some(weak => password.toLowerCase().includes(weak.toLowerCase()))) {
        errors.push('Password is too common or weak');
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
}
async function hashPassword(password) {
    const validation = validatePassword(password);
    if (!validation.isValid) {
        throw new Error(`Invalid password: ${validation.errors.join(', ')}`);
    }
    try {
        const hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
        return hash;
    }
    catch (error) {
        console.error('Password hashing failed:', error);
        throw new Error('Failed to hash password');
    }
}
async function comparePassword(password, hash) {
    if (!password || !hash) {
        return false;
    }
    try {
        const isMatch = await bcrypt.compare(password, hash);
        return isMatch;
    }
    catch (error) {
        console.error('Password comparison failed:', error);
        return false;
    }
}
function needsRehash(hash) {
    try {
        const rounds = parseInt(hash.split('$')[2], 10);
        return rounds < BCRYPT_SALT_ROUNDS;
    }
    catch (error) {
        return true;
    }
}
function estimatePasswordStrength(password) {
    let score = 0;
    if (!password) {
        return { score: 0, description: 'No password' };
    }
    if (password.length >= 12)
        score += 1;
    if (password.length >= 16)
        score += 1;
    if (/[a-z]/.test(password))
        score += 0.5;
    if (/[A-Z]/.test(password))
        score += 0.5;
    if (/\d/.test(password))
        score += 0.5;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
        score += 0.5;
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.6)
        score += 1;
    score = Math.min(4, Math.floor(score));
    const descriptions = [
        'Very weak',
        'Weak',
        'Fair',
        'Strong',
        'Very strong',
    ];
    return {
        score,
        description: descriptions[score],
    };
}
function generateSecurePassword(length = 16) {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}';
    const all = lowercase + uppercase + digits + special;
    let password = '';
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += digits[Math.floor(Math.random() * digits.length)];
    password += special[Math.floor(Math.random() * special.length)];
    for (let i = password.length; i < length; i++) {
        password += all[Math.floor(Math.random() * all.length)];
    }
    return password
        .split('')
        .sort(() => Math.random() - 0.5)
        .join('');
}
function sanitizePasswordForLogging(password) {
    if (!password)
        return '[empty]';
    return `[${password.length} chars]`;
}
function getPasswordRequirements() {
    return [
        `At least ${PASSWORD_REQUIREMENTS.minLength} characters long`,
        'At least one uppercase letter (A-Z)',
        'At least one lowercase letter (a-z)',
        'At least one digit (0-9)',
        'At least one special character (!@#$%^&*...)',
    ];
}
//# sourceMappingURL=auth.js.map