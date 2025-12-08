/**
 * Behavior Controller
 * Handles HTTP requests for user behavior tracking and analytics
 */

import { Request, Response } from 'express';
import { BehaviorService } from '../services/behaviorService';
import { UserEvent, EventType } from '../events/userEvents';

/**
 * Behavior Controller
 */
export class BehaviorController {
  private behaviorService: BehaviorService;

  constructor() {
    this.behaviorService = new BehaviorService();
  }

  /**
   * Get behavior service instance (for middleware)
   */
  getBehaviorService(): BehaviorService {
    return this.behaviorService;
  }

  /**
   * POST /api/analytics/consent/grant
   * Grant tracking consent for current user
   */
  grantConsent = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;

      if (!user || !user.userId) {
        res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User authentication required'
        });
        return;
      }

      await this.behaviorService.grantConsent(user.userId);

      res.status(200).json({
        success: true,
        message: 'Tracking consent granted successfully',
        userId: user.userId
      });
    } catch (error) {
      console.error('[BehaviorController] Error granting consent:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to grant consent'
      });
    }
  };

  /**
   * POST /api/analytics/consent/revoke
   * Revoke tracking consent for current user
   */
  revokeConsent = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;

      if (!user || !user.userId) {
        res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User authentication required'
        });
        return;
      }

      await this.behaviorService.revokeConsent(user.userId);

      res.status(200).json({
        success: true,
        message: 'Tracking consent revoked successfully',
        userId: user.userId
      });
    } catch (error) {
      console.error('[BehaviorController] Error revoking consent:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to revoke consent'
      });
    }
  };

  /**
   * GET /api/analytics/consent/status
   * Check consent status for current user
   */
  getConsentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;

      if (!user || !user.userId) {
        res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User authentication required'
        });
        return;
      }

      const status = await this.behaviorService.getConsentStatus(user.userId);

      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('[BehaviorController] Error checking consent status:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to check consent status'
      });
    }
  };

  /**
   * DELETE /api/analytics/data
   * Delete all behavior data for current user (GDPR Right to Erasure)
   */
  deleteUserData = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;

      if (!user || !user.userId) {
        res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User authentication required'
        });
        return;
      }

      await this.behaviorService.deleteUserData(user.userId);

      res.status(200).json({
        success: true,
        message: 'All user behavior data has been deleted',
        userId: user.userId
      });
    } catch (error) {
      console.error('[BehaviorController] Error deleting user data:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to delete user data'
      });
    }
  };

  /**
   * POST /api/analytics/events
   * Track a user behavior event (requires consent)
   */
  trackEvent = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;

      if (!user || !user.userId) {
        res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User authentication required'
        });
        return;
      }

      // Validate request body
      const { eventType, sessionId, ...eventData } = req.body;

      if (!eventType || !sessionId) {
        res.status(400).json({
          success: false,
          error: 'INVALID_REQUEST',
          message: 'eventType and sessionId are required'
        });
        return;
      }

      if (!Object.values(EventType).includes(eventType)) {
        res.status(400).json({
          success: false,
          error: 'INVALID_EVENT_TYPE',
          message: `Invalid event type: ${eventType}`
        });
        return;
      }

      // Create event object
      const event: UserEvent = {
        eventType,
        userId: user.userId,
        sessionId,
        timestamp: new Date(),
        ...eventData
      } as UserEvent;

      // Track event (consent is verified in middleware)
      await this.behaviorService.trackEvent(event);

      res.status(201).json({
        success: true,
        message: 'Event tracked successfully',
        eventType
      });
    } catch (error: any) {
      console.error('[BehaviorController] Error tracking event:', error);

      if (error.message?.includes('GDPR_CONSENT_REQUIRED')) {
        res.status(403).json({
          success: false,
          error: 'GDPR_CONSENT_REQUIRED',
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to track event'
      });
    }
  };

  /**
   * GET /api/analytics/users/:userId/segment
   * Get user segment classification (requires consent)
   */
  getUserSegment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const user = (req as any).user;

      // Users can only access their own segment (unless admin)
      if (user.userId !== userId && user.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: 'Access denied'
        });
        return;
      }

      const segmentData = await this.behaviorService.getUserSegment(userId);

      if (!segmentData) {
        res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'No segment data available. User may not have consented to tracking.'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: segmentData
      });
    } catch (error) {
      console.error('[BehaviorController] Error getting user segment:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get user segment'
      });
    }
  };

  /**
   * GET /api/analytics/users/:userId/churn-risk
   * Get churn risk prediction (requires consent)
   */
  getChurnRisk = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const user = (req as any).user;

      // Users can only access their own churn risk (unless admin)
      if (user.userId !== userId && user.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: 'Access denied'
        });
        return;
      }

      const churnData = await this.behaviorService.getChurnRisk(userId);

      if (!churnData) {
        res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'No churn data available. User may not have consented to tracking.'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: churnData
      });
    } catch (error) {
      console.error('[BehaviorController] Error getting churn risk:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get churn risk'
      });
    }
  };

  /**
   * GET /api/analytics/users/:userId/events
   * Get user events history (requires consent)
   */
  getUserEvents = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const user = (req as any).user;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

      // Users can only access their own events (unless admin)
      if (user.userId !== userId && user.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: 'Access denied'
        });
        return;
      }

      const events = await this.behaviorService.getUserEvents(userId, limit);

      res.status(200).json({
        success: true,
        data: {
          userId,
          events,
          count: events.length
        }
      });
    } catch (error) {
      console.error('[BehaviorController] Error getting user events:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get user events'
      });
    }
  };

  /**
   * GET /api/analytics/segments/:segment/users
   * Get users in a specific segment (admin only)
   */
  getUsersBySegment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { segment } = req.params;
      const user = (req as any).user;

      // Admin only
      if (user.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: 'Admin access required'
        });
        return;
      }

      const userIds = await this.behaviorService.getUsersBySegment(segment as any);

      res.status(200).json({
        success: true,
        data: {
          segment,
          userIds,
          count: userIds.length
        }
      });
    } catch (error) {
      console.error('[BehaviorController] Error getting users by segment:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get users by segment'
      });
    }
  };

  /**
   * GET /api/analytics/at-risk
   * Get users at risk of churning (admin only)
   */
  getAtRiskUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;

      // Admin only
      if (user.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: 'Admin access required'
        });
        return;
      }

      const minRisk = req.query.minRisk ? parseFloat(req.query.minRisk as string) : 0.5;
      const atRiskUsers = await this.behaviorService.getAtRiskUsers(minRisk);

      res.status(200).json({
        success: true,
        data: {
          atRiskUsers,
          count: atRiskUsers.length,
          minRisk
        }
      });
    } catch (error) {
      console.error('[BehaviorController] Error getting at-risk users:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get at-risk users'
      });
    }
  };

  /**
   * GET /api/analytics/statistics
   * Get aggregated statistics (admin only, no PII)
   */
  getStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;

      // Admin only
      if (user.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: 'Admin access required'
        });
        return;
      }

      const statistics = await this.behaviorService.getStatistics();

      res.status(200).json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('[BehaviorController] Error getting statistics:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get statistics'
      });
    }
  };
}
