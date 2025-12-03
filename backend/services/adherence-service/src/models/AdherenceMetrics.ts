/**
 * Adherence Metrics Model
 * Tracks patient medication adherence using pharmacy industry standards
 */

export interface AdherenceMetrics {
  patientId: string;
  medicationId: string;
  medicationName: string;
  period: {
    start: Date;
    end: Date;
  };
  pdc: number;  // Proportion of Days Covered (0-1)
  mpr: number;  // Medication Possession Ratio (0-1)
  gapDays: number;
  earlyRefillDays: number;
  adherenceCategory: 'optimal' | 'moderate' | 'poor';
  trend: 'improving' | 'stable' | 'declining';
  lastDispensationDate?: Date;
  nextExpectedRefillDate?: Date;
  totalDispensations: number;
}

export interface AdherenceAlert {
  id: string;
  patientId: string;
  type: 'missed_refill' | 'gap_detected' | 'early_refill' | 'stockout_risk';
  severity: 'info' | 'warning' | 'critical';
  medicationName: string;
  medicationId: string;
  daysOverdue?: number;
  recommendedAction: string;
  createdAt: Date;
  resolved: boolean;
}

export interface DispensationRecord {
  id: string;
  patientId: string;
  medicationId: string;
  dispensationDate: Date;
  quantityDispensed: number;
  daysSupply: number;
  prescriptionId: string;
}

export interface AdherenceHistory {
  patientId: string;
  medicationId: string;
  dataPoints: Array<{
    date: Date;
    pdc: number;
    mpr: number;
    adherenceCategory: 'optimal' | 'moderate' | 'poor';
  }>;
}

export type AdherenceCategory = 'optimal' | 'moderate' | 'poor';
export type AdherenceTrend = 'improving' | 'stable' | 'declining';
