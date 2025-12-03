/**
 * Alert Generation Service
 * Generates adherence alerts based on patient medication patterns
 */

import { AdherenceAlert, AdherenceMetrics } from '../models';
import { v4 as uuidv4 } from 'uuid';

export class AlertGenerationService {
  /**
   * Generate alerts for a patient's medication adherence
   */
  generateAlerts(metrics: AdherenceMetrics): AdherenceAlert[] {
    const alerts: AdherenceAlert[] = [];
    const now = new Date();

    // Alert 1: Missed Refill Detection
    if (metrics.nextExpectedRefillDate) {
      const daysOverdue = this.daysBetween(metrics.nextExpectedRefillDate, now);

      if (daysOverdue > 7) {
        alerts.push({
          id: uuidv4(),
          patientId: metrics.patientId,
          type: 'missed_refill',
          severity: 'critical',
          medicationName: metrics.medicationName,
          medicationId: metrics.medicationId,
          daysOverdue,
          recommendedAction: 'Contact patient immediately to ensure medication continuity',
          createdAt: now,
          resolved: false
        });
      } else if (daysOverdue > 3) {
        alerts.push({
          id: uuidv4(),
          patientId: metrics.patientId,
          type: 'missed_refill',
          severity: 'warning',
          medicationName: metrics.medicationName,
          medicationId: metrics.medicationId,
          daysOverdue,
          recommendedAction: 'Remind patient to refill medication soon',
          createdAt: now,
          resolved: false
        });
      }
    }

    // Alert 2: Adherence Gap Detection
    if (metrics.gapDays > 14) {
      alerts.push({
        id: uuidv4(),
        patientId: metrics.patientId,
        type: 'gap_detected',
        severity: 'critical',
        medicationName: metrics.medicationName,
        medicationId: metrics.medicationId,
        recommendedAction: `Patient has ${metrics.gapDays} days without medication. Schedule consultation to discuss adherence barriers`,
        createdAt: now,
        resolved: false
      });
    } else if (metrics.gapDays > 7) {
      alerts.push({
        id: uuidv4(),
        patientId: metrics.patientId,
        type: 'gap_detected',
        severity: 'warning',
        medicationName: metrics.medicationName,
        medicationId: metrics.medicationId,
        recommendedAction: `${metrics.gapDays} days gap detected. Monitor adherence closely`,
        createdAt: now,
        resolved: false
      });
    }

    // Alert 3: Stockout Risk (running out soon)
    if (metrics.nextExpectedRefillDate) {
      const daysUntilRefill = this.daysBetween(now, metrics.nextExpectedRefillDate);

      if (daysUntilRefill >= 0 && daysUntilRefill <= 2) {
        alerts.push({
          id: uuidv4(),
          patientId: metrics.patientId,
          type: 'stockout_risk',
          severity: 'warning',
          medicationName: metrics.medicationName,
          medicationId: metrics.medicationId,
          recommendedAction: 'Patient medication running out within 2 days. Send refill reminder',
          createdAt: now,
          resolved: false
        });
      }
    }

    // Alert 4: Early Refill Pattern (possible medication misuse)
    if (metrics.earlyRefillDays > 10) {
      alerts.push({
        id: uuidv4(),
        patientId: metrics.patientId,
        type: 'early_refill',
        severity: 'info',
        medicationName: metrics.medicationName,
        medicationId: metrics.medicationId,
        recommendedAction: `${metrics.earlyRefillDays} early refill days detected. Discuss proper dosing with patient`,
        createdAt: now,
        resolved: false
      });
    }

    // Alert 5: Poor Adherence Category
    if (metrics.adherenceCategory === 'poor') {
      alerts.push({
        id: uuidv4(),
        patientId: metrics.patientId,
        type: 'gap_detected',
        severity: 'critical',
        medicationName: metrics.medicationName,
        medicationId: metrics.medicationId,
        recommendedAction: `Poor adherence (PDC: ${(metrics.pdc * 100).toFixed(1)}%). Intervention required`,
        createdAt: now,
        resolved: false
      });
    }

    return alerts;
  }

  /**
   * Helper: Calculate days between two dates
   */
  private daysBetween(date1: Date, date2: Date): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    const diff = new Date(date2).getTime() - new Date(date1).getTime();
    return Math.ceil(diff / msPerDay);
  }
}
