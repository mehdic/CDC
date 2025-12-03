/**
 * Analytics Service
 * Provides business logic for analytics calculations and data aggregation
 */

import {
  DashboardData,
  PharmacyMetrics,
  DailyMetric,
  MetricSnapshot,
  AnalyticsFilter,
} from '../models/analytics.model';

/**
 * Mock data storage - In production, this would query a database
 */
interface StoredMetrics {
  [pharmacyId: string]: {
    dailyRevenue: Map<string, number>;
    dailyPrescriptions: Map<string, number>;
    dailyInventory: Map<string, number>;
    orders: Array<{ id: string; date: string; amount: number; status: string }>;
    products: Array<{ id: string; name: string; sales: number; revenue: number }>;
  };
}

export class AnalyticsService {
  private metricsStore: StoredMetrics = {};

  /**
   * Initialize service with mock data
   */
  initializeMockData(): void {
    const pharmacyId = 'pharmacy-001';
    const today = new Date();

    // Generate mock data for the last 30 days
    const dailyRevenue = new Map<string, number>();
    const dailyPrescriptions = new Map<string, number>();
    const dailyInventory = new Map<string, number>();

    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Generate realistic mock values
      dailyRevenue.set(dateStr, Math.floor(Math.random() * 2000) + 500);
      dailyPrescriptions.set(dateStr, Math.floor(Math.random() * 50) + 10);
      dailyInventory.set(dateStr, Math.floor(Math.random() * 100000) + 50000);
    }

    // Mock orders
    const orders = Array.from({ length: 20 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      return {
        id: `order-${String(i + 1).padStart(4, '0')}`,
        date: date.toISOString().split('T')[0],
        amount: Math.floor(Math.random() * 500) + 50,
        status: ['completed', 'processing', 'pending'][Math.floor(Math.random() * 3)],
      };
    });

    // Mock products
    const productNames = ['Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Metformin', 'Atorvastatin', 'Lisinopril', 'Omeprazole', 'Aspirin'];
    const products = productNames.map((name, i) => ({
      id: `prod-${String(i + 1).padStart(4, '0')}`,
      name,
      sales: Math.floor(Math.random() * 500) + 100,
      revenue: Math.floor(Math.random() * 5000) + 1000,
    }));

