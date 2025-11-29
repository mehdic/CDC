/**
 * Unit Tests for Digital Twin Patient Profile Service (T3-107)
 * Tests for T3-106 implementation
 */

import {
  getDigitalTwinProfile,
  updateDigitalTwin,
} from '../digitalTwinService';

// Mock the AppDataSource
jest.mock('../../../services/user-service/src/index', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

import { AppDataSource } from '../../../services/user-service/src/index';

describe('Digital Twin Service - T3-106', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDigitalTwinProfile', () => {
    it('should return null if patient not found', async () => {
      const mockUserRepo = {
        findOne: jest.fn().mockResolvedValue(null),
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockUserRepo);

      const result = await getDigitalTwinProfile('nonexistent-patient');

      expect(result).toBeNull();
    });

    it('should return complete digital twin profile for patient', async () => {
      const mockPatient = {
        id: 'patient-123',
        first_name_encrypted: 'John',
        last_name_encrypted: 'Doe',
        email: 'john@example.com',
        phone_encrypted: '555-1234',
        primary_pharmacy_id: 'pharmacy-1',
      };

      const mockPrescriptions = [
        {
          patient_id: 'patient-123',
          created_at: new Date('2024-01-01'),
          source: 'doctor',
          items: [
            {
              medication_name: 'Metformin 500mg',
              medication_rxnorm_code: '6809',
              dosage: '500mg',
              frequency: 'twice daily',
            },
          ],
        },
      ];

      const mockOrders = [
        {
          patient_id: 'patient-123',
          created_at: new Date('2024-01-15'),
          total_amount: 45.50,
          items: [
            {
              product_name: 'Vitamin D',
              product_category: 'supplements',
            },
          ],
        },
      ];

      const mockUserRepo = {
        findOne: jest.fn().mockResolvedValue(mockPatient),
      };

      const mockPrescriptionRepo = {
        find: jest.fn().mockResolvedValue(mockPrescriptions),
        count: jest.fn().mockResolvedValue(1),
        findOne: jest.fn().mockResolvedValue(mockPrescriptions[0]),
      };

      const mockOrderRepo = {
        find: jest.fn().mockResolvedValue(mockOrders),
        count: jest.fn().mockResolvedValue(1),
        findOne: jest.fn().mockResolvedValue(mockOrders[0]),
      };

      (AppDataSource.getRepository as jest.Mock)
        .mockReturnValueOnce(mockUserRepo)
        .mockReturnValueOnce(mockPrescriptionRepo)
        .mockReturnValueOnce(mockOrderRepo)
        .mockReturnValueOnce(mockPrescriptionRepo)
        .mockReturnValueOnce(mockPrescriptionRepo)
        .mockReturnValueOnce(mockOrderRepo)
        .mockReturnValue(mockPrescriptionRepo);

      const result = await getDigitalTwinProfile('patient-123');

      expect(result).not.toBeNull();
      expect(result?.patient_id).toBe('patient-123');
      expect(result?.demographic).toBeDefined();
      expect(result?.medical_history).toBeDefined();
      expect(result?.purchase_behavior).toBeDefined();
      expect(result?.health_insights).toBeDefined();
      expect(result?.predictions).toBeDefined();
      expect(result?.engagement).toBeDefined();
      expect(result?.privacy).toBeDefined();
    });

    it('should detect chronic conditions from prescription patterns', async () => {
      const mockPatient = {
        id: 'patient-123',
        first_name_encrypted: 'John',
        last_name_encrypted: 'Doe',
        email: 'john@example.com',
      };

      // Multiple prescriptions for diabetes medications
      const mockPrescriptions = [
        {
          patient_id: 'patient-123',
          created_at: new Date('2024-01-01'),
          source: 'doctor',
          items: [
            {
              medication_name: 'Metformin 500mg',
              medication_rxnorm_code: '6809',
              dosage: '500mg',
              frequency: 'twice daily',
            },
          ],
        },
        {
          patient_id: 'patient-123',
          created_at: new Date('2024-02-01'),
          source: 'doctor',
          items: [
            {
              medication_name: 'Metformin 500mg',
              medication_rxnorm_code: '6809',
              dosage: '500mg',
              frequency: 'twice daily',
            },
          ],
        },
      ];

      const mockUserRepo = {
        findOne: jest.fn().mockResolvedValue(mockPatient),
      };

      const mockPrescriptionRepo = {
        find: jest.fn().mockResolvedValue(mockPrescriptions),
        count: jest.fn().mockResolvedValue(2),
        findOne: jest.fn().mockResolvedValue(mockPrescriptions[0]),
      };

      const mockOrderRepo = {
        find: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findOne: jest.fn().mockResolvedValue(null),
      };

      (AppDataSource.getRepository as jest.Mock)
        .mockReturnValueOnce(mockUserRepo)
        .mockReturnValueOnce(mockPrescriptionRepo)
        .mockReturnValueOnce(mockOrderRepo)
        .mockReturnValueOnce(mockPrescriptionRepo)
        .mockReturnValueOnce(mockPrescriptionRepo)
        .mockReturnValueOnce(mockOrderRepo)
        .mockReturnValue(mockPrescriptionRepo);

      const result = await getDigitalTwinProfile('patient-123');

      expect(result).not.toBeNull();
      expect(result?.medical_history.chronic_conditions.length).toBeGreaterThan(0);

      // Should detect Type 2 Diabetes from metformin usage
      const hasdiabetes = result?.medical_history.chronic_conditions.some(
        condition => condition.condition_name.includes('Diabetes')
      );
      expect(hasdiabetes).toBeTruthy();
    });

    it('should calculate medication adherence score', async () => {
      const mockPatient = {
        id: 'patient-123',
        first_name_encrypted: 'John',
        last_name_encrypted: 'Doe',
      };

      const mockPrescriptions = [
        {
          patient_id: 'patient-123',
          created_at: new Date('2024-01-01'),
          source: 'doctor',
          items: [
            {
              medication_name: 'Lisinopril 10mg',
              medication_rxnorm_code: '104382',
              dosage: '10mg',
              frequency: 'once daily',
            },
          ],
        },
      ];

      const mockUserRepo = {
        findOne: jest.fn().mockResolvedValue(mockPatient),
      };

      const mockPrescriptionRepo = {
        find: jest.fn().mockResolvedValue(mockPrescriptions),
        count: jest.fn().mockResolvedValue(1),
        findOne: jest.fn().mockResolvedValue(mockPrescriptions[0]),
      };

      const mockOrderRepo = {
        find: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findOne: jest.fn().mockResolvedValue(null),
      };

      (AppDataSource.getRepository as jest.Mock)
        .mockReturnValueOnce(mockUserRepo)
        .mockReturnValueOnce(mockPrescriptionRepo)
        .mockReturnValueOnce(mockOrderRepo)
        .mockReturnValueOnce(mockPrescriptionRepo)
        .mockReturnValueOnce(mockPrescriptionRepo)
        .mockReturnValueOnce(mockOrderRepo)
        .mockReturnValue(mockPrescriptionRepo);

      const result = await getDigitalTwinProfile('patient-123');

      expect(result).not.toBeNull();
      expect(result?.health_insights.medication_adherence_score).toBeGreaterThan(0);
      expect(result?.health_insights.medication_adherence_score).toBeLessThanOrEqual(100);
    });

    it('should calculate purchase behavior metrics', async () => {
      const mockPatient = {
        id: 'patient-123',
        first_name_encrypted: 'John',
        last_name_encrypted: 'Doe',
      };

      const mockOrders = [
        {
          patient_id: 'patient-123',
          created_at: new Date('2024-01-01'),
          total_amount: 50.00,
          items: [
            { product_name: 'Product A', product_category: 'supplements' },
          ],
        },
        {
          patient_id: 'patient-123',
          created_at: new Date('2024-02-01'),
          total_amount: 30.00,
          items: [
            { product_name: 'Product B', product_category: 'otc' },
          ],
        },
      ];

      const mockUserRepo = {
        findOne: jest.fn().mockResolvedValue(mockPatient),
      };

      const mockPrescriptionRepo = {
        find: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findOne: jest.fn().mockResolvedValue(null),
      };

      const mockOrderRepo = {
        find: jest.fn().mockResolvedValue(mockOrders),
        count: jest.fn().mockResolvedValue(2),
        findOne: jest.fn().mockResolvedValue(mockOrders[1]),
      };

      (AppDataSource.getRepository as jest.Mock)
        .mockReturnValueOnce(mockUserRepo)
        .mockReturnValueOnce(mockPrescriptionRepo)
        .mockReturnValueOnce(mockOrderRepo)
        .mockReturnValueOnce(mockPrescriptionRepo)
        .mockReturnValueOnce(mockOrderRepo)
        .mockReturnValueOnce(mockOrderRepo)
        .mockReturnValue(mockPrescriptionRepo);

      const result = await getDigitalTwinProfile('patient-123');

      expect(result).not.toBeNull();
      expect(result?.purchase_behavior.total_orders).toBe(2);
      expect(result?.purchase_behavior.avg_order_value).toBeGreaterThan(0);
      expect(result?.purchase_behavior.preferred_categories.length).toBeGreaterThan(0);
    });

    it('should assess health risk level', async () => {
      const mockPatient = {
        id: 'patient-123',
        first_name_encrypted: 'John',
        last_name_encrypted: 'Doe',
      };

      // Patient with multiple chronic conditions (high risk)
      const mockPrescriptions = [
        {
          patient_id: 'patient-123',
          created_at: new Date('2024-01-01'),
          source: 'doctor',
          items: [
            {
              medication_name: 'Metformin',
              medication_rxnorm_code: '6809',
              dosage: '500mg',
              frequency: 'twice daily',
            },
            {
              medication_name: 'Lisinopril',
              medication_rxnorm_code: '104382',
              dosage: '10mg',
              frequency: 'once daily',
            },
            {
              medication_name: 'Atorvastatin',
              medication_rxnorm_code: '83367',
              dosage: '20mg',
              frequency: 'once daily',
            },
          ],
        },
      ];

      const mockUserRepo = {
        findOne: jest.fn().mockResolvedValue(mockPatient),
      };

      const mockPrescriptionRepo = {
        find: jest.fn().mockResolvedValue(mockPrescriptions),
        count: jest.fn().mockResolvedValue(1),
        findOne: jest.fn().mockResolvedValue(mockPrescriptions[0]),
      };

      const mockOrderRepo = {
        find: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findOne: jest.fn().mockResolvedValue(null),
      };

      (AppDataSource.getRepository as jest.Mock)
        .mockReturnValueOnce(mockUserRepo)
        .mockReturnValueOnce(mockPrescriptionRepo)
        .mockReturnValueOnce(mockOrderRepo)
        .mockReturnValueOnce(mockPrescriptionRepo)
        .mockReturnValueOnce(mockPrescriptionRepo)
        .mockReturnValueOnce(mockOrderRepo)
        .mockReturnValue(mockPrescriptionRepo);

      const result = await getDigitalTwinProfile('patient-123');

      expect(result).not.toBeNull();
      expect(result?.health_insights.health_risk_level).toBeDefined();
      expect(['low', 'moderate', 'high']).toContain(result?.health_insights.health_risk_level);
      expect(result?.health_insights.risk_factors.length).toBeGreaterThan(0);
    });

    it('should generate refill predictions', async () => {
      const mockPatient = {
        id: 'patient-123',
        first_name_encrypted: 'John',
        last_name_encrypted: 'Doe',
      };

      const mockPrescriptions = [
        {
          patient_id: 'patient-123',
          created_at: new Date('2024-01-01'),
          source: 'doctor',
          items: [
            {
              medication_name: 'Medication A',
              medication_rxnorm_code: '12345',
              dosage: '100mg',
              frequency: 'once daily',
            },
          ],
        },
      ];

      const mockUserRepo = {
        findOne: jest.fn().mockResolvedValue(mockPatient),
      };

      const mockPrescriptionRepo = {
        find: jest.fn().mockResolvedValue(mockPrescriptions),
        count: jest.fn().mockResolvedValue(1),
        findOne: jest.fn().mockResolvedValue(mockPrescriptions[0]),
      };

      const mockOrderRepo = {
        find: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findOne: jest.fn().mockResolvedValue(null),
      };

      (AppDataSource.getRepository as jest.Mock)
        .mockReturnValueOnce(mockUserRepo)
        .mockReturnValueOnce(mockPrescriptionRepo)
        .mockReturnValueOnce(mockOrderRepo)
        .mockReturnValueOnce(mockPrescriptionRepo)
        .mockReturnValueOnce(mockPrescriptionRepo)
        .mockReturnValueOnce(mockOrderRepo)
        .mockReturnValue(mockPrescriptionRepo);

      const result = await getDigitalTwinProfile('patient-123');

      expect(result).not.toBeNull();
      expect(result?.predictions.refill_due_dates.length).toBeGreaterThan(0);

      if (result && result.predictions.refill_due_dates.length > 0) {
        const refillPrediction = result.predictions.refill_due_dates[0];
        expect(refillPrediction).toHaveProperty('medication_name');
        expect(refillPrediction).toHaveProperty('predicted_refill_date');
        expect(refillPrediction).toHaveProperty('confidence');
        expect(refillPrediction).toHaveProperty('auto_refill_eligible');
      }
    });

    it('should handle database errors gracefully', async () => {
      const mockUserRepo = {
        findOne: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockUserRepo);

      const result = await getDigitalTwinProfile('patient-error');

      expect(result).toBeNull();
    });
  });

  describe('updateDigitalTwin', () => {
    it('should update profile on prescription event', async () => {
      const result = await updateDigitalTwin(
        'patient-123',
        'prescription',
        { prescription_id: 'rx-123' }
      );

      expect(result).toBe(true);
    });

    it('should update profile on purchase event', async () => {
      const result = await updateDigitalTwin(
        'patient-123',
        'purchase',
        { order_id: 'order-123' }
      );

      expect(result).toBe(true);
    });

    it('should update profile on allergy event', async () => {
      const result = await updateDigitalTwin(
        'patient-123',
        'allergy',
        { allergen: 'penicillin' }
      );

      expect(result).toBe(true);
    });

    it('should update profile on condition event', async () => {
      const result = await updateDigitalTwin(
        'patient-123',
        'condition',
        { condition: 'hypertension' }
      );

      expect(result).toBe(true);
    });
  });

  describe('Profile Completeness', () => {
    it('should calculate profile completeness percentage', async () => {
      const mockPatient = {
        id: 'patient-123',
        email: 'john@example.com',
        first_name_encrypted: 'John',
        last_name_encrypted: 'Doe',
        phone_encrypted: '555-1234',
        primary_pharmacy_id: 'pharmacy-1',
      };

      const mockUserRepo = {
        findOne: jest.fn().mockResolvedValue(mockPatient),
      };

      const mockPrescriptionRepo = {
        find: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findOne: jest.fn().mockResolvedValue(null),
      };

      const mockOrderRepo = {
        find: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findOne: jest.fn().mockResolvedValue(null),
      };

      (AppDataSource.getRepository as jest.Mock)
        .mockReturnValueOnce(mockUserRepo)
        .mockReturnValueOnce(mockPrescriptionRepo)
        .mockReturnValueOnce(mockOrderRepo)
        .mockReturnValueOnce(mockPrescriptionRepo)
        .mockReturnValueOnce(mockPrescriptionRepo)
        .mockReturnValueOnce(mockOrderRepo)
        .mockReturnValue(mockPrescriptionRepo);

      const result = await getDigitalTwinProfile('patient-123');

      expect(result).not.toBeNull();
      expect(result?.demographic.profile_completeness).toBeGreaterThan(0);
      expect(result?.demographic.profile_completeness).toBeLessThanOrEqual(100);
      // With all fields filled, should be 100%
      expect(result?.demographic.profile_completeness).toBe(100);
    });
  });
});
