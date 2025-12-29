/**
 * Analytics Service
 * Business logic for analytics and metrics - queries real database
 * Note: Database uses snake_case column names
 */

import { query, count, queryOne } from '../config/database';

export interface DashboardData {
  pharmacyId: string;
  totalRevenue: number;
  totalPrescriptions: number;
  totalPatients: number;
  averageOrderValue: number;
  metrics: {
    revenueToday: number;
    prescriptionsToday: number;
    newPatients: number;
    activeDeliveries: number;
  };
  topProducts: Array<{
    productId: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
  timestamp: string;
}

export interface MetricsData {
  pharmacyId: string;
  revenue: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  prescriptions: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  patients: {
    active: number;
    new: number;
    returning: number;
  };
  timestamp: string;
}

export interface RevenueTrend {
  date: string;
  revenue: number;
  transactions: number;
}

export interface PrescriptionTrend {
  date: string;
  count: number;
  uniquePatients: number;
}

export class AnalyticsService {
  /**
   * Get comprehensive dashboard data for a pharmacy
   */
  async getDashboard(pharmacyId: string): Promise<DashboardData> {
    // Get total prescriptions
    const totalPrescriptions = await count(
      'SELECT COUNT(*) FROM prescriptions WHERE pharmacy_id = $1',
      [pharmacyId]
    );

    // Get total patients (unique)
    const totalPatients = await count(
      'SELECT COUNT(DISTINCT patient_id) FROM prescriptions WHERE pharmacy_id = $1',
      [pharmacyId]
    );

    // Get total revenue from payments
    const revenueResult = await queryOne<{ total: string }>(
      'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE pharmacy_id = $1 AND status = $2',
      [pharmacyId, 'completed']
    );
    const totalRevenue = revenueResult ? parseFloat(revenueResult.total) : 0;

    // Get today's prescriptions
    const prescriptionsToday = await count(
      `SELECT COUNT(*) FROM prescriptions WHERE pharmacy_id = $1 AND DATE(created_at) = CURRENT_DATE`,
      [pharmacyId]
    );

    // Get today's revenue
    const revenueTodayResult = await queryOne<{ total: string }>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM payments
       WHERE pharmacy_id = $1 AND status = 'completed' AND DATE(created_at) = CURRENT_DATE`,
      [pharmacyId]
    );
    const revenueToday = revenueTodayResult ? parseFloat(revenueTodayResult.total) : 0;

    // Get new patients (registered this week)
    const newPatients = await count(
      `SELECT COUNT(DISTINCT p.patient_id) FROM prescriptions p
       JOIN users u ON p.patient_id = u.id
       WHERE p.pharmacy_id = $1 AND DATE(u.created_at) >= CURRENT_DATE - INTERVAL '7 days'`,
      [pharmacyId]
    );

    // Get active deliveries
    const activeDeliveries = await count(
      `SELECT COUNT(*) FROM deliveries WHERE pharmacy_id = $1 AND status IN ('pending', 'in_transit')`,
      [pharmacyId]
    );

    // Get top products (from prescription items)
    const topProducts = await query<{ productId: string; name: string; sales: number; revenue: number }>(
      `SELECT
        pi.medication_id as "productId",
        pi.medication_name as name,
        COUNT(*)::int as sales,
        COALESCE(SUM(pi.quantity * COALESCE(pi.price, 0)), 0)::numeric as revenue
       FROM prescription_items pi
       JOIN prescriptions p ON pi.prescription_id = p.id
       WHERE p.pharmacy_id = $1
       GROUP BY pi.medication_id, pi.medication_name
       ORDER BY sales DESC
       LIMIT 5`,
      [pharmacyId]
    );

    // Calculate average order value
    const averageOrderValue = totalPrescriptions > 0 ? totalRevenue / totalPrescriptions : 0;

    return {
      pharmacyId,
      totalRevenue,
      totalPrescriptions,
      totalPatients,
      averageOrderValue,
      metrics: {
        revenueToday,
        prescriptionsToday,
        newPatients,
        activeDeliveries,
      },
      topProducts: topProducts.map(p => ({
        productId: p.productId || 'unknown',
        name: p.name || 'Unknown Product',
        sales: Number(p.sales) || 0,
        revenue: Number(p.revenue) || 0,
      })),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get metrics summary for a pharmacy
   */
  async getMetrics(pharmacyId: string): Promise<MetricsData> {
    // Daily prescriptions
    const prescriptionsDaily = await count(
      `SELECT COUNT(*) FROM prescriptions WHERE pharmacy_id = $1 AND DATE(created_at) = CURRENT_DATE`,
      [pharmacyId]
    );

    // Weekly prescriptions
    const prescriptionsWeekly = await count(
      `SELECT COUNT(*) FROM prescriptions WHERE pharmacy_id = $1 AND DATE(created_at) >= CURRENT_DATE - INTERVAL '7 days'`,
      [pharmacyId]
    );

    // Monthly prescriptions
    const prescriptionsMonthly = await count(
      `SELECT COUNT(*) FROM prescriptions WHERE pharmacy_id = $1 AND DATE(created_at) >= CURRENT_DATE - INTERVAL '30 days'`,
      [pharmacyId]
    );

    // Yearly prescriptions
    const prescriptionsYearly = await count(
      `SELECT COUNT(*) FROM prescriptions WHERE pharmacy_id = $1 AND DATE(created_at) >= CURRENT_DATE - INTERVAL '365 days'`,
      [pharmacyId]
    );

    // Revenue metrics
    const revenueDaily = await queryOne<{ total: string }>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM payments
       WHERE pharmacy_id = $1 AND status = 'completed' AND DATE(created_at) = CURRENT_DATE`,
      [pharmacyId]
    );

