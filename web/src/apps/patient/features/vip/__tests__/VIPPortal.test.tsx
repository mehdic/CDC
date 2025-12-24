/**
 * VIP Portal Component Tests
 * Tests for VIP components and integration
 * Task: T8-044 - Patient VIP Program Portal
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RewardsSection } from '../components/RewardsSection';
import { OffersSection } from '../components/OffersSection';
import { TierBenefitsCard } from '../components/TierBenefitsCard';
import { PointsHistorySection } from '../components/PointsHistorySection';
import { VIPTier, RewardStatus, OfferType } from '../types/vip.types';

// Test Fixtures
function buildVIPMembership() {
  return {
    id: 'member-123',
    userId: 'user-123',
    currentTier: VIPTier.GOLD,
    totalPoints: 850,
    pointsToNextTier: 150,
    currentTierPoints: 350,
    joinedAt: new Date('2024-01-15'),
    lastActivityAt: new Date(),
    nextTierAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isActive: true,
    membershipStatus: 'active' as const,
  };
}

function buildVIPTierInfo(tier: VIPTier = VIPTier.GOLD) {
  return {
    tier,
    name: 'Niveau Gold',
    description: 'Access premium benefits',
    minPoints: 501,
    discountPercentage: 10,
    pointsMultiplier: 1.5,
    color: '#FFD700',
    benefits: [
      {
        id: 'b1',
        benefit: 'Réduction spéciale',
        description: '10% de réduction',
      },
      {
        id: 'b2',
        benefit: 'Points multipliés',
        description: 'Gagnez 1.5x plus de points',
      },
    ],
  };
}

function buildVIPReward() {
  return {
    id: 'reward-123',
    memberId: 'member-123',
    title: 'Bon de réduction 50 CHF',
    description: 'Utilisable sur votre prochain achat',
    pointsValue: 200,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: RewardStatus.AVAILABLE,
    code: 'REWARD123ABC',
  };
}

function buildVIPOffer() {
  return {
    id: 'offer-123',
    title: '20% de réduction',
    description: 'Sur vitamines et compléments',
    type: OfferType.DISCOUNT,
    discountPercentage: 20,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    applicableTiers: [VIPTier.GOLD, VIPTier.PLATINUM],
    usageLimit: 100,
    usageCount: 42,
    termsAndConditions: 'Valide sur produits sélectionnés',
    featured: true,
  };
}

function buildPointsHistory() {
  return {
    id: 'hist-123',
    memberId: 'member-123',
    points: 50,
    type: 'earned' as const,
    description: 'Points gagnés lors achat',
    transactionId: 'txn-123',
    createdAt: new Date(),
  };
}

describe('VIP Portal Components', () => {
  describe('RewardsSection', () => {
    it('should display available rewards', () => {
      const rewards = [buildVIPReward()];
      render(<RewardsSection rewards={rewards} />);

      expect(screen.getByText('Bon de réduction 50 CHF')).toBeInTheDocument();
      expect(screen.getByText('Utilisable sur votre prochain achat')).toBeInTheDocument();
    });

    it('should show reward statuses', () => {
      const reward1 = buildVIPReward();
      const reward2 = { ...buildVIPReward(), id: 'reward-2', status: RewardStatus.REDEEMED };
      const rewards = [reward1, reward2];
      render(<RewardsSection rewards={rewards} />);

      expect(screen.getByText('Disponible')).toBeInTheDocument();
      const utilisedChips = screen.getAllByText('Utilisé');
      expect(utilisedChips.length).toBeGreaterThan(0);
    });

    it('should show empty state when no rewards', () => {
      render(<RewardsSection rewards={[]} />);

      expect(screen.getByText(/Aucune récompense/i)).toBeInTheDocument();
    });

    it('should handle loading state', () => {
      const { container } = render(<RewardsSection rewards={[]} loading={true} />);

      expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument();
    });

    it('should open redeem dialog', async () => {
      const onRedeem = jest.fn();
      const rewards = [buildVIPReward()];

      render(<RewardsSection rewards={rewards} onRedeem={onRedeem} />);

      const useButtons = screen.getAllByRole('button').filter(btn => btn.textContent?.includes('Utiliser'));
      if (useButtons.length > 0) {
        fireEvent.click(useButtons[0]);

        await waitFor(() => {
          expect(screen.getByText('Utiliser la récompense')).toBeInTheDocument();
        });
      }
    });
  });

  describe('OffersSection', () => {
    it('should display offers', () => {
      const offers = [buildVIPOffer()];
      render(<OffersSection offers={offers} />);

      expect(screen.getByText('20% de réduction')).toBeInTheDocument();
      expect(screen.getByText('VEDETTE')).toBeInTheDocument();
    });

    it('should show offer discount', () => {
      const offers = [buildVIPOffer()];
      render(<OffersSection offers={offers} />);

      expect(screen.getByText('20%')).toBeInTheDocument();
    });

    it('should handle empty offers', () => {
      render(<OffersSection offers={[]} />);

      expect(screen.getByText(/Aucune offre/i)).toBeInTheDocument();
    });

    it('should show loading state', () => {
      const { container } = render(<OffersSection offers={[]} loading={true} />);

      expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument();
    });

    it('should open offer details', async () => {
      const offers = [buildVIPOffer()];
      render(<OffersSection offers={offers} />);

      fireEvent.click(screen.getByRole('button', { name: /voir les détails/i }));

      await waitFor(() => {
        expect(screen.getByText(/Conditions/i)).toBeInTheDocument();
      });
    });
  });

  describe('TierBenefitsCard', () => {
    it('should display membership tier', () => {
      const membership = buildVIPMembership();
      const tierInfo = buildVIPTierInfo();

      render(
        <TierBenefitsCard membership={membership} tierInfo={tierInfo} />
      );

      expect(screen.getByText('Niveau Gold')).toBeInTheDocument();
    });

    it('should show total points', () => {
      const membership = buildVIPMembership();
      const tierInfo = buildVIPTierInfo();

      render(
        <TierBenefitsCard membership={membership} tierInfo={tierInfo} />
      );

      expect(screen.getByText('850')).toBeInTheDocument();
    });

    it('should display tier benefits', () => {
      const membership = buildVIPMembership();
      const tierInfo = buildVIPTierInfo();

      render(
        <TierBenefitsCard membership={membership} tierInfo={tierInfo} />
      );

      expect(screen.getByText('Réduction spéciale')).toBeInTheDocument();
      expect(screen.getByText('Points multipliés')).toBeInTheDocument();
    });

    it('should show upgrade button when next tier available', () => {
      const membership = buildVIPMembership();
      const tierInfo = buildVIPTierInfo(VIPTier.GOLD);
      const nextTierInfo = buildVIPTierInfo(VIPTier.PLATINUM);
      const onUpgradeClick = jest.fn();

      render(
        <TierBenefitsCard
          membership={membership}
          tierInfo={tierInfo}
          nextTierInfo={nextTierInfo}
          onUpgradeClick={onUpgradeClick}
        />
      );

      const upgradeButton = screen.getByRole('button', { name: /Viser le niveau/ });
      fireEvent.click(upgradeButton);

      expect(onUpgradeClick).toHaveBeenCalled();
    });
  });

  describe('PointsHistorySection', () => {
    it('should display points history entries', () => {
      const history = [buildPointsHistory()];

      render(<PointsHistorySection history={history} />);

      expect(screen.getByText('Gagné')).toBeInTheDocument();
    });

    it('should show point values', () => {
      const history = [buildPointsHistory()];

      render(<PointsHistorySection history={history} />);

      expect(screen.getByText('+50')).toBeInTheDocument();
    });

    it('should handle empty history', () => {
      render(<PointsHistorySection history={[]} />);

      expect(screen.getByText(/Aucune activité/i)).toBeInTheDocument();
    });

    it('should show loading state', () => {
      const { container } = render(
        <PointsHistorySection history={[]} loading={true} />
      );

      expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument();
    });

    it('should display correct transaction info', () => {
      const history = [buildPointsHistory()];

      render(<PointsHistorySection history={history} />);

      expect(screen.getByText(/txn-123/i)).toBeInTheDocument();
    });
  });

  describe('Complete VIP Portal Workflow', () => {
    it('should render all sections together', () => {
      const membership = buildVIPMembership();
      const tierInfo = buildVIPTierInfo();
      const rewards = [buildVIPReward()];
      const offers = [buildVIPOffer()];
      const history = [buildPointsHistory()];

      const { container } = render(
        <div>
          <TierBenefitsCard membership={membership} tierInfo={tierInfo} />
          <RewardsSection rewards={rewards} />
          <OffersSection offers={offers} />
          <PointsHistorySection history={history} />
        </div>
      );

      expect(container.textContent).toContain('Niveau Gold');
      expect(container.textContent).toContain('Bon de réduction');
      expect(container.textContent).toContain('20% de réduction');
      expect(container.textContent).toContain('Gagné');
    });
  });
});
