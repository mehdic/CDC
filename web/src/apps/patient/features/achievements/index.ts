/**
 * Achievements Feature Barrel Export
 * Task: T6-021
 */

// Pages
export { AchievementsPage } from './pages/AchievementsPage';

// Components
export { AchievementCard } from './components/AchievementCard';
export { AchievementDetail } from './components/AchievementDetail';
export { LeaderboardWidget } from './components/LeaderboardWidget';
export { ProgressTracker } from './components/ProgressTracker';

// Hooks
export { useAchievements } from './hooks/useAchievements';

// Types
export type {
  Achievement,
  AchievementCategory,
  AchievementCriteria,
  AchievementTier,
  PatientAchievement,
  Streak,
  StreakType,
  HealthGoal,
  GoalStatus,
  GoalCheckIn,
  Challenge,
  ChallengeStatus,
  ChallengeReward,
  LeaderboardEntry,
  AchievementStats,
} from './types/achievement.types';