    const revenueWeekly = await queryOne<{ total: string }>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM payments
       WHERE pharmacy_id = $1 AND status = 'completed' AND DATE(created_at) >= CURRENT_DATE - INTERVAL '7 days'`,
      [pharmacyId]
    );

    const revenueMonthly = await queryOne<{ total: string }>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM payments
       WHERE pharmacy_id = $1 AND status = 'completed' AND DATE(created_at) >= CURRENT_DATE - INTERVAL '30 days'`,
      [pharmacyId]
    );

    const revenueYearly = await queryOne<{ total: string }>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM payments
       WHERE pharmacy_id = $1 AND status = 'completed' AND DATE(created_at) >= CURRENT_DATE - INTERVAL '365 days'`,
      [pharmacyId]
    );

    // Patient metrics
    const activePatients = await count(
      `SELECT COUNT(DISTINCT patient_id) FROM prescriptions
       WHERE pharmacy_id = $1 AND DATE(created_at) >= CURRENT_DATE - INTERVAL '90 days'`,
      [pharmacyId]
    );

    const newPatients = await count(
      `SELECT COUNT(DISTINCT p.patient_id) FROM prescriptions p
       JOIN users u ON p.patient_id = u.id
       WHERE p.pharmacy_id = $1 AND DATE(u.created_at) >= CURRENT_DATE - INTERVAL '30 days'`,
      [pharmacyId]
    );

    const totalPatients = await count(
      `SELECT COUNT(DISTINCT patient_id) FROM prescriptions WHERE pharmacy_id = $1`,
      [pharmacyId]
    );

    return {
      pharmacyId,
      revenue: {
        daily: parseFloat(revenueDaily?.total || '0'),
        weekly: parseFloat(revenueWeekly?.total || '0'),
        monthly: parseFloat(revenueMonthly?.total || '0'),
        yearly: parseFloat(revenueYearly?.total || '0'),
      },
      prescriptions: {
        daily: prescriptionsDaily,
        weekly: prescriptionsWeekly,
        monthly: prescriptionsMonthly,
        yearly: prescriptionsYearly,
      },
      patients: {
        active: activePatients,
        new: newPatients,
        returning: Math.max(0, totalPatients - newPatients),
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get revenue trends for a date range
   */
  async getRevenueTrends(
    pharmacyId: string,
    startDate?: string,
    endDate?: string
  ): Promise<RevenueTrend[]> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    const trends = await query<{ date: string; revenue: string; transactions: string }>(
      `SELECT
        DATE(created_at)::text as date,
        COALESCE(SUM(amount), 0)::numeric as revenue,
        COUNT(*)::int as transactions
       FROM payments
       WHERE pharmacy_id = $1 AND status = 'completed'
         AND DATE(created_at) >= $2 AND DATE(created_at) <= $3
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at)`,
      [pharmacyId, start, end]
    );

    return trends.map(t => ({
      date: t.date,
      revenue: parseFloat(t.revenue) || 0,
      transactions: parseInt(t.transactions, 10) || 0,
    }));
  }

  /**
   * Get prescription trends for a date range
   */
  async getPrescriptionTrends(
    pharmacyId: string,
    startDate?: string,
    endDate?: string
  ): Promise<PrescriptionTrend[]> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    const trends = await query<{ date: string; count: string; uniquePatients: string }>(
      `SELECT
        DATE(created_at)::text as date,
        COUNT(*)::int as count,
        COUNT(DISTINCT patient_id)::int as "uniquePatients"
       FROM prescriptions
       WHERE pharmacy_id = $1
         AND DATE(created_at) >= $2 AND DATE(created_at) <= $3
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at)`,
      [pharmacyId, start, end]
    );

    return trends.map(t => ({
      date: t.date,
      count: parseInt(t.count, 10) || 0,
      uniquePatients: parseInt(t.uniquePatients, 10) || 0,
    }));
  }
}
