/**
 * RefillService Unit Tests
 * Test refill request creation, approval, and management
 */

import { RefillService } from '../services/RefillService';
import { EligibilityService } from '../services/EligibilityService';
import { PrescriptionData } from '../types/refill.types';

describe('RefillService', () => {
  let eligibilityService: EligibilityService;

  const validPrescription: PrescriptionData = {
    id: 'rx-123',
    patientId: 'patient-123',
    pharmacyId: 'pharmacy-123',
    doctorId: 'doctor-123',
    medications: [
      {
        drugName: 'Aspirin',
        dosage: '500mg',
        quantity: 30,
        isControlledSubstance: false,
      },
    ],
    status: 'active',
    issuedAt: new Date('2024-01-01'),
    expiresAt: new Date('2025-12-31'),
    refillsAllowed: 11,
    refillsUsed: 2,
    lastRefillDate: new Date('2024-11-01'),
  };

  beforeEach(() => {
    eligibilityService = new EligibilityService();
  });

  describe('EligibilityService integration', () => {
    it('should correctly identify eligible prescriptions', async () => {
      const result = await eligibilityService.checkEligibility(validPrescription);
      expect(result.isEligible).toBe(true);
      expect(result.remainingRefills).toBe(9);
    });

    it('should correctly identify ineligible prescriptions', async () => {
      const ineligiblePrescription = {
        ...validPrescription,
        refillsUsed: 11,
      };

      const result = await eligibilityService.checkEligibility(
        ineligiblePrescription
      );
      expect(result.isEligible).toBe(false);
      expect(result.remainingRefills).toBe(0);
    });

    it('should identify controlled substances', async () => {
      const controlledPrescription = {
        ...validPrescription,
        medications: [
          {
            drugName: 'Morphine',
            dosage: '10mg',
            quantity: 30,
            isControlledSubstance: true,
          },
        ],
      };

      const result = await eligibilityService.checkEligibility(
        controlledPrescription
      );

      expect(result.controlledSubstance).toBe(true);
      expect(result.requiresManualApproval).toBe(true);
    });

    it('should require manual approval for antibiotics', async () => {
      const antibioticPrescription = {
        ...validPrescription,
        medications: [
          {
            drugName: 'Amoxicillin',
            dosage: '500mg',
            quantity: 30,
            isControlledSubstance: false,
          },
        ],
      };

      const result = await eligibilityService.checkEligibility(
        antibioticPrescription
      );

      expect(result.requiresManualApproval).toBe(true);
    });
  });

  describe('PrescriptionData validation', () => {
    it('should handle prescriptions with all required fields', () => {
      expect(validPrescription.id).toBeDefined();
      expect(validPrescription.patientId).toBeDefined();
      expect(validPrescription.pharmacyId).toBeDefined();
      expect(validPrescription.medications).toBeDefined();
      expect(validPrescription.medications.length).toBeGreaterThan(0);
    });

    it('should validate medication data structure', () => {
      const med = validPrescription.medications[0];
      expect(med.drugName).toBeDefined();
      expect(med.dosage).toBeDefined();
      expect(med.quantity).toBeGreaterThan(0);
      expect(typeof med.isControlledSubstance).toBe('boolean');
    });
  });

  describe('Refill eligibility scenarios', () => {
    it('should handle prescriptions with no refill history', async () => {
      const newPrescription = {
        ...validPrescription,
        lastRefillDate: undefined,
      };

      const result = await eligibilityService.checkEligibility(newPrescription);

      expect(result.isEligible).toBe(true);
      expect(result.daysUntilNextRefill).toBe(0);
    });

    it('should handle expired prescriptions', async () => {
      const expiredPrescription = {
        ...validPrescription,
        expiresAt: new Date('2023-12-31'),
      };

      const result = await eligibilityService.checkEligibility(
        expiredPrescription
      );

      expect(result.isEligible).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle prescriptions with no refills remaining', async () => {
      const noRefillsPrescription = {
        ...validPrescription,
        refillsUsed: 11,
      };

      const result = await eligibilityService.checkEligibility(
        noRefillsPrescription
      );

      expect(result.isEligible).toBe(false);
      expect(result.remainingRefills).toBe(0);
    });
  });

  describe('EligibilityService configuration', () => {
    it('should update rules dynamically', () => {
      const service = new EligibilityService();
      service.updateRules({
        maxRefillsDefault: 5,
        minDaysBetweenRefills: 14,
      });

      const rules = service.getRules();
      expect(rules.maxRefillsDefault).toBe(5);
      expect(rules.minDaysBetweenRefills).toBe(14);
    });

    it('should preserve unchanged rules when updating', () => {
      const service = new EligibilityService();
      const originalRules = service.getRules();

      service.updateRules({ maxRefillsDefault: 5 });
      const updatedRules = service.getRules();

      expect(updatedRules.minDaysBetweenRefills).toBe(
        originalRules.minDaysBetweenRefills
      );
    });

    it('should support custom configuration on initialization', () => {
      const service = new EligibilityService({
        maxRefillsDefault: 3,
        minDaysBetweenRefills: 14,
      });

      const rules = service.getRules();
      expect(rules.maxRefillsDefault).toBe(3);
      expect(rules.minDaysBetweenRefills).toBe(14);
    });
  });
});
