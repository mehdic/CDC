/**
 * Achievement Controller
 * REST endpoints for patient achievements
 * T6-020: Achievements gamification system
 */

import { Request, Response, NextFunction } from 'express';
import { AchievementService } from '../services/AchievementService';
import {
  triggerFirstOrder,
  triggerPrescriptionAdherence,
  triggerReferralMilestone,
  triggerVIPTierUpgrade,
  triggerHealthGoalCompletion,
} from '../services/AchievementTriggers';

export class AchievementController {
  private achievementService: AchievementService;

  constructor() {
    this.achievementService = new AchievementService();
  }

  async getAllAchievements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category, tier, isActive } = req.query;

      const filters = {
        category: category as string,
        tier: tier as string,
        isActive: isActive === 'true',
      };

      const achievements = await this.achievementService.getAllAchievements(filters);

      res.json({
        success: true,
        data: achievements,
        total: achievements.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPatientAchievements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { patientId } = req.params;
      const { category, isUnlockedOnly } = req.query;

      const filters = {
        category: category as string,
        isUnlockedOnly: isUnlockedOnly === 'true',
      };

      const achievements = await this.achievementService.getPatientAchievements(patientId, filters);

      const summary = {
        total: achievements.length,
        unlocked: achievements.filter((a) => a.isUnlocked).length,
        inProgress: achievements.filter((a) => !a.isUnlocked && a.progress > 0).length,
        notStarted: achievements.filter((a) => a.progress === 0).length,
        totalPoints: achievements
          .filter((a) => a.isUnlocked)
          .reduce((sum, a) => sum + (a.achievement?.rewardPoints || 0), 0),
      };

      res.json({
        success: true,
        data: achievements,
        summary,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAchievementDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { achievementId } = req.params;
      const achievements = await this.achievementService.getAllAchievements();
      const achievement = achievements.find((a) => a.id === achievementId);

      if (!achievement) {
        res.status(404).json({
          success: false,
          error: 'Achievement not found',
        });
        return;
      }

      res.json({
        success: true,
        data: achievement,
      });
    } catch (error) {
      next(error);
    }
  }

  async unlockAchievement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { patientId, achievementId } = req.body;

      if (!patientId || !achievementId) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: patientId, achievementId',
        });
        return;
      }

      const patientAchievement = await this.achievementService.unlockAchievement(
        patientId,
        achievementId
      );

      res.json({
        success: true,
        message: 'Achievement unlocked successfully',
        data: patientAchievement,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit = 100, category } = req.query;

      const leaderboard = await this.achievementService.getLeaderboard(
        parseInt(limit as string),
        category as string
      );

      res.json({
        success: true,
        data: leaderboard,
        total: leaderboard.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async triggerFirstOrderAchievement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { patientId } = req.body;

      if (!patientId) {
        res.status(400).json({
          success: false,
          error: 'Missing required field: patientId',
        });
        return;
      }

      await triggerFirstOrder({
        patientId,
        timestamp: new Date(),
      });

      res.json({
        success: true,
        message: 'First order achievement triggered',
      });
    } catch (error) {
      next(error);
    }
  }

  async triggerAdherenceStreak(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { patientId, streakDays } = req.body;

      if (!patientId || streakDays === undefined) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: patientId, streakDays',
        });
        return;
      }

      await triggerPrescriptionAdherence({
        patientId,
        timestamp: new Date(),
        streakDays: parseInt(streakDays),
      });

      res.json({
        success: true,
        message: 'Adherence streak achievement triggered',
      });
    } catch (error) {
      next(error);
    }
  }

  async triggerReferralMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { patientId, referralCount } = req.body;

      if (!patientId || referralCount === undefined) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: patientId, referralCount',
        });
        return;
      }

      await triggerReferralMilestone({
        patientId,
        timestamp: new Date(),
        referralCount: parseInt(referralCount),
      });

      res.json({
        success: true,
        message: 'Referral milestone achievement triggered',
      });
    } catch (error) {
      next(error);
    }
  }

  async triggerVIPTierUpgrade(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { patientId, tier, previousTier } = req.body;

      if (!patientId || !tier) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: patientId, tier',
        });
        return;
      }

      await triggerVIPTierUpgrade({
        patientId,
        timestamp: new Date(),
        tier,
        previousTier,
      });

      res.json({
        success: true,
        message: 'VIP tier upgrade achievement triggered',
      });
    } catch (error) {
      next(error);
    }
  }

  async triggerHealthGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { patientId, goalType, goalId } = req.body;

      if (!patientId || !goalType) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: patientId, goalType',
        });
        return;
      }

      await triggerHealthGoalCompletion({
        patientId,
        timestamp: new Date(),
        goalType,
        goalId,
      });

      res.json({
        success: true,
        message: 'Health goal achievement triggered',
      });
    } catch (error) {
      next(error);
    }
  }
}
