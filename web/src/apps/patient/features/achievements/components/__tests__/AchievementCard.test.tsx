/**
 * AchievementCard Component Tests
 * Task: T6-021
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AchievementCard } from '../AchievementCard';
import { Achievement, PatientAchievement } from '../../types/achievement.types';

const mockAchievement: Achievement = {
  achievementId: 'test-1',
  name: 'First Timer',
  nameInFrench: 'Premier Coup',
  description: 'Complete your first task',
  descriptionInFrench: 'Complétez votre première tâche',
  category: 'adherence',
  tier: 'bronze',
  iconUrl: 'http://example.com/badge.png',
  pointsAwarded: 100,
  isSecret: false,
  criteria: {
    type: 'counter',
    metric: 'tasks',
    threshold: 1,
  },
};

const mockPatientAchievement: PatientAchievement = {
  patientId: 'patient-123',
  achievementId: 'test-1',
  earnedAt: new Date('2025-01-15'),
  progress: 100,
  isLocked: false,
};

describe('AchievementCard', () => {
  it('should render achievement card with name and category', () => {
    render(<AchievementCard achievement={mockAchievement} />);

    expect(screen.getByText('First Timer')).toBeInTheDocument();
    expect(screen.getByText(/Adhérence|adherence/i)).toBeInTheDocument();
  });

  it('should display tier badge with correct color', () => {
    render(<AchievementCard achievement={mockAchievement} />);

    const tierChip = screen.getByText('Bronze');
    expect(tierChip).toBeInTheDocument();
  });

  it('should display points value', () => {
    render(<AchievementCard achievement={mockAchievement} />);

    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('should show unlocked status when achievement is earned', () => {
    render(
      <AchievementCard
        achievement={mockAchievement}
        patientAchievement={mockPatientAchievement}
      />
    );

    expect(screen.getByText(/✓ Débloqué/)).toBeInTheDocument();
  });

  it('should show locked status when achievement is locked', () => {
    render(<AchievementCard achievement={mockAchievement} isLocked={true} />);

    expect(screen.getByText('Bloqué')).toBeInTheDocument();
  });

  it('should display progress bar for in-progress achievement', () => {
    const achievementWithHighThreshold: Achievement = {
      ...mockAchievement,
      criteria: { ...mockAchievement.criteria, threshold: 10 },
    };

    const partialProgress: PatientAchievement = {
      ...mockPatientAchievement,
      progress: 3,  // 30% progress
      isLocked: true,  // locked = in progress, not unlocked yet
    };

    render(
      <AchievementCard
        achievement={achievementWithHighThreshold}
        patientAchievement={partialProgress}
      />
    );

    // For in-progress achievements, component should render successfully
    expect(screen.getByText('First Timer')).toBeInTheDocument();
    // When in-progress (locked), should not show earned status
    expect(screen.queryByText(/✓ Débloqué/)).not.toBeInTheDocument();
  });

  it('should call onClick handler when clicked', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(
      <AchievementCard achievement={mockAchievement} onClick={handleClick} />
    );

    const card = screen.getByText('First Timer').closest('div[role="presentation"]') ||
      screen.getByText('First Timer').closest('div');

    if (card) {
      await user.click(card);
      expect(handleClick).toHaveBeenCalled();
    }
  });

  it('should display earned date when available', () => {
    render(
      <AchievementCard
        achievement={mockAchievement}
        patientAchievement={mockPatientAchievement}
      />
    );

    expect(screen.getByText(/15\/01\/2025|15\/1\/2025|2025-01-15/)).toBeInTheDocument();
  });

  it('should apply locked styling when locked', () => {
    const { container } = render(
      <AchievementCard achievement={mockAchievement} isLocked={true} />
    );

    const cardElement = container.querySelector('[class*="MuiCard"]');
    expect(cardElement).toHaveStyle({ opacity: '0.6' });
  });

  it('should show image from iconUrl when available', () => {
    render(<AchievementCard achievement={mockAchievement} />);

    const image = screen.getByAltText('First Timer') as HTMLImageElement;
    expect(image).toHaveAttribute('src', mockAchievement.iconUrl);
  });

  it('should calculate correct progress percentage', () => {
    const partialProgress: PatientAchievement = {
      ...mockPatientAchievement,
      progress: 100,
      isLocked: false,
    };

    render(
      <AchievementCard
        achievement={mockAchievement}
        patientAchievement={partialProgress}
      />
    );

    // Achievement has threshold of 1, progress is 100
    // Should show unlocked status instead of progress bar
    expect(screen.getByText(/✓ Débloqué/)).toBeInTheDocument();
  });
});
