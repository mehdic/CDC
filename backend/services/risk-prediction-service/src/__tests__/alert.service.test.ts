/**
 * Alert Service Tests
 */

import { AlertService } from '../services/alert.service';
import type { RiskScore } from '../types/risk.types';

describe('AlertService', () => {
  let service: AlertService;

  beforeEach(() => {
    service = new AlertService();
  });

  describe('createAlert', () => {
    it('should create alert for high-risk patient', () => {
      const riskScore: RiskScore = {
        overall: 75,
        level: 'high',
        factors: [
          {
            category: 'medication_interaction',
            description: 'Drug interaction detected',
            severity: 80,
            details: 'Warfarin + Aspirin',
            recommendations: ['Consult pharmacist'],
          },
        ],
        confidence: 0.9,
      };

      const alert = service.createAlert('P001', 'John Doe', riskScore);

      expect(alert).not.toBeNull();
      expect(alert?.riskLevel).toBe('high');
      expect(alert?.patientId).toBe('P001');
      expect(alert?.acknowledged).toBe(false);
    });

    it('should create alert for critical-risk patient', () => {
      const riskScore: RiskScore = {
        overall: 92,
        level: 'critical',
        factors: [],
        confidence: 0.9,
      };

      const alert = service.createAlert('P002', 'Jane Smith', riskScore);

      expect(alert).not.toBeNull();
      expect(alert?.priority).toBe('urgent');
    });

    it('should not create alert for low-risk patient', () => {
      const riskScore: RiskScore = {
        overall: 25,
        level: 'low',
        factors: [],
        confidence: 0.8,
      };

      const alert = service.createAlert('P003', 'Bob Johnson', riskScore);

      expect(alert).toBeNull();
    });

    it('should not create alert for moderate-risk patient', () => {
      const riskScore: RiskScore = {
        overall: 50,
        level: 'moderate',
        factors: [],
        confidence: 0.8,
      };

      const alert = service.createAlert('P004', 'Alice Brown', riskScore);

      expect(alert).toBeNull();
    });
  });

  describe('getActiveAlerts', () => {
    it('should return all unacknowledged alerts', () => {
      const riskScore: RiskScore = {
        overall: 75,
        level: 'high',
        factors: [],
        confidence: 0.9,
      };

      service.createAlert('P001', 'Patient 1', riskScore);
      service.createAlert('P002', 'Patient 2', riskScore);

      const alerts = service.getActiveAlerts();

      expect(alerts).toHaveLength(2);
      expect(alerts.every((a) => !a.acknowledged)).toBe(true);
    });

    it('should sort alerts by priority', () => {
      const highRisk: RiskScore = {
        overall: 75,
        level: 'high',
        factors: [],
        confidence: 0.9,
      };

      const criticalRisk: RiskScore = {
        overall: 92,
        level: 'critical',
        factors: [],
        confidence: 0.9,
      };

      service.createAlert('P001', 'Patient 1', highRisk);
      service.createAlert('P002', 'Patient 2', criticalRisk);

      const alerts = service.getActiveAlerts();

      expect(alerts[0]?.priority).toBe('urgent');
      expect(alerts[1]?.priority).toBe('medium');
    });

    it('should exclude acknowledged alerts', () => {
      const riskScore: RiskScore = {
        overall: 75,
        level: 'high',
        factors: [],
        confidence: 0.9,
      };

      const alert1 = service.createAlert('P001', 'Patient 1', riskScore);
      service.createAlert('P002', 'Patient 2', riskScore);

      if (alert1) {
        service.acknowledgeAlert(alert1.alertId, 'USER001');
      }

      const activeAlerts = service.getActiveAlerts();

      expect(activeAlerts).toHaveLength(1);
      expect(activeAlerts[0]?.patientId).toBe('P002');
    });
  });

  describe('acknowledgeAlert', () => {
    it('should acknowledge an alert', () => {
      const riskScore: RiskScore = {
        overall: 75,
        level: 'high',
        factors: [],
        confidence: 0.9,
      };

      const alert = service.createAlert('P001', 'Patient 1', riskScore);
      expect(alert).not.toBeNull();

      const acknowledged = service.acknowledgeAlert(alert!.alertId, 'USER001');

      expect(acknowledged).not.toBeNull();
      expect(acknowledged?.acknowledged).toBe(true);
      expect(acknowledged?.acknowledgedBy).toBe('USER001');
      expect(acknowledged?.acknowledgedAt).toBeInstanceOf(Date);
    });

    it('should return null for non-existent alert', () => {
      const result = service.acknowledgeAlert('INVALID-ID', 'USER001');

      expect(result).toBeNull();
    });
  });

  describe('getPatientAlerts', () => {
    it('should return all alerts for a patient', () => {
      const riskScore: RiskScore = {
        overall: 75,
        level: 'high',
        factors: [],
        confidence: 0.9,
      };

      service.createAlert('P001', 'Patient 1', riskScore);
      service.createAlert('P001', 'Patient 1', riskScore);
      service.createAlert('P002', 'Patient 2', riskScore);

      const alerts = service.getPatientAlerts('P001');

      expect(alerts).toHaveLength(2);
      expect(alerts.every((a) => a.patientId === 'P001')).toBe(true);
    });

    it('should return empty array for patient with no alerts', () => {
      const alerts = service.getPatientAlerts('P999');

      expect(alerts).toHaveLength(0);
    });
  });
});
