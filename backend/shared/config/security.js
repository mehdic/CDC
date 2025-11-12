"use strict";
/**
 * Security Configuration Module (T250)
 * Centralizes all security-related configuration for MetaPharm Connect
 * Based on HIPAA/GDPR compliance requirements
 *
 * IMPORTANT: Never commit secrets to git. All sensitive values must come from environment variables.
 */
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
exports.REQUIRED_ENV_VARS = exports.Environment = void 0;
exports.getEnvironment = getEnvironment;
exports.isProduction = isProduction;
exports.isDevelopment = isDevelopment;
exports.getJWTConfig = getJWTConfig;
exports.getMFAConfig = getMFAConfig;
exports.getPasswordPolicyConfig = getPasswordPolicyConfig;
exports.getRateLimitConfig = getRateLimitConfig;
exports.getSessionConfig = getSessionConfig;
exports.getCORSConfig = getCORSConfig;
exports.getCSPConfig = getCSPConfig;
exports.getFileUploadConfig = getFileUploadConfig;
exports.getEncryptionConfig = getEncryptionConfig;
exports.getAuditConfig = getAuditConfig;
exports.getSecurityHeadersConfig = getSecurityHeadersConfig;
exports.validateEnvironmentVariables = validateEnvironmentVariables;
exports.getSecurityConfig = getSecurityConfig;
exports.logSecurityConfig = logSecurityConfig;
const dotenv = __importStar(require("dotenv"));
// Load environment variables
dotenv.config();
// ============================================================================
// Environment Type
// ============================================================================
var Environment;
(function (Environment) {
    Environment["DEVELOPMENT"] = "development";
    Environment["STAGING"] = "staging";
    Environment["PRODUCTION"] = "production";
    Environment["TEST"] = "test";
})(Environment || (exports.Environment = Environment = {}));
/**
 * Get current environment
 */
function getEnvironment() {
    const env = process.env.NODE_ENV || 'development';
    switch (env.toLowerCase()) {
        case 'production':
        case 'prod':
            return Environment.PRODUCTION;
        case 'staging':
        case 'stage':
            return Environment.STAGING;
        case 'test':
        case 'testing':
            return Environment.TEST;
        default:
            return Environment.DEVELOPMENT;
    }
}
/**
 * Check if running in production
 */
function isProduction() {
    return getEnvironment() === Environment.PRODUCTION;
}
/**
 * Check if running in development
 */
function isDevelopment() {
    return getEnvironment() === Environment.DEVELOPMENT;
}
/**
 * Get JWT configuration
 * @throws Error if JWT_SECRET or JWT_REFRESH_SECRET are missing
 */
function getJWTConfig() {
    const secret = process.env.JWT_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET environment variable is required');
    }
    if (!refreshSecret) {
        throw new Error('JWT_REFRESH_SECRET environment variable is required');
    }
    // In production, enforce strong secrets (min 32 chars)
    if (isProduction()) {
        if (secret.length < 32) {
            throw new Error('JWT_SECRET must be at least 32 characters in production');
        }
        if (refreshSecret.length < 32) {
            throw new Error('JWT_REFRESH_SECRET must be at least 32 characters in production');
        }
    }
    return {
        secret,
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
        refreshSecret,
        refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
        algorithm: 'HS256',
        issuer: 'metapharm-connect',
        audience: 'metapharm-users',
    };
}
/**
 * Get MFA configuration
 */
function getMFAConfig() {
    return {
        issuer: process.env.MFA_ISSUER || 'MetaPharm Connect',
        totpWindow: 1, // Allow 1 time step drift (±30 seconds)
        totpDigits: 6, // Standard 6-digit TOTP
        backupCodesCount: 10, // Generate 10 backup codes
        backupCodeLength: 8, // Each code is 8 characters
    };
}
/**
 * Get password policy configuration
 * Stricter in production
 */
function getPasswordPolicyConfig() {
    const env = getEnvironment();
    // Production requires stricter password policies
    if (env === Environment.PRODUCTION) {
        return {
            minLength: 12,
            maxLength: 128,
            requireUppercase: true,
            requireLowercase: true,
            requireDigits: true,
            requireSpecialChars: true,
            preventCommonPasswords: true,
            passwordHistoryCount: 5,
            bcryptRounds: 12, // Higher cost in production
        };
    }
    // Development/staging can be slightly less strict for testing
    return {
        minLength: 12,
        maxLength: 128,
        requireUppercase: true,
        requireLowercase: true,
        requireDigits: true,
        requireSpecialChars: true,
        preventCommonPasswords: true,
        passwordHistoryCount: 5,
        bcryptRounds: 10, // Lower cost in dev for faster tests
    };
}
/**
 * Get rate limiting configuration
 */
