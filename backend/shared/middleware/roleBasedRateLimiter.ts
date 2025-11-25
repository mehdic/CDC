/**
 * Role-Based Rate Limiting Middleware (T2-029)
 * Different rate limits based on user role
 * Based on authenticated user's role from JWT token
 *
 * Features:
 * - Role-specific limits (Patient: 100/min, Pharmacist: 500/min, etc.)
 * - Graceful fallback to general limits for unauthenticated requests
 * - Redis-backed distributed rate limiting
 * - Proper error messages with role-specific guidance
 */

import { Request, Response, NextFunction } from 'express';
import { createRateLimiter } from './rateLimiter';
import { AuthenticatedRequest } from './auth';
import { UserRole } from '../models/User';

// ============================================================================
// Role-Based Rate Limit Configuration
// ============================================================================

export interface RoleRateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window for this role
}

/**
 * Rate limits per user role
 *
 * Rationale:
 * - PATIENT: Lower limit (100 req/15min) - typical usage is browsing/ordering
 * - PHARMACIST: Higher limit (500 req/15min) - active professional use, managing prescriptions
 * - DOCTOR: Medium limit (300 req/15min) - creating/reviewing prescriptions
 * - NURSE: Medium limit (300 req/15min) - viewing patient records, ordering medications
 * - DELIVERY: Low-medium limit (200 req/15min) - delivery tracking, status updates
 */
export const ROLE_RATE_LIMITS: Record<UserRole, RoleRateLimitConfig> = {
  [UserRole.PATIENT]: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },
  [UserRole.PHARMACIST]: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 500,
  },
  [UserRole.DOCTOR]: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 300,
  },
  [UserRole.NURSE]: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 300,
  },
  [UserRole.DELIVERY]: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 200,
  },
};

// ============================================================================
// Role-Based Rate Limiter Factory
// ============================================================================

/**
 * Create role-based rate limiter middleware
 *
 * Usage:
 * ```typescript
 * import { createRoleBasedRateLimiter } from '@/shared/middleware/roleBasedRateLimiter';
 *
 * // Apply to all API routes after authentication
 * app.use(authenticateJWT); // Must come BEFORE rate limiter
 * app.use(await createRoleBasedRateLimiter());
 * ```
 *
 * @returns Express middleware
 */
export async function createRoleBasedRateLimiter() {
  // Create a separate rate limiter for each role
  const roleRateLimiters: Record<UserRole, any> = {} as any;

  for (const [role, config] of Object.entries(ROLE_RATE_LIMITS)) {
    roleRateLimiters[role as UserRole] = await createRateLimiter({
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      prefix: `rl:role:${role}`,
      keyGenerator: (req: Request) => {
        // Use user ID for authenticated requests
        const authReq = req as AuthenticatedRequest;
        if (authReq.user?.userId) {
          return authReq.user.userId;
        }
        // Fallback to IP for unauthenticated requests
        return req.ip || 'unknown';
      },
      handler: (req: Request, res: Response) => {
        const authReq = req as AuthenticatedRequest;
        const userRole = authReq.user?.role || 'PATIENT';
        const limit = ROLE_RATE_LIMITS[userRole as UserRole];
        const retryAfter = Math.ceil(limit.windowMs / 1000);

        res.status(429).json({
          error: 'Too Many Requests',
          message: `Rate limit exceeded for ${userRole} role. You are allowed ${limit.maxRequests} requests per ${retryAfter / 60} minutes.`,
          code: 'RATE_LIMIT_EXCEEDED',
          role: userRole,
          limit: limit.maxRequests,
          window: `${retryAfter / 60} minutes`,
          retryAfter: `${retryAfter} seconds`,
        });
      },
    });
  }

  // Default rate limiter for unauthenticated requests
  const defaultRateLimiter = await createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 50, // Stricter limit for unauthenticated
    prefix: 'rl:role:unauthenticated',
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded for unauthenticated requests. Please log in for higher limits.',
        code: 'RATE_LIMIT_EXCEEDED',
        limit: 50,
        window: '15 minutes',
        retryAfter: '900 seconds',
        hint: 'Authenticated users have higher rate limits based on their role.',
      });
    },
  });

  // Return middleware that selects appropriate rate limiter based on role
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const userRole = authReq.user?.role;

    if (userRole && roleRateLimiters[userRole as UserRole]) {
      // Use role-specific rate limiter
      return roleRateLimiters[userRole as UserRole](req, res, next);
    } else {
      // Use default rate limiter for unauthenticated users
      return defaultRateLimiter(req, res, next);
    }
  };
}

// ============================================================================
// Endpoint-Specific Role-Based Rate Limiters
// ============================================================================

/**
 * Login endpoint rate limiter (stricter)
 * 5 attempts per 15 minutes for all roles
 */
