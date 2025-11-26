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
import { UserRole } from '../models/User';
export declare enum TokenType {
    ACCESS = "access",
    REFRESH = "refresh"
}
/**
 * JWT Payload structure
 * Contains user identity, role, and pharmacy context
 */
export interface JWTPayload {
    userId: string;
    email: string;
    role: UserRole;
    pharmacyId: string | null;
    type: TokenType;
    iat?: number;
    exp?: number;
}
/**
 * Token generation result
 */
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
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
export declare function generateAccessToken(userId: string, email: string, role: UserRole, pharmacyId: string | null): string;
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
export declare function generateRefreshToken(userId: string, email: string, role: UserRole, pharmacyId: string | null): string;
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
export declare function generateTokenPair(userId: string, email: string, role: UserRole, pharmacyId: string | null): TokenPair;
/**
 * Verify and decode an access token
 *
 * @param token - JWT access token to verify
 * @returns Decoded JWT payload
 * @throws Error if token is invalid, expired, or malformed
 */
export declare function verifyAccessToken(token: string): JWTPayload;
/**
 * Verify and decode a refresh token
 *
 * @param token - JWT refresh token to verify
 * @returns Decoded JWT payload
 * @throws Error if token is invalid, expired, or malformed
 */
export declare function verifyRefreshToken(token: string): JWTPayload;
/**
 * Decode a token without verification (useful for debugging)
 * WARNING: Do not use for authentication - this does not verify the signature
 *
 * @param token - JWT token to decode
 * @returns Decoded payload or null if invalid
 */
export declare function decodeTokenUnsafe(token: string): JWTPayload | null;
/**
 * Extract token from Authorization header
 * Supports: "Bearer <token>"
 *
 * @param authHeader - Authorization header value
 * @returns Token string or null if not found
 */
export declare function extractTokenFromHeader(authHeader: string | undefined): string | null;
/**
 * Check if a token is expired without verifying signature
 *
 * @param token - JWT token to check
 * @returns True if token is expired
 */
export declare function isTokenExpired(token: string): boolean;
/**
 * Get remaining time until token expiry
 *
 * @param token - JWT token to check
 * @returns Remaining seconds or 0 if expired/invalid
 */
export declare function getTokenTimeRemaining(token: string): number;
/**
 * Refresh an access token using a refresh token
 * Validates the refresh token and generates a new access token
 *
 * @param refreshToken - Valid refresh token
 * @returns New token pair
 * @throws Error if refresh token is invalid or expired
 */
export declare function refreshAccessToken(refreshToken: string): TokenPair;
/**
 * Validate token structure without verifying signature
 * Useful for quick pre-validation
 *
 * @param token - Token string to validate
 * @returns True if token has valid JWT structure
 */
export declare function hasValidTokenStructure(token: string): boolean;
/**
 * Sanitize token for logging
 * NEVER log full tokens - use this for debugging
 *
 * @param token - Token to sanitize
 * @returns Masked token string
 */
export declare function sanitizeTokenForLogging(token: string): string;
//# sourceMappingURL=jwt.d.ts.map