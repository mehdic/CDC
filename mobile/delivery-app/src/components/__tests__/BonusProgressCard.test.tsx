/**
 * BonusProgressCard Component Unit Tests
 * Comprehensive tests for bonus progress tracking card
 */

import { render } from '@testing-library/react-native';
import React from 'react';

import { BonusProgressCard, BonusItem } from '../BonusProgressCard';

describe('BonusProgressCard Component', () => {
  const mockBonuses: BonusItem[] = [
    {
      id: 'bonus-1',
      title: 'Delivery Sprint',
      description: 'Complete 10 deliveries',
      target: 10,
      current: 7,
      unit: 'deliveries',
      reward: 25,
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'bonus-2',
      title: 'Distance Challenge',
      description: 'Cover 50 km in a week',
      target: 50,
      current: 38,
      unit: 'km',
      reward: 15,
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  describe('Rendering', () => {
    it('should render bonus progress card', () => {
      const { getByTestId } = render(<BonusProgressCard bonuses={mockBonuses} />);

      expect(getByTestId('bonus-progress-card')).toBeTruthy();
    });

    it('should render card title', () => {
      const { getByTestId } = render(<BonusProgressCard bonuses={mockBonuses} />);

      const title = getByTestId('bonus-progress-card-title');
      expect(title.props.children).toBe('Active Bonuses');
    });

    it('should render bonus list', () => {
      const { getByTestId } = render(<BonusProgressCard bonuses={mockBonuses} />);

      expect(getByTestId('bonus-progress-card-list')).toBeTruthy();
    });

    it('should render info container', () => {
      const { getByTestId } = render(<BonusProgressCard bonuses={mockBonuses} />);

      expect(getByTestId('bonus-progress-card-info')).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('should render empty state when no bonuses', () => {
      const { getByTestId } = render(<BonusProgressCard bonuses={[]} />);

      expect(getByTestId('bonus-progress-card-empty')).toBeTruthy();
    });

    it('should display empty message', () => {
      const { getByTestId } = render(<BonusProgressCard bonuses={[]} />);

      const emptyText = getByTestId('bonus-progress-card-empty-text');
      expect(emptyText.props.children).toBe('No active bonuses available');
    });

    it('should still render title in empty state', () => {
      const { getByTestId } = render(<BonusProgressCard bonuses={[]} />);

      const title = getByTestId('bonus-progress-card-title');
      expect(title.props.children).toBe('Active Bonuses');
    });
  });

  describe('Bonus Item Display', () => {
    it('should render each bonus item', () => {
      const { getByTestId } = render(<BonusProgressCard bonuses={mockBonuses} />);

      expect(getByTestId('bonus-progress-card-bonus-0')).toBeTruthy();
      expect(getByTestId('bonus-progress-card-bonus-1')).toBeTruthy();
    });

    it('should render bonus title', () => {
      const { getByTestId } = render(<BonusProgressCard bonuses={mockBonuses} />);

      const title = getByTestId('bonus-progress-card-bonus-title-0');
      expect(title.props.children).toBe('Delivery Sprint');
    });

    it('should render bonus description', () => {
      const { getByTestId } = render(<BonusProgressCard bonuses={mockBonuses} />);

      const description = getByTestId('bonus-progress-card-bonus-description-0');
      expect(description.props.children).toBe('Complete 10 deliveries');
    });

    it('should render reward amount', () => {
      const { getByTestId } = render(<BonusProgressCard bonuses={mockBonuses} />);

      const reward = getByTestId('bonus-progress-card-reward-value-0');
      expect(reward.props.children).toBe('25.00');
    });

    it('should render progress bar', () => {
      const { getByTestId } = render(<BonusProgressCard bonuses={mockBonuses} />);

      expect(getByTestId('bonus-progress-card-progress-0')).toBeTruthy();
      expect(getByTestId('bonus-progress-card-progress-fill-0')).toBeTruthy();
    });

    it('should render progress text', () => {
      const { getByTestId } = render(<BonusProgressCard bonuses={mockBonuses} />);

      const progressText = getByTestId('bonus-progress-card-progress-text-0');
      const children = progressText.props.children;
      const childrenText = Array.isArray(children) ? children.join('') : children;
      expect(childrenText).toContain('7');
      expect(childrenText).toContain('10');
      expect(childrenText).toContain('deliveries');
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate progress percentage correctly', () => {
      const { getByTestId } = render(<BonusProgressCard bonuses={mockBonuses} />);

      const progressFill = getByTestId('bonus-progress-card-progress-fill-0');
      const widthStyle = progressFill.props.style.find(
        (style: any) => style && typeof style === 'object' && 'width' in style
      );
      // 7/10 = 70%
      expect(widthStyle.width).toBe('70%');
    });

    it('should show 100% progress when complete', () => {
      const completedBonus: BonusItem = {
        id: 'bonus-complete',
        title: 'Completed Bonus',
        description: 'This is complete',
        target: 10,
        current: 10,
        unit: 'deliveries',
        reward: 50,
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const { getByTestId } = render(<BonusProgressCard bonuses={[completedBonus]} />);

      const progressFill = getByTestId('bonus-progress-card-progress-fill-0');
      const widthStyle = progressFill.props.style.find(
        (style: any) => style && typeof style === 'object' && 'width' in style
      );
      expect(widthStyle.width).toBe('100%');
    });

    it('should show 0% progress when no progress', () => {
      const noProgressBonus: BonusItem = {
        id: 'bonus-no-progress',
        title: 'New Bonus',
        description: 'Not started',
        target: 10,
        current: 0,
        unit: 'deliveries',
        reward: 50,
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const { getByTestId } = render(<BonusProgressCard bonuses={[noProgressBonus]} />);

      const progressFill = getByTestId('bonus-progress-card-progress-fill-0');
      const widthStyle = progressFill.props.style.find(
        (style: any) => style && typeof style === 'object' && 'width' in style
      );
      expect(widthStyle.width).toBe('0%');
    });

    it('should cap progress at 100%', () => {
      const overProgressBonus: BonusItem = {
        id: 'bonus-over',
        title: 'Over Progress',
        description: 'Exceeded target',
        target: 10,
        current: 15,
        unit: 'deliveries',
        reward: 50,
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const { getByTestId } = render(<BonusProgressCard bonuses={[overProgressBonus]} />);

      const progressFill = getByTestId('bonus-progress-card-progress-fill-0');
      const widthStyle = progressFill.props.style.find(
        (style: any) => style && typeof style === 'object' && 'width' in style
      );
      expect(widthStyle.width).toBe('100%');
    });
  });

  describe('Completion Display', () => {
    it('should show completion checkmark when bonus is complete', () => {
      const completedBonus: BonusItem = {
        id: 'bonus-complete',
        title: 'Completed',
        description: 'Done',
        target: 10,
        current: 10,
        unit: 'deliveries',
        reward: 50,
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const { getByTestId } = render(<BonusProgressCard bonuses={[completedBonus]} />);

      const completeText = getByTestId('bonus-progress-card-complete-text-0');
      expect(completeText.props.children).toBe('✓ Complete');
    });

    it('should not show completion when incomplete', () => {
      const { queryByTestId } = render(<BonusProgressCard bonuses={mockBonuses} />);

      expect(queryByTestId('bonus-progress-card-complete-text-0')).toBeFalsy();
    });
  });

  describe('Expiry Date Display', () => {
    it('should display days or weeks left for future dates', () => {
      const futureBonus: BonusItem = {
        id: 'bonus-future',
        title: 'Future Bonus',
        description: 'In the future',
        target: 10,
        current: 5,
        unit: 'deliveries',
        reward: 50,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const { getByTestId } = render(<BonusProgressCard bonuses={[futureBonus]} />);

      const expiryText = getByTestId('bonus-progress-card-expiry-text-0');
      const text = expiryText.props.children;
      expect(text).toMatch(/days left|weeks left/);
    });

    it('should display "Today" or "Tomorrow" for current/next day expiry', () => {
      const todayBonus: BonusItem = {
        id: 'bonus-today',
        title: 'Today Bonus',
        description: 'Expires soon',
        target: 10,
        current: 5,
        unit: 'deliveries',
        reward: 50,
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      };

      const { getByTestId } = render(<BonusProgressCard bonuses={[todayBonus]} />);

      const expiryText = getByTestId('bonus-progress-card-expiry-text-0');
      const text = expiryText.props.children;
      expect(text).toMatch(/Today|Tomorrow/);
    });

    it('should display "Expired" for past dates', () => {
      const expiredBonus: BonusItem = {
        id: 'bonus-expired',
        title: 'Expired Bonus',
        description: 'Already expired',
        target: 10,
        current: 5,
        unit: 'deliveries',
        reward: 50,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      };

      const { getByTestId } = render(<BonusProgressCard bonuses={[expiredBonus]} />);

      const expiryText = getByTestId('bonus-progress-card-expiry-text-0');
      expect(expiryText.props.children).toBe('Expired');
    });
  });

  describe('Multiple Bonuses', () => {
    it('should render multiple bonuses in order', () => {
      const threeBonuses: BonusItem[] = [
        ...mockBonuses,
        {
          id: 'bonus-3',
          title: 'Third Bonus',
          description: 'Third challenge',
          target: 20,
          current: 10,
          unit: 'deliveries',
          reward: 100,
          expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      const { getByTestId } = render(<BonusProgressCard bonuses={threeBonuses} />);

      expect(getByTestId('bonus-progress-card-bonus-0')).toBeTruthy();
      expect(getByTestId('bonus-progress-card-bonus-1')).toBeTruthy();
      expect(getByTestId('bonus-progress-card-bonus-2')).toBeTruthy();
    });

    it('should maintain separate progress for each bonus', () => {
      const { getByTestId } = render(<BonusProgressCard bonuses={mockBonuses} />);

      const progressFill0 = getByTestId('bonus-progress-card-progress-fill-0');
      const progressFill1 = getByTestId('bonus-progress-card-progress-fill-1');

      const width0 = progressFill0.props.style.find(
        (style: any) => style && typeof style === 'object' && 'width' in style
      ).width;
      const width1 = progressFill1.props.style.find(
        (style: any) => style && typeof style === 'object' && 'width' in style
      ).width;

      // 7/10 = 70%, 38/50 = 76%
      expect(width0).toBe('70%');
      expect(width1).toBe('76%');
    });
  });

  describe('Reward Display', () => {
    it('should format reward with two decimals', () => {
      const bonusWithDecimal: BonusItem = {
        id: 'bonus-decimal',
        title: 'Decimal Reward',
        description: 'Has decimal reward',
        target: 10,
        current: 5,
        unit: 'deliveries',
        reward: 12.5,
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const { getByTestId } = render(<BonusProgressCard bonuses={[bonusWithDecimal]} />);

      const reward = getByTestId('bonus-progress-card-reward-value-0');
      expect(reward.props.children).toBe('12.50');
    });

    it('should display large reward values', () => {
      const bonusLargeReward: BonusItem = {
        id: 'bonus-large',
        title: 'Large Reward',
        description: 'High reward',
        target: 100,
        current: 50,
        unit: 'deliveries',
        reward: 999.99,
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const { getByTestId } = render(<BonusProgressCard bonuses={[bonusLargeReward]} />);

      const reward = getByTestId('bonus-progress-card-reward-value-0');
      expect(reward.props.children).toBe('999.99');
    });
  });

  describe('Edge Cases', () => {
    it('should handle bonuses with zero target', () => {
      const zeroTarget: BonusItem = {
        id: 'bonus-zero',
        title: 'Zero Target',
        description: 'Zero target bonus',
        target: 0,
        current: 0,
        unit: 'deliveries',
        reward: 50,
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const { getByTestId } = render(<BonusProgressCard bonuses={[zeroTarget]} />);

      const progressFill = getByTestId('bonus-progress-card-progress-fill-0');
      const widthStyle = progressFill.props.style.find(
        (style: any) => style && typeof style === 'object' && 'width' in style
      );
      expect(widthStyle.width).toBe('0%');
    });

    it('should handle very large target values', () => {
      const largeTarget: BonusItem = {
        id: 'bonus-large-target',
        title: 'Large Target',
        description: 'Large target',
        target: 10000,
        current: 5000,
        unit: 'km',
        reward: 500,
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const { getByTestId } = render(<BonusProgressCard bonuses={[largeTarget]} />);

      const progressText = getByTestId('bonus-progress-card-progress-text-0');
      const children = progressText.props.children;
      const childrenText = Array.isArray(children) ? children.join('') : children;
      expect(childrenText).toContain('5000');
      expect(childrenText).toContain('10000');
      expect(childrenText).toContain('km');
    });
  });

  describe('Style and Accessibility', () => {
    it('should accept custom testID', () => {
      const { getByTestId } = render(
        <BonusProgressCard bonuses={mockBonuses} testID="custom-bonus" />
      );

      expect(getByTestId('custom-bonus')).toBeTruthy();
    });

    it('should apply default testID when not provided', () => {
      const { getByTestId } = render(<BonusProgressCard bonuses={mockBonuses} />);

      expect(getByTestId('bonus-progress-card')).toBeTruthy();
    });
  });
});
