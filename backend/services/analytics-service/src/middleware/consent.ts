/**
 * GDPR Consent Verification Middleware
 * Ensures user consent before tracking behavior data
 */

import { Request, Response, NextFunction } from 'express';
import { BehaviorService } from '../services/behaviorService';

/**
 * Middleware to verify GDPR consent for tracking
 * Attaches behaviorService instance to request
 */
export function requireTrackingConsent(behaviorService: BehaviorService) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get user ID from authenticated request
      const user = (req as any).user;

      if (!user || !user.userId) {
        res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User authentication required'
        });
        return;
      }

      // Check if user has consented to tracking
      const hasConsent = await behaviorService.hasTrackingConsent(user.userId);

      if (!hasConsent) {
        res.status(403).json({
          success: false,
          error: 'GDPR_CONSENT_REQUIRED',
          message: 'User has not consented to behavior tracking. Please grant consent first.',
          consentEndpoint: '/api/analytics/consent/grant'
        });
        return;
      }

      // Attach behavior service to request for use in controller
      (req as any).behaviorService = behaviorService;

      next();
    } catch (error) {
      console.error('[ConsentMiddleware] Error verifying consent:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to verify tracking consent'
      });
    }
  };
}

/**
 * Middleware for consent management endpoints (no consent required)
 * Only requires authentication
 */
export function attachBehaviorService(behaviorService: BehaviorService) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    (req as any).behaviorService = behaviorService;
    next();
  };
}

/**
 * Optional consent check - allows endpoints to work without consent
 * but tracks consent status
 */
export function optionalTrackingConsent(behaviorService: BehaviorService) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;

      if (user && user.userId) {
        const hasConsent = await behaviorService.hasTrackingConsent(user.userId);
        (req as any).hasTrackingConsent = hasConsent;
      } else {
        (req as any).hasTrackingConsent = false;
      }

      (req as any).behaviorService = behaviorService;
      next();
    } catch (error) {
      console.error('[ConsentMiddleware] Error checking optional consent:', error);
      (req as any).hasTrackingConsent = false;
      (req as any).behaviorService = behaviorService;
      next();
    }
  };
}
