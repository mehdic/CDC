/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user info to request
 */

import { Request, Response, NextFunction } from 'express';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  pharmacyId?: string;
}

/**
 * Authenticate JWT token
 * Attaches user info to req.user
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      success: false,
      error: 'Authorization header required',
    });
    return;
  }

  let token = '';

  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice('Bearer '.length).trim();
  }

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Token required',
    });
    return;
  }

  try {
    // In production, would verify JWT with shared secret
    // For now, we'll decode without verification (mock implementation)
    // Real implementation would use jsonwebtoken library:
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Mock decoded payload (replace with real JWT verification)
    const decoded: JWTPayload = {
      userId: 'mock-user-id', // Would be extracted from real JWT
      email: 'mock@example.com',
      role: 'pharmacist',
      pharmacyId: 'mock-pharmacy-id',
    };

    // Attach user info to request
    (req as any).user = decoded;

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
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

  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        success: false,
        error: 'Forbidden: Insufficient permissions',
      });
      return;
    }

    next();
  };
}