function getRateLimitConfig() {
    return {
        // General API: 100 requests per 15 minutes
        general: {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 min
            maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
            skipSuccessfulRequests: false,
            skipFailedRequests: false,
        },
        // Auth endpoints: 10 requests per 15 minutes
        auth: {
            windowMs: 900000, // 15 min
            maxRequests: 10,
            skipSuccessfulRequests: true, // Only count failed attempts
            skipFailedRequests: false,
        },
        // Password reset: 3 requests per hour
        passwordReset: {
            windowMs: 3600000, // 1 hour
            maxRequests: 3,
            skipSuccessfulRequests: false,
            skipFailedRequests: false,
        },
        // MFA verification: 5 requests per 15 minutes
        mfa: {
            windowMs: 900000, // 15 min
            maxRequests: 5,
            skipSuccessfulRequests: false,
            skipFailedRequests: false,
        },
        // File upload: 20 requests per hour
        fileUpload: {
            windowMs: 3600000, // 1 hour
            maxRequests: 20,
            skipSuccessfulRequests: false,
            skipFailedRequests: false,
        },
    };
}
/**
 * Get session configuration
 * @throws Error if SESSION_SECRET is missing
 */
function getSessionConfig() {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
        throw new Error('SESSION_SECRET environment variable is required');
    }
    if (isProduction() && secret.length < 32) {
        throw new Error('SESSION_SECRET must be at least 32 characters in production');
    }
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    // Different session lifetimes per user role
    // Default: 30 minutes for patients, 2 hours for healthcare professionals
    const maxAge = parseInt(process.env.SESSION_MAX_AGE || '7200000', 10); // 2 hours default
    return {
        secret,
        maxAge,
        maxConcurrentSessions: 3, // Max 3 active sessions per user
        redisUrl,
        sessionIdLength: 32, // 32-byte session ID
    };
}
/**
 * Get CORS configuration
 */
function getCORSConfig() {
    const env = getEnvironment();
    // Parse allowed origins from environment
    const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');
    // In production, strictly validate origins
    if (env === Environment.PRODUCTION) {
        return {
            origin: (origin, callback) => {
                // Allow requests with no origin (mobile apps, Postman, etc.)
                if (!origin) {
                    callback(null, true);
                    return;
                }
                if (allowedOrigins.includes(origin)) {
                    callback(null, true);
                }
                else {
                    callback(new Error('Origin not allowed by CORS'));
                }
            },
            credentials: true,
            optionsSuccessStatus: 204,
            allowedHeaders: [
                'Content-Type',
                'Authorization',
                'X-Requested-With',
                'Accept',
                'Origin',
            ],
            exposedHeaders: [
                'X-Total-Count',
                'X-Page-Number',
                'X-Page-Size',
            ],
            maxAge: 600, // 10 minutes
        };
    }
    // Development: Allow all origins
    return {
        origin: true,
        credentials: true,
        optionsSuccessStatus: 204,
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'Accept',
            'Origin',
        ],
        exposedHeaders: [
            'X-Total-Count',
            'X-Page-Number',
            'X-Page-Size',
        ],
        maxAge: 600,
    };
}
/**
 * Get Content Security Policy configuration
 */
function getCSPConfig() {
    const env = getEnvironment();
    // Production uses strict CSP
    if (env === Environment.PRODUCTION) {
        return {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"], // Material-UI requires unsafe-inline
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'", 'https://api.metapharm-connect.ch'],
                fontSrc: ["'self'", 'https:', 'data:'],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
            reportOnly: false, // Enforce in production
        };
    }
    // Development uses report-only mode
    return {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-eval'"], // Allow eval in dev for hot reload
            imgSrc: ["'self'", 'data:', 'https:', 'http:'],
            connectSrc: ["'self'", 'http://localhost:*', 'ws://localhost:*'],
            fontSrc: ["'self'", 'https:', 'data:'],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
        reportOnly: true, // Report-only in development
    };
}
/**
 * Get file upload configuration
 */
function getFileUploadConfig() {
    return {
        maxFileSize: 10 * 1024 * 1024, // 10 MB
        allowedMimeTypes: [
            'application/pdf',
            'image/png',
            'image/jpeg',
            'image/jpg',
        ],
        allowedExtensions: ['.pdf', '.png', '.jpg', '.jpeg'],
        uploadDir: process.env.UPLOAD_DIR || '/tmp/uploads',
    };
}
/**
 * Get encryption configuration
 */
