import { Repository } from 'typeorm';
import {
  AlertType,
  AlertSeverity,
  DispensationLogEntry,
} from '../types/controlled.types';
import { Alert } from '../entities/Alert';
import { DispensationLog } from '../entities/DispensationLog';
import { ControlledSubstance } from '../entities/ControlledSubstance';

/**
 * Alert Service
 * Detects and manages alerts for potential abuse patterns and compliance issues
 */
export class AlertService {
  // Thresholds for different alert types
  private readonly FREQUENCY_THRESHOLD_DAYS = 14; // Alert if dispensed within 14 days
  private readonly MULTI_PHARMACY_THRESHOLD = 3; // Alert if using 3+ pharmacies
  private readonly MONTHLY_DISPENSATION_LIMIT = 4; // Alert if more than 4 per month
  private readonly EARLY_REFILL_THRESHOLD = 0.8; // Alert if refill is 80% early

  constructor(
    private alertRepository: Repository<Alert>,
    private dispensationRepository: Repository<DispensationLog>,
    private substanceRepository: Repository<ControlledSubstance>
  ) {}

  /**
   * Analyzes dispensation for potential abuse patterns
   * Returns list of alerts if patterns detected
   */
  async analyzeDispensation(
    patientId: string,
    substanceId: string,
    pharmacyId: string,
    daysSupply: number
  ): Promise<Alert[]> {
    const alerts: Alert[] = [];

    // Get recent dispensations for this patient and substance
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentDispensations = await this.dispensationRepository.find({
      where: {
        patientId,
        substanceId,
      },
      order: { dispensedDate: 'DESC' },
      take: 10,
    });

    if (recentDispensations.length > 0) {
      const lastDispensation = recentDispensations[0];

      // Check for frequency abuse
      if (recentDispensations.length > 1) {
        const daysSinceLast = Math.floor(
          (Date.now() - lastDispensation.dispensedDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        if (daysSinceLast < this.FREQUENCY_THRESHOLD_DAYS) {
          const alert = await this.alertRepository.create({
            type: AlertType.FREQUENCY_ABUSE,
            severity: AlertSeverity.HIGH,
            message: `Patient received dispensation only ${daysSinceLast} days after previous dispensation`,
            patientId,
            substanceId,
            pharmacyId,
            metadata: {
              daysSinceLast,
              lastDispensedDate: lastDispensation.dispensedDate,
            },
          });
          alerts.push(await this.alertRepository.save(alert));
        }

        // Check for early refill
        const expectedRefillDate = new Date(lastDispensation.dispensedDate);
        expectedRefillDate.setDate(
          expectedRefillDate.getDate() +
            lastDispensation.daysSupply * this.EARLY_REFILL_THRESHOLD
        );

        if (new Date() < expectedRefillDate) {
          const alert = await this.alertRepository.create({
            type: AlertType.FREQUENCY_ABUSE,
            severity: AlertSeverity.MEDIUM,
            message: 'Early refill detected before expected date',
            patientId,
            substanceId,
            pharmacyId,
            metadata: {
              expectedRefillDate,
              daysEarly: Math.floor(
                (expectedRefillDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              ),
            },
          });
          alerts.push(await this.alertRepository.save(alert));
        }
      }

      // Check for multi-pharmacy pattern
      const allPharmacies = await this.dispensationRepository
        .createQueryBuilder('log')
        .select('DISTINCT log.pharmacyId')
        .where('log.patientId = :patientId', { patientId })
        .andWhere('log.substanceId = :substanceId', { substanceId })
        .andWhere('log.dispensedDate > :thirtyDaysAgo', { thirtyDaysAgo })
        .getRawMany();

      if (allPharmacies.length >= this.MULTI_PHARMACY_THRESHOLD) {
        const alert = await this.alertRepository.create({
          type: AlertType.MULTI_PHARMACY,
          severity: AlertSeverity.MEDIUM,
          message: `Patient obtained substance from ${allPharmacies.length} different pharmacies in past 30 days`,
          patientId,
          substanceId,
          metadata: {
            pharmacyCount: allPharmacies.length,
          },
        });
        alerts.push(await this.alertRepository.save(alert));
      }
    }

    // Check monthly frequency
    const recentCount = recentDispensations.filter(
      (d) => d.dispensedDate > thirtyDaysAgo
    ).length;

    if (recentCount > this.MONTHLY_DISPENSATION_LIMIT) {
      const alert = await this.alertRepository.create({
        type: AlertType.FREQUENCY_ABUSE,
        severity: AlertSeverity.HIGH,
        message: `Patient has received ${recentCount} dispensations in past 30 days (limit: ${this.MONTHLY_DISPENSATION_LIMIT})`,
        patientId,
        substanceId,
        pharmacyId,
        metadata: {
          dispensationCount: recentCount,
        },
      });
      alerts.push(await this.alertRepository.save(alert));
    }

    return alerts;
  }

  /**
   * Gets all unresolved alerts for a pharmacy
   */
  async getPharmacyAlerts(pharmacyId: string): Promise<Alert[]> {
    return this.alertRepository
      .createQueryBuilder('alert')
      .where('alert.pharmacyId = :pharmacyId', { pharmacyId })
      .andWhere('alert.resolvedAt IS NULL')
      .orderBy('alert.severity', 'DESC')
      .addOrderBy('alert.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Gets all alerts for a patient
   */
  async getPatientAlerts(patientId: string): Promise<Alert[]> {
    return this.alertRepository.find({
      where: { patientId },
      order: { severity: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Gets alerts with specific severity or higher
   */
  async getAlertsBySeverity(
    minimumSeverity: AlertSeverity
  ): Promise<Alert[]> {
    const severityOrder = [
      AlertSeverity.LOW,
      AlertSeverity.MEDIUM,
      AlertSeverity.HIGH,
      AlertSeverity.CRITICAL,
    ];
    const minimumIndex = severityOrder.indexOf(minimumSeverity);

    return this.alertRepository
      .createQueryBuilder('alert')
      .where('alert.resolvedAt IS NULL')
      .orderBy('alert.severity', 'DESC')
      .addOrderBy('alert.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Marks an alert as resolved
   */
  async resolveAlert(
    alertId: string,
    resolvedBy: string,
    resolutionNotes?: string
  ): Promise<Alert> {
    const alert = await this.alertRepository.findOne({ where: { id: alertId } });
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.resolvedAt = new Date();
    alert.resolvedBy = resolvedBy;
    alert.resolutionNotes = resolutionNotes;

    return this.alertRepository.save(alert);
  }

  /**
   * Dismisses multiple alerts
   */
  async dismissAlerts(
    alertIds: string[],
    resolvedBy: string
  ): Promise<Alert[]> {
    const resolved: Alert[] = [];
    for (const alertId of alertIds) {
      const alert = await this.resolveAlert(
        alertId,
        resolvedBy,
        'Manually dismissed'
      );
      resolved.push(alert);
    }

    return resolved;
  }

  /**
   * Gets alert statistics
   */
  async getAlertStatistics(pharmacyId?: string): Promise<{
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  }> {
    const query = this.alertRepository
      .createQueryBuilder('alert')
      .where('alert.resolvedAt IS NULL');

    if (pharmacyId) {
      query.andWhere('alert.pharmacyId = :pharmacyId', { pharmacyId });
    }

    const alerts = await query.getMany();

    return {
      critical: alerts.filter((a) => a.severity === AlertSeverity.CRITICAL).length,
      high: alerts.filter((a) => a.severity === AlertSeverity.HIGH).length,
      medium: alerts.filter((a) => a.severity === AlertSeverity.MEDIUM).length,
      low: alerts.filter((a) => a.severity === AlertSeverity.LOW).length,
      total: alerts.length,
    };
  }
}
