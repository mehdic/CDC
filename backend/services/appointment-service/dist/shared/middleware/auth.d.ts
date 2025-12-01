/**
 * JWT Authentication Middleware (T041)
 * Implements JWT token validation and user context injection
 * Based on: /specs/002-metapharm-platform/plan.md
 *
 * Security Requirements:
 * - JWT-based authentication (FR-006)
 * - Session timeout after 30 minutes inactivity (FR-006)
 * - Audit logging for authentication events (FR-007)
 * - Reject expired/invalid tokens
 */
import { Request, Response, NextFunction } from 'express';
import { JWTPayload } from '../utils/jwt';
import { UserRole } from '../models/User';
/**
 * Authenticated user context injected into request
 * Available in all routes protected by authenticateJWT middleware
 */
export interface AuthenticatedUser {
    userId: string;
    email: string;
    role: UserRole;
    pharmacyId: string | null;
    tokenPayload: JWTPayload;
}
/**
 * Express Request extended with authenticated user
 * Use this type in route handlers to access user context
 */
export interface AuthenticatedRequest extends Request {
    user?: AuthenticatedUser;
}
/**
 * JWT Authentication Middleware
 * Validates JWT token from Authorization header and attaches user to request
 *
 * Usage in routes:
 * ```
 * router.get('/protected', authenticateJWT, (req: AuthenticatedRequest, res) => {
 *   const { userId, role } = req.user!;
 *   // ... route logic
 * });
 * ```
 *
 * Security features:
 * - Validates token signature
 * - Checks token expiration
 * - Rejects tokens with invalid structure
 * - Logs authentication failures for audit trail
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export declare function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
/**
 * Optional JWT Authentication Middleware
 * Attaches user to request if token is provided and valid, but does not reject if missing
 *
 * Useful for routes that have different behavior for authenticated vs. unauthenticated users
 *
 * Usage:
 * ```
 * router.get('/public', optionalAuthenticateJWT, (req: AuthenticatedRequest, res) => {
 *   if (req.user) {
 *     // Authenticated user - show personalized content
 *   } else {
 *     // Anonymous user - show public content
 *   }
 * });
 * ```
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export declare function optionalAuthenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
/**
 * Require MFA Middleware
 * Ensures user has completed MFA verification
 * Must be used AFTER authenticateJWT middleware
 *
 * Usage:
 * ```
 * router.get('/sensitive', authenticateJWT, requireMFA, (req, res) => {
 *   // Only accessible by users who have completed MFA
 * });
 * ```
 *
 * Note: This checks if MFA was verified during login. The actual MFA verification
 * is handled by the Auth Service (T046-T047).
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export declare function requireMFA(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
/**
 * Require HIN e-ID Middleware
 * Ensures user authenticated via Swiss HIN e-ID
 * Required for doctors and pharmacists per FR-003
 *
 * Usage:
 * ```
 * router.get('/doctor-only', authenticateJWT, requireHINAuth, (req, res) => {
 *   // Only accessible by HIN-authenticated users
 * });
 * ```
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export declare function requireHINAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
/**
 * Require Pharmacy Affiliation Middleware
 * Ensures user is affiliated with a pharmacy
 * Required for pharmacists and some operations
 *
 * Usage:
 * ```
 * router.get('/pharmacy-staff', authenticateJWT, requirePharmacyAffiliation, (req, res) => {
 *   const { pharmacyId } = req.user!;
 *   // ... pharmacy-specific logic
 * });
 * ```
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export declare function requirePharmacyAffiliation(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
/**
 * Extract user ID from request
 * Helper function for routes that need user ID
 *
 * @param req - Express request
 * @returns User ID or null if not authenticated
 */
export declare function getUserIdFromRequest(req: AuthenticatedRequest): string | null;
/**
 * Extract pharmacy ID from request
 * Helper function for routes that need pharmacy context
 *
 * @param req - Express request
 * @returns Pharmacy ID or null if not authenticated or not affiliated
 */
export declare function getPharmacyIdFromRequest(req: AuthenticatedRequest): string | null;
/**
 * Check if user is authenticated
 * Helper function for conditional logic
 *
 * @param req - Express request
 * @returns True if user is authenticated
 */
export declare function isAuthenticated(req: AuthenticatedRequest): boolean;
/**
 * Get user role from request
 * Helper function for role-based logic
 *
 * @param req - Express request
 * @returns User role or null if not authenticated
 */
export declare function getUserRoleFromRequest(req: AuthenticatedRequest): UserRole | null;
//# sourceMappingURL=auth.d.ts.map