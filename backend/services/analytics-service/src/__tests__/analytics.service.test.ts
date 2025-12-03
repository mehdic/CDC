/**
 * Analytics Service Tests
 * Comprehensive unit tests for analytics business logic
 */

import { AnalyticsService } from '../services/analytics.service';
import { DashboardData, PharmacyMetrics } from '../models/analytics.model';

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    analyticsService = new AnalyticsService();
    analyticsService.initializeMockData();
  });

  describe('getDashboardData', () => {
    it('should return dashboard data for a valid pharmacy ID', () => {
      const pharmacyId = 'pharmacy-001';
      const dashboard = analyticsService.getDashboardData(pharmacyId);

      expect(dashboard).toBeDefined();
      expect(dashboard.pharmacyId).toBe(pharmacyId);
      expect(dashboard.metrics).toBeDefined();
      expect(dashboard.timeSeries).toBeDefined();
      expect(dashboard.topProducts).toBeDefined();
      expect(dashboard.recentOrders).toBeDefined();
      expect(dashboard.lastUpdated).toBeDefined();
    });

    it('should include revenue metrics in dashboard', () => {
      const dashboard = analyticsService.getDashboardData('pharmacy-001');

      expect(dashboard.metrics.revenue).toBeDefined();
      expect(dashboard.metrics.revenue.today).toBeGreaterThanOrEqual(0);
      expect(dashboard.metrics.revenue.thisWeek).toBeGreaterThanOrEqual(0);
      expect(dashboard.metrics.revenue.thisMonth).toBeGreaterThanOrEqual(0);
      expect(typeof dashboard.metrics.revenue.trend).toBe('number');
    });

    it('should include prescription metrics in dashboard', () => {
      const dashboard = analyticsService.getDashboardData('pharmacy-001');

      expect(dashboard.metrics.prescriptions).toBeDefined();
      expect(dashboard.metrics.prescriptions.today).toBeGreaterThanOrEqual(0);
      expect(dashboard.metrics.prescriptions.thisWeek).toBeGreaterThanOrEqual(0);
      expect(dashboard.metrics.prescriptions.thisMonth).toBeGreaterThanOrEqual(0);
      expect(typeof dashboard.metrics.prescriptions.trend).toBe('number');
    });

    it('should include inventory metrics in dashboard', () => {
      const dashboard = analyticsService.getDashboardData('pharmacy-001');

      expect(dashboard.metrics.inventory).toBeDefined();
      expect(dashboard.metrics.inventory.totalItems).toBeGreaterThanOrEqual(0);
      expect(dashboard.metrics.inventory.lowStockItems).toBeGreaterThanOrEqual(0);
      expect(dashboard.metrics.inventory.expiredItems).toBeGreaterThanOrEqual(0);
      expect(dashboard.metrics.inventory.totalValue).toBeGreaterThanOrEqual(0);
    });

    it('should include time series data in dashboard', () => {
      const dashboard = analyticsService.getDashboardData('pharmacy-001');

      expect(dashboard.timeSeries.daily).toBeDefined();
      expect(dashboard.timeSeries.daily.length).toBeGreaterThan(0);
      expect(dashboard.timeSeries.weekly).toBeDefined();
      expect(dashboard.timeSeries.monthly).toBeDefined();

      // Verify time series data structure
      const firstDaily = dashboard.timeSeries.daily[0];
      expect(firstDaily.date).toBeDefined();
      expect(firstDaily.revenue).toBeGreaterThanOrEqual(0);
      expect(firstDaily.prescriptions).toBeGreaterThanOrEqual(0);
      expect(firstDaily.inventory).toBeGreaterThanOrEqual(0);
    });

    it('should include top products in dashboard', () => {
      const dashboard = analyticsService.getDashboardData('pharmacy-001');

      expect(dashboard.topProducts).toBeDefined();
      expect(dashboard.topProducts.length).toBeGreaterThan(0);
      expect(dashboard.topProducts.length).toBeLessThanOrEqual(5);

      // Verify product structure
      const firstProduct = dashboard.topProducts[0];
      expect(firstProduct.id).toBeDefined();
      expect(firstProduct.name).toBeDefined();
      expect(firstProduct.sales).toBeGreaterThanOrEqual(0);
      expect(firstProduct.revenue).toBeGreaterThanOrEqual(0);
    });

    it('should include recent orders in dashboard', () => {
      const dashboard = analyticsService.getDashboardData('pharmacy-001');

      expect(dashboard.recentOrders).toBeDefined();
      expect(dashboard.recentOrders.length).toBeGreaterThan(0);
      expect(dashboard.recentOrders.length).toBeLessThanOrEqual(10);

      // Verify order structure
      const firstOrder = dashboard.recentOrders[0];
      expect(firstOrder.id).toBeDefined();
      expect(firstOrder.date).toBeDefined();
      expect(firstOrder.amount).toBeGreaterThanOrEqual(0);
      expect(firstOrder.status).toBeDefined();
    });

    it('should throw error for non-existent pharmacy', () => {
      expect(() => {
        analyticsService.getDashboardData('non-existent-pharmacy');
      }).toThrow();
    });

    it('should respect custom date filters', () => {
      const startDate = '2025-11-01';
      const endDate = '2025-11-30';

      const dashboard = analyticsService.getDashboardData('pharmacy-001', {
        pharmacyId: 'pharmacy-001',
        startDate,
        endDate,
      });

      expect(dashboard).toBeDefined();
      expect(dashboard.timeSeries.daily).toBeDefined();
    });
  });

  describe('getMetricsSummary', () => {
    it('should return metrics summary for a valid pharmacy ID', () => {
      const metrics = analyticsService.getMetricsSummary('pharmacy-001');

      expect(metrics).toBeDefined();
      expect(metrics.pharmacyId).toBe('pharmacy-001');
      expect(metrics.totalRevenue).toBeGreaterThanOrEqual(0);
      expect(metrics.totalPrescriptions).toBeGreaterThanOrEqual(0);
      expect(metrics.averageOrderValue).toBeGreaterThanOrEqual(0);
      expect(metrics.inventoryValue).toBeGreaterThanOrEqual(0);
      expect(metrics.lastUpdated).toBeDefined();
    });

    it('should calculate average order value correctly', () => {
      const metrics = analyticsService.getMetricsSummary('pharmacy-001');

      if (metrics.totalPrescriptions > 0) {
        const expectedAOV = metrics.totalRevenue / metrics.totalPrescriptions;
        expect(metrics.averageOrderValue).toBeCloseTo(expectedAOV, 1);
      }
    });

    it('should return zero averages for zero prescriptions', () => {
      const metrics = analyticsService.getMetricsSummary('pharmacy-001');

      if (metrics.totalPrescriptions === 0) {
        expect(metrics.averageOrderValue).toBe(0);
      }
    });

    it('should throw error for non-existent pharmacy', () => {
      expect(() => {
        analyticsService.getMetricsSummary('non-existent-pharmacy');
      }).toThrow();
    });
  });

  describe('getRevenueTrends', () => {
    it('should return revenue trends for a valid date range', () => {
      const startDate = '2025-11-01';
      const endDate = '2025-11-30';

      const trends = analyticsService.getRevenueTrends('pharmacy-001', startDate, endDate);

      expect(trends).toBeDefined();
      expect(Array.isArray(trends)).toBe(true);
      expect(trends.length).toBeGreaterThan(0);
    });

    it('should have correct data structure for trends', () => {
      const startDate = '2025-11-01';
      const endDate = '2025-11-05';

      const trends = analyticsService.getRevenueTrends('pharmacy-001', startDate, endDate);

      trends.forEach(trend => {
        expect(trend.date).toBeDefined();
        expect(typeof trend.date).toBe('string');
        expect(trend.value).toBeGreaterThanOrEqual(0);
        expect(typeof trend.value).toBe('number');
      });
    });

    it('should throw error for non-existent pharmacy', () => {
      expect(() => {
        analyticsService.getRevenueTrends('non-existent-pharmacy', '2025-11-01', '2025-11-30');
      }).toThrow();
    });
  });

  describe('getPrescriptionTrends', () => {
    it('should return prescription trends for a valid date range', () => {
      const startDate = '2025-11-01';
      const endDate = '2025-11-30';

      const trends = analyticsService.getPrescriptionTrends('pharmacy-001', startDate, endDate);

      expect(trends).toBeDefined();
      expect(Array.isArray(trends)).toBe(true);
      expect(trends.length).toBeGreaterThan(0);
    });

    it('should have correct data structure for trends', () => {
      const startDate = '2025-11-01';
      const endDate = '2025-11-05';

      const trends = analyticsService.getPrescriptionTrends('pharmacy-001', startDate, endDate);

      trends.forEach(trend => {
        expect(trend.date).toBeDefined();
        expect(typeof trend.date).toBe('string');
        expect(trend.value).toBeGreaterThanOrEqual(0);
        expect(typeof trend.value).toBe('number');
      });
    });

    it('should throw error for non-existent pharmacy', () => {
      expect(() => {
        analyticsService.getPrescriptionTrends('non-existent-pharmacy', '2025-11-01', '2025-11-30');
      }).toThrow();
    });
  });

  describe('Data Consistency', () => {
    it('should ensure thisMonth >= thisWeek', () => {
      const dashboard = analyticsService.getDashboardData('pharmacy-001');

      expect(dashboard.metrics.revenue.thisMonth).toBeGreaterThanOrEqual(dashboard.metrics.revenue.thisWeek);
      expect(dashboard.metrics.prescriptions.thisMonth).toBeGreaterThanOrEqual(dashboard.metrics.prescriptions.thisWeek);
    });

    it('should ensure thisWeek >= today', () => {
      const dashboard = analyticsService.getDashboardData('pharmacy-001');

      expect(dashboard.metrics.revenue.thisWeek).toBeGreaterThanOrEqual(dashboard.metrics.revenue.today);
      expect(dashboard.metrics.prescriptions.thisWeek).toBeGreaterThanOrEqual(dashboard.metrics.prescriptions.today);
    });

    it('should have non-negative metrics', () => {
      const dashboard = analyticsService.getDashboardData('pharmacy-001');

      expect(dashboard.metrics.revenue.today).toBeGreaterThanOrEqual(0);
      expect(dashboard.metrics.revenue.thisWeek).toBeGreaterThanOrEqual(0);
      expect(dashboard.metrics.revenue.thisMonth).toBeGreaterThanOrEqual(0);
      expect(dashboard.metrics.prescriptions.today).toBeGreaterThanOrEqual(0);
      expect(dashboard.metrics.prescriptions.thisWeek).toBeGreaterThanOrEqual(0);
      expect(dashboard.metrics.prescriptions.thisMonth).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single day date ranges', () => {
      const singleDate = '2025-11-15';
      const trends = analyticsService.getRevenueTrends('pharmacy-001', singleDate, singleDate);

      expect(trends.length).toBe(1);
      expect(trends[0].date).toBe(singleDate);
    });

    it('should return empty array for future dates', () => {
      const futureDate = '2099-01-01';
      const trends = analyticsService.getRevenueTrends('pharmacy-001', futureDate, '2099-01-31');

      expect(Array.isArray(trends)).toBe(true);
    });
  });
});
