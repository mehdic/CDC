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
import {
  extractTokenFromHeader,
  verifyAccessToken,
  JWTPayload,
  sanitizeTokenForLogging,
} from '../utils/jwt';
import { UserRole } from '../models/User';

// ============================================================================
// Extended Request Type with User Context
// ============================================================================

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

// ============================================================================
// Authentication Middleware (T041)
// ============================================================================

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
export function authenticateJWT(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      console.warn('Authentication failed: No token provided', {
        ip: req.ip,
        path: req.path,
        method: req.method,
      });

      res.status(401).json({
        error: 'Unauthorized',
        message: 'No authentication token provided',
        code: 'NO_TOKEN',
      });
      return;
    }

    // Verify token
    let decoded: JWTPayload;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      const errorMessage = (error as Error).message;

      console.warn('Authentication failed: Invalid token', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        error: errorMessage,
        token: sanitizeTokenForLogging(token),
      });

      // Provide specific error messages for different failure cases
      if (errorMessage.includes('expired')) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Access token expired. Please refresh your token.',
          code: 'TOKEN_EXPIRED',
        });
        return;
      }

      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid authentication token',
        code: 'INVALID_TOKEN',
      });
      return;
    }

    // Attach user context to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      pharmacyId: decoded.pharmacyId,
      tokenPayload: decoded,
    };

    // Log successful authentication (for audit trail - FR-007)
    console.info('Authentication successful', {
      userId: decoded.userId,
      role: decoded.role,
      ip: req.ip,
      path: req.path,
      method: req.method,
    });

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication processing failed',
      code: 'AUTH_ERROR',
    });
  }
}

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
export function optionalAuthenticateJWT(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    // If no token, proceed without authentication
    if (!token) {
      next();
      return;
    }

    // Verify token if provided
    try {
      const decoded = verifyAccessToken(token);

      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        pharmacyId: decoded.pharmacyId,
        tokenPayload: decoded,
      };

      console.info('Optional authentication successful', {
        userId: decoded.userId,
        role: decoded.role,
        ip: req.ip,
        path: req.path,
      });
    } catch (error) {
      // Token was provided but invalid - log but don't reject
      console.warn('Optional authentication failed: Invalid token', {
        ip: req.ip,
        path: req.path,
        error: (error as Error).message,
      });
    }

    next();
  } catch (error) {
    console.error('Optional authentication middleware error:', error);
    // Even on error, proceed without authentication
    next();
  }
}

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
export function requireMFA(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'NO_AUTH',
    });
    return;
  }

  // Check if token includes MFA verified flag
  // This would be set during login after MFA verification
  const mfaVerified = (req.user.tokenPayload as any).mfaVerified === true;

  if (!mfaVerified) {
    console.warn('MFA required but not verified', {
      userId: req.user.userId,
      role: req.user.role,
      ip: req.ip,
      path: req.path,
    });

    res.status(403).json({
      error: 'Forbidden',
      message: 'Multi-factor authentication required',
      code: 'MFA_REQUIRED',
    });
    return;
  }

  next();
}

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
export function requireHINAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'NO_AUTH',
    });
    return;
  }

  // Check if token includes HIN authentication flag
  const hinAuthenticated = (req.user.tokenPayload as any).hinAuthenticated === true;

  if (!hinAuthenticated) {
    console.warn('HIN e-ID authentication required but not present', {
      userId: req.user.userId,
      role: req.user.role,
      ip: req.ip,
      path: req.path,
    });

    res.status(403).json({
      error: 'Forbidden',
      message: 'Swiss HIN e-ID authentication required',
      code: 'HIN_AUTH_REQUIRED',
    });
    return;
  }

  next();
}

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
export function requirePharmacyAffiliation(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'NO_AUTH',
    });
    return;
  }

  if (!req.user.pharmacyId) {
    console.warn('Pharmacy affiliation required but not present', {
      userId: req.user.userId,
      role: req.user.role,
      ip: req.ip,
      path: req.path,
    });

    res.status(403).json({
      error: 'Forbidden',
      message: 'Pharmacy affiliation required for this operation',
      code: 'NO_PHARMACY_AFFILIATION',
    });
    return;
  }

  next();
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Extract user ID from request
 * Helper function for routes that need user ID
 *
 * @param req - Express request
 * @returns User ID or null if not authenticated
 */
export function getUserIdFromRequest(req: AuthenticatedRequest): string | null {
  return req.user?.userId || null;
}

/**
 * Extract pharmacy ID from request
 * Helper function for routes that need pharmacy context
 *
 * @param req - Express request
 * @returns Pharmacy ID or null if not authenticated or not affiliated
 */
export function getPharmacyIdFromRequest(req: AuthenticatedRequest): string | null {
  return req.user?.pharmacyId || null;
}

/**
 * Check if user is authenticated
 * Helper function for conditional logic
 *
 * @param req - Express request
 * @returns True if user is authenticated
 */
export function isAuthenticated(req: AuthenticatedRequest): boolean {
  return req.user !== undefined;
}

/**
 * Get user role from request
 * Helper function for role-based logic
 *
 * @param req - Express request
 * @returns User role or null if not authenticated
 */
export function getUserRoleFromRequest(req: AuthenticatedRequest): UserRole | null {
  return req.user?.role || null;
}
