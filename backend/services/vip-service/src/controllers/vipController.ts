/**
 * VIP Controller
 * Handles VIP program API endpoints
 * T3-095, T3-097: VIP program endpoints
 */

import { Request, Response } from 'express';
import { VipService } from '../services/VipService';
import { PointsService } from '../services/PointsService';

const vipService = new VipService();
const pointsService = new PointsService();

/**
 * GET /vip/membership
 * Get current user's VIP membership with benefits
 */
export async function getMembership(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const membershipData = await vipService.getMembershipWithBenefits(userId);

    res.json({
      membership: {
        id: membershipData.membership.id,
        tier: membershipData.membership.tier,
        currentPoints: membershipData.membership.current_points,
        lifetimePoints: membershipData.membership.lifetime_points,
        redeemedPoints: membershipData.membership.redeemed_points,
        isActive: membershipData.membership.is_active,
        enrolledAt: membershipData.membership.enrolled_at,
      },
      benefits: membershipData.benefits,
      pointsUntilNextTier: membershipData.pointsUntilNextTier,
    });
  } catch (error) {
    console.error('Error getting membership:', error);
    res.status(500).json({ error: 'Failed to get membership' });
  }
}

/**
 * GET /vip/summary
 * Get quick membership summary
 */
export async function getMembershipSummary(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const summary = await vipService.getMembershipSummary(userId);

    res.json(summary);
  } catch (error) {
    console.error('Error getting summary:', error);
    res.status(500).json({ error: 'Failed to get summary' });
  }
}

/**
 * GET /vip/points/history
 * Get points transaction history
 */
export async function getPointsHistory(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const limit = parseInt((req.query.limit as string) || '50', 10);
    const history = await pointsService.getPointsHistory(userId, limit);

    res.json({
      total: history.length,
      transactions: history.map((tx) => ({
        id: tx.id,
        type: tx.type,
        source: tx.source,
        amount: tx.amount,
        description: tx.description,
        expiresAt: tx.expires_at,
        redeemedAt: tx.redeemed_at,
        createdAt: tx.created_at,
      })),
    });
  } catch (error) {
    console.error('Error getting points history:', error);
    res.status(500).json({ error: 'Failed to get points history' });
  }
}

/**
 * POST /vip/points/earn
 * Record points earned from purchase
 * Body: { orderId: string, amount: number }
 */
export async function earnPoints(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    const { orderId, amount } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!orderId || !amount || typeof amount !== 'number') {
      res.status(400).json({ error: 'Invalid request parameters' });
      return;
    }

    const transaction = await pointsService.earnPointsFromPurchase(userId, amount, orderId);

    const membership = await vipService.getOrCreateMembership(userId);

    res.status(201).json({
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        type: transaction.type,
        source: transaction.source,
      },
      membership: {
        currentPoints: membership.current_points,
        tier: membership.tier,
      },
    });
  } catch (error) {
    console.error('Error earning points:', error);
    res.status(500).json({ error: 'Failed to earn points' });
  }
}

/**
 * POST /vip/points/redeem
 * Redeem points for discount
 * Body: { pointsToRedeem: number, orderId: string }
 */
export async function redeemPoints(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    const { pointsToRedeem, orderId } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!pointsToRedeem || typeof pointsToRedeem !== 'number' || !orderId) {
      res.status(400).json({ error: 'Invalid request parameters' });
      return;
    }

    try {
      const transaction = await pointsService.redeemPoints(userId, pointsToRedeem, orderId);

      const membership = await vipService.getOrCreateMembership(userId);

      res.json({
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          type: transaction.type,
        },
        membership: {
          currentPoints: membership.current_points,
          tier: membership.tier,
        },
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  } catch (error) {
    console.error('Error redeeming points:', error);
    res.status(500).json({ error: 'Failed to redeem points' });
  }
}

/**
 * GET /vip/discount
 * Get applicable discount percentage for user
 */
export async function getDiscount(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const discountPercentage = await vipService.getApplicableDiscount(userId);

    res.json({
      discountPercentage,
    });
  } catch (error) {
    console.error('Error getting discount:', error);
    res.status(500).json({ error: 'Failed to get discount' });
  }
}

/**
 * GET /vip/delivery/eligible
 * Check if eligible for free delivery
 * Query: { orderAmount: number }
 */
export async function checkFreeDelivery(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    const orderAmount = parseFloat((req.query.orderAmount as string) || '0');

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (orderAmount <= 0) {
      res.status(400).json({ error: 'Invalid order amount' });
      return;
    }

    const eligible = await vipService.checkFreeDeliveryEligibility(userId, orderAmount);

    res.json({
      eligible,
      orderAmount,
    });
  } catch (error) {
    console.error('Error checking delivery eligibility:', error);
    res.status(500).json({ error: 'Failed to check delivery eligibility' });
  }
}

/**
 * GET /vip/tier/thresholds
 * Get all tier thresholds
 */
export async function getTierThresholds(req: Request, res: Response): Promise<void> {
  try {
    const thresholds = vipService.getTierThresholds();

    res.json({
      thresholds: {
        bronze: thresholds.bronze,
        silver: thresholds.silver,
        gold: thresholds.gold,
        platinum: thresholds.platinum,
      },
    });
  } catch (error) {
    console.error('Error getting tier thresholds:', error);
    res.status(500).json({ error: 'Failed to get tier thresholds' });
  }
}

/**
 * POST /vip/points/birthday
 * Award birthday bonus (admin/system endpoint)
 * Body: { userId: string }
 */
export async function awardBirthdayBonus(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'Missing userId' });
      return;
    }

    const transaction = await pointsService.awardBirthdayBonus(userId);

    if (!transaction) {
      res.status(400).json({
        error: 'Birthday bonus already awarded this year or user not found',
      });
      return;
    }

    const membership = await vipService.getOrCreateMembership(userId);

    res.status(201).json({
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        source: transaction.source,
      },
      membership: {
        currentPoints: membership.current_points,
        tier: membership.tier,
      },
    });
  } catch (error) {
    console.error('Error awarding birthday bonus:', error);
    res.status(500).json({ error: 'Failed to award birthday bonus' });
  }
}
