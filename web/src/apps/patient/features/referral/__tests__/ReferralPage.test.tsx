/**
 * Referral Page Component Tests
 * T6-024: Implement referral program for patient acquisition
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReferralPage } from '../pages/ReferralPage';

// Mock fetch
global.fetch = jest.fn();

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe('ReferralPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('token', 'test-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should render referral page with loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      new Promise(() => {
        // Never resolve - stay in loading state
      }),
    );

    render(<ReferralPage />);

    // Should show loading indicator
    expect(screen.getByText(/Loading referral data/i)).toBeInTheDocument();
  });

  it('should load and display referral code', async () => {
    const mockReferralCode = 'REF-ABC123';

    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/referrals/current')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { code: mockReferralCode } }),
        });
      }
      if (url.includes('/referral-stats')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                totalReferrals: 5,
                pendingReferrals: 2,
                completedReferrals: 3,
                totalRewardsEarned: 150,
                appliedRewardsValue: 100,
                pendingRewardsValue: 50,
              },
            }),
        });
      }
      if (url.includes('/referrals') && !url.includes('current')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(<ReferralPage />);

    await waitFor(() => {
      expect(screen.getByText(mockReferralCode)).toBeInTheDocument();
    });
  });

  it('should create new referral code if none exists', async () => {
    const mockReferralCode = 'REF-XYZ789';

    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/referrals/current')) {
        return Promise.resolve({ ok: false, status: 404 });
      }
      if (url === '/api/referrals' && (global.fetch as jest.Mock).mock.calls.length > 1) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { referralCode: mockReferralCode } }),
        });
      }
      if (url.includes('/referral-stats')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                totalReferrals: 0,
                pendingReferrals: 0,
                completedReferrals: 0,
                totalRewardsEarned: 0,
                appliedRewardsValue: 0,
                pendingRewardsValue: 0,
              },
            }),
        });
      }
      if (url.includes('/referrals') && !url.includes('current')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(<ReferralPage />);

    await waitFor(() => {
      expect(screen.getByText(mockReferralCode)).toBeInTheDocument();
    });
  });

  it('should copy referral code to clipboard', async () => {
    const mockReferralCode = 'REF-ABC123';

    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/referrals/current')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { code: mockReferralCode } }),
        });
      }
      if (url.includes('/referral-stats')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                totalReferrals: 0,
                pendingReferrals: 0,
                completedReferrals: 0,
                totalRewardsEarned: 0,
                appliedRewardsValue: 0,
                pendingRewardsValue: 0,
              },
            }),
        });
      }
      if (url.includes('/referrals') && !url.includes('current')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(<ReferralPage />);

    await waitFor(() => {
      expect(screen.getByText(mockReferralCode)).toBeInTheDocument();
    });

    const copyButton = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockReferralCode);
    });
  });

  it('should display share options', async () => {
    const mockReferralCode = 'REF-ABC123';

    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/referrals/current')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { code: mockReferralCode } }),
        });
      }
      if (url.includes('/referral-stats')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                totalReferrals: 0,
                pendingReferrals: 0,
                completedReferrals: 0,
                totalRewardsEarned: 0,
                appliedRewardsValue: 0,
                pendingRewardsValue: 0,
              },
            }),
        });
      }
      if (url.includes('/referrals') && !url.includes('current')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(<ReferralPage />);

    await waitFor(() => {
      expect(screen.getByText(/Share Your Code/i)).toBeInTheDocument();
    });

    // Check for share buttons
    expect(screen.getByRole('button', { name: /email/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sms/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /whatsapp/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /facebook/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /twitter/i })).toBeInTheDocument();
  });

  it('should display referral statistics', async () => {
    const mockStats = {
      totalReferrals: 5,
      pendingReferrals: 2,
      completedReferrals: 3,
      totalRewardsEarned: 150,
      appliedRewardsValue: 100,
      pendingRewardsValue: 50,
    };

    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/referrals/current')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { code: 'REF-ABC123' } }),
        });
      }
      if (url.includes('/referral-stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockStats }),
        });
      }
      if (url.includes('/referrals') && !url.includes('current')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(<ReferralPage />);

    await waitFor(() => {
      expect(screen.getByText(/Your Referral Program Performance/i)).toBeInTheDocument();
    });
  });

  it('should display referral history table', async () => {
    const mockReferrals = [
      {
        id: 'ref-1',
        code: 'REF-ABC123',
        status: 'completed',
        refereeName: 'John Doe',
        refereeEmail: 'john@example.com',
        createdAt: new Date('2025-01-01'),
        completedAt: new Date('2025-01-05'),
        rewardsEarned: 50,
      },
    ];

    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/referrals/current')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { code: 'REF-ABC123' } }),
        });
      }
      if (url.includes('/referral-stats')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                totalReferrals: 1,
                pendingReferrals: 0,
                completedReferrals: 1,
                totalRewardsEarned: 50,
                appliedRewardsValue: 50,
                pendingRewardsValue: 0,
              },
            }),
        });
      }
      if (url.includes('/referrals') && !url.includes('current')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockReferrals }),
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(<ReferralPage />);

    await waitFor(() => {
      expect(screen.getByText(/Referral History/i)).toBeInTheDocument();
    });

    // Check for table data
    await waitFor(() => {
      expect(screen.getByText(/REF-ABC123/)).toBeInTheDocument();
    });
  });

  it('should handle error loading referral data', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<ReferralPage />);

    await waitFor(() => {
      // Should show some error indication (message or fallback UI)
      // This depends on implementation - we're just checking it doesn't crash
      expect(screen.queryByText(/Loading referral data/i)).not.toBeInTheDocument();
    });
  });

  it('should open share modal when clicking more button', async () => {
    const mockReferralCode = 'REF-ABC123';

    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/referrals/current')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { code: mockReferralCode } }),
        });
      }
      if (url.includes('/referral-stats')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                totalReferrals: 0,
                pendingReferrals: 0,
                completedReferrals: 0,
                totalRewardsEarned: 0,
                appliedRewardsValue: 0,
                pendingRewardsValue: 0,
              },
            }),
        });
      }
      if (url.includes('/referrals') && !url.includes('current')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(<ReferralPage />);

    await waitFor(() => {
      expect(screen.getByText(mockReferralCode)).toBeInTheDocument();
    });

    const moreButton = screen.getByRole('button', { name: /more/i });
    fireEvent.click(moreButton);

    await waitFor(() => {
      expect(screen.getByText(/Share Referral Code/i)).toBeInTheDocument();
    });
  });
});
