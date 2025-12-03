/**
 * Unit Tests for Alert Generation Service
 */

import { AlertGenerationService } from '../services/AlertGenerationService';
import { AdherenceMetrics } from '../models';

describe('AlertGenerationService', () => {
  let service: AlertGenerationService;

  beforeEach(() => {
    service = new AlertGenerationService();
  });

  describe('generateAlerts', () => {
    it('should generate missed refill alert for overdue medication', () => {
      const now = new Date();
      const overdueDate = new Date(now);
      overdueDate.setDate(overdueDate.getDate() - 10); // 10 days overdue

      const metrics: AdherenceMetrics = {
        patientId: 'p1',
        medicationId: 'm1',
        medicationName: 'Test Med',
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        pdc: 0.9,
        mpr: 0.9,
        gapDays: 3,
        earlyRefillDays: 0,
        adherenceCategory: 'optimal',
        trend: 'stable',
        nextExpectedRefillDate: overdueDate,
        totalDispensations: 2
      };

      const alerts = service.generateAlerts(metrics);
      const missedRefillAlert = alerts.find(a => a.type === 'missed_refill');

      expect(missedRefillAlert).toBeDefined();
      expect(missedRefillAlert?.severity).toBe('critical');
      expect(missedRefillAlert?.daysOverdue).toBeGreaterThan(7);
    });

    it('should generate warning for slightly overdue refill', () => {
      const now = new Date();
      const overdueDate = new Date(now);
      overdueDate.setDate(overdueDate.getDate() - 5); // 5 days overdue

      const metrics: AdherenceMetrics = {
        patientId: 'p1',
        medicationId: 'm1',
        medicationName: 'Test Med',
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        pdc: 0.85,
        mpr: 0.85,
        gapDays: 5,
        earlyRefillDays: 0,
        adherenceCategory: 'optimal',
        trend: 'stable',
        nextExpectedRefillDate: overdueDate,
        totalDispensations: 2
      };

      const alerts = service.generateAlerts(metrics);
      const missedRefillAlert = alerts.find(a => a.type === 'missed_refill');

      expect(missedRefillAlert).toBeDefined();
      expect(missedRefillAlert?.severity).toBe('warning');
    });

    it('should generate gap detection alert for significant gaps', () => {
      const metrics: AdherenceMetrics = {
        patientId: 'p1',
        medicationId: 'm1',
        medicationName: 'Test Med',
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        pdc: 0.5,
        mpr: 0.5,
        gapDays: 15,
        earlyRefillDays: 0,
        adherenceCategory: 'moderate',
        trend: 'declining',
        totalDispensations: 1
      };

      const alerts = service.generateAlerts(metrics);
      const gapAlert = alerts.find(a => a.type === 'gap_detected');

      expect(gapAlert).toBeDefined();
      expect(gapAlert?.severity).toBe('critical');
    });

    it('should generate stockout risk alert', () => {
      const now = new Date();
      const soonDate = new Date(now);
      soonDate.setDate(soonDate.getDate() + 1); // Refill due tomorrow

      const metrics: AdherenceMetrics = {
        patientId: 'p1',
        medicationId: 'm1',
        medicationName: 'Test Med',
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        pdc: 0.9,
        mpr: 0.9,
        gapDays: 0,
        earlyRefillDays: 0,
        adherenceCategory: 'optimal',
        trend: 'stable',
        nextExpectedRefillDate: soonDate,
        totalDispensations: 2
      };

      const alerts = service.generateAlerts(metrics);
      const stockoutAlert = alerts.find(a => a.type === 'stockout_risk');

      expect(stockoutAlert).toBeDefined();
      expect(stockoutAlert?.severity).toBe('warning');
    });

    it('should generate early refill alert', () => {
      const metrics: AdherenceMetrics = {
        patientId: 'p1',
        medicationId: 'm1',
        medicationName: 'Test Med',
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        pdc: 1.0,
        mpr: 1.2,
        gapDays: 0,
        earlyRefillDays: 15,
        adherenceCategory: 'optimal',
        trend: 'stable',
        totalDispensations: 3
      };

      const alerts = service.generateAlerts(metrics);
      const earlyRefillAlert = alerts.find(a => a.type === 'early_refill');

      expect(earlyRefillAlert).toBeDefined();
      expect(earlyRefillAlert?.severity).toBe('info');
    });

    it('should generate poor adherence alert', () => {
      const metrics: AdherenceMetrics = {
        patientId: 'p1',
        medicationId: 'm1',
        medicationName: 'Test Med',
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        pdc: 0.3,
        mpr: 0.3,
        gapDays: 20,
        earlyRefillDays: 0,
        adherenceCategory: 'poor',
        trend: 'declining',
        totalDispensations: 1
      };

      const alerts = service.generateAlerts(metrics);
      const poorAdherenceAlert = alerts.find(
        a => a.type === 'gap_detected' && a.recommendedAction.includes('Poor adherence')
      );

      expect(poorAdherenceAlert).toBeDefined();
      expect(poorAdherenceAlert?.severity).toBe('critical');
    });

    it('should generate no alerts for perfect adherence', () => {
      const metrics: AdherenceMetrics = {
        patientId: 'p1',
        medicationId: 'm1',
        medicationName: 'Test Med',
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        pdc: 1.0,
        mpr: 1.0,
        gapDays: 0,
        earlyRefillDays: 0,
        adherenceCategory: 'optimal',
        trend: 'stable',
        totalDispensations: 1
      };

      const alerts = service.generateAlerts(metrics);
      expect(alerts.length).toBe(0);
    });

    it('should include all required alert properties', () => {
      const now = new Date();
      const overdueDate = new Date(now);
      overdueDate.setDate(overdueDate.getDate() - 10);

      const metrics: AdherenceMetrics = {
        patientId: 'p1',
        medicationId: 'm1',
        medicationName: 'Test Med',
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        pdc: 0.5,
        mpr: 0.5,
        gapDays: 15,
        earlyRefillDays: 0,
        adherenceCategory: 'moderate',
        trend: 'declining',
        nextExpectedRefillDate: overdueDate,
        totalDispensations: 1
      };

      const alerts = service.generateAlerts(metrics);

      alerts.forEach(alert => {
        expect(alert).toHaveProperty('id');
        expect(alert).toHaveProperty('patientId');
        expect(alert).toHaveProperty('type');
        expect(alert).toHaveProperty('severity');
        expect(alert).toHaveProperty('medicationName');
        expect(alert).toHaveProperty('medicationId');
        expect(alert).toHaveProperty('recommendedAction');
        expect(alert).toHaveProperty('createdAt');
        expect(alert).toHaveProperty('resolved');
        expect(alert.resolved).toBe(false);
      });
    });
  });
});
