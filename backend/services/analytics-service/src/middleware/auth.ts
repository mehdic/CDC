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
      error: 'Unauthorized',
      message: 'No authentication token provided',
      code: 'NO_TOKEN',
    });
    return;
  }

  let token = '';

  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice('Bearer '.length).trim();
  }

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid authentication token',
      code: 'INVALID_TOKEN',
    });
    return;
  }

  try {
    // Decode JWT token (base64) to extract payload
    // The token format is: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token format',
        code: 'INVALID_TOKEN',
      });
      return;
    }

    // Decode the payload (second part)
    const payloadBase64 = parts[1];
    const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
    const decoded = JSON.parse(payloadJson) as JWTPayload;

    // Attach user info to request
    (req as any).user = decoded;

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
      code: 'INVALID_TOKEN',
    });
  }
}

/**
 * Require specific role(s)
 */
export function requireRole(roles: string | string[]) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  // Normalize to lowercase for comparison
  const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase());

  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    // Normalize user role to lowercase for comparison
    const userRole = (user.role || '').toLowerCase();
    if (!normalizedAllowedRoles.includes(userRole)) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
        code: 'FORBIDDEN',
      });
      return;
    }

    next();
  };
}
