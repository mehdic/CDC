/**
 * Unit Tests for Adherence Calculation Service
 */

import { AdherenceCalculationService } from '../services/AdherenceCalculationService';
import { DispensationRecord } from '../models';

describe('AdherenceCalculationService', () => {
  let service: AdherenceCalculationService;

  beforeEach(() => {
    service = new AdherenceCalculationService();
  });

  describe('calculatePDC', () => {
    it('should return 0 for no dispensations', () => {
      const dispensations: DispensationRecord[] = [];
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');

      const pdc = service.calculatePDC(dispensations, start, end);
      expect(pdc).toBe(0);
    });

    it('should calculate 100% PDC for perfect coverage', () => {
      const dispensations: DispensationRecord[] = [
        {
          id: '1',
          patientId: 'p1',
          medicationId: 'm1',
          dispensationDate: new Date('2024-01-01'),
          quantityDispensed: 30,
          daysSupply: 30,
          prescriptionId: 'rx1'
        }
      ];
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-30');

      const pdc = service.calculatePDC(dispensations, start, end);
      expect(pdc).toBe(1.0);
    });

    it('should calculate partial PDC with gaps', () => {
      const dispensations: DispensationRecord[] = [
        {
          id: '1',
          patientId: 'p1',
          medicationId: 'm1',
          dispensationDate: new Date('2024-01-01'),
          quantityDispensed: 15,
          daysSupply: 15,
          prescriptionId: 'rx1'
        }
      ];
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-30');

      const pdc = service.calculatePDC(dispensations, start, end);
      expect(pdc).toBeCloseTo(0.5, 1); // 15 days out of 30
    });

    it('should handle overlapping dispensations correctly', () => {
      const dispensations: DispensationRecord[] = [
        {
          id: '1',
          patientId: 'p1',
          medicationId: 'm1',
          dispensationDate: new Date('2024-01-01'),
          quantityDispensed: 20,
          daysSupply: 20,
          prescriptionId: 'rx1'
        },
        {
          id: '2',
          patientId: 'p1',
          medicationId: 'm1',
          dispensationDate: new Date('2024-01-15'), // 5 days early
          quantityDispensed: 20,
          daysSupply: 20,
          prescriptionId: 'rx2'
        }
      ];
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');

      const pdc = service.calculatePDC(dispensations, start, end);
      expect(pdc).toBeGreaterThan(0.9); // Should cover most of the period
    });

    it('should cap PDC at 1.0', () => {
      const dispensations: DispensationRecord[] = [
        {
          id: '1',
          patientId: 'p1',
          medicationId: 'm1',
          dispensationDate: new Date('2024-01-01'),
          quantityDispensed: 60,
          daysSupply: 60,
          prescriptionId: 'rx1'
        }
      ];
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-30');

      const pdc = service.calculatePDC(dispensations, start, end);
      expect(pdc).toBe(1.0);
    });
  });

  describe('calculateMPR', () => {
    it('should return 0 for no dispensations', () => {
      const dispensations: DispensationRecord[] = [];
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');

      const mpr = service.calculateMPR(dispensations, start, end);
      expect(mpr).toBe(0);
    });

    it('should calculate MPR for single fill', () => {
      const dispensations: DispensationRecord[] = [
        {
          id: '1',
          patientId: 'p1',
          medicationId: 'm1',
          dispensationDate: new Date('2024-01-01'),
          quantityDispensed: 30,
          daysSupply: 30,
          prescriptionId: 'rx1'
        }
      ];
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');

      const mpr = service.calculateMPR(dispensations, start, end);
      expect(mpr).toBeGreaterThan(0);
    });

    it('should calculate MPR for multiple fills', () => {
      const dispensations: DispensationRecord[] = [
        {
          id: '1',
          patientId: 'p1',
          medicationId: 'm1',
          dispensationDate: new Date('2024-01-01'),
          quantityDispensed: 30,
          daysSupply: 30,
          prescriptionId: 'rx1'
        },
        {
          id: '2',
          patientId: 'p1',
          medicationId: 'm1',
          dispensationDate: new Date('2024-02-01'),
          quantityDispensed: 30,
          daysSupply: 30,
          prescriptionId: 'rx2'
        }
      ];
      const start = new Date('2024-01-01');
      const end = new Date('2024-02-29');

      const mpr = service.calculateMPR(dispensations, start, end);
      expect(mpr).toBeGreaterThan(0.5);
    });
  });

  describe('calculateGapDays', () => {
    it('should return 0 for perfect adherence', () => {
      const dispensations: DispensationRecord[] = [
        {
          id: '1',
          patientId: 'p1',
          medicationId: 'm1',
          dispensationDate: new Date('2024-01-01'),
          quantityDispensed: 30,
          daysSupply: 30,
          prescriptionId: 'rx1'
        }
      ];
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-30');

      const gaps = service.calculateGapDays(dispensations, start, end);
      expect(gaps).toBe(0);
    });

    it('should calculate gaps correctly', () => {
      const dispensations: DispensationRecord[] = [
        {
          id: '1',
          patientId: 'p1',
          medicationId: 'm1',
          dispensationDate: new Date('2024-01-01'),
          quantityDispensed: 10,
          daysSupply: 10,
          prescriptionId: 'rx1'
        }
      ];
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-30');

      const gaps = service.calculateGapDays(dispensations, start, end);
      expect(gaps).toBeGreaterThan(15);
    });
  });

  describe('calculateEarlyRefillDays', () => {
    it('should return 0 for single fill', () => {
      const dispensations: DispensationRecord[] = [
        {
          id: '1',
          patientId: 'p1',
          medicationId: 'm1',
          dispensationDate: new Date('2024-01-01'),
          quantityDispensed: 30,
          daysSupply: 30,
          prescriptionId: 'rx1'
        }
      ];

      const earlyDays = service.calculateEarlyRefillDays(dispensations);
      expect(earlyDays).toBe(0);
    });

    it('should detect early refills', () => {
      const dispensations: DispensationRecord[] = [
        {
          id: '1',
          patientId: 'p1',
          medicationId: 'm1',
          dispensationDate: new Date('2024-01-01'),
          quantityDispensed: 30,
          daysSupply: 30,
          prescriptionId: 'rx1'
        },
        {
          id: '2',
          patientId: 'p1',
          medicationId: 'm1',
          dispensationDate: new Date('2024-01-25'), // 6 days early
          quantityDispensed: 30,
          daysSupply: 30,
          prescriptionId: 'rx2'
        }
      ];

      const earlyDays = service.calculateEarlyRefillDays(dispensations);
      expect(earlyDays).toBeGreaterThan(5);
    });
  });

  describe('categorizeAdherence', () => {
    it('should categorize as optimal for PDC >= 0.8', () => {
      expect(service.categorizeAdherence(0.8)).toBe('optimal');
      expect(service.categorizeAdherence(0.9)).toBe('optimal');
      expect(service.categorizeAdherence(1.0)).toBe('optimal');
    });

    it('should categorize as moderate for 0.5 <= PDC < 0.8', () => {
      expect(service.categorizeAdherence(0.5)).toBe('moderate');
      expect(service.categorizeAdherence(0.6)).toBe('moderate');
      expect(service.categorizeAdherence(0.79)).toBe('moderate');
    });

    it('should categorize as poor for PDC < 0.5', () => {
      expect(service.categorizeAdherence(0.0)).toBe('poor');
      expect(service.categorizeAdherence(0.3)).toBe('poor');
      expect(service.categorizeAdherence(0.49)).toBe('poor');
    });
  });

  describe('calculateMetrics', () => {
    it('should calculate complete metrics correctly', () => {
      const dispensations: DispensationRecord[] = [
        {
          id: '1',
          patientId: 'p1',
          medicationId: 'm1',
          dispensationDate: new Date('2024-01-01'),
          quantityDispensed: 30,
          daysSupply: 30,
          prescriptionId: 'rx1'
        },
        {
          id: '2',
          patientId: 'p1',
          medicationId: 'm1',
          dispensationDate: new Date('2024-02-01'),
          quantityDispensed: 30,
          daysSupply: 30,
          prescriptionId: 'rx2'
        }
      ];
      const start = new Date('2024-01-01');
      const end = new Date('2024-02-29');

      const metrics = service.calculateMetrics(
        'p1',
        'm1',
        'Test Medication',
        dispensations,
        start,
        end
      );

      expect(metrics.patientId).toBe('p1');
      expect(metrics.medicationId).toBe('m1');
      expect(metrics.medicationName).toBe('Test Medication');
      expect(metrics.pdc).toBeGreaterThan(0);
      expect(metrics.mpr).toBeGreaterThan(0);
      expect(metrics.adherenceCategory).toBeDefined();
      expect(metrics.trend).toBeDefined();
      expect(metrics.totalDispensations).toBe(2);
    });
  });
});
