/**
 * Nurse Authentication Middleware
 * Validates that the user has nurse role
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@shared/middleware/auth';
import { UserRole } from '@shared/models/User';

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

  // In production, validate JWT token here
  // For now, we'll do a simple check
  try {
    // Mock user extraction from token
    // TODO: Implement proper JWT validation
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token format',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Mock user object
    // In production, decode JWT and extract user info
    req.user = {
      userId: 'nurse-user-id', // Extract from JWT
      role: UserRole.NURSE, // Extract from JWT
      email: 'nurse@example.com', // Extract from JWT
      pharmacyId: null,
      tokenPayload: {} as any,
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
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
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
    console.log(
      `[Auth] ${req.method} ${req.path} - User: ${req.user.userId} (${req.user.role})`
    );
  }
  next();
}
