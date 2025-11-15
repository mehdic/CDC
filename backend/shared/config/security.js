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
dotenv.config();
var Environment;
(function (Environment) {
    Environment["DEVELOPMENT"] = "development";
    Environment["STAGING"] = "staging";
    Environment["PRODUCTION"] = "production";
    Environment["TEST"] = "test";
})(Environment || (exports.Environment = Environment = {}));
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
function isProduction() {
    return getEnvironment() === Environment.PRODUCTION;
}
function isDevelopment() {
    return getEnvironment() === Environment.DEVELOPMENT;
}
function getJWTConfig() {
    const secret = process.env.JWT_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET environment variable is required');
    }
    if (!refreshSecret) {
        throw new Error('JWT_REFRESH_SECRET environment variable is required');
    }
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
function getMFAConfig() {
    return {
        issuer: process.env.MFA_ISSUER || 'MetaPharm Connect',
        totpWindow: 1,
        totpDigits: 6,
        backupCodesCount: 10,
        backupCodeLength: 8,
    };
}
function getPasswordPolicyConfig() {
    const env = getEnvironment();
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
            bcryptRounds: 12,
        };
    }
    return {
        minLength: 12,
        maxLength: 128,
        requireUppercase: true,
        requireLowercase: true,
        requireDigits: true,
        requireSpecialChars: true,
        preventCommonPasswords: true,
        passwordHistoryCount: 5,
        bcryptRounds: 10,
    };
}
function getRateLimitConfig() {
    return {
        general: {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
            maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
            skipSuccessfulRequests: false,
            skipFailedRequests: false,
        },
        auth: {
            windowMs: 900000,
            maxRequests: 10,
            skipSuccessfulRequests: true,
            skipFailedRequests: false,
        },
        passwordReset: {
            windowMs: 3600000,
            maxRequests: 3,
            skipSuccessfulRequests: false,
            skipFailedRequests: false,
        },
        mfa: {
            windowMs: 900000,
            maxRequests: 5,
            skipSuccessfulRequests: false,
            skipFailedRequests: false,
        },
        fileUpload: {
            windowMs: 3600000,
            maxRequests: 20,
            skipSuccessfulRequests: false,
            skipFailedRequests: false,
        },
    };
}
function getSessionConfig() {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
        throw new Error('SESSION_SECRET environment variable is required');
    }
    if (isProduction() && secret.length < 32) {
        throw new Error('SESSION_SECRET must be at least 32 characters in production');
    }
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const maxAge = parseInt(process.env.SESSION_MAX_AGE || '7200000', 10);
    return {
        secret,
        maxAge,
        maxConcurrentSessions: 3,
        redisUrl,
        sessionIdLength: 32,
    };
}
function getCORSConfig() {
    const env = getEnvironment();
    const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');
    if (env === Environment.PRODUCTION) {
        return {
            origin: (origin, callback) => {
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
            maxAge: 600,
        };
    }
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
function getCSPConfig() {
    const env = getEnvironment();
    if (env === Environment.PRODUCTION) {
        return {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'", 'https://api.metapharm-connect.ch'],
                fontSrc: ["'self'", 'https:', 'data:'],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
            reportOnly: false,
        };
    }
    return {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-eval'"],
            imgSrc: ["'self'", 'data:', 'https:', 'http:'],
            connectSrc: ["'self'", 'http://localhost:*', 'ws://localhost:*'],
            fontSrc: ["'self'", 'https:', 'data:'],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
        reportOnly: true,
    };
}
function getFileUploadConfig() {
    return {
        maxFileSize: 10 * 1024 * 1024,
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
function getEncryptionConfig() {
    const kmsKeyId = process.env.AWS_KMS_KEY_ID;
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (isProduction() && !kmsKeyId) {
        throw new Error('AWS_KMS_KEY_ID is required in production for HIPAA compliance');
    }
    if (!kmsKeyId && encryptionKey) {
        console.warn('⚠️  WARNING: Using ENCRYPTION_KEY instead of AWS KMS. Not recommended for production.');
    }
    return {
        algorithm: 'aes-256-gcm',
        kmsKeyId,
        encryptionKey,
        keyRotationDays: 90,
    };
}
function getAuditConfig() {
    return {
        enabled: true,
        logLevel: process.env.LOG_LEVEL || 'info',
        retentionDays: 2555,
        encryptPII: true,
    };
}
function getSecurityHeadersConfig() {
    return {
        hsts: {
            enabled: isProduction(),
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
        },
        xFrameOptions: 'DENY',
        xContentTypeOptions: 'nosniff',
        xXSSProtection: '1; mode=block',
        referrerPolicy: 'strict-origin-when-cross-origin',
        permissionsPolicy: {
            camera: ["'self'"],
            microphone: ["'self'"],
            geolocation: ["'self'"],
            payment: ["'none'"],
            usb: ["'none'"],
        },
    };
}
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
        'AWS_KMS_KEY_ID',
        'SENTRY_DSN',
    ],
};
function validateEnvironmentVariables() {
    const missing = [];
    for (const varName of exports.REQUIRED_ENV_VARS.all) {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    }
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
function getSecurityConfig() {
    return {
        environment: getEnvironment(),
        jwt: {
            ...getJWTConfig(),
            secret: '[REDACTED]',
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
function logSecurityConfig() {
    const config = getSecurityConfig();
    console.log('🔒 Security Configuration:');
    console.log(JSON.stringify(config, null, 2));
}
//# sourceMappingURL=security.js.map