/**
 * Main Adherence Service
 * Orchestrates adherence tracking, calculations, and alert generation
 */

import { AdherenceCalculationService } from './AdherenceCalculationService';
import { AlertGenerationService } from './AlertGenerationService';
import {
  AdherenceMetrics,
  AdherenceAlert,
  AdherenceHistory,
  DispensationRecord
} from '../models';

export class AdherenceService {
  private calculationService: AdherenceCalculationService;
  private alertService: AlertGenerationService;

  // In-memory storage (would be database in production)
  private dispensationRecords: Map<string, DispensationRecord[]> = new Map();
  private adherenceMetricsCache: Map<string, AdherenceMetrics> = new Map();
  private alertsCache: Map<string, AdherenceAlert[]> = new Map();

  constructor() {
    this.calculationService = new AdherenceCalculationService();
    this.alertService = new AlertGenerationService();
  }

  /**
   * Record a new medication dispensation
   */
  recordDispensation(dispensation: DispensationRecord): void {
    const key = `${dispensation.patientId}-${dispensation.medicationId}`;
    const existing = this.dispensationRecords.get(key) || [];
    existing.push(dispensation);
    this.dispensationRecords.set(key, existing);

    // Invalidate cache for this patient-medication
    this.adherenceMetricsCache.delete(key);
    this.alertsCache.delete(dispensation.patientId);
  }

  /**
   * Get adherence metrics for a specific patient-medication pair
   */
  getPatientMedicationAdherence(
    patientId: string,
    medicationId: string,
    medicationName: string,
    periodStart?: Date,
    periodEnd?: Date
  ): AdherenceMetrics | null {
    const key = `${patientId}-${medicationId}`;

    // Default to last 90 days
    const end = periodEnd || new Date();
    const start = periodStart || new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Get dispensation records
    const dispensations = this.getDispensationRecords(patientId, medicationId);

    if (dispensations.length === 0) {
      return null;
    }

    // Calculate metrics
    const metrics = this.calculationService.calculateMetrics(
      patientId,
      medicationId,
      medicationName,
      dispensations,
      start,
      end
    );

    // Cache the result
    this.adherenceMetricsCache.set(key, metrics);

    return metrics;
  }

  /**
   * Get all adherence metrics for a patient (all medications)
   */
  getPatientAdherence(patientId: string): AdherenceMetrics[] {
    const allMetrics: AdherenceMetrics[] = [];

    // Find all medications for this patient
    const patientMedications = this.getPatientMedications(patientId);

    patientMedications.forEach(({ medicationId, medicationName }) => {
      const metrics = this.getPatientMedicationAdherence(
        patientId,
        medicationId,
        medicationName
      );
      if (metrics) {
        allMetrics.push(metrics);
      }
    });

    return allMetrics;
  }

  /**
   * Get adherence history over time for a patient-medication
   */
  getAdherenceHistory(
    patientId: string,
    medicationId: string,
    medicationName: string,
    months: number = 6
  ): AdherenceHistory {
    const dataPoints: AdherenceHistory['dataPoints'] = [];
    const now = new Date();

    // Calculate metrics for each month
    for (let i = 0; i < months; i++) {
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() - i);
      periodEnd.setDate(1); // First day of the month

      const periodStart = new Date(periodEnd);
      periodStart.setMonth(periodStart.getMonth() - 1);

      const dispensations = this.getDispensationRecords(patientId, medicationId).filter(
        d => {
          const date = new Date(d.dispensationDate);
          return date >= periodStart && date < periodEnd;
        }
      );

      if (dispensations.length > 0) {
        const metrics = this.calculationService.calculateMetrics(
          patientId,
          medicationId,
          medicationName,
          dispensations,
          periodStart,
          periodEnd
        );

        dataPoints.push({
          date: periodEnd,
          pdc: metrics.pdc,
          mpr: metrics.mpr,
          adherenceCategory: metrics.adherenceCategory
        });
      }
    }

    return {
      patientId,
      medicationId,
      dataPoints: dataPoints.reverse() // Oldest to newest
    };
  }

  /**
   * Get active alerts for a patient
   */
  getPatientAlerts(patientId: string): AdherenceAlert[] {
    // Check cache first
    const cached = this.alertsCache.get(patientId);
    if (cached) {
      return cached.filter(alert => !alert.resolved);
    }

    // Generate new alerts
    const metrics = this.getPatientAdherence(patientId);
    const allAlerts: AdherenceAlert[] = [];

    metrics.forEach(metric => {
      const alerts = this.alertService.generateAlerts(metric);
      allAlerts.push(...alerts);
    });

    // Cache the alerts
    this.alertsCache.set(patientId, allAlerts);

    return allAlerts.filter(alert => !alert.resolved);
  }

  /**
   * Get patients with poor adherence (for doctor dashboard)
   */
  getPatientsWithPoorAdherence(patientIds: string[]): Array<{
    patientId: string;
    poorAdherenceMedications: AdherenceMetrics[];
    alertCount: number;
  }> {
    const results: Array<{
      patientId: string;
      poorAdherenceMedications: AdherenceMetrics[];
      alertCount: number;
    }> = [];

    patientIds.forEach(patientId => {
      const metrics = this.getPatientAdherence(patientId);
      const poorMetrics = metrics.filter(m => m.adherenceCategory === 'poor' || m.adherenceCategory === 'moderate');

      if (poorMetrics.length > 0) {
        const alerts = this.getPatientAlerts(patientId);
        results.push({
          patientId,
          poorAdherenceMedications: poorMetrics,
          alertCount: alerts.length
        });
      }
    });

    // Sort by alert count (highest first)
    return results.sort((a, b) => b.alertCount - a.alertCount);
  }

  /**
   * Resolve an alert
   */
  resolveAlert(patientId: string, alertId: string): boolean {
    const alerts = this.alertsCache.get(patientId);
    if (!alerts) return false;

    const alert = alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      return true;
    }

    return false;
  }

  /**
   * Helper: Get dispensation records for a patient-medication
   */
  private getDispensationRecords(patientId: string, medicationId: string): DispensationRecord[] {
    const key = `${patientId}-${medicationId}`;
    return this.dispensationRecords.get(key) || [];
  }

  /**
   * Helper: Get all medications for a patient
   */
  private getPatientMedications(patientId: string): Array<{ medicationId: string; medicationName: string }> {
    const medications = new Map<string, string>();

    this.dispensationRecords.forEach((records, key) => {
      if (key.startsWith(patientId + '-')) {
        const medicationId = key.split('-')[1];
        // In production, would fetch medication name from database
        medications.set(medicationId, `Medication ${medicationId}`);
      }
    });

    return Array.from(medications.entries()).map(([medicationId, medicationName]) => ({
      medicationId,
      medicationName
    }));
  }

  /**
   * Get summary statistics for a patient
   */
  getPatientSummary(patientId: string) {
    const metrics = this.getPatientAdherence(patientId);
    const alerts = this.getPatientAlerts(patientId);

    const totalMedications = metrics.length;
    const optimalCount = metrics.filter(m => m.adherenceCategory === 'optimal').length;
    const moderateCount = metrics.filter(m => m.adherenceCategory === 'moderate').length;
    const poorCount = metrics.filter(m => m.adherenceCategory === 'poor').length;

    const averagePDC = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.pdc, 0) / metrics.length
      : 0;

    return {
      patientId,
      totalMedications,
      adherenceCounts: {
        optimal: optimalCount,
        moderate: moderateCount,
        poor: poorCount
      },
      averagePDC,
      overallCategory: this.calculationService.categorizeAdherence(averagePDC),
      criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
      warningAlerts: alerts.filter(a => a.severity === 'warning').length,
      infoAlerts: alerts.filter(a => a.severity === 'info').length
    };
  }
}

// Export singleton instance
export const adherenceService = new AdherenceService();
