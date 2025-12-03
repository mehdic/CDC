/**
 * Birthday Bonus Controller
 * Handles birthday bonus REST endpoints
 * T6-023: Implement birthday bonus system for VIP program
 */

import { Request, Response } from 'express';
import { BirthdayBonusService, BirthdayBonusDto } from '../services/BirthdayBonusService';
import { BonusType } from '../../../../shared/models/BirthdayBonus';

const birthdayBonusService = new BirthdayBonusService();

// ============================================================================
// Type Definitions
// ============================================================================

interface GenerateBirthdayBonusRequest {
  bonusType?: BonusType;
  bonusValue?: number;
}

interface RedeemBirthdayBonusRequest {
  bonusCode: string;
  orderId?: string;
}

interface SendNotificationRequest {
  channel?: 'email' | 'sms' | 'push' | 'in_app';
}

// ============================================================================
// Endpoints
// ============================================================================

/**
 * GET /birthday-bonus/current
 * Get current active birthday bonus for authenticated user
 */
export async function getCurrentBirthdayBonus(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const bonus = await birthdayBonusService.getBirthdayBonus(userId);

    if (!bonus) {
      res.status(404).json({
        message: 'No active birthday bonus found',
        bonus: null,
      });
      return;
    }

    res.json({
      message: 'Birthday bonus found',
      bonus,
    });
  } catch (error) {
    console.error('Error getting birthday bonus:', error);
    res.status(500).json({ error: 'Failed to get birthday bonus' });
  }
}

/**
 * GET /birthday-bonus/all
 * Get all birthday bonuses (including redeemed) for authenticated user
 */
export async function getAllBirthdayBonuses(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const bonuses = await birthdayBonusService.getAllBirthdayBonuses(userId);

    res.json({
      total: bonuses.length,
      bonuses,
    });
  } catch (error) {
    console.error('Error getting all birthday bonuses:', error);
    res.status(500).json({ error: 'Failed to get birthday bonuses' });
  }
}

/**
 * POST /birthday-bonus/generate
 * Generate birthday bonus for authenticated user
 * Admin/Pharmacist only
 */
export async function generateBirthdayBonus(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { bonusType = BonusType.DISCOUNT, bonusValue = 15 } =
      req.body as GenerateBirthdayBonusRequest;

    // Validation
    if (!Object.values(BonusType).includes(bonusType)) {
      res.status(400).json({
        error: 'Invalid bonus type',
        validTypes: Object.values(BonusType),
      });
      return;
    }

    if (typeof bonusValue !== 'number' || bonusValue <= 0) {
      res.status(400).json({
        error: 'Invalid bonus value. Must be a positive number.',
      });
      return;
    }

    const bonus = await birthdayBonusService.generateBirthdayBonus(
      userId,
      bonusType,
      bonusValue
    );

    res.status(201).json({
      message: 'Birthday bonus generated successfully',
      bonus: {
        id: bonus.id,
        bonusCode: bonus.bonusCode,
        bonusType: bonus.bonusType,
        bonusValue: bonus.bonusValue,
        validFrom: bonus.validFrom,
        validUntil: bonus.validUntil,
        description: bonus.description,
      },
    });
  } catch (error) {
    console.error('Error generating birthday bonus:', error);
    res.status(500).json({ error: 'Failed to generate birthday bonus' });
  }
}

/**
 * POST /birthday-bonus/redeem
 * Redeem birthday bonus code
 */
export async function redeemBirthdayBonus(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { bonusCode, orderId } = req.body as RedeemBirthdayBonusRequest;

    if (!bonusCode || typeof bonusCode !== 'string') {
      res.status(400).json({
        error: 'Invalid bonus code',
      });
      return;
    }

    const bonus = await birthdayBonusService.redeemBonus(
      userId,
      bonusCode,
      orderId
    );

    res.json({
      message: 'Birthday bonus redeemed successfully',
      bonus: {
        id: bonus.id,
        bonusCode: bonus.bonusCode,
        bonusType: bonus.bonusType,
        bonusValue: bonus.bonusValue,
        isRedeemed: bonus.isRedeemed,
        redeemedAt: bonus.redeemedAt,
      },
    });
  } catch (error: any) {
    console.error('Error redeeming birthday bonus:', error);

    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
      return;
    }

    if (error.message.includes('expired')) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Failed to redeem birthday bonus' });
  }
}

/**
 * POST /birthday-bonus/validate
 * Validate bonus code without redeeming
 */
export async function validateBonusCode(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { bonusCode } = req.body as { bonusCode?: string };

    if (!bonusCode || typeof bonusCode !== 'string') {
      res.status(400).json({ error: 'Invalid bonus code' });
      return;
    }

    const isValid = await birthdayBonusService.validateBonusCode(
      userId,
      bonusCode
    );

    res.json({
      valid: isValid,
      message: isValid ? 'Bonus code is valid' : 'Bonus code is invalid or expired',
    });
  } catch (error) {
    console.error('Error validating bonus code:', error);
    res.status(500).json({ error: 'Failed to validate bonus code' });
  }
}

/**
 * POST /birthday-bonus/:bonusId/notify
 * Send birthday notification for specific bonus
 * Admin/Notification service only
 */
export async function sendBirthdayNotification(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { bonusId } = req.params;
    const { channel = 'email' } = req.body as SendNotificationRequest;

    if (!bonusId || typeof bonusId !== 'string') {
      res.status(400).json({ error: 'Invalid bonus ID' });
      return;
    }

    const validChannels = ['email', 'sms', 'push', 'in_app'];
    if (!validChannels.includes(channel)) {
      res.status(400).json({
        error: 'Invalid notification channel',
        validChannels,
      });
      return;
    }

    const bonus = await birthdayBonusService.sendBirthdayNotification(
      bonusId,
      channel as 'email' | 'sms' | 'push' | 'in_app'
    );

    res.json({
      message: 'Notification sent successfully',
      notificationSentAt: bonus.notificationSentAt,
      channel: bonus.notificationChannel,
    });
  } catch (error: any) {
    console.error('Error sending notification:', error);

    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Failed to send notification' });
  }
}

/**
 * GET /birthday-bonus/check-upcoming
 * Check for upcoming birthdays and generate bonuses
 * Admin/Cron job only
 */
export async function checkUpcomingBirthdays(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const daysAdvance = parseInt((req.query.daysAdvance as string) || '7', 10);

    if (daysAdvance < 0 || daysAdvance > 365) {
      res.status(400).json({
        error: 'Invalid daysAdvance parameter. Must be between 0 and 365.',
      });
      return;
    }

    const generatedBonuses = await birthdayBonusService.checkUpcomingBirthdays(
      daysAdvance
    );

    res.json({
      message: 'Birthday check completed',
      daysAdvance,
      generatedCount: generatedBonuses.length,
      bonuses: generatedBonuses.map((bonus) => ({
        id: bonus.id,
        patientId: bonus.patient_id,
        bonusCode: bonus.bonusCode,
        year: bonus.year,
      })),
    });
  } catch (error) {
    console.error('Error checking upcoming birthdays:', error);
    res.status(500).json({ error: 'Failed to check upcoming birthdays' });
  }
}
