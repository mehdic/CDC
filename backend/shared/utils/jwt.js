"use strict";
/**
 * JWT Token Utilities (T040)
 * Implements JWT token generation and validation
 * Based on: /specs/002-metapharm-platform/plan.md
 *
 * Security Requirements:
 * - JWT-based authentication (FR-006, FR-007)
 * - Access tokens: 1 hour expiry
 * - Refresh tokens: 7 days expiry
 * - Token payload includes user ID, role, pharmacy context
 * - Audit trail for token generation (FR-007)
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
exports.TokenType = void 0;
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.generateTokenPair = generateTokenPair;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.decodeTokenUnsafe = decodeTokenUnsafe;
exports.extractTokenFromHeader = extractTokenFromHeader;
exports.isTokenExpired = isTokenExpired;
exports.getTokenTimeRemaining = getTokenTimeRemaining;
exports.refreshAccessToken = refreshAccessToken;
exports.hasValidTokenStructure = hasValidTokenStructure;
exports.sanitizeTokenForLogging = sanitizeTokenForLogging;
const jwt = __importStar(require("jsonwebtoken"));
// ============================================================================
// Configuration
// ============================================================================
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-change-this-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-token-secret-change-this';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h'; // 1 hour for access tokens
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'; // 7 days for refresh tokens
if (JWT_SECRET === 'your-jwt-secret-key-change-this-in-production') {
    console.warn('WARNING: Using default JWT_SECRET. Set JWT_SECRET environment variable in production!');
}
if (JWT_REFRESH_SECRET === 'your-refresh-token-secret-change-this') {
    console.warn('WARNING: Using default JWT_REFRESH_SECRET. Set JWT_REFRESH_SECRET environment variable in production!');
}
// ============================================================================
// Token Types
// ============================================================================
var TokenType;
(function (TokenType) {
    TokenType["ACCESS"] = "access";
    TokenType["REFRESH"] = "refresh";
})(TokenType || (exports.TokenType = TokenType = {}));
// ============================================================================
// Access Token Generation (T040)
// ============================================================================
/**
 * Generate an access token (JWT)
 * Access tokens are short-lived (1 hour) and used for API authentication
 *
 * Use cases:
 * - User login
 * - Token refresh
 * - Session restoration
 *
 * @param userId - User UUID
 * @param email - User email
 * @param role - User role (pharmacist, doctor, nurse, delivery, patient)
 * @param pharmacyId - Primary pharmacy ID (null for patients without affiliation)
 * @returns Signed JWT access token
 */
function generateAccessToken(userId, email, role, pharmacyId) {
    const payload = {
        userId,
        email,
        role,
        pharmacyId,
        type: TokenType.ACCESS,
    };
    try {
        const token = jwt.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
            issuer: 'metapharm-connect',
            audience: 'metapharm-api',
        });
        return token;
    }
    catch (error) {
        console.error('Access token generation failed:', error);
        throw new Error('Failed to generate access token');
    }
}
/**
 * Generate a refresh token (JWT)
 * Refresh tokens are long-lived (7 days) and used to obtain new access tokens
 * Should be stored securely (HTTP-only cookie or secure storage)
 *
 * @param userId - User UUID
 * @param email - User email
 * @param role - User role
 * @param pharmacyId - Primary pharmacy ID
 * @returns Signed JWT refresh token
 */
function generateRefreshToken(userId, email, role, pharmacyId) {
    const payload = {
        userId,
        email,
        role,
        pharmacyId,
        type: TokenType.REFRESH,
    };
    try {
        const token = jwt.sign(payload, JWT_REFRESH_SECRET, {
            expiresIn: REFRESH_TOKEN_EXPIRES_IN,
            issuer: 'metapharm-connect',
            audience: 'metapharm-api',
        });
        return token;
    }
    catch (error) {
        console.error('Refresh token generation failed:', error);
        throw new Error('Failed to generate refresh token');
    }
}
/**
 * Generate both access and refresh tokens
 * Convenience function for login flows
 *
 * @param userId - User UUID
 * @param email - User email
 * @param role - User role
 * @param pharmacyId - Primary pharmacy ID
 * @returns Object containing access token, refresh token, and expiry info
 */
function generateTokenPair(userId, email, role, pharmacyId) {
    const accessToken = generateAccessToken(userId, email, role, pharmacyId);
    const refreshToken = generateRefreshToken(userId, email, role, pharmacyId);
    // Calculate expiry in seconds
    const expiresIn = parseExpiryToSeconds(JWT_EXPIRES_IN);
    return {
        accessToken,
        refreshToken,
        expiresIn,
    };
}
// ============================================================================
// Token Verification
// ============================================================================
/**
 * Verify and decode an access token
 *
 * @param token - JWT access token to verify
 * @returns Decoded JWT payload
 * @throws Error if token is invalid, expired, or malformed
 */
function verifyAccessToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET, {
            issuer: 'metapharm-connect',
            audience: 'metapharm-api',
        });
        if (decoded.type !== TokenType.ACCESS) {
            throw new Error('Invalid token type: expected access token');
        }
        return decoded;
    }
    catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new Error('Access token expired');
        }
        else if (error instanceof jwt.JsonWebTokenError) {
            throw new Error('Invalid access token');
        }
        else {
            throw new Error(`Token verification failed: ${error.message}`);
        }
    }
}
/**
 * Verify and decode a refresh token
 *
 * @param token - JWT refresh token to verify
 * @returns Decoded JWT payload
 * @throws Error if token is invalid, expired, or malformed
 */
function verifyRefreshToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
            issuer: 'metapharm-connect',
            audience: 'metapharm-api',
        });
        if (decoded.type !== TokenType.REFRESH) {
            throw new Error('Invalid token type: expected refresh token');
        }
        return decoded;
    }
    catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new Error('Refresh token expired');
        }
        else if (error instanceof jwt.JsonWebTokenError) {
            throw new Error('Invalid refresh token');
        }
        else {
            throw new Error(`Token verification failed: ${error.message}`);
        }
    }
}
/**
 * Decode a token without verification (useful for debugging)
 * WARNING: Do not use for authentication - this does not verify the signature
 *
 * @param token - JWT token to decode
 * @returns Decoded payload or null if invalid
 */
function decodeTokenUnsafe(token) {
    try {
        const decoded = jwt.decode(token);
        return decoded;
    }
    catch (error) {
        return null;
    }
}
// ============================================================================
// Token Utility Functions
// ============================================================================
/**
 * Extract token from Authorization header
 * Supports: "Bearer <token>"
 *
 * @param authHeader - Authorization header value
 * @returns Token string or null if not found
 */
function extractTokenFromHeader(authHeader) {
    if (!authHeader) {
        return null;
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }
    return parts[1];
}
/**
 * Check if a token is expired without verifying signature
 *
 * @param token - JWT token to check
 * @returns True if token is expired
 */
function isTokenExpired(token) {
    const decoded = decodeTokenUnsafe(token);
    if (!decoded || !decoded.exp) {
        return true;
    }
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now;
}
/**
 * Get remaining time until token expiry
 *
 * @param token - JWT token to check
 * @returns Remaining seconds or 0 if expired/invalid
 */
function getTokenTimeRemaining(token) {
    const decoded = decodeTokenUnsafe(token);
    if (!decoded || !decoded.exp) {
        return 0;
    }
    const now = Math.floor(Date.now() / 1000);
    const remaining = decoded.exp - now;
    return Math.max(0, remaining);
}
/**
 * Parse expiry string (e.g., "1h", "7d") to seconds
 *
 * @param expiry - Expiry string (e.g., "1h", "7d", "30m")
 * @returns Expiry in seconds
 */
function parseExpiryToSeconds(expiry) {
    const units = {
        s: 1,
        m: 60,
        h: 3600,
        d: 86400,
    };
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
        return 3600; // Default to 1 hour
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    return value * (units[unit] || 1);
}
/**
 * Refresh an access token using a refresh token
 * Validates the refresh token and generates a new access token
 *
 * @param refreshToken - Valid refresh token
 * @returns New token pair
 * @throws Error if refresh token is invalid or expired
 */
function refreshAccessToken(refreshToken) {
    const decoded = verifyRefreshToken(refreshToken);
    // Generate new token pair
    return generateTokenPair(decoded.userId, decoded.email, decoded.role, decoded.pharmacyId);
}
/**
 * Validate token structure without verifying signature
 * Useful for quick pre-validation
 *
 * @param token - Token string to validate
 * @returns True if token has valid JWT structure
 */
function hasValidTokenStructure(token) {
    if (!token || typeof token !== 'string') {
        return false;
    }
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
        return false;
    }
    // Check each part is non-empty, has minimum length, and is base64url encoded
    // Real JWT parts are typically 20+ characters minimum
    const base64UrlPattern = /^[A-Za-z0-9_-]+$/;
    const MIN_PART_LENGTH = 20;
    return parts.every(part => part.length >= MIN_PART_LENGTH &&
        base64UrlPattern.test(part));
}
/**
 * Sanitize token for logging
 * NEVER log full tokens - use this for debugging
 *
 * @param token - Token to sanitize
 * @returns Masked token string
 */
function sanitizeTokenForLogging(token) {
    if (!token)
        return '[no token]';
    if (token.length < 20)
        return '[invalid token]';
    return `${token.substring(0, 10)}...${token.substring(token.length - 10)}`;
}
//# sourceMappingURL=jwt.js.map