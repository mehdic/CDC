/**
 * Referral Controller
 * REST API endpoints for referral program management
 * T6-024: Implement referral program for patient acquisition
 */

import { Router, Request, Response } from 'express';
import { ReferralService } from '../services/ReferralService';
import { VipService } from '../services/VipService';

export class ReferralController {
  private router: Router;
  private referralService: ReferralService;
  private vipService: VipService;

  constructor() {
    this.router = Router();
    this.referralService = new ReferralService();
    this.vipService = new VipService();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Create new referral
    this.router.post('/referrals', this.createReferral.bind(this));

    // Get referral by code
    this.router.get('/referrals/:code', this.getReferralByCode.bind(this));

    // Complete referral (mark as completed when referee makes purchase)
    this.router.post('/referrals/:code/complete', this.completeReferral.bind(this));

    // Apply reward
    this.router.post('/rewards/:rewardId/apply', this.applyReward.bind(this));

    // Get user's referral statistics
    this.router.get('/users/:userId/referral-stats', this.getReferralStats.bind(this));

    // Get user's referral history
    this.router.get('/users/:userId/referrals', this.getUserReferrals.bind(this));

    // Get user's unclaimed rewards
    this.router.get('/users/:userId/unclaimed-rewards', this.getUnclaimedRewards.bind(this));

    // Get leaderboard
    this.router.get('/leaderboard', this.getLeaderboard.bind(this));

    // Cancel referral
    this.router.post('/referrals/:referralId/cancel', this.cancelReferral.bind(this));
  }

  /**
   * POST /referrals
   * Create new referral code for authenticated user
   */
  private async createReferral(req: Request, res: Response): Promise<void> {
    try {
      const { refereeEmail, refereePhone, referrerReward = 50, refereeReward = 20 } = req.body;

      // TODO: Get userId from authenticated request
      const userId = req.headers['x-user-id'] as string;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const referral = await this.referralService.createReferral(
        userId,
        refereeEmail,
        refereePhone,
        referrerReward,
        refereeReward,
      );

      res.status(201).json({
        success: true,
        data: {
          id: referral.id,
          referralCode: referral.referral_code,
          status: referral.status,
          expiresAt: referral.expires_at,
          shareText: referral.getShareText('https://app.metapharm.ch'),
        },
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to create referral',
      });
    }
  }

  /**
   * GET /referrals/:code
   * Get referral details by code
   */
  private async getReferralByCode(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;

      const referral = await this.referralService.getReferralByCode(code);

      if (!referral) {
        res.status(404).json({ error: 'Referral code not found' });
        return;
      }

      res.json({
        success: true,
        data: {
          id: referral.id,
          code: referral.referral_code,
          status: referral.status,
          isActive: referral.isActive(),
          isExpired: referral.isExpired(),
          expiresAt: referral.expires_at,
          referrerReward: referral.referrer_reward,
          refereeReward: referral.referee_reward,
        },
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to retrieve referral',
      });
    }
  }

  /**
   * POST /referrals/:code/complete
   * Mark referral as completed when referee makes first purchase
   */
  private async completeReferral(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;
      const { refereeId, orderId } = req.body;

      if (!refereeId || !orderId) {
        res.status(400).json({ error: 'refereeId and orderId are required' });
        return;
      }

      const { referral, rewards } = await this.referralService.completeReferral(
        code,
        refereeId,
        orderId,
      );

      res.json({
        success: true,
        data: {
          referral: {
            id: referral.id,
            status: referral.status,
            completedAt: referral.completed_at,
          },
          rewards: rewards.map((r) => ({
            id: r.id,
            recipientId: r.recipient_id,
            rewardType: r.reward_type,
            rewardValue: r.reward_value,
            isApplied: r.is_applied,
          })),
        },
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to complete referral',
      });
    }
  }

  /**
   * POST /rewards/:rewardId/apply
   * Apply reward to user account (add points to VIP membership)
   */
  private async applyReward(req: Request, res: Response): Promise<void> {
    try {
      const { rewardId } = req.params;

      const reward = await this.referralService.applyReward(rewardId);

      res.json({
        success: true,
        data: {
          id: reward.id,
          rewardType: reward.reward_type,
          rewardValue: reward.reward_value,
          isApplied: reward.is_applied,
          appliedAt: reward.applied_at,
        },
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to apply reward',
      });
    }
  }

  /**
   * GET /users/:userId/referral-stats
   * Get user's referral statistics
   */
  private async getReferralStats(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const stats = await this.referralService.getReferralStats(userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to retrieve stats',
      });
    }
  }

  /**
   * GET /users/:userId/referrals
   * Get user's referral history
   */
  private async getUserReferrals(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const referrals = await this.referralService.getUserReferrals(userId);

      res.json({
        success: true,
        data: referrals,
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to retrieve referrals',
      });
    }
  }

  /**
   * GET /users/:userId/unclaimed-rewards
   * Get user's unclaimed rewards
   */
  private async getUnclaimedRewards(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const rewards = await this.referralService.getUnclaimedRewards(userId);

      res.json({
        success: true,
        data: rewards.map((r) => ({
          id: r.id,
          referralCode: r.referral.referral_code,
          rewardType: r.reward_type,
          rewardValue: r.reward_value,
          expiresAt: r.expires_at,
          isExpired: r.isExpired(),
          canApply: r.canApply(),
        })),
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to retrieve rewards',
      });
    }
  }

  /**
   * GET /leaderboard
   * Get top referrers leaderboard
   */
  private async getLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      const leaderboard = await this.referralService.getLeaderboard(limit);

      res.json({
        success: true,
        data: leaderboard,
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to retrieve leaderboard',
      });
    }
  }

  /**
   * POST /referrals/:referralId/cancel
   * Cancel an active referral
   */
  private async cancelReferral(req: Request, res: Response): Promise<void> {
    try {
      const { referralId } = req.params;
      const { reason } = req.body;

      const referral = await this.referralService.cancelReferral(referralId, reason || '');

      res.json({
        success: true,
        data: {
          id: referral.id,
          status: referral.status,
          cancelledAt: referral.cancelled_at,
          cancellationReason: referral.cancellation_reason,
        },
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to cancel referral',
      });
    }
  }

  /**
   * Get the Express router
   */
  getRouter(): Router {
    return this.router;
  }
}
