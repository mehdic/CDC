/**
 * Alert Service
 * Manages high-risk patient alerts
 */

import type { RiskAlert, RiskScore } from '../types/risk.types';

export class AlertService {
  private alerts: Map<string, RiskAlert> = new Map();
  private alertIdCounter = 1;

  /**
   * Create alert for high-risk patients
   */
  public createAlert(
    patientId: string,
    patientName: string,
    riskScore: RiskScore
  ): RiskAlert | null {
    // Only create alerts for high and critical risk
    if (riskScore.level !== 'high' && riskScore.level !== 'critical') {
      return null;
    }

    const priority = this.determinePriority(riskScore);
    const message = this.generateAlertMessage(riskScore);

    const alert: RiskAlert = {
      alertId: `ALERT-${this.alertIdCounter++}`,
      patientId,
      patientName,
      riskLevel: riskScore.level,
      priority,
      message,
      createdAt: new Date(),
      acknowledged: false,
    };

    this.alerts.set(alert.alertId, alert);
    return alert;
  }

  /**
   * Get all active (unacknowledged) alerts
   */
  public getActiveAlerts(): ReadonlyArray<RiskAlert> {
    return Array.from(this.alerts.values())
      .filter((alert) => !alert.acknowledged)
      .sort((a, b) => {
        // Sort by priority then by creation time
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        const priorityDiff =
          priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }

  /**
   * Get alerts for a specific patient
   */
  public getPatientAlerts(patientId: string): ReadonlyArray<RiskAlert> {
    return Array.from(this.alerts.values()).filter(
      (alert) => alert.patientId === patientId
    );
  }

  /**
   * Acknowledge an alert
   */
  public acknowledgeAlert(
    alertId: string,
    acknowledgedBy: string
  ): RiskAlert | null {
    const alert = this.alerts.get(alertId);
    if (!alert) return null;

    const acknowledgedAlert: RiskAlert = {
      ...alert,
      acknowledged: true,
      acknowledgedBy,
      acknowledgedAt: new Date(),
    };

    this.alerts.set(alertId, acknowledgedAlert);
    return acknowledgedAlert;
  }

  /**
   * Determine alert priority from risk score
   */
  private determinePriority(
    riskScore: RiskScore
  ): 'low' | 'medium' | 'high' | 'urgent' {
    if (riskScore.level === 'critical' && riskScore.overall >= 90) {
      return 'urgent';
    }
    if (riskScore.level === 'critical') {
      return 'high';
    }
    if (riskScore.level === 'high') {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Generate human-readable alert message
   */
  private generateAlertMessage(riskScore: RiskScore): string {
    const factorsCopy = [...riskScore.factors];
    const topFactors = factorsCopy
      .sort((a, b) => b.severity - a.severity)
      .slice(0, 2);

    if (topFactors.length === 0) {
      return `High-risk patient - overall risk score: ${riskScore.overall}`;
    }

    const factorDescriptions = topFactors.map((f) => f.description).join('; ');

    return `${riskScore.level.toUpperCase()} RISK (${riskScore.overall}/100): ${factorDescriptions}`;
  }

  /**
   * Clear all alerts (for testing)
   */
  public clearAllAlerts(): void {
    this.alerts.clear();
    this.alertIdCounter = 1;
  }
}