    this.metricsStore[pharmacyId] = {
      dailyRevenue,
      dailyPrescriptions,
      dailyInventory,
      orders,
      products,
    };
  }

  /**
   * Get comprehensive dashboard data for a pharmacy
   */
  getDashboardData(pharmacyId: string, filter?: AnalyticsFilter): DashboardData {
    const startDate = filter?.startDate || this.getDateString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const endDate = filter?.endDate || this.getDateString(new Date());

    const metrics = this.metricsStore[pharmacyId];
    if (!metrics) {
      throw new Error(`No data found for pharmacy ${pharmacyId}`);
    }

    const today = this.getDateString(new Date());
    const thisWeekStart = this.getDateString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const thisMonthStart = this.getDateString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

    // Calculate revenue metrics
    const todayRevenue = metrics.dailyRevenue.get(today) || 0;
    const thisWeekRevenue = this.sumMetricsInRange(metrics.dailyRevenue, thisWeekStart, today);
    const thisMonthRevenue = this.sumMetricsInRange(metrics.dailyRevenue, thisMonthStart, today);
    const previousMonthRevenue = this.sumMetricsInRange(
      metrics.dailyRevenue,
      this.getDateString(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)),
      thisMonthStart
    );
    const revenueTrend = previousMonthRevenue > 0 ? ((thisMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : 0;

    // Calculate prescription metrics
    const todayPrescriptions = metrics.dailyPrescriptions.get(today) || 0;
    const thisWeekPrescriptions = this.sumMetricsInRange(metrics.dailyPrescriptions, thisWeekStart, today);
    const thisMonthPrescriptions = this.sumMetricsInRange(metrics.dailyPrescriptions, thisMonthStart, today);
    const previousMonthPrescriptions = this.sumMetricsInRange(
      metrics.dailyPrescriptions,
      this.getDateString(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)),
      thisMonthStart
    );
    const prescriptionTrend = previousMonthPrescriptions > 0 ? ((thisMonthPrescriptions - previousMonthPrescriptions) / previousMonthPrescriptions) * 100 : 0;

    // Calculate inventory metrics
    const currentInventory = metrics.dailyInventory.get(today) || 0;
    const lowStockItems = Math.floor(currentInventory * 0.1); // Mock: 10% are low stock
    const expiredItems = Math.floor(currentInventory * 0.02); // Mock: 2% are expired

    // Get time series data
    const daily = this.getTimeSeriesData(metrics, startDate, endDate, 'daily');
    const weekly = this.getTimeSeriesData(metrics, startDate, endDate, 'weekly');
    const monthly = this.getTimeSeriesData(metrics, startDate, endDate, 'monthly');

    // Filter and sort top products
    const topProducts = metrics.products.slice().sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Get recent orders
    const recentOrders = metrics.orders.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    return {
      pharmacyId,
      metrics: {
        revenue: {
          today: todayRevenue,
          thisWeek: thisWeekRevenue,
          thisMonth: thisMonthRevenue,
          trend: Math.round(revenueTrend * 100) / 100, // Round to 2 decimals
        },
        prescriptions: {
          today: todayPrescriptions,
          thisWeek: thisWeekPrescriptions,
          thisMonth: thisMonthPrescriptions,
          trend: Math.round(prescriptionTrend * 100) / 100,
        },
        inventory: {
          totalItems: currentInventory,
          lowStockItems,
          expiredItems,
          totalValue: Math.floor(currentInventory * 1.5), // Mock calculation
        },
      },
      timeSeries: {
        daily,
        weekly,
        monthly,
      },
      topProducts,
      recentOrders,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get pharmacy metrics summary
   */
  getMetricsSummary(pharmacyId: string): PharmacyMetrics {
    const metrics = this.metricsStore[pharmacyId];
    if (!metrics) {
      throw new Error(`No data found for pharmacy ${pharmacyId}`);
    }

    const today = this.getDateString(new Date());
    const thisMonthStart = this.getDateString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

    const totalRevenue = this.sumMetricsInRange(metrics.dailyRevenue, thisMonthStart, today);
    const totalPrescriptions = this.sumMetricsInRange(metrics.dailyPrescriptions, thisMonthStart, today);
    const averageOrderValue = totalRevenue > 0 ? totalRevenue / totalPrescriptions : 0;
    const inventoryValue = metrics.dailyInventory.get(today) || 0;

    return {
      pharmacyId,
      totalRevenue,
      totalPrescriptions,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      inventoryValue,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get revenue trends for a date range
   */
  getRevenueTrends(pharmacyId: string, startDate: string, endDate: string): MetricSnapshot[] {
    const metrics = this.metricsStore[pharmacyId];
    if (!metrics) {
      throw new Error(`No data found for pharmacy ${pharmacyId}`);
    }

    const result: MetricSnapshot[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const dateStr = this.getDateString(current);
      const value = metrics.dailyRevenue.get(dateStr) || 0;
      result.push({ date: dateStr, value });
      current.setDate(current.getDate() + 1);
    }

    return result;
  }

  /**
   * Get prescription trends for a date range
   */
  getPrescriptionTrends(pharmacyId: string, startDate: string, endDate: string): MetricSnapshot[] {
    const metrics = this.metricsStore[pharmacyId];
    if (!metrics) {
      throw new Error(`No data found for pharmacy ${pharmacyId}`);
    }

    const result: MetricSnapshot[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const dateStr = this.getDateString(current);
      const value = metrics.dailyPrescriptions.get(dateStr) || 0;
      result.push({ date: dateStr, value });
      current.setDate(current.getDate() + 1);
    }

    return result;
  }

  /**
   * Private helper methods
   */

  private getDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private sumMetricsInRange(metricsMap: Map<string, number>, startDate: string, endDate: string): number {
    let sum = 0;
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const dateStr = this.getDateString(current);
      sum += metricsMap.get(dateStr) || 0;
      current.setDate(current.getDate() + 1);
    }

    return sum;
  }

  private getTimeSeriesData(
    metrics: (typeof this.metricsStore)[string],
    startDate: string,
    endDate: string,
    groupBy: 'daily' | 'weekly' | 'monthly'
  ): DailyMetric[] {
    const result: DailyMetric[] = [];

    if (groupBy === 'daily') {
      const current = new Date(startDate);
      const end = new Date(endDate);

      while (current <= end) {
        const dateStr = this.getDateString(current);
        result.push({
          date: dateStr,
          revenue: metrics.dailyRevenue.get(dateStr) || 0,
          prescriptions: metrics.dailyPrescriptions.get(dateStr) || 0,
          inventory: metrics.dailyInventory.get(dateStr) || 0,
        });
        current.setDate(current.getDate() + 1);
      }
    } else if (groupBy === 'weekly') {
      let current = new Date(startDate);
      const end = new Date(endDate);

      while (current <= end) {
        const weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const endOfWeek = weekEnd > end ? end : weekEnd;
        const weekRevenue = this.sumMetricsInRange(metrics.dailyRevenue, this.getDateString(current), this.getDateString(endOfWeek));
        const weekPrescriptions = this.sumMetricsInRange(metrics.dailyPrescriptions, this.getDateString(current), this.getDateString(endOfWeek));
        const weekInventory = this.sumMetricsInRange(metrics.dailyInventory, this.getDateString(current), this.getDateString(endOfWeek)) / 7; // Average

        result.push({
          date: this.getDateString(current),
          revenue: weekRevenue,
          prescriptions: weekPrescriptions,
          inventory: Math.floor(weekInventory),
        });

        current.setDate(current.getDate() + 7);
      }
    } else {
      let current = new Date(startDate);
      const end = new Date(endDate);

      while (current.getMonth() <= end.getMonth() || current.getFullYear() < end.getFullYear()) {
        const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
        const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
        const endOfMonth = monthEnd > end ? end : monthEnd;

        const monthRevenue = this.sumMetricsInRange(metrics.dailyRevenue, this.getDateString(monthStart), this.getDateString(endOfMonth));
        const monthPrescriptions = this.sumMetricsInRange(metrics.dailyPrescriptions, this.getDateString(monthStart), this.getDateString(endOfMonth));
        const monthInventory = this.sumMetricsInRange(metrics.dailyInventory, this.getDateString(monthStart), this.getDateString(endOfMonth));

        result.push({
          date: `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`,
          revenue: monthRevenue,
          prescriptions: monthPrescriptions,
          inventory: Math.floor(monthInventory / monthStart.getDate()), // Average per day
        });

        current.setMonth(current.getMonth() + 1);
      }
    }

    return result;
  }
}
