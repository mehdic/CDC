/**
 * Achievement Types for Patient Gamification
 * Frontend types for achievements, streaks, goals, and challenges
 * Task: T6-021
 */

export type AchievementCategory = 'adherence' | 'health' | 'engagement' | 'loyalty' | 'social';
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type StreakType = 'medication_adherence' | 'daily_login' | 'health_tracking';
export type GoalStatus = 'active' | 'achieved' | 'failed' | 'paused';
export type ChallengeStatus = 'upcoming' | 'active' | 'completed';

/**
 * Achievement Definition
 */
export interface Achievement {
  achievementId: string;
  name: string;
  nameInFrench?: string;
  description: string;
  descriptionInFrench?: string;
  category: AchievementCategory;
  tier: AchievementTier;
  iconUrl: string;
  pointsAwarded: number;
  isSecret: boolean;
  criteria: AchievementCriteria;
}

/**
 * Achievement Progress Criteria
 */
export interface AchievementCriteria {
  type: 'counter' | 'streak' | 'milestone' | 'challenge';
  metric: string;
  threshold: number;
  timeframe?: 'day' | 'week' | 'month' | 'year' | 'all_time';
}

/**
 * Patient's Earned Achievement
 */
export interface PatientAchievement {
  patientId: string;
  achievementId: string;
  earnedAt: Date;
  progress: number;
  isLocked: boolean;
  metadata?: Record<string, any>;
}

/**
 * Streak Tracking
 */
export interface Streak {
  streakId: string;
  patientId: string;
  type: StreakType;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  multiplier: number;
}

/**
 * Health Goal
 */
export interface HealthGoal {
  goalId: string;
  patientId: string;
  goalType: 'weight' | 'blood_pressure' | 'blood_sugar' | 'steps' | 'medication' | 'custom';
  goalTypeInFrench?: string;
  targetValue: number;
  currentValue: number;
  startDate: Date;
  targetDate: Date;
  status: GoalStatus;
  progress: number;
  checkIns: GoalCheckIn[];
}

/**
 * Goal Check-in Entry
 */
export interface GoalCheckIn {
  checkInId: string;
  goalId: string;
  value: number;
  date: Date;
  notes?: string;
}

/**
 * Challenge Definition
 */
export interface Challenge {
  challengeId: string;
  name: string;
  nameInFrench?: string;
  description: string;
  descriptionInFrench?: string;
  type: 'individual' | 'community';
  criteria: AchievementCriteria;
  startDate: Date;
  endDate: Date;
  rewards: ChallengeReward[];
  participantCount: number;
  status: ChallengeStatus;
  iconUrl?: string;
}

/**
 * Challenge Reward Tier
 */
export interface ChallengeReward {
  position: number;
  points: number;
  badgeId?: string;
  discountCode?: string;
  discountPercent?: number;
}

/**
 * Leaderboard Entry
 */
export interface LeaderboardEntry {
  rank: number;
  patientId: string;
  patientName: string;
  totalPoints: number;
  achievement_count: number;
  current_streak?: number;
  avatarUrl?: string;
}

/**
 * Achievement Statistics
 */
export interface AchievementStats {
  totalAchievements: number;
  unlockedCount: number;
  lockedCount: number;
  totalPoints: number;
  categoryBreakdown: Record<AchievementCategory, number>;
  recentAchievements: PatientAchievement[];
}
