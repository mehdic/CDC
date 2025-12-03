/**
 * Temperature Alert Service
 * Real-time alert system for cold chain breaches
 */

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export enum AlertType {
  TEMPERATURE_BREACH = 'temperature_breach',
  TEMPERATURE_WARNING = 'temperature_warning',
  SENSOR_BATTERY_LOW = 'sensor_battery_low',
  SENSOR_OFFLINE = 'sensor_offline',
  CALIBRATION_OVERDUE = 'calibration_overdue',
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  affectedEntityId: string;
  affectedEntityType: string;
  createdAt: Date;
  resolvedAt?: Date;
  metadata: Record<string, any>;
}

export class TemperatureAlertService {
  private alerts: Map<string, Alert> = new Map();

  async createTemperatureBreachAlert(
    monitoringId: string,
    currentTemp: number,
    minTemp: number,
    maxTemp: number
  ): Promise<{ success: boolean; alert?: Alert; notified: any[]; errors: string[] }> {
    const errors: string[] = [];
    const notified: any[] = [];

    try {
      const alert: Alert = {
        id: `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: AlertType.TEMPERATURE_BREACH,
        severity: AlertSeverity.CRITICAL,
        title: 'Temperature Breach Detected',
        description: `Temperature reached ${currentTemp}°C. Safe range: ${minTemp}°C - ${maxTemp}°C`,
        affectedEntityId: monitoringId,
        affectedEntityType: 'monitoring',
        createdAt: new Date(),
        metadata: { currentTemp, minTemp, maxTemp },
      };

      this.alerts.set(alert.id, alert);
      console.log(`[ALERT] ${alert.title}: ${alert.description}`);

      return { success: true, alert, notified, errors: [] };
    } catch (error) {
      errors.push(`Alert creation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, notified, errors };
    }
  }

  async createBatteryLowAlert(sensorId: string): Promise<{ success: boolean; alert?: Alert; errors: string[] }> {
    const errors: string[] = [];
    try {
      const alert: Alert = {
        id: `ALERT-${Date.now()}-BATTERY`,
        type: AlertType.SENSOR_BATTERY_LOW,
        severity: AlertSeverity.WARNING,
        title: 'Sensor Battery Low',
        description: `Sensor ${sensorId} battery is running low`,
        affectedEntityId: sensorId,
        affectedEntityType: 'sensor',
        createdAt: new Date(),
        metadata: { sensorId },
      };

      this.alerts.set(alert.id, alert);
      return { success: true, alert, errors: [] };
    } catch (error) {
      errors.push(`Battery alert error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, errors };
    }
  }

  async resolveAlert(alertId: string): Promise<{ success: boolean; alert?: Alert; errors: string[] }> {
    const errors: string[] = [];
    try {
      const alert = this.alerts.get(alertId);
      if (!alert) {
        errors.push(`Alert ${alertId} not found`);
        return { success: false, errors };
      }

      alert.resolvedAt = new Date();
      return { success: true, alert, errors: [] };
    } catch (error) {
      errors.push(`Resolution error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, errors };
    }
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(a => !a.resolvedAt);
  }

  getAlertStatistics(): {
    total: number;
    active: number;
    resolved: number;
  } {
    const allAlerts = Array.from(this.alerts.values());
    return {
      total: allAlerts.length,
      active: allAlerts.filter(a => !a.resolvedAt).length,
      resolved: allAlerts.filter(a => a.resolvedAt).length,
    };
  }
}
