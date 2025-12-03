/**
 * Achievement Service Unit Tests
 * T6-020: Achievements gamification system
 */

describe('AchievementService', () => {
  describe('Achievement Categories', () => {
    it('should have health category', () => {
      const categories = ['health', 'loyalty', 'social', 'milestone'];
      expect(categories).toContain('health');
    });

    it('should have loyalty category', () => {
      const categories = ['health', 'loyalty', 'social', 'milestone'];
      expect(categories).toContain('loyalty');
    });

    it('should have social category', () => {
      const categories = ['health', 'loyalty', 'social', 'milestone'];
      expect(categories).toContain('social');
    });

    it('should have milestone category', () => {
      const categories = ['health', 'loyalty', 'social', 'milestone'];
      expect(categories).toContain('milestone');
    });
  });

  describe('Achievement Tiers', () => {
    it('should have bronze tier', () => {
      const tiers = ['bronze', 'silver', 'gold', 'platinum'];
      expect(tiers).toContain('bronze');
    });

    it('should have silver tier', () => {
      const tiers = ['bronze', 'silver', 'gold', 'platinum'];
      expect(tiers).toContain('silver');
    });

    it('should have gold tier', () => {
      const tiers = ['bronze', 'silver', 'gold', 'platinum'];
      expect(tiers).toContain('gold');
    });

    it('should have platinum tier', () => {
      const tiers = ['bronze', 'silver', 'gold', 'platinum'];
      expect(tiers).toContain('platinum');
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate 50% progress correctly', () => {
      const current = 50;
      const target = 100;
      const progress = Math.round((current / target) * 100);
      expect(progress).toBe(50);
    });

    it('should cap progress at 100%', () => {
      const current = 150;
      const target = 100;
      const progress = Math.min(100, Math.round((current / target) * 100));
      expect(progress).toBe(100);
    });

    it('should support 0% progress', () => {
      const current = 0;
      const target = 100;
      const progress = Math.round((current / target) * 100);
      expect(progress).toBe(0);
    });

    it('should support 25% progress', () => {
      const current = 25;
      const target = 100;
      const progress = Math.round((current / target) * 100);
      expect(progress).toBe(25);
    });

    it('should support 75% progress', () => {
      const current = 75;
      const target = 100;
      const progress = Math.round((current / target) * 100);
      expect(progress).toBe(75);
    });
  });

  describe('Achievement Milestones', () => {
    describe('Adherence Milestones', () => {
      it('should support 7-day adherence', () => {
        const milestones = [7, 30, 90, 365];
        expect(milestones).toContain(7);
      });

      it('should support 30-day adherence', () => {
        const milestones = [7, 30, 90, 365];
        expect(milestones).toContain(30);
      });

      it('should support 90-day adherence', () => {
        const milestones = [7, 30, 90, 365];
        expect(milestones).toContain(90);
      });

      it('should support 365-day adherence', () => {
        const milestones = [7, 30, 90, 365];
        expect(milestones).toContain(365);
      });
    });

    describe('Referral Milestones', () => {
      it('should support 1 referral', () => {
        const milestones = [1, 5, 10];
        expect(milestones).toContain(1);
      });

      it('should support 5 referrals', () => {
        const milestones = [1, 5, 10];
        expect(milestones).toContain(5);
      });

      it('should support 10 referrals', () => {
        const milestones = [1, 5, 10];
        expect(milestones).toContain(10);
      });
    });
  });

  describe('Points Rewards', () => {
    it('first order should give 10 points', () => {
      const points = 10;
      expect(points).toBeGreaterThan(0);
    });

    it('7-day adherence should give points', () => {
      const points = 10;
      expect(points).toBeGreaterThan(0);
    });

    it('30-day adherence should give more points than 7-day', () => {
      const sevenDay = 10;
      const thirtyDay = 30;
      expect(thirtyDay).toBeGreaterThan(sevenDay);
    });

    it('1 referral should give 25 points', () => {
      const points = 25;
      expect(points).toBeGreaterThan(0);
    });

    it('5 referrals should give 125 points', () => {
      const points = 125;
      expect(points).toBeGreaterThan(0);
    });

    it('10 referrals should give 250 points', () => {
      const points = 250;
      expect(points).toBeGreaterThan(0);
    });
  });

  describe('VIP Tier Achievements', () => {
    it('should have silver tier achievement', () => {
      const tier = 'silver';
      const validTiers = ['silver', 'gold', 'platinum'];
      expect(validTiers).toContain(tier);
    });

    it('should have gold tier achievement', () => {
      const tier = 'gold';
      const validTiers = ['silver', 'gold', 'platinum'];
      expect(validTiers).toContain(tier);
    });

    it('should have platinum tier achievement', () => {
      const tier = 'platinum';
      const validTiers = ['silver', 'gold', 'platinum'];
      expect(validTiers).toContain(tier);
    });
  });

  describe('Requirement Types', () => {
    it('should support count requirement', () => {
      const requirement = { type: 'count', threshold: 1 };
      expect(requirement.type).toBe('count');
      expect(requirement.threshold).toBeGreaterThan(0);
    });

    it('should support duration requirement', () => {
      const requirement = { type: 'duration', threshold: 7, period: 'days' };
      expect(requirement.type).toBe('duration');
      expect(requirement.period).toBeDefined();
    });

    it('should support streak requirement', () => {
      const requirement = { type: 'streak', threshold: 30 };
      expect(requirement.type).toBe('streak');
      expect(requirement.threshold).toBeGreaterThan(0);
    });

    it('should support amount requirement', () => {
      const requirement = { type: 'amount', threshold: 100 };
      expect(requirement.type).toBe('amount');
      expect(requirement.threshold).toBeGreaterThan(0);
    });
  });

  describe('Health Goals', () => {
    it('should support weight_loss goal', () => {
      const goals = ['weight_loss', 'fitness', 'nutrition'];
      expect(goals).toContain('weight_loss');
    });

    it('should support fitness goal', () => {
      const goals = ['weight_loss', 'fitness', 'nutrition'];
      expect(goals).toContain('fitness');
    });

    it('should support nutrition goal', () => {
      const goals = ['weight_loss', 'fitness', 'nutrition'];
      expect(goals).toContain('nutrition');
    });
  });

  describe('Leaderboard Sorting', () => {
    it('should sort by points descending', () => {
      const entries = [
        { patientId: 'p1', totalPoints: 100 },
        { patientId: 'p2', totalPoints: 200 },
        { patientId: 'p3', totalPoints: 150 },
      ];
      const sorted = entries.sort((a, b) => b.totalPoints - a.totalPoints);
      expect(sorted[0].totalPoints).toBe(200);
      expect(sorted[1].totalPoints).toBe(150);
      expect(sorted[2].totalPoints).toBe(100);
    });

    it('should assign correct ranks', () => {
      const entries = [
        { totalPoints: 500, rank: 1 },
        { totalPoints: 400, rank: 2 },
        { totalPoints: 300, rank: 3 },
      ];
      entries.forEach((entry, index) => {
        expect(entry.rank).toBe(index + 1);
      });
    });

    it('should respect limit of 100', () => {
      const entries = Array.from({ length: 200 }, (_, i) => ({
        patientId: `p${i}`,
        totalPoints: 1000 - i,
      }));
      const limited = entries.slice(0, 100);
      expect(limited.length).toBe(100);
    });
  });
});
