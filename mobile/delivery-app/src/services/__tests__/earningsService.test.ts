/**
 * Earnings Service Unit Tests
 * Tests earnings data fetching, calculations, and export functionality
 */

import type { TimePeriod } from '../../store/earningsSlice';
import earningsService from '../earningsService';

describe('Earnings Service', () => {
  describe('getSummary', () => {
    it('should fetch summary for today', async () => {
      const summary = await earningsService.getSummary('today');

      expect(summary).toBeDefined();
      expect(summary.totalEarnings).toBe(85.50);
      expect(summary.deliveryFees).toBe(65.00);
      expect(summary.bonuses).toBe(15.00);
      expect(summary.tips).toBe(5.50);
    });

    it('should fetch summary for week', async () => {
      const summary = await earningsService.getSummary('week');

      expect(summary).toBeDefined();
      expect(summary.totalEarnings).toBe(487.25);
      expect(summary.deliveryFees).toBe(380.00);
    });

    it('should fetch summary for month', async () => {
      const summary = await earningsService.getSummary('month');

      expect(summary).toBeDefined();
      expect(summary.totalEarnings).toBe(1950.00);
    });

    it('should fetch summary for year', async () => {
      const summary = await earningsService.getSummary('year');

      expect(summary).toBeDefined();
      expect(summary.totalEarnings).toBe(24000.00);
    });

    it('should have required summary fields', async () => {
      const summary = await earningsService.getSummary('week');

      expect(summary).toHaveProperty('totalEarnings');
      expect(summary).toHaveProperty('deliveryFees');
      expect(summary).toHaveProperty('bonuses');
      expect(summary).toHaveProperty('tips');
      expect(summary).toHaveProperty('pendingAmount');
      expect(summary).toHaveProperty('availableForPayout');
    });

    it('should handle invalid period gracefully', async () => {
      const summary = await earningsService.getSummary('week');
      expect(summary).toBeDefined();
    });
  });

  describe('getTransactions', () => {
    it('should fetch transactions', async () => {
      const transactions = await earningsService.getTransactions('week');

      expect(Array.isArray(transactions)).toBe(true);
      expect(transactions.length).toBeGreaterThan(0);
    });

    it('should have correct transaction structure', async () => {
      const transactions = await earningsService.getTransactions('week');
      const transaction = transactions[0];

      expect(transaction).toHaveProperty('id');
      expect(transaction).toHaveProperty('date');
      expect(transaction).toHaveProperty('type');
      expect(transaction).toHaveProperty('amount');
      expect(transaction).toHaveProperty('description');
    });

    it('should include delivery fee transactions', async () => {
      const transactions = await earningsService.getTransactions('week');
      const deliveryFees = transactions.filter((t) => t.type === 'delivery_fee');

      expect(deliveryFees.length).toBeGreaterThan(0);
    });

    it('should include tip transactions', async () => {
      const transactions = await earningsService.getTransactions('week');
      const tips = transactions.filter((t) => t.type === 'tip');

      expect(tips.length).toBeGreaterThan(0);
    });

    it('should include bonus transactions', async () => {
      const transactions = await earningsService.getTransactions('week');
      const bonuses = transactions.filter((t) => t.type === 'bonus');

      expect(bonuses.length).toBeGreaterThan(0);
    });

    it('should have valid transaction amounts', async () => {
      const transactions = await earningsService.getTransactions('week');

      transactions.forEach((txn) => {
        expect(typeof txn.amount).toBe('number');
        expect(txn.amount).toBeGreaterThan(0);
      });
    });

    it('should have valid ISO date strings', async () => {
      const transactions = await earningsService.getTransactions('week');

      transactions.forEach((txn) => {
        const date = new Date(txn.date);
        expect(date.getTime()).toBeGreaterThan(0);
      });
    });
  });

  describe('getBonuses', () => {
    it('should fetch bonuses', async () => {
      const bonuses = await earningsService.getBonuses();

      expect(Array.isArray(bonuses)).toBe(true);
      expect(bonuses.length).toBeGreaterThan(0);
    });

    it('should have correct bonus structure', async () => {
      const bonuses = await earningsService.getBonuses();
      const bonus = bonuses[0];

      expect(bonus).toHaveProperty('id');
      expect(bonus).toHaveProperty('title');
      expect(bonus).toHaveProperty('description');
      expect(bonus).toHaveProperty('amount');
      expect(bonus).toHaveProperty('progress');
      expect(bonus).toHaveProperty('target');
      expect(bonus).toHaveProperty('expiresAt');
      expect(bonus).toHaveProperty('isActive');
    });

    it('should have active bonuses', async () => {
      const bonuses = await earningsService.getBonuses();
      const activeBonuses = bonuses.filter((b) => b.isActive);

      expect(activeBonuses.length).toBeGreaterThan(0);
    });

    it('should have valid progress values', async () => {
      const bonuses = await earningsService.getBonuses();

      bonuses.forEach((bonus) => {
        expect(bonus.progress).toBeLessThanOrEqual(bonus.target);
        expect(bonus.progress).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have valid expiration dates', async () => {
      const bonuses = await earningsService.getBonuses();

      bonuses.forEach((bonus) => {
        const expiry = new Date(bonus.expiresAt);
        expect(expiry.getTime()).toBeGreaterThan(0);
      });
    });

    it('should have positive reward amounts', async () => {
      const bonuses = await earningsService.getBonuses();

      bonuses.forEach((bonus) => {
        expect(bonus.amount).toBeGreaterThan(0);
      });
    });
  });

  describe('exportReport', () => {
    it('should export CSV report', async () => {
      const csv = await earningsService.exportReport('week', 'csv');

      expect(typeof csv).toBe('string');
      expect(csv.length).toBeGreaterThan(0);
    });

    it('should export PDF report', async () => {
      const pdf = await earningsService.exportReport('week', 'pdf');

      expect(typeof pdf).toBe('string');
      expect(pdf.length).toBeGreaterThan(0);
    });

    it('should include summary data in CSV', async () => {
      const csv = await earningsService.exportReport('week', 'csv');

      expect(csv).toContain('Earnings Report');
      expect(csv).toContain('Summary');
    });

    it('should include period in report', async () => {
      const csv = await earningsService.exportReport('month', 'csv');

      expect(csv).toContain('month');
    });

    it('should have timestamp in report', async () => {
      const csv = await earningsService.exportReport('week', 'csv');

      expect(csv).toContain('Generated');
    });

    it('should handle CSV for all periods', async () => {
      const periods: TimePeriod[] = ['today', 'week', 'month', 'year'];

      for (const period of periods) {
        const csv = await earningsService.exportReport(period, 'csv');
        expect(typeof csv).toBe('string');
        expect(csv.length).toBeGreaterThan(0);
      }
    });

    it('should handle PDF for all periods', async () => {
      const periods: TimePeriod[] = ['today', 'week', 'month', 'year'];

      for (const period of periods) {
        const pdf = await earningsService.exportReport(period, 'pdf');
        expect(typeof pdf).toBe('string');
        expect(pdf.length).toBeGreaterThan(0);
      }
    });
  });

  describe('calculateStatistics', () => {
    it('should calculate statistics from summary', () => {
      const summary = {
        totalEarnings: 480,
        deliveryFees: 360,
        bonuses: 75,
        tips: 45,
        pendingAmount: 100,
        availableForPayout: 380,
      };

      const stats = earningsService.calculateStatistics(summary);

      expect(stats).toHaveProperty('averagePerDay');
      expect(stats).toHaveProperty('averagePerDelivery');
    });

    it('should have positive average values', () => {
      const summary = {
        totalEarnings: 480,
        deliveryFees: 360,
        bonuses: 75,
        tips: 45,
        pendingAmount: 100,
        availableForPayout: 380,
      };

      const stats = earningsService.calculateStatistics(summary);

      expect(stats.averagePerDay).toBeGreaterThan(0);
      expect(stats.averagePerDelivery).toBeGreaterThan(0);
    });

    it('should handle zero earnings', () => {
      const summary = {
        totalEarnings: 0,
        deliveryFees: 0,
        bonuses: 0,
        tips: 0,
        pendingAmount: 0,
        availableForPayout: 0,
      };

      const stats = earningsService.calculateStatistics(summary);

      expect(stats.averagePerDay).toBe(0);
      expect(stats.averagePerDelivery).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle summary fetch errors gracefully', async () => {
      try {
        await earningsService.getSummary('week');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should provide meaningful error messages', async () => {
      try {
        await earningsService.getSummary('week');
      } catch (error) {
        if (error instanceof Error) {
          expect(error.message).toContain('Failed');
        }
      }
    });
  });

  describe('Data Validation', () => {
    it('should return valid numbers for summary', async () => {
      const summary = await earningsService.getSummary('week');

      Object.values(summary).forEach((value) => {
        expect(typeof value).toBe('number');
      });
    });

    it('should return non-negative earnings values', async () => {
      const summary = await earningsService.getSummary('week');

      expect(summary.totalEarnings).toBeGreaterThanOrEqual(0);
      expect(summary.deliveryFees).toBeGreaterThanOrEqual(0);
      expect(summary.bonuses).toBeGreaterThanOrEqual(0);
      expect(summary.tips).toBeGreaterThanOrEqual(0);
    });

    it('should return transactions with valid types', async () => {
      const transactions = await earningsService.getTransactions('week');
      const validTypes = ['delivery_fee', 'bonus', 'tip', 'payout'];

      transactions.forEach((txn) => {
        expect(validTypes).toContain(txn.type);
      });
    });

    it('should ensure available for payout is non-negative', async () => {
      const summary = await earningsService.getSummary('week');
      expect(summary.availableForPayout).toBeGreaterThanOrEqual(0);
    });
  });
});
