/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user info to request
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Authenticate JWT token
 * Attaches user info to req.user
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Authorization header required',
    });
  }

  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token required',
    });
  }

  try {
    // In production, would verify JWT with shared secret
    // For now, we'll decode without verification (mock implementation)
    // Real implementation would use jsonwebtoken library:
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Mock decoded payload (replace with real JWT verification)
    const decoded = {
      userId: 'mock-user-id', // Would be extracted from real JWT
      email: 'mock@example.com',
      role: 'pharmacist',
    };

    // Attach user info to request
    (req as any).user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
}

/**
 * Require specific role(s)
 */
export function requireRole(roles: string | string[]) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Insufficient permissions',
      });
    }

    next();
  };
}
