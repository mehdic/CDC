/**
 * Nurse Authentication Middleware
 * Validates that the user has nurse role
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@shared/middleware/auth';
import { UserRole } from '@shared/models/User';
import { extractTokenFromHeader, verifyAccessToken, JWTPayload } from '@shared/utils/jwt';

export { AuthenticatedRequest };

/**
 * Middleware to require nurse role
 * In production, this would validate JWT tokens and check role
 */
export function requireNurseRole(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // Extract Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing Authorization header',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Extract token from header
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token format',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Verify JWT token
  try {
    const decoded = verifyAccessToken(token);

    // Attach user to request
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email,
      pharmacyId: decoded.pharmacyId || null,
      tokenPayload: decoded,
    };

    // Verify user has nurse role
    if (req.user.role !== UserRole.NURSE) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Nurse role required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  } catch (error) {
    const errorMessage = (error as Error).message;
    res.status(401).json({
      error: 'Unauthorized',
      message: errorMessage || 'Invalid or expired token',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Optional middleware for logging authenticated requests
 */
export function logAuthenticatedRequest(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  if (req.user) {
    console.info(
      `[Auth] ${req.method} ${req.path} - User: ${req.user.userId} (${req.user.role})`
    );
  }
  next();
}
