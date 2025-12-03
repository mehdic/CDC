/**
 * useAchievements Hook
 * Custom React hook for managing achievements API integration
 * Task: T6-021
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Achievement,
  PatientAchievement,
  AchievementStats,
  Streak,
  HealthGoal,
  Challenge,
  LeaderboardEntry,
  AchievementCategory,
} from '../types/achievement.types';

interface UseAchievementsOptions {
  patientId?: string;
  autoFetch?: boolean;
}

interface UseAchievementsResult {
  achievements: Achievement[];
  patientAchievements: PatientAchievement[];
  stats: AchievementStats | null;
  streaks: Streak[];
  goals: HealthGoal[];
  challenges: Challenge[];
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  fetchAchievements: () => Promise<void>;
  fetchPatientAchievements: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchStreaks: () => Promise<void>;
  fetchGoals: () => Promise<void>;
  fetchChallenges: () => Promise<void>;
  fetchLeaderboard: (type?: string) => Promise<void>;
  createGoal: (goal: Omit<HealthGoal, 'goalId' | 'checkIns'>) => Promise<HealthGoal>;
  addGoalCheckIn: (goalId: string, value: number, notes?: string) => Promise<void>;
  joinChallenge: (challengeId: string) => Promise<void>;
}

export const useAchievements = (
  options: UseAchievementsOptions = {}
): UseAchievementsResult => {
  const { patientId, autoFetch = true } = options;

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [patientAchievements, setPatientAchievements] = useState<
    PatientAchievement[]
  >([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [goals, setGoals] = useState<HealthGoal[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all available achievements
  const fetchAchievements = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/achievements');
      if (!response.ok) {
        throw new Error('Failed to fetch achievements');
      }

      const data = await response.json();
      setAchievements(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch achievements');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch patient's specific achievements
  const fetchPatientAchievements = useCallback(async () => {
    if (!patientId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/patients/${patientId}/achievements`);
      if (!response.ok) {
        throw new Error('Failed to fetch patient achievements');
      }

      const data = await response.json();
      setPatientAchievements(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch patient achievements');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  // Fetch achievement statistics
  const fetchStats = useCallback(async () => {
    if (!patientId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/patients/${patientId}/achievements/stats`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  // Fetch patient's streaks
  const fetchStreaks = useCallback(async () => {
    if (!patientId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/patients/${patientId}/streaks`);
      if (!response.ok) {
        throw new Error('Failed to fetch streaks');
      }

      const data = await response.json();
      setStreaks(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch streaks');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  // Fetch patient's health goals
  const fetchGoals = useCallback(async () => {
    if (!patientId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/patients/${patientId}/goals`);
      if (!response.ok) {
        throw new Error('Failed to fetch goals');
      }

      const data = await response.json();
      setGoals(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch goals');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  // Fetch active challenges
  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/challenges');
      if (!response.ok) {
        throw new Error('Failed to fetch challenges');
      }

      const data = await response.json();
      setChallenges(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch challenges');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async (type: string = 'all_time') => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/leaderboard?type=${type}`);
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      setLeaderboard(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch leaderboard');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new health goal
  const createGoal = useCallback(
    async (goalData: Omit<HealthGoal, 'goalId' | 'checkIns'>) => {
      if (!patientId) throw new Error('Patient ID required');

      setError(null);

      try {
        const response = await fetch(`/api/patients/${patientId}/goals`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(goalData),
        });

        if (!response.ok) {
          throw new Error('Failed to create goal');
        }

        const newGoal = await response.json();
        setGoals((prev) => [newGoal, ...prev]);
        return newGoal;
      } catch (err: any) {
        setError(err.message || 'Failed to create goal');
        throw err;
      }
    },
    [patientId]
  );

  // Add check-in to a health goal
  const addGoalCheckIn = useCallback(
    async (goalId: string, value: number, notes?: string) => {
      if (!patientId) throw new Error('Patient ID required');

      setError(null);

      try {
        const response = await fetch(
          `/api/patients/${patientId}/goals/${goalId}/checkin`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              value,
              notes,
            }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to add check-in');
        }

        // Refresh goals after check-in
        await fetchGoals();
      } catch (err: any) {
        setError(err.message || 'Failed to add check-in');
        throw err;
      }
    },
    [patientId, fetchGoals]
  );

  // Join a challenge
  const joinChallenge = useCallback(
    async (challengeId: string) => {
      if (!patientId) throw new Error('Patient ID required');

      setError(null);

      try {
        const response = await fetch(
          `/api/challenges/${challengeId}/join`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ patientId }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to join challenge');
        }

        // Refresh challenges after joining
        await fetchChallenges();
      } catch (err: any) {
        setError(err.message || 'Failed to join challenge');
        throw err;
      }
    },
    [patientId, fetchChallenges]
  );

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchAchievements();
      fetchChallenges();
      if (patientId) {
        fetchPatientAchievements();
        fetchStats();
        fetchStreaks();
        fetchGoals();
        fetchLeaderboard();
      }
    }
  }, [
    autoFetch,
    patientId,
    fetchAchievements,
    fetchPatientAchievements,
    fetchStats,
    fetchStreaks,
    fetchGoals,
    fetchChallenges,
    fetchLeaderboard,
  ]);

  return {
    achievements,
    patientAchievements,
    stats,
    streaks,
    goals,
    challenges,
    leaderboard,
    loading,
    error,
    fetchAchievements,
    fetchPatientAchievements,
    fetchStats,
    fetchStreaks,
    fetchGoals,
    fetchChallenges,
    fetchLeaderboard,
    createGoal,
    addGoalCheckIn,
    joinChallenge,
  };
};
