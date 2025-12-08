/**
 * Behavior Tracking Routes
 * Defines API routes for user behavior tracking and analytics
 */

import { Router } from 'express';
import { BehaviorController } from '../controllers/behaviorController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { requireTrackingConsent, attachBehaviorService } from '../middleware/consent';

/**
 * Create behavior routes with proper authentication and consent checks
 */
export function createBehaviorRoutes(behaviorController: BehaviorController): Router {
  const router = Router();
  const behaviorService = behaviorController.getBehaviorService();

  // ============================================================================
  // Consent Management Routes (no consent required, only authentication)
  // ============================================================================

  /**
   * POST /api/analytics/consent/grant
   * Grant tracking consent for current user
   */
  router.post(
    '/consent/grant',
    authenticateToken,
    attachBehaviorService(behaviorService),
    behaviorController.grantConsent
  );

  /**
   * POST /api/analytics/consent/revoke
   * Revoke tracking consent for current user
   */
  router.post(
    '/consent/revoke',
    authenticateToken,
    attachBehaviorService(behaviorService),
    behaviorController.revokeConsent
  );

  /**
   * GET /api/analytics/consent/status
   * Check consent status for current user
   */
  router.get(
    '/consent/status',
    authenticateToken,
    attachBehaviorService(behaviorService),
    behaviorController.getConsentStatus
  );

  /**
   * DELETE /api/analytics/data
   * Delete all behavior data for current user (GDPR Right to Erasure)
   * Does not require consent (user right)
   */
  router.delete(
    '/data',
    authenticateToken,
    attachBehaviorService(behaviorService),
    behaviorController.deleteUserData
  );

  // ============================================================================
  // Event Tracking Routes (require consent)
  // ============================================================================

  /**
   * POST /api/analytics/events
   * Track a user behavior event
   * Requires: authentication + tracking consent
   */
  router.post(
    '/events',
    authenticateToken,
    requireTrackingConsent(behaviorService),
    behaviorController.trackEvent
  );

  /**
   * GET /api/analytics/users/:userId/events
   * Get user events history
   * Requires: authentication + tracking consent
   */
  router.get(
    '/users/:userId/events',
    authenticateToken,
    behaviorController.getUserEvents
  );

  // ============================================================================
  // User Segmentation Routes (require consent)
  // ============================================================================

  /**
   * GET /api/analytics/users/:userId/segment
   * Get user segment classification
   * Requires: authentication (consent checked in service)
   */
  router.get(
    '/users/:userId/segment',
    authenticateToken,
    behaviorController.getUserSegment
  );

  /**
   * GET /api/analytics/users/:userId/churn-risk
   * Get churn risk prediction for user
   * Requires: authentication (consent checked in service)
   */
  router.get(
    '/users/:userId/churn-risk',
    authenticateToken,
    behaviorController.getChurnRisk
  );

  // ============================================================================
  // Admin Analytics Routes (require admin role)
  // ============================================================================

  /**
   * GET /api/analytics/segments/:segment/users
   * Get users in a specific segment
   * Requires: authentication + admin role
   */
  router.get(
    '/segments/:segment/users',
    authenticateToken,
    requireRole('admin'),
    behaviorController.getUsersBySegment
  );

  /**
   * GET /api/analytics/at-risk
   * Get users at risk of churning
   * Requires: authentication + admin role
   */
  router.get(
    '/at-risk',
    authenticateToken,
    requireRole('admin'),
    behaviorController.getAtRiskUsers
  );

  /**
   * GET /api/analytics/statistics
   * Get aggregated statistics (no PII)
   * Requires: authentication + admin role
   */
  router.get(
    '/statistics',
    authenticateToken,
    requireRole('admin'),
    behaviorController.getStatistics
  );

  return router;
}
