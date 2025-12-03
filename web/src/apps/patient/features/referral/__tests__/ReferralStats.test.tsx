/**
 * Referral Stats Component Tests
 * T6-024: Implement referral program for patient acquisition
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ReferralStats } from '../components/ReferralStats';

describe('ReferralStats', () => {
  const mockStats = {
    totalReferrals: 10,
    pendingReferrals: 3,
    completedReferrals: 7,
    totalRewardsEarned: 350,
    appliedRewardsValue: 250,
    pendingRewardsValue: 100,
  };

  it('should render referral stats component', () => {
    render(<ReferralStats stats={mockStats} />);

    expect(screen.getByText(/Your Referral Program Performance/i)).toBeInTheDocument();
  });

  it('should display total referrals count', () => {
    render(<ReferralStats stats={mockStats} />);

    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('should display pending referrals count', () => {
    render(<ReferralStats stats={mockStats} />);

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should display completed referrals count', () => {
    render(<ReferralStats stats={mockStats} />);

    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('should calculate and display conversion rate', () => {
    render(<ReferralStats stats={mockStats} />);

    // Conversion rate = completed / total = 7 / 10 = 70%
    expect(screen.getByText('70')).toBeInTheDocument();
  });

  it('should display total rewards earned', () => {
    render(<ReferralStats stats={mockStats} />);

    expect(screen.getByText('CHF 350.00')).toBeInTheDocument();
  });

  it('should display applied rewards', () => {
    render(<ReferralStats stats={mockStats} />);

    expect(screen.getByText('CHF 250.00')).toBeInTheDocument();
  });

  it('should display pending rewards', () => {
    render(<ReferralStats stats={mockStats} />);

    expect(screen.getByText('CHF 100.00')).toBeInTheDocument();
  });

  it('should show progress to next milestone for 0 completed referrals', () => {
    const newUserStats = {
      ...mockStats,
      completedReferrals: 0,
    };

    render(<ReferralStats stats={newUserStats} />);

    expect(screen.getByText(/Complete 3 more referral/i)).toBeInTheDocument();
  });

  it('should show progress to next milestone for 3+ completed referrals', () => {
    const progressStats = {
      ...mockStats,
      completedReferrals: 5,
    };

    render(<ReferralStats stats={progressStats} />);

    expect(screen.getByText(/Complete 5 more referral/i)).toBeInTheDocument();
  });

  it('should show max level reached message for 10+ completed referrals', () => {
    const maxStats = {
      ...mockStats,
      completedReferrals: 10,
    };

    render(<ReferralStats stats={maxStats} />);

    expect(screen.getByText(/You have reached the maximum referral reward level/i)).toBeInTheDocument();
  });

  it('should display benefits information', () => {
    render(<ReferralStats stats={mockStats} />);

    expect(screen.getByText(/How Referral Rewards Work/i)).toBeInTheDocument();
    expect(screen.getByText(/CHF 50.*in points for each successful referral/i)).toBeInTheDocument();
    expect(screen.getByText(/CHF 20.*in points.*welcome bonus/i)).toBeInTheDocument();
  });

  it('should handle zero conversion rate correctly', () => {
    const zeroStats = {
      ...mockStats,
      totalReferrals: 0,
      completedReferrals: 0,
    };

    render(<ReferralStats stats={zeroStats} />);

    // Should show 0% conversion rate
    expect(screen.getByText(/0/)).toBeInTheDocument();
  });

  it('should display all statistics sections', () => {
    render(<ReferralStats stats={mockStats} />);

    expect(screen.getByText('Total Referrals')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Conversion Rate')).toBeInTheDocument();
    expect(screen.getByText('Total Rewards Earned')).toBeInTheDocument();
    expect(screen.getByText('Progress to Next Reward Milestone')).toBeInTheDocument();
  });

  it('should format currency values correctly', () => {
    const currencyStats = {
      totalReferrals: 5,
      pendingReferrals: 2,
      completedReferrals: 3,
      totalRewardsEarned: 123.45,
      appliedRewardsValue: 73.45,
      pendingRewardsValue: 50,
    };

    render(<ReferralStats stats={currencyStats} />);

    expect(screen.getByText('CHF 123.45')).toBeInTheDocument();
    expect(screen.getByText('CHF 73.45')).toBeInTheDocument();
    expect(screen.getByText('CHF 50.00')).toBeInTheDocument();
  });

  it('should display percentage symbol for conversion rate', () => {
    render(<ReferralStats stats={mockStats} />);

    // Check for % symbol in conversion rate
    const percentElements = screen.getAllByText('%');
    expect(percentElements.length).toBeGreaterThan(0);
  });
});
