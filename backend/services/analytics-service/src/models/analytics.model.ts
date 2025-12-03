/**
 * Analytics Models for Pharmacy Dashboard
 * Defines data structures for metrics and analytics
 */

export interface DailyMetric {
  date: string;
  revenue: number;
  prescriptions: number;
  inventory: number;
}

export interface MetricSnapshot {
  date: string;
  value: number;
}

export interface PharmacyMetrics {
  pharmacyId: string;
  totalRevenue: number;
  totalPrescriptions: number;
  averageOrderValue: number;
  inventoryValue: number;
  lastUpdated: string;
}

export interface DashboardData {
  pharmacyId: string;
  metrics: {
    revenue: {
      today: number;
      thisWeek: number;
      thisMonth: number;
      trend: number; // percentage change
    };
    prescriptions: {
      today: number;
      thisWeek: number;
      thisMonth: number;
      trend: number; // percentage change
    };
    inventory: {
      totalItems: number;
      lowStockItems: number;
      expiredItems: number;
      totalValue: number;
    };
  };
  timeSeries: {
    daily: DailyMetric[];
    weekly: DailyMetric[];
    monthly: DailyMetric[];
  };
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    id: string;
    date: string;
    amount: number;
    status: string;
  }>;
  lastUpdated: string;
}

export interface AnalyticsFilter {
  pharmacyId: string;
  startDate: string;
  endDate: string;
  groupBy?: 'daily' | 'weekly' | 'monthly';
}

export interface AnalyticsResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
