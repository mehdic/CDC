/**
 * Dashboard Analytics API Hooks
 * React Query hooks for dashboard analytics data
 */

import { useApiQuery } from './useApi';

// ============================================================================
// Types
// ============================================================================

export interface DashboardAnalytics {
  prescriptions: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    trend: string;
  };
  consultations: {
    total: number;
    upcoming: number;
    completed: number;
    trend: string;
  };
  revenue: {
    total: number;
    thisMonth: number;
    trend: string;
  };
  inventory: {
    totalItems: number;
    lowStock: number;
    expiringSoon: number;
  };
  deliveries: {
    total: number;
    inTransit: number;
    completed: number;
  };
}

export interface PatientMetrics {
  totalPatients: number;
  newPatients: number;
  activePatients: number;
  chronicPatients: number;
}

export interface PopularMedication {
  name: string;
  count: number;
}

export interface ConsultationTrends {
  thisWeek: number;
  lastWeek: number;
  trend: string;
  peakDays: string[];
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch dashboard analytics
 */
export function useDashboardAnalytics(startDate?: string, endDate?: string) {
  const params: Record<string, string> = {};
  if (startDate) params.start = startDate;
  if (endDate) params.end = endDate;

  return useApiQuery<{ success: boolean; data: DashboardAnalytics }>(
    ['dashboard', 'analytics', params],
    '/dashboard/analytics',
    { params },
    {
      staleTime: 60000, // 1 minute
    }
  );
}

/**
 * Hook to fetch patient metrics
 */
export function usePatientMetrics() {
  return useApiQuery<{ success: boolean; data: PatientMetrics }>(
    ['dashboard', 'patients'],
    '/dashboard/patients',
    {},
    {
      staleTime: 120000, // 2 minutes
    }
  );
}

/**
 * Hook to fetch popular medications
 */
export function usePopularMedications() {
  return useApiQuery<{ success: boolean; data: PopularMedication[] }>(
    ['dashboard', 'popular-medications'],
    '/dashboard/popular-medications',
    {},
    {
      staleTime: 300000, // 5 minutes
    }
  );
}

/**
 * Hook to fetch consultation trends
 */
export function useConsultationTrends() {
  return useApiQuery<{ success: boolean; data: ConsultationTrends }>(
    ['dashboard', 'consultation-trends'],
    '/dashboard/consultation-trends',
    {},
    {
      staleTime: 120000, // 2 minutes
    }
  );
}