function getEncryptionConfig() {
    const kmsKeyId = process.env.AWS_KMS_KEY_ID;
    const encryptionKey = process.env.ENCRYPTION_KEY;
    // In production, KMS is required
    if (isProduction() && !kmsKeyId) {
        throw new Error('AWS_KMS_KEY_ID is required in production for HIPAA compliance');
    }
    // Warn if using fallback encryption key instead of KMS
    if (!kmsKeyId && encryptionKey) {
        console.warn('⚠️  WARNING: Using ENCRYPTION_KEY instead of AWS KMS. Not recommended for production.');
    }
    return {
        algorithm: 'aes-256-gcm',
        kmsKeyId,
        encryptionKey,
        keyRotationDays: 90, // Rotate keys every 90 days
    };
}
/**
 * Get audit logging configuration
 */
function getAuditConfig() {
    return {
        enabled: true, // Always enabled for HIPAA compliance
        logLevel: process.env.LOG_LEVEL || 'info',
        retentionDays: 2555, // 7 years (HIPAA requirement)
        encryptPII: true, // Always encrypt PII in audit logs
    };
}
/**
 * Get security headers configuration
 */
function getSecurityHeadersConfig() {
    return {
        hsts: {
            enabled: isProduction(), // Only in production (requires HTTPS)
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true,
        },
        xFrameOptions: 'DENY', // Prevent clickjacking
        xContentTypeOptions: 'nosniff', // Prevent MIME sniffing
        xXSSProtection: '1; mode=block', // XSS protection
        referrerPolicy: 'strict-origin-when-cross-origin',
        permissionsPolicy: {
            camera: ["'self'"], // Teleconsultation needs camera
            microphone: ["'self'"], // Teleconsultation needs microphone
            geolocation: ["'self'"], // Delivery tracking needs geolocation
            payment: ["'none'"],
            usb: ["'none'"],
        },
    };
}
// ============================================================================
// Required Environment Variables
// ============================================================================
/**
 * List of required environment variables
 * Used for startup validation
 */
exports.REQUIRED_ENV_VARS = {
    all: [
        'NODE_ENV',
        'PORT',
        'DATABASE_URL',
        'REDIS_URL',
        'JWT_SECRET',
        'JWT_REFRESH_SECRET',
        'SESSION_SECRET',
    ],
    production: [
        'AWS_KMS_KEY_ID', // Required for encryption in production
        'SENTRY_DSN', // Required for error tracking in production
    ],
};
/**
 * Validate required environment variables
 * @throws Error if required variables are missing
 */
function validateEnvironmentVariables() {
    const missing = [];
    // Check all required variables
    for (const varName of exports.REQUIRED_ENV_VARS.all) {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    }
    // Check production-specific variables
    if (isProduction()) {
        for (const varName of exports.REQUIRED_ENV_VARS.production) {
            if (!process.env[varName]) {
                missing.push(varName);
            }
        }
    }
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}\n` +
            'Please check .env.example for required variables.');
    }
    console.log('✓ All required environment variables are set');
}
// ============================================================================
// Security Configuration Summary
// ============================================================================
/**
 * Get complete security configuration
 * Useful for debugging and validation
 */
function getSecurityConfig() {
    return {
        environment: getEnvironment(),
        jwt: {
            ...getJWTConfig(),
            secret: '[REDACTED]', // Never log secrets
            refreshSecret: '[REDACTED]',
        },
        mfa: getMFAConfig(),
        passwordPolicy: getPasswordPolicyConfig(),
        rateLimit: getRateLimitConfig(),
        session: {
            ...getSessionConfig(),
            secret: '[REDACTED]',
        },
        cors: getCORSConfig(),
        csp: getCSPConfig(),
        fileUpload: getFileUploadConfig(),
        encryption: {
            ...getEncryptionConfig(),
            encryptionKey: '[REDACTED]',
        },
        audit: getAuditConfig(),
        securityHeaders: getSecurityHeadersConfig(),
    };
}
/**
 * Log security configuration (safe for logging - secrets redacted)
 */
function logSecurityConfig() {
    const config = getSecurityConfig();
    console.log('🔒 Security Configuration:');
    console.log(JSON.stringify(config, null, 2));
}
//# sourceMappingURL=security.js.map