/**
 * Achievement Service
 * Manages patient achievements, progress tracking, and unlocking
 * T6-020: Achievements gamification system
 */

import { getRepository, Repository } from 'typeorm';
// TODO: Achievement and PatientAchievement models not found - need to be created
// import {
//   Achievement,
//   AchievementCategory,
//   AchievementTier,
//   AchievementRequirement,
// } from '@shared/models/Achievement';
// import { PatientAchievement } from '@shared/models/PatientAchievement';
import { User } from '@shared/models/User';

// Temporary type definitions until models are created
type AchievementCategory = string;
type AchievementTier = string;
type AchievementRequirement = any;
type Achievement = any;
type PatientAchievement = any;

export interface AchievementProgressData {
  type: string;
  current: number;
  target: number;
  percentage: number;
}

export interface PatientAchievementDTO {
  id: string;
  achievement: {
    id: string;
    name: string;
    description: string;
    category: AchievementCategory;
    tier: AchievementTier;
    iconUrl: string;
    rewardPoints: number;
    rewardBadge: string;
  };
  progress: number;
  isUnlocked: boolean;
  earnedAt: Date | null;
  progressData?: AchievementProgressData;
}

export interface LeaderboardEntry {
  patientId: string;
  patientName: string;
  totalAchievements: number;
  totalPoints: number;
  rank: number;
  topTierAchievements: {
    platinum: number;
    gold: number;
    silver: number;
    bronze: number;
  };
}

export class AchievementService {
  private achievementRepository: Repository<Achievement>;
  private patientAchievementRepository: Repository<PatientAchievement>;
  private userRepository: Repository<User>;

  constructor() {
    // Note: Achievement and PatientAchievement are temporary type definitions
    // In production, these should be actual entity classes for getRepository()
    // For now, we use type assertions to work with the mock repositories
    this.achievementRepository = getRepository(User) as any; // Placeholder until Achievement entity is created
    this.patientAchievementRepository = getRepository(User) as any; // Placeholder until PatientAchievement entity is created
    this.userRepository = getRepository(User);
  }

  /**
   * Get all available achievements
   */
  async getAllAchievements(filters?: {
    category?: AchievementCategory;
    tier?: AchievementTier;
    isActive?: boolean;
  }): Promise<Achievement[]> {
    let query = this.achievementRepository
      .createQueryBuilder('achievement')
      .where('achievement.deletedAt IS NULL');

    if (filters?.category) {
      query = query.andWhere('achievement.category = :category', {
        category: filters.category,
      });
    }

    if (filters?.tier) {
      query = query.andWhere('achievement.tier = :tier', { tier: filters.tier });
    }

    if (filters?.isActive !== undefined) {
      query = query.andWhere('achievement.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    return query.orderBy('achievement.tier', 'DESC').addOrderBy('achievement.name', 'ASC').getMany();
  }

  /**
   * Get patient's achievements with progress
   */
  async getPatientAchievements(
    patientId: string,
    filters?: { category?: AchievementCategory; isUnlockedOnly?: boolean }
  ): Promise<PatientAchievementDTO[]> {
    let query = this.patientAchievementRepository
      .createQueryBuilder('pa')
      .leftJoinAndSelect('pa.achievement', 'a')
      .where('pa.patientId = :patientId', { patientId })
      .andWhere('a.deletedAt IS NULL');

    if (filters?.category) {
      query = query.andWhere('a.category = :category', { category: filters.category });
    }

    if (filters?.isUnlockedOnly) {
      query = query.andWhere('pa.isUnlocked = true');
    }

    const patientAchievements = await query
      .orderBy('a.tier', 'DESC')
      .addOrderBy('pa.isUnlocked', 'DESC')
      .addOrderBy('pa.earnedAt', 'DESC')
      .getMany();

    return patientAchievements.map((pa) => this.mapToDTO(pa));
  }

  /**
   * Unlock an achievement for a patient
   */
  async unlockAchievement(patientId: string, achievementId: string): Promise<PatientAchievement> {
    let patientAchievement = await this.patientAchievementRepository.findOne({
      where: {
        patientId,
        achievementId,
      },
    });

    if (!patientAchievement) {
      patientAchievement = this.patientAchievementRepository.create({
        patientId,
        achievementId,
        progress: 100,
        isUnlocked: false,
      });
    }

    // Unlock the achievement
    patientAchievement.isUnlocked = true;
    patientAchievement.earnedAt = new Date();
    patientAchievement.progress = 100;

    // Save and return
    const saved = await this.patientAchievementRepository.save(patientAchievement);

    // Increment earned count on the achievement
    const achievement = await this.achievementRepository.findOne({ where: { id: achievementId } });
    if (achievement) {
      achievement.earnedCount += 1;
      await this.achievementRepository.save(achievement);
    }

    return saved;
  }

  /**
   * Get leaderboard of patients by achievements earned
   */
  async getLeaderboard(limit: number = 100, category?: AchievementCategory): Promise<LeaderboardEntry[]> {
    let query = this.patientAchievementRepository
      .createQueryBuilder('pa')
      .leftJoinAndSelect('pa.achievement', 'a')
      .leftJoinAndSelect('pa.patient', 'u')
      .where('pa.isUnlocked = true')
      .andWhere('a.deletedAt IS NULL');

    if (category) {
      query = query.andWhere('a.category = :category', { category });
    }

    const results = await query.getMany();

    // Group by patient and calculate stats
    const patientStats = new Map<
      string,
      { name: string; achievements: number; points: number; tiers: any }
    >();

    for (const pa of results) {
      const patientId = pa.patientId;
      if (!patientStats.has(patientId)) {
        patientStats.set(patientId, {
          name: pa.patient?.firstName + ' ' + pa.patient?.lastName,
          achievements: 0,
          points: 0,
          tiers: { platinum: 0, gold: 0, silver: 0, bronze: 0 },
        });
      }

      const stats = patientStats.get(patientId)!;
      stats.achievements += 1;
      stats.points += pa.achievement.rewardPoints;
      stats.tiers[pa.achievement.tier] += 1;
    }

    // Convert to leaderboard entries and sort
    const leaderboard: LeaderboardEntry[] = Array.from(patientStats.entries())
      .map(([patientId, stats], index) => ({
        patientId,
        patientName: stats.name,
        totalAchievements: stats.achievements,
        totalPoints: stats.points,
        rank: index + 1,
        topTierAchievements: stats.tiers,
      }))
      .sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) {
          return b.totalPoints - a.totalPoints;
        }
        return b.totalAchievements - a.totalAchievements;
      })
      .slice(0, limit)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    return leaderboard;
  }

  /**
   * Trigger achievement check after an action
   */
  async triggerAchievementCheck(
    patientId: string,
    triggerType: string,
    data?: Record<string, any>
  ): Promise<void> {
    switch (triggerType) {
      case 'first_order':
        await this.checkFirstOrderAchievement(patientId);
        break;
      case 'prescription_adherence_streak':
        await this.checkAdherenceStreakAchievement(patientId, data?.streakDays || 0);
        break;
      case 'referral_milestone':
        await this.checkReferralMilestoneAchievement(patientId, data?.referralCount || 0);
        break;
      case 'vip_tier_upgrade':
        await this.checkVIPTierAchievement(patientId, data?.tier || 'bronze');
        break;
      case 'health_goal_completion':
        await this.checkHealthGoalAchievement(patientId, data?.goalType || 'generic');
        break;
    }
  }

  private mapToDTO(patientAchievement: PatientAchievement): PatientAchievementDTO {
    return {
      id: patientAchievement.id,
      achievement: {
        id: patientAchievement.achievement.id,
        name: patientAchievement.achievement.name,
        description: patientAchievement.achievement.description,
        category: patientAchievement.achievement.category,
        tier: patientAchievement.achievement.tier,
        iconUrl: patientAchievement.achievement.iconUrl,
        rewardPoints: patientAchievement.achievement.rewardPoints,
        rewardBadge: patientAchievement.achievement.rewardBadge,
      },
      progress: patientAchievement.progress,
      isUnlocked: patientAchievement.isUnlocked,
      earnedAt: patientAchievement.earnedAt,
      progressData: patientAchievement.metadata as AchievementProgressData,
    };
  }

  private async checkFirstOrderAchievement(patientId: string): Promise<void> {
    let achievement = await this.achievementRepository.findOne({
      where: { name: 'First Order' },
    });

    if (!achievement) {
      achievement = this.achievementRepository.create({
        name: 'First Order',
        description: 'Place your first order on MetaPharm Connect',
        category: 'milestone',
        tier: 'bronze',
        rewardPoints: 10,
        rewardBadge: 'First Step',
        requirement: {
          type: 'count',
          threshold: 1,
        },
      });
      await this.achievementRepository.save(achievement);
    }

    await this.unlockAchievement(patientId, achievement.id);
  }

  private async checkAdherenceStreakAchievement(patientId: string, streakDays: number): Promise<void> {
    const streaks = [
      { days: 7, name: '7-Day Adherence', tier: 'bronze' as AchievementTier },
      { days: 30, name: '30-Day Adherence', tier: 'silver' as AchievementTier },
      { days: 90, name: '90-Day Adherence', tier: 'gold' as AchievementTier },
      { days: 365, name: 'Year-Long Adherence', tier: 'platinum' as AchievementTier },
    ];

    for (const streak of streaks) {
      if (streakDays >= streak.days) {
        let achievement = await this.achievementRepository.findOne({
          where: { name: streak.name },
        });

        if (!achievement) {
          achievement = this.achievementRepository.create({
            name: streak.name,
            description: `Maintain medication adherence for ${streak.days} consecutive days`,
            category: 'health',
            tier: streak.tier,
            rewardPoints: 10 * (streak.days / 7),
            rewardBadge: `Health Champion (${streak.days}d)`,
            requirement: {
              type: 'streak',
              threshold: streak.days,
              period: 'lifetime',
            },
          });
          await this.achievementRepository.save(achievement);
        }

        await this.unlockAchievement(patientId, achievement.id);
      }
    }
  }

  private async checkReferralMilestoneAchievement(patientId: string, referralCount: number): Promise<void> {
    const milestones = [
      { count: 1, name: 'First Referral', tier: 'bronze' as AchievementTier },
      { count: 5, name: '5 Referrals', tier: 'silver' as AchievementTier },
      { count: 10, name: '10 Referrals', tier: 'gold' as AchievementTier },
    ];

    for (const milestone of milestones) {
      if (referralCount >= milestone.count) {
        let achievement = await this.achievementRepository.findOne({
          where: { name: milestone.name },
        });

        if (!achievement) {
          achievement = this.achievementRepository.create({
            name: milestone.name,
            description: `Refer ${milestone.count} friend(s) to MetaPharm Connect`,
            category: 'social',
            tier: milestone.tier,
            rewardPoints: 25 * milestone.count,
            rewardBadge: `Community Builder (${milestone.count})`,
            requirement: {
              type: 'count',
              threshold: milestone.count,
            },
          });
          await this.achievementRepository.save(achievement);
        }

        await this.unlockAchievement(patientId, achievement.id);
      }
    }
  }

  private async checkVIPTierAchievement(patientId: string, tier: string): Promise<void> {
    const tiers = ['silver', 'gold', 'platinum'];

    for (const vipTier of tiers) {
      if (tier === vipTier) {
        let achievement = await this.achievementRepository.findOne({
          where: { name: `Reached ${vipTier.charAt(0).toUpperCase() + vipTier.slice(1)} Tier` },
        });

        if (!achievement) {
          const tierPoints = { silver: 50, gold: 100, platinum: 200 };
          achievement = this.achievementRepository.create({
            name: `Reached ${vipTier.charAt(0).toUpperCase() + vipTier.slice(1)} Tier`,
            description: `Achieve VIP ${vipTier} tier status`,
            category: 'loyalty',
            tier: (vipTier as any) as AchievementTier,
            rewardPoints: tierPoints[vipTier as keyof typeof tierPoints],
            rewardBadge: `VIP ${vipTier.charAt(0).toUpperCase() + vipTier.slice(1)}`,
            requirement: {
              type: 'count',
              threshold: 1,
            },
          });
          await this.achievementRepository.save(achievement);
        }

        await this.unlockAchievement(patientId, achievement.id);
      }
    }
  }

  private async checkHealthGoalAchievement(patientId: string, goalType: string): Promise<void> {
    let achievement = await this.achievementRepository.findOne({
      where: { name: `Health Goal: ${goalType}` },
    });

    if (!achievement) {
      achievement = this.achievementRepository.create({
        name: `Health Goal: ${goalType}`,
        description: `Complete a health goal in the ${goalType} category`,
        category: 'health',
        tier: 'gold',
        rewardPoints: 75,
        rewardBadge: `Goal Achiever (${goalType})`,
        requirement: {
          type: 'count',
          threshold: 1,
        },
      });
      await this.achievementRepository.save(achievement);
    }

    await this.unlockAchievement(patientId, achievement.id);
  }
}
