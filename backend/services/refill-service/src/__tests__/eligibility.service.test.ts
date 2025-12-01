/**
 * EligibilityService Unit Tests
 * Test refill eligibility checking logic
 */

import { EligibilityService } from '../services/EligibilityService';
import { PrescriptionData } from '../types/refill.types';

describe('EligibilityService', () => {
  let eligibilityService: EligibilityService;

  beforeEach(() => {
    eligibilityService = new EligibilityService();
  });

  describe('checkEligibility', () => {
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

    it('should return eligible for valid prescription with remaining refills', async () => {
      const result = await eligibilityService.checkEligibility(
        validPrescription
      );

      expect(result.isEligible).toBe(true);
      expect(result.remainingRefills).toBe(9);
      expect(result.daysUntilNextRefill).toBe(0);
    });

    it('should return ineligible when prescription has expired', async () => {
      const expiredPrescription = {
        ...validPrescription,
        expiresAt: new Date('2023-12-31'),
      };

      const result = await eligibilityService.checkEligibility(
        expiredPrescription
      );

      expect(result.isEligible).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some(e => e.includes('expired'))).toBe(true);
    });

    it('should return ineligible when no refills remaining', async () => {
      const noRefillsPrescription = {
        ...validPrescription,
        refillsUsed: 11,
      };

      const result = await eligibilityService.checkEligibility(
        noRefillsPrescription
      );

      expect(result.isEligible).toBe(false);
      expect(result.remainingRefills).toBe(0);
      expect(result.errors).toContain('No refills remaining for this prescription');
    });

    it('should calculate correct days until next refill', async () => {
      const currentDate = new Date('2024-11-05');
      const prescription = {
        ...validPrescription,
        lastRefillDate: new Date('2024-11-01'),
      };

      const result = await eligibilityService.checkEligibility(
        prescription,
        currentDate
      );

      // Should fail because not enough days have passed since last refill
      expect(result.isEligible).toBe(false);
      expect(result.daysUntilNextRefill).toBeGreaterThan(0);
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

      // Amoxicillin ends with -cillin, so should require manual approval
      expect(result.requiresManualApproval).toBe(true);
    });

    it('should handle prescription without refill history', async () => {
      const firstRefillPrescription = {
        ...validPrescription,
        lastRefillDate: undefined,
      };

      const result = await eligibilityService.checkEligibility(
        firstRefillPrescription
      );

      expect(result.isEligible).toBe(true);
      expect(result.daysUntilNextRefill).toBe(0);
    });
  });

  describe('updateRules', () => {
    it('should update refill rules', () => {
      const newRules = {
        maxRefillsDefault: 5,
        minDaysBetweenRefills: 14,
      };

      eligibilityService.updateRules(newRules);
      const rules = eligibilityService.getRules();

      expect(rules.maxRefillsDefault).toBe(5);
      expect(rules.minDaysBetweenRefills).toBe(14);
    });

    it('should preserve original rules not overridden', () => {
      const originalRules = eligibilityService.getRules();
      eligibilityService.updateRules({ maxRefillsDefault: 5 });
      const updatedRules = eligibilityService.getRules();

      expect(updatedRules.minDaysBetweenRefills).toBe(
        originalRules.minDaysBetweenRefills
      );
    });
  });

  describe('Controlled substance rules', () => {
    it('should apply stricter rules for controlled substances', async () => {
      const customService = new EligibilityService({
        controlledSubstanceRules: {
          maxRefills: 3,
          minDaysBetweenRefills: 30,
          requiresManualApproval: true,
        },
      });

      const controlledPrescription: PrescriptionData = {
        id: 'rx-123',
        patientId: 'patient-123',
        pharmacyId: 'pharmacy-123',
        doctorId: 'doctor-123',
        medications: [
          {
            drugName: 'Codeine',
            dosage: '30mg',
            quantity: 20,
            isControlledSubstance: true,
          },
        ],
        status: 'active',
        issuedAt: new Date('2024-01-01'),
        expiresAt: new Date('2025-12-31'),
        refillsAllowed: 3,
        refillsUsed: 1,
        lastRefillDate: new Date('2024-10-01'),
      };

      const result = await customService.checkEligibility(
        controlledPrescription,
        new Date('2024-11-10')
      );

      // Codeine is controlled substance, so should flag it
      expect(result.controlledSubstance).toBe(true);
      expect(result.requiresManualApproval).toBe(true);
    });
  });
});
