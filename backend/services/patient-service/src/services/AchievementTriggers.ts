/**
 * Achievement Triggers
 * Automatically checks and awards achievements based on user actions
 * T6-020: Achievements gamification system
 */

import { AchievementService } from './AchievementService';

export interface TriggerContext {
  patientId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * First Order Trigger
 */
export async function triggerFirstOrder(context: TriggerContext): Promise<void> {
  const achievementService = new AchievementService();
  await achievementService.triggerAchievementCheck(context.patientId, 'first_order');
}

/**
 * Prescription Adherence Trigger
 */
export async function triggerPrescriptionAdherence(
  context: TriggerContext & { streakDays: number }
): Promise<void> {
  const achievementService = new AchievementService();
  await achievementService.triggerAchievementCheck(context.patientId, 'prescription_adherence_streak', {
    streakDays: context.streakDays,
  });
}

/**
 * Referral Milestone Trigger
 */
export async function triggerReferralMilestone(
  context: TriggerContext & { referralCount: number }
): Promise<void> {
  const achievementService = new AchievementService();
  await achievementService.triggerAchievementCheck(context.patientId, 'referral_milestone', {
    referralCount: context.referralCount,
  });
}

/**
 * VIP Tier Upgrade Trigger
 */
export async function triggerVIPTierUpgrade(
  context: TriggerContext & { tier: string; previousTier?: string }
): Promise<void> {
  const achievementService = new AchievementService();
  await achievementService.triggerAchievementCheck(context.patientId, 'vip_tier_upgrade', {
    tier: context.tier,
    previousTier: context.previousTier,
  });
}

/**
 * Health Goal Completion Trigger
 */
export async function triggerHealthGoalCompletion(
  context: TriggerContext & { goalType: string; goalId?: string }
): Promise<void> {
  const achievementService = new AchievementService();
  await achievementService.triggerAchievementCheck(context.patientId, 'health_goal_completion', {
    goalType: context.goalType,
    goalId: context.goalId,
  });
}
