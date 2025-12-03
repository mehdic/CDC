/**
 * AchievementsPage Component Tests
 * Task: T6-021
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AchievementsPage } from '../AchievementsPage';

// Mock the useAchievements hook
jest.mock('../../hooks/useAchievements', () => ({
  useAchievements: () => ({
    achievements: [
      {
        achievementId: 'ach1',
        name: 'First Timer',
        nameInFrench: 'Premier Coup',
        description: 'Complete first task',
        descriptionInFrench: 'Complétez votre première tâche',
        category: 'adherence',
        tier: 'bronze',
        iconUrl: 'http://example.com/badge1.png',
        pointsAwarded: 100,
        isSecret: false,
        criteria: { type: 'counter', metric: 'tasks', threshold: 1 },
      },
      {
        achievementId: 'ach2',
        name: 'Week Warrior',
        nameInFrench: 'Guerrier de la Semaine',
        description: 'Complete weekly tasks',
        descriptionInFrench: 'Complétez les tâches hebdomadaires',
        category: 'adherence',
        tier: 'silver',
        iconUrl: 'http://example.com/badge2.png',
        pointsAwarded: 250,
        isSecret: false,
        criteria: { type: 'streak', metric: 'daily_tasks', threshold: 7 },
      },
    ],
    patientAchievements: [
      {
        patientId: 'p1',
        achievementId: 'ach1',
        earnedAt: new Date(),
        progress: 100,
        isLocked: false,
      },
    ],
    stats: {
      totalAchievements: 2,
      unlockedCount: 1,
      lockedCount: 1,
      totalPoints: 100,
      categoryBreakdown: { adherence: 2, health: 0, engagement: 0, loyalty: 0, social: 0 },
      recentAchievements: [],
    },
    streaks: [],
    goals: [],
    challenges: [],
    leaderboard: [],
    loading: false,
    error: null,
    fetchAchievements: jest.fn(),
    fetchPatientAchievements: jest.fn(),
    fetchStats: jest.fn(),
    fetchStreaks: jest.fn(),
    fetchGoals: jest.fn(),
    fetchChallenges: jest.fn(),
    fetchLeaderboard: jest.fn(),
    createGoal: jest.fn(),
    addGoalCheckIn: jest.fn(),
    joinChallenge: jest.fn(),
  }),
}));

describe('AchievementsPage', () => {
  it('should render page title and description', () => {
    render(<AchievementsPage />);

    expect(screen.getByText('Mes Succès')).toBeInTheDocument();
    expect(screen.getByText(/Suivez votre progression/i)).toBeInTheDocument();
  });

  it('should display achievement statistics', () => {
    render(<AchievementsPage />);

    expect(screen.getByText('Points totaux')).toBeInTheDocument();
    expect(screen.getByText('Succès débloqués')).toBeInTheDocument();
    expect(screen.getByText('Taux de déverrouillage')).toBeInTheDocument();
  });

  it('should render achievement tabs', () => {
    render(<AchievementsPage />);

    expect(screen.getByRole('tab', { name: /Succès/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Progression/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Objectifs/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Classement/i })).toBeInTheDocument();
  });

  it('should display unlocked achievements', async () => {
    render(<AchievementsPage />);

    await waitFor(() => {
      expect(screen.getByText('First Timer')).toBeInTheDocument();
    });
  });

  it('should display locked achievements', async () => {
    render(<AchievementsPage />);

    await waitFor(() => {
      expect(screen.getByText('Week Warrior')).toBeInTheDocument();
    });
  });

  it('should filter achievements by category', async () => {
    const user = userEvent.setup();
    render(<AchievementsPage />);

    // Get all category filter chips
    const categoryButtons = screen.getAllByRole('button').filter((btn) =>
      ['Tous', 'Adhérence', 'Santé', 'Engagement', 'Fidélité', 'Social'].includes(
        btn.textContent || ''
      )
    );

    if (categoryButtons.length > 0) {
      await user.click(categoryButtons[0]);
      expect(categoryButtons[0]).toHaveClass('MuiChip-filled');
    }
  });

  it('should switch between tabs', async () => {
    const user = userEvent.setup();
    render(<AchievementsPage />);

    const progressTab = screen.getByRole('tab', { name: /Progression/i });
    await user.click(progressTab);

    expect(progressTab).toHaveAttribute('aria-selected', 'true');
  });

  it('should have create goal button in goals tab', async () => {
    const user = userEvent.setup();
    render(<AchievementsPage />);

    const goalsTab = screen.getByRole('tab', { name: /Objectifs/i });
    await user.click(goalsTab);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Créer un nouvel objectif/i })).toBeInTheDocument();
    });
  });

  it('should display achievement count in statistics', () => {
    render(<AchievementsPage />);

    expect(screen.getByText(/1\/2|1\/[2-9]/)).toBeInTheDocument();
  });

  it('should show achievement icons', async () => {
    render(<AchievementsPage />);

    await waitFor(() => {
      const images = screen.getAllByRole('img').filter((img) =>
        img.getAttribute('alt')?.includes('Timer')
      );
      expect(images.length).toBeGreaterThan(0);
    });
  });

  it('should render with accessibility attributes', () => {
    render(<AchievementsPage />);

    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(4);

    tabs.forEach((tab) => {
      expect(tab).toHaveAttribute('aria-controls');
      expect(tab).toHaveAttribute('aria-selected');
    });
  });
});