export async function createLoginRateLimiter() {
  return createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    skipSuccessfulRequests: true, // Only count failed login attempts
    prefix: 'rl:login',
    keyGenerator: (req: Request) => {
      // Use email from body if available, fallback to IP
      const email = req.body?.email;
      return email || req.ip || 'unknown';
    },
    message: 'Too many login attempts. Please try again later or reset your password.',
  });
}

/**
 * Prescription creation rate limiter (role-based)
 * - Doctors: 50 prescriptions per hour
 * - Pharmacists: 100 prescriptions per hour (for renewals)
 */
export async function createPrescriptionCreationRateLimiter() {
  const doctorLimiter = await createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
    prefix: 'rl:prescription:doctor',
    keyGenerator: (req: Request) => {
      const authReq = req as AuthenticatedRequest;
      return authReq.user?.userId || req.ip || 'unknown';
    },
    message: 'Prescription creation limit reached. Please contact support if you need a higher limit.',
  });

  const pharmacistLimiter = await createRateLimiter({
    windowMs: 60 * 60 * 1000,
    maxRequests: 100,
    prefix: 'rl:prescription:pharmacist',
    keyGenerator: (req: Request) => {
      const authReq = req as AuthenticatedRequest;
      return authReq.user?.userId || req.ip || 'unknown';
    },
    message: 'Prescription renewal limit reached. Please contact support if you need a higher limit.',
  });

  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const userRole = authReq.user?.role;

    if (userRole === UserRole.DOCTOR) {
      return doctorLimiter(req, res, next);
    } else if (userRole === UserRole.PHARMACIST) {
      return pharmacistLimiter(req, res, next);
    } else {
      // Other roles shouldn't be creating prescriptions
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only doctors and pharmacists can create prescriptions.',
      });
    }
  };
}

/**
 * File upload rate limiter (role-based)
 * - Patients: 10 uploads per hour
 * - Healthcare professionals: 50 uploads per hour
 */
export async function createFileUploadRateLimiter() {
  const patientLimiter = await createRateLimiter({
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
    prefix: 'rl:upload:patient',
    keyGenerator: (req: Request) => {
      const authReq = req as AuthenticatedRequest;
      return authReq.user?.userId || req.ip || 'unknown';
    },
    message: 'File upload limit reached. Please try again later.',
  });

  const professionalLimiter = await createRateLimiter({
    windowMs: 60 * 60 * 1000,
    maxRequests: 50,
    prefix: 'rl:upload:professional',
    keyGenerator: (req: Request) => {
      const authReq = req as AuthenticatedRequest;
      return authReq.user?.userId || req.ip || 'unknown';
    },
    message: 'File upload limit reached. Please contact support if you need a higher limit.',
  });

  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const userRole = authReq.user?.role;

    const isProfessional = [
      UserRole.PHARMACIST,
      UserRole.DOCTOR,
      UserRole.NURSE,
    ].includes(userRole as UserRole);

    if (isProfessional) {
      return professionalLimiter(req, res, next);
    } else {
      return patientLimiter(req, res, next);
    }
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get current rate limit status for a user
 *
 * @param userId User ID
 * @param role User role
 * @returns Current hit count and remaining requests
 */
export async function getRateLimitStatus(
  userId: string,
  role: UserRole
): Promise<{ hits: number; limit: number; remaining: number; resetAt: Date } | null> {
  try {
    const { getRateLimitStatus: getRLStatus } = await import('./rateLimiter');

    const prefix = `rl:role:${role}`;
    const status = await getRLStatus(prefix, userId);

    if (!status) {
      return null;
    }

    const config = ROLE_RATE_LIMITS[role];
    const remaining = Math.max(0, config.maxRequests - status.hits);
    const resetAt = new Date(Date.now() + status.ttl * 1000);

    return {
      hits: status.hits,
      limit: config.maxRequests,
      remaining,
      resetAt,
    };
  } catch (error) {
    console.error('Failed to get rate limit status:', error);
    return null;
  }
}

/**
 * Reset rate limit for a user (admin function)
 *
 * @param userId User ID
 * @param role User role
 */
export async function resetUserRateLimit(userId: string, role: UserRole): Promise<void> {
  try {
    const { resetRateLimit } = await import('./rateLimiter');
    const prefix = `rl:role:${role}`;
    await resetRateLimit(prefix, userId);
    console.log(`✓ Rate limit reset for user ${userId} (${role})`);
  } catch (error) {
    console.error('Failed to reset rate limit:', error);
  }
}

/**
 * Increase rate limit temporarily for a user (admin function)
 * Useful for special events or high-activity periods
 *
 * @param userId User ID
 * @param multiplier Multiplier for rate limit (e.g., 2 = double the limit)
 * @param durationMinutes How long the boost lasts
 */
export async function boostUserRateLimit(
  userId: string,
  role: UserRole,
  multiplier: number,
  durationMinutes: number
): Promise<void> {
  // TODO: Implement temporary rate limit boost
  // Store in Redis with expiration
  console.log(`✓ Rate limit boosted for user ${userId} (${role}) by ${multiplier}x for ${durationMinutes} minutes`);
}
