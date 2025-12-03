/**
 * Adherence Calculation Service
 * Implements pharmacy industry standard adherence metrics:
 * - PDC (Proportion of Days Covered)
 * - MPR (Medication Possession Ratio)
 */

import {
  AdherenceMetrics,
  AdherenceCategory,
  AdherenceTrend,
  DispensationRecord
} from '../models';

export class AdherenceCalculationService {
  /**
   * Calculate Proportion of Days Covered (PDC)
   * PDC = (Days with medication available) / (Days in period)
   * Industry standard: PDC >= 0.8 is considered adherent
   */
  calculatePDC(dispensations: DispensationRecord[], periodStart: Date, periodEnd: Date): number {
    if (dispensations.length === 0) return 0;

    const periodDays = this.daysBetween(periodStart, periodEnd);
    if (periodDays <= 0) return 0;

    // Track which days have medication coverage
    const coveredDays = new Set<string>();

    dispensations.forEach(dispensation => {
      const startDate = new Date(dispensation.dispensationDate);
      const daysSupply = dispensation.daysSupply;

      for (let i = 0; i < daysSupply; i++) {
        const coverageDate = new Date(startDate);
        coverageDate.setDate(coverageDate.getDate() + i);

        // Only count days within the measurement period
        if (coverageDate >= periodStart && coverageDate <= periodEnd) {
          coveredDays.add(coverageDate.toISOString().split('T')[0]);
        }
      }
    });

    const pdc = coveredDays.size / periodDays;
    return Math.min(pdc, 1.0); // Cap at 1.0
  }

  /**
   * Calculate Medication Possession Ratio (MPR)
   * MPR = (Total days supply) / (Days between first and last fill)
   * Simpler than PDC but can exceed 1.0 with early refills
   */
  calculateMPR(dispensations: DispensationRecord[], periodStart: Date, periodEnd: Date): number {
    if (dispensations.length === 0) return 0;

    // Sort by dispensation date
    const sortedDispensations = [...dispensations].sort(
      (a, b) => new Date(a.dispensationDate).getTime() - new Date(b.dispensationDate).getTime()
    );

    const firstFill = new Date(sortedDispensations[0].dispensationDate);
    const lastFill = new Date(sortedDispensations[sortedDispensations.length - 1].dispensationDate);

    // If only one fill, use period end as reference
    const treatmentPeriodDays = sortedDispensations.length === 1
      ? this.daysBetween(firstFill, periodEnd)
      : this.daysBetween(firstFill, lastFill);

    if (treatmentPeriodDays <= 0) return 0;

    const totalDaysSupply = dispensations.reduce((sum, d) => sum + d.daysSupply, 0);
    const mpr = totalDaysSupply / treatmentPeriodDays;

    return mpr;
  }

  /**
   * Calculate gap days (days without medication)
   */
  calculateGapDays(dispensations: DispensationRecord[], periodStart: Date, periodEnd: Date): number {
    const periodDays = this.daysBetween(periodStart, periodEnd);
    const pdc = this.calculatePDC(dispensations, periodStart, periodEnd);
    return Math.round(periodDays * (1 - pdc));
  }

  /**
   * Calculate early refill days (overlapping supply)
   */
  calculateEarlyRefillDays(dispensations: DispensationRecord[]): number {
    if (dispensations.length < 2) return 0;

    const sorted = [...dispensations].sort(
      (a, b) => new Date(a.dispensationDate).getTime() - new Date(b.dispensationDate).getTime()
    );

    let earlyDays = 0;

    for (let i = 1; i < sorted.length; i++) {
      const prevFill = sorted[i - 1];
      const currentFill = sorted[i];

      const expectedNextFillDate = new Date(prevFill.dispensationDate);
      expectedNextFillDate.setDate(expectedNextFillDate.getDate() + prevFill.daysSupply);

      const actualFillDate = new Date(currentFill.dispensationDate);
      const daysDiff = this.daysBetween(actualFillDate, expectedNextFillDate);

      if (daysDiff > 0) {
        earlyDays += daysDiff;
      }
    }

    return earlyDays;
  }

