/**
 * Security Configuration Module (T250)
 * Centralizes all security-related configuration for MetaPharm Connect
 * Based on HIPAA/GDPR compliance requirements
 *
 * IMPORTANT: Never commit secrets to git. All sensitive values must come from environment variables.
 */
export declare enum Environment {
    DEVELOPMENT = "development",
    STAGING = "staging",
    PRODUCTION = "production",
    TEST = "test"
}
/**
 * Get current environment
 */
export declare function getEnvironment(): Environment;
/**
 * Check if running in production
 */
export declare function isProduction(): boolean;
/**
 * Check if running in development
 */
export declare function isDevelopment(): boolean;
export interface JWTConfig {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
    algorithm: 'HS256' | 'HS384' | 'HS512';
    issuer: string;
    audience: string;
}
/**
 * Get JWT configuration
 * @throws Error if JWT_SECRET or JWT_REFRESH_SECRET are missing
 */
export declare function getJWTConfig(): JWTConfig;
export interface MFAConfig {
    issuer: string;
    totpWindow: number;
    totpDigits: number;
    backupCodesCount: number;
    backupCodeLength: number;
}
/**
 * Get MFA configuration
 */
export declare function getMFAConfig(): MFAConfig;
export interface PasswordPolicyConfig {
    minLength: number;
    maxLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireDigits: boolean;
    requireSpecialChars: boolean;
    preventCommonPasswords: boolean;
    passwordHistoryCount: number;
    bcryptRounds: number;
}
/**
 * Get password policy configuration
 * Stricter in production
 */
export declare function getPasswordPolicyConfig(): PasswordPolicyConfig;
export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
    skipFailedRequests: boolean;
}
export interface RateLimitPresets {
    general: RateLimitConfig;
    auth: RateLimitConfig;
    passwordReset: RateLimitConfig;
    mfa: RateLimitConfig;
    fileUpload: RateLimitConfig;
}
/**
 * Get rate limiting configuration
 */
export declare function getRateLimitConfig(): RateLimitPresets;
export interface SessionConfig {
    secret: string;
    maxAge: number;
    maxConcurrentSessions: number;
    redisUrl: string;
    sessionIdLength: number;
}
/**
 * Get session configuration
 * @throws Error if SESSION_SECRET is missing
 */
export declare function getSessionConfig(): SessionConfig;
export interface CORSConfig {
    origin: string | string[] | ((origin: string, callback: (err: Error | null, allow?: boolean) => void) => void);
    credentials: boolean;
    optionsSuccessStatus: number;
    allowedHeaders: string[];
    exposedHeaders: string[];
    maxAge: number;
}
/**
 * Get CORS configuration
 */
export declare function getCORSConfig(): CORSConfig;
export interface CSPConfig {
    directives: Record<string, string[]>;
    reportOnly: boolean;
}
/**
 * Get Content Security Policy configuration
 */
export declare function getCSPConfig(): CSPConfig;
export interface FileUploadConfig {
    maxFileSize: number;
    allowedMimeTypes: string[];
    allowedExtensions: string[];
    uploadDir: string;
}
/**
 * Get file upload configuration
 */
export declare function getFileUploadConfig(): FileUploadConfig;
export interface EncryptionConfig {
    algorithm: 'aes-256-gcm';
    kmsKeyId: string | undefined;
    encryptionKey: string | undefined;
    keyRotationDays: number;
}
/**
 * Get encryption configuration
 */
export declare function getEncryptionConfig(): EncryptionConfig;
export interface AuditConfig {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    retentionDays: number;
    encryptPII: boolean;
}
/**
 * Get audit logging configuration
 */
export declare function getAuditConfig(): AuditConfig;
export interface SecurityHeadersConfig {
    hsts: {
        enabled: boolean;
        maxAge: number;
        includeSubDomains: boolean;
        preload: boolean;
    };
    xFrameOptions: 'DENY' | 'SAMEORIGIN';
    xContentTypeOptions: 'nosniff';
    xXSSProtection: '1; mode=block' | '0';
    referrerPolicy: 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url';
    permissionsPolicy: Record<string, string[]>;
}
/**
 * Get security headers configuration
 */
export declare function getSecurityHeadersConfig(): SecurityHeadersConfig;
/**
 * List of required environment variables
 * Used for startup validation
 */
export declare const REQUIRED_ENV_VARS: {
    all: string[];
    production: string[];
};
/**
 * Validate required environment variables
 * @throws Error if required variables are missing
 */
export declare function validateEnvironmentVariables(): void;
/**
 * Get complete security configuration
 * Useful for debugging and validation
 */
export declare function getSecurityConfig(): {
    environment: Environment;
    jwt: {
        secret: string;
        refreshSecret: string;
        expiresIn: string;
        refreshExpiresIn: string;
        algorithm: "HS256" | "HS384" | "HS512";
        issuer: string;
        audience: string;
    };
    mfa: MFAConfig;
    passwordPolicy: PasswordPolicyConfig;
    rateLimit: RateLimitPresets;
    session: {
        secret: string;
        maxAge: number;
        maxConcurrentSessions: number;
        redisUrl: string;
        sessionIdLength: number;
    };
    cors: CORSConfig;
    csp: CSPConfig;
    fileUpload: FileUploadConfig;
    encryption: {
        encryptionKey: string;
        algorithm: "aes-256-gcm";
        kmsKeyId: string | undefined;
        keyRotationDays: number;
    };
    audit: AuditConfig;
    securityHeaders: SecurityHeadersConfig;
};
/**
 * Log security configuration (safe for logging - secrets redacted)
 */
export declare function logSecurityConfig(): void;
//# sourceMappingURL=security.d.ts.map