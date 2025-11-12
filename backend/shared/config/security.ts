/**
 * Security Configuration Module (T250)
 * Centralizes all security-related configuration for MetaPharm Connect
 * Based on HIPAA/GDPR compliance requirements
 *
 * IMPORTANT: Never commit secrets to git. All sensitive values must come from environment variables.
 */

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ============================================================================
// Environment Type
// ============================================================================

export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TEST = 'test',
}

/**
 * Get current environment
 */
export function getEnvironment(): Environment {
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
export function isProduction(): boolean {
  return getEnvironment() === Environment.PRODUCTION;
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getEnvironment() === Environment.DEVELOPMENT;
}

// ============================================================================
// JWT Configuration
// ============================================================================

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
export function getJWTConfig(): JWTConfig {
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

// ============================================================================
// MFA Configuration
// ============================================================================

export interface MFAConfig {
  issuer: string;
  totpWindow: number; // Number of time steps to allow (default: 1 = 30 seconds)
  totpDigits: number; // Number of digits in TOTP code (default: 6)
  backupCodesCount: number; // Number of backup codes to generate
  backupCodeLength: number; // Length of each backup code
}

/**
 * Get MFA configuration
 */
export function getMFAConfig(): MFAConfig {
  return {
    issuer: process.env.MFA_ISSUER || 'MetaPharm Connect',
    totpWindow: 1, // Allow 1 time step drift (±30 seconds)
    totpDigits: 6, // Standard 6-digit TOTP
    backupCodesCount: 10, // Generate 10 backup codes
    backupCodeLength: 8, // Each code is 8 characters
  };
}

// ============================================================================
// Password Policy Configuration
// ============================================================================

export interface PasswordPolicyConfig {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireDigits: boolean;
  requireSpecialChars: boolean;
  preventCommonPasswords: boolean;
  passwordHistoryCount: number; // Prevent reuse of last N passwords
  bcryptRounds: number; // Cost factor for bcrypt hashing
}

/**
 * Get password policy configuration
 * Stricter in production
 */
export function getPasswordPolicyConfig(): PasswordPolicyConfig {
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

// ============================================================================
// Rate Limiting Configuration
// ============================================================================

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
}

export interface RateLimitPresets {
  general: RateLimitConfig; // General API endpoints
  auth: RateLimitConfig; // Authentication endpoints (stricter)
  passwordReset: RateLimitConfig; // Password reset (very strict)
  mfa: RateLimitConfig; // MFA verification (strict)
  fileUpload: RateLimitConfig; // File upload endpoints
}

/**
 * Get rate limiting configuration
 */
export function getRateLimitConfig(): RateLimitPresets {
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

// ============================================================================
// Session Configuration
// ============================================================================

export interface SessionConfig {
  secret: string;
  maxAge: number; // Session lifetime in milliseconds
  maxConcurrentSessions: number; // Max sessions per user
  redisUrl: string;
  sessionIdLength: number;
}

/**
 * Get session configuration
 * @throws Error if SESSION_SECRET is missing
 */
export function getSessionConfig(): SessionConfig {
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

// ============================================================================
// CORS Configuration
// ============================================================================

export interface CORSConfig {
  origin: string | string[] | ((origin: string, callback: (err: Error | null, allow?: boolean) => void) => void);
  credentials: boolean;
  optionsSuccessStatus: number;
  allowedHeaders: string[];
  exposedHeaders: string[];
  maxAge: number; // Preflight cache duration in seconds
}

/**
 * Get CORS configuration
 */
export function getCORSConfig(): CORSConfig {
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
        } else {
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
    origin: (origin, callback) => {
      // In development, allow all origins
      callback(null, true);
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

// ============================================================================
// Content Security Policy (CSP) Configuration
// ============================================================================

export interface CSPConfig {
  directives: Record<string, string[]>;
  reportOnly: boolean;
}

/**
 * Get Content Security Policy configuration
 */
export function getCSPConfig(): CSPConfig {
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

// ============================================================================
// File Upload Configuration
// ============================================================================

export interface FileUploadConfig {
  maxFileSize: number; // In bytes
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  uploadDir: string;
}

/**
 * Get file upload configuration
 */
export function getFileUploadConfig(): FileUploadConfig {
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

// ============================================================================
// Encryption Configuration
// ============================================================================

export interface EncryptionConfig {
  algorithm: 'aes-256-gcm';
  kmsKeyId: string | undefined;
  encryptionKey: string | undefined; // Fallback for local encryption
  keyRotationDays: number;
}

/**
 * Get encryption configuration
 */
export function getEncryptionConfig(): EncryptionConfig {
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

// ============================================================================
// Audit Logging Configuration
// ============================================================================

export interface AuditConfig {
  enabled: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  retentionDays: number; // How long to keep audit logs
  encryptPII: boolean; // Encrypt PII in audit logs
}

/**
 * Get audit logging configuration
 */
export function getAuditConfig(): AuditConfig {
  return {
    enabled: true, // Always enabled for HIPAA compliance
    logLevel: (process.env.LOG_LEVEL as any) || 'info',
    retentionDays: 2555, // 7 years (HIPAA requirement)
    encryptPII: true, // Always encrypt PII in audit logs
  };
}

// ============================================================================
// Security Headers Configuration
// ============================================================================

export interface SecurityHeadersConfig {
  hsts: {
    enabled: boolean;
    maxAge: number; // Seconds
    includeSubDomains: boolean;
    preload: boolean;
  };
  xFrameOptions: 'DENY' | 'SAMEORIGIN';
  xContentTypeOptions: 'nosniff';
  xXSSProtection: '1; mode=block' | '0';
  referrerPolicy:
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'origin'
    | 'origin-when-cross-origin'
    | 'same-origin'
    | 'strict-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url';
  permissionsPolicy: Record<string, string[]>;
}

/**
 * Get security headers configuration
 */
export function getSecurityHeadersConfig(): SecurityHeadersConfig {
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
export const REQUIRED_ENV_VARS = {
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
export function validateEnvironmentVariables(): void {
  const missing: string[] = [];

  // Check all required variables
  for (const varName of REQUIRED_ENV_VARS.all) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Check production-specific variables
  if (isProduction()) {
    for (const varName of REQUIRED_ENV_VARS.production) {
      if (!process.env[varName]) {
        missing.push(varName);
      }
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check .env.example for required variables.'
    );
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
export function getSecurityConfig() {
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
export function logSecurityConfig(): void {
  const config = getSecurityConfig();
  console.log('🔒 Security Configuration:');
  console.log(JSON.stringify(config, null, 2));
}