  /**
   * Categorize adherence level based on PDC
   * - Optimal: PDC >= 0.8 (industry standard)
   * - Moderate: 0.5 <= PDC < 0.8
   * - Poor: PDC < 0.5
   */
  categorizeAdherence(pdc: number): AdherenceCategory {
    if (pdc >= 0.8) return 'optimal';
    if (pdc >= 0.5) return 'moderate';
    return 'poor';
  }

  /**
   * Determine adherence trend by comparing recent vs historical PDC
   */
  calculateTrend(
    recentDispensations: DispensationRecord[],
    historicalDispensations: DispensationRecord[],
    recentPeriodStart: Date,
    recentPeriodEnd: Date,
    historicalPeriodStart: Date,
    historicalPeriodEnd: Date
  ): AdherenceTrend {
    const recentPDC = this.calculatePDC(recentDispensations, recentPeriodStart, recentPeriodEnd);
    const historicalPDC = this.calculatePDC(
      historicalDispensations,
      historicalPeriodStart,
      historicalPeriodEnd
    );

    const diff = recentPDC - historicalPDC;

    if (diff > 0.1) return 'improving';
    if (diff < -0.1) return 'declining';
    return 'stable';
  }

  /**
   * Calculate complete adherence metrics for a patient-medication pair
   */
  calculateMetrics(
    patientId: string,
    medicationId: string,
    medicationName: string,
    dispensations: DispensationRecord[],
    periodStart: Date,
    periodEnd: Date
  ): AdherenceMetrics {
    const pdc = this.calculatePDC(dispensations, periodStart, periodEnd);
    const mpr = this.calculateMPR(dispensations, periodStart, periodEnd);
    const gapDays = this.calculateGapDays(dispensations, periodStart, periodEnd);
    const earlyRefillDays = this.calculateEarlyRefillDays(dispensations);
    const adherenceCategory = this.categorizeAdherence(pdc);

    // Calculate trend (compare last 30 days vs previous 30 days)
    const now = periodEnd;
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentDispensations = dispensations.filter(
      d => new Date(d.dispensationDate) >= thirtyDaysAgo
    );
    const historicalDispensations = dispensations.filter(
      d =>
        new Date(d.dispensationDate) >= sixtyDaysAgo &&
        new Date(d.dispensationDate) < thirtyDaysAgo
    );

    const trend = this.calculateTrend(
      recentDispensations,
      historicalDispensations,
      thirtyDaysAgo,
      now,
      sixtyDaysAgo,
      thirtyDaysAgo
    );

    // Find last dispensation and calculate next expected refill
    const sortedDispensations = [...dispensations].sort(
      (a, b) => new Date(b.dispensationDate).getTime() - new Date(a.dispensationDate).getTime()
    );

    const lastDispensation = sortedDispensations[0];
    let nextExpectedRefillDate: Date | undefined;

    if (lastDispensation) {
      nextExpectedRefillDate = new Date(lastDispensation.dispensationDate);
      nextExpectedRefillDate.setDate(
        nextExpectedRefillDate.getDate() + lastDispensation.daysSupply
      );
    }

    return {
      patientId,
      medicationId,
      medicationName,
      period: { start: periodStart, end: periodEnd },
      pdc,
      mpr,
      gapDays,
      earlyRefillDays,
      adherenceCategory,
      trend,
      lastDispensationDate: lastDispensation ? lastDispensation.dispensationDate : undefined,
      nextExpectedRefillDate,
      totalDispensations: dispensations.length
    };
  }

  /**
   * Helper: Calculate days between two dates
   */
  private daysBetween(date1: Date, date2: Date): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    const diff = new Date(date2).getTime() - new Date(date1).getTime();
    return Math.ceil(diff / msPerDay) + 1; // +1 to include both start and end date
  }
}
