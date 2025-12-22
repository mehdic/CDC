/**
 * Medication Order Service Tests
 * Tests for order validation and submission
 */

import {
  validateMedicationOrder,
  checkDrugInteractions,
  fetchAvailableMedications,
} from '../medicationOrderService';

describe('medicationOrderService', () => {
  describe('validateMedicationOrder', () => {
    it('should validate correct order data', () => {
      const orderData = {
        patientId: 'patient-001',
        medications: [
          { medicationId: 'med-001', name: 'Aspirin', quantity: 2, dosage: '500mg' },
        ],
        urgency: 'routine' as const,
        notes: 'Test order',
      };

      const errors = validateMedicationOrder(orderData);

      expect(errors).toEqual([]);
    });

    it('should require patient ID', () => {
      const orderData = {
        patientId: '',
        medications: [
          { medicationId: 'med-001', name: 'Aspirin', quantity: 2, dosage: '500mg' },
        ],
        urgency: 'routine' as const,
      };

      const errors = validateMedicationOrder(orderData);

      expect(errors).toContainEqual(
        expect.objectContaining({
          field: 'patientId',
          message: expect.stringContaining('required'),
        })
      );
    });

    it('should require at least one medication', () => {
      const orderData = {
        patientId: 'patient-001',
        medications: [],
        urgency: 'routine' as const,
      };

      const errors = validateMedicationOrder(orderData);

      expect(errors).toContainEqual(
        expect.objectContaining({
          field: 'medications',
          message: expect.stringContaining('At least one medication'),
        })
      );
    });

    it('should validate medication ID', () => {
      const orderData = {
        patientId: 'patient-001',
        medications: [
          { medicationId: '', name: 'Aspirin', quantity: 2, dosage: '500mg' },
        ],
        urgency: 'routine' as const,
      };

      const errors = validateMedicationOrder(orderData);

      expect(errors).toContainEqual(
        expect.objectContaining({
          field: expect.stringContaining('medicationId'),
        })
      );
    });

    it('should validate medication name', () => {
      const orderData = {
        patientId: 'patient-001',
        medications: [
          { medicationId: 'med-001', name: '', quantity: 2, dosage: '500mg' },
        ],
        urgency: 'routine' as const,
      };

      const errors = validateMedicationOrder(orderData);

      expect(errors).toContainEqual(
        expect.objectContaining({
          field: expect.stringContaining('name'),
        })
      );
    });

    it('should validate quantity is positive', () => {
      const orderData = {
        patientId: 'patient-001',
        medications: [
          { medicationId: 'med-001', name: 'Aspirin', quantity: 0, dosage: '500mg' },
        ],
        urgency: 'routine' as const,
      };

      const errors = validateMedicationOrder(orderData);

      expect(errors).toContainEqual(
        expect.objectContaining({
          field: expect.stringContaining('quantity'),
        })
      );
    });

    it('should validate dosage is provided', () => {
      const orderData = {
        patientId: 'patient-001',
        medications: [
          { medicationId: 'med-001', name: 'Aspirin', quantity: 2, dosage: '' },
        ],
        urgency: 'routine' as const,
      };

      const errors = validateMedicationOrder(orderData);

      expect(errors).toContainEqual(
        expect.objectContaining({
          field: expect.stringContaining('dosage'),
        })
      );
    });

    it('should validate urgency level', () => {
      const orderData = {
        patientId: 'patient-001',
        medications: [
          { medicationId: 'med-001', name: 'Aspirin', quantity: 2, dosage: '500mg' },
        ],
        urgency: 'invalid' as unknown as 'routine' | 'urgent' | 'stat',
      };

      const errors = validateMedicationOrder(orderData);

      expect(errors).toContainEqual(
        expect.objectContaining({
          field: 'urgency',
        })
      );
    });

    it('should handle multiple medications validation', () => {
      const orderData = {
        patientId: 'patient-001',
        medications: [
          { medicationId: 'med-001', name: 'Aspirin', quantity: 2, dosage: '500mg' },
          { medicationId: 'med-002', name: 'Ibuprofen', quantity: 3, dosage: '400mg' },
          { medicationId: '', name: 'Invalid', quantity: -1, dosage: '' },
        ],
        urgency: 'routine' as const,
      };

      const errors = validateMedicationOrder(orderData);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.field.includes('medications.2'))).toBe(true);
    });
  });

  describe('checkDrugInteractions', () => {
    it('should return no interaction for safe medication', async () => {
      const result = await checkDrugInteractions('med-001', ['allergy1', 'allergy2']);

      expect(result.hasInteraction).toBe(false);
      expect(result.severity).toBe('none');
    });

    it('should detect penicillin allergy interaction', async () => {
      const result = await checkDrugInteractions('med-003', ['penicillin']);

      expect(result.hasInteraction).toBe(true);
      expect(result.severity).toBe('severe');
      expect(result.message).toContain('penicillin');
    });

    it('should handle case-insensitive allergies', async () => {
      const result = await checkDrugInteractions('med-003', ['Penicillin']);

      expect(result.hasInteraction).toBe(true);
      expect(result.severity).toBe('severe');
    });

    it('should handle empty allergy list', async () => {
      const result = await checkDrugInteractions('med-003', []);

      expect(result.hasInteraction).toBe(false);
    });
  });

  describe('fetchAvailableMedications', () => {
    it('should return list of available medications', async () => {
      const medications = await fetchAvailableMedications();

      expect(Array.isArray(medications)).toBe(true);
      expect(medications.length).toBeGreaterThan(0);
    });

    it('should return medications with required properties', async () => {
      const medications = await fetchAvailableMedications();

      medications.forEach((med) => {
        expect(med).toHaveProperty('id');
        expect(med).toHaveProperty('name');
        expect(med).toHaveProperty('dosageOptions');
        expect(med).toHaveProperty('route');
        expect(Array.isArray(med.dosageOptions)).toBe(true);
      });
    });

    it('should include various routes', async () => {
      const medications = await fetchAvailableMedications();

      const routes = medications.map((m) => m.route);

      expect(routes).toContain('oral');
    });

    it('should include dosage options for each medication', async () => {
      const medications = await fetchAvailableMedications();

      medications.forEach((med) => {
        expect(med.dosageOptions.length).toBeGreaterThan(0);
        med.dosageOptions.forEach((dosage) => {
          expect(typeof dosage).toBe('string');
          expect(dosage.length).toBeGreaterThan(0);
        });
      });
    });
  });
});
