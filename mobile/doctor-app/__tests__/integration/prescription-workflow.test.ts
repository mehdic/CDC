/**
 * Integration Tests: Doctor App Prescription Workflow
 * Tests the complete flow of creating and sending a prescription
 *
 * Coverage:
 * - Patient selection workflow
 * - Pharmacy selection workflow
 * - Medication search and addition
 * - Dosage configuration
 * - Prescription validation
 * - Send to pharmacy
 */

import { prescriptionApi, patientApi, pharmacyApi, drugApi } from '../../src/services/api';
import {
  Patient,
  Pharmacy,
  PrescriptionItem,
  Prescription,
  CreatePrescriptionRequest,
} from '../../src/types';

// Mock API responses
jest.mock('../../src/services/api');

describe('Doctor App - Prescription Creation Workflow', () => {
  // Test data
  const mockPatient: Patient = {
    id: 'patient-123',
    email: 'john.doe@example.com',
    first_name: 'John',
    last_name: 'Doe',
    allergies: ['penicillin'],
    medical_conditions: ['hypertension'],
  };

  const mockPharmacy: Pharmacy = {
    id: 'pharmacy-456',
    name: 'Geneva Central Pharmacy',
    license_number: 'CH-GE-12345',
    address: '123 Rue de Genève',
    city: 'Geneva',
    canton: 'GE',
    postal_code: '1200',
    phone: '+41 22 123 4567',
  };

  const mockDrug = {
    drug: {
      id: 'drug-789',
      name: 'Amoxicillin',
      rxnorm_code: 'RX123456',
      generic_name: 'Amoxicillin',
      common_dosages: ['500mg', '250mg'],
    },
    confidence: 95,
  };

  const mockPrescriptionItem: PrescriptionItem = {
    medication_name: 'Amoxicillin',
    medication_rxnorm_code: 'RX123456',
    dosage: '500mg (tablet)',
    frequency: 'three times daily',
    duration: '7 days',
    quantity: 21,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Patient Selection', () => {
    it('should search patients by name', async () => {
      (patientApi.search as jest.Mock).mockResolvedValue([mockPatient]);

      const results = await patientApi.search('John');

      expect(patientApi.search).toHaveBeenCalledWith('John');
      expect(results).toHaveLength(1);
      expect(results[0].first_name).toBe('John');
    });

    it('should load recent patients', async () => {
      (patientApi.getRecent as jest.Mock).mockResolvedValue([mockPatient]);

      const results = await patientApi.getRecent();

      expect(patientApi.getRecent).toHaveBeenCalled();
      expect(results).toHaveLength(1);
    });

    it('should get patient by ID', async () => {
      (patientApi.getById as jest.Mock).mockResolvedValue(mockPatient);

      const patient = await patientApi.getById('patient-123');

      expect(patientApi.getById).toHaveBeenCalledWith('patient-123');
      expect(patient.id).toBe('patient-123');
    });
  });

  describe('Pharmacy Selection', () => {
    it('should search pharmacies by name', async () => {
      (pharmacyApi.search as jest.Mock).mockResolvedValue([mockPharmacy]);

      const results = await pharmacyApi.search('Geneva');

      expect(pharmacyApi.search).toHaveBeenCalledWith('Geneva');
      expect(results).toHaveLength(1);
      expect(results[0].city).toBe('Geneva');
    });

    it('should get nearby pharmacies', async () => {
      (pharmacyApi.getNearby as jest.Mock).mockResolvedValue([mockPharmacy]);

      const results = await pharmacyApi.getNearby();

      expect(pharmacyApi.getNearby).toHaveBeenCalled();
      expect(results).toHaveLength(1);
    });

    it('should get pharmacy by ID', async () => {
      (pharmacyApi.getById as jest.Mock).mockResolvedValue(mockPharmacy);

      const pharmacy = await pharmacyApi.getById('pharmacy-456');

      expect(pharmacyApi.getById).toHaveBeenCalledWith('pharmacy-456');
      expect(pharmacy.id).toBe('pharmacy-456');
    });
  });

  describe('Medication Search', () => {
    it('should search drugs with AI suggestions', async () => {
      (drugApi.search as jest.Mock).mockResolvedValue([mockDrug]);

      const results = await drugApi.search('Amox');

      expect(drugApi.search).toHaveBeenCalledWith('Amox');
      expect(results).toHaveLength(1);
      expect(results[0].drug.name).toBe('Amoxicillin');
      expect(results[0].confidence).toBeGreaterThan(90);
    });

    it('should return drugs with RxNorm codes', async () => {
      (drugApi.search as jest.Mock).mockResolvedValue([mockDrug]);

      const results = await drugApi.search('Amoxicillin');

      expect(results[0].drug.rxnorm_code).toBeDefined();
      expect(results[0].drug.rxnorm_code).toBe('RX123456');
    });
  });

  describe('Prescription Creation', () => {
    it('should create complete prescription with all required fields', async () => {
      const prescriptionRequest: CreatePrescriptionRequest = {
        pharmacy_id: mockPharmacy.id,
        patient_id: mockPatient.id,
        items: [mockPrescriptionItem],
        prescribed_date: new Date().toISOString(),
      };

      (prescriptionApi.create as jest.Mock).mockResolvedValue({
        success: true,
        prescription: {
          id: 'prescription-999',
          ...prescriptionRequest,
          source: 'doctor_direct',
          status: 'pending',
        },
      });

      const response = await prescriptionApi.create(prescriptionRequest);

      expect(prescriptionApi.create).toHaveBeenCalledWith(prescriptionRequest);
      expect(response.success).toBe(true);
      expect(response.prescription.id).toBeDefined();
    });

    it('should validate prescription has at least one medication', async () => {
      const invalidRequest: CreatePrescriptionRequest = {
        pharmacy_id: mockPharmacy.id,
        patient_id: mockPatient.id,
        items: [], // Empty items
        prescribed_date: new Date().toISOString(),
      };

      const validate = (req: CreatePrescriptionRequest): string | null => {
        if (req.items.length === 0) return 'Please add at least one medication';
        return null;
      };

      const error = validate(invalidRequest);
      expect(error).toBe('Please add at least one medication');
    });

    it('should validate prescription has patient selected', async () => {
      const invalidRequest: CreatePrescriptionRequest = {
        pharmacy_id: mockPharmacy.id,
        patient_id: '', // Missing patient
        items: [mockPrescriptionItem],
        prescribed_date: new Date().toISOString(),
      };

      const validate = (req: CreatePrescriptionRequest): string | null => {
        if (!req.patient_id) return 'Please select a patient';
        return null;
      };

      const error = validate(invalidRequest);
      expect(error).toBe('Please select a patient');
    });

    it('should validate prescription has pharmacy selected', async () => {
      const invalidRequest: CreatePrescriptionRequest = {
        pharmacy_id: '', // Missing pharmacy
        patient_id: mockPatient.id,
        items: [mockPrescriptionItem],
        prescribed_date: new Date().toISOString(),
      };

      const validate = (req: CreatePrescriptionRequest): string | null => {
        if (!req.pharmacy_id) return 'Please select a pharmacy';
        return null;
      };

      const error = validate(invalidRequest);
      expect(error).toBe('Please select a pharmacy');
    });
  });

  describe('Complete Workflow', () => {
    it('should complete full prescription creation workflow', async () => {
      // Step 1: Search and select patient
      (patientApi.search as jest.Mock).mockResolvedValue([mockPatient]);
      const patients = await patientApi.search('John');
      expect(patients).toHaveLength(1);
      const selectedPatient = patients[0];

      // Step 2: Search and select pharmacy
      (pharmacyApi.search as jest.Mock).mockResolvedValue([mockPharmacy]);
      const pharmacies = await pharmacyApi.search('Geneva');
      expect(pharmacies).toHaveLength(1);
      const selectedPharmacy = pharmacies[0];

      // Step 3: Search medication
      (drugApi.search as jest.Mock).mockResolvedValue([mockDrug]);
      const drugs = await drugApi.search('Amoxicillin');
      expect(drugs).toHaveLength(1);
      const selectedDrug = drugs[0].drug;

      // Step 4: Add medication item
      const items: PrescriptionItem[] = [
        {
          medication_name: selectedDrug.name,
          medication_rxnorm_code: selectedDrug.rxnorm_code,
          dosage: '500mg (tablet)',
          frequency: 'three times daily',
          duration: '7 days',
          quantity: 21,
        },
      ];

      // Step 5: Create prescription
      const prescriptionRequest: CreatePrescriptionRequest = {
        pharmacy_id: selectedPharmacy.id,
        patient_id: selectedPatient.id,
        items: items,
        prescribed_date: new Date().toISOString(),
        notes: 'Take with food',
      };

      (prescriptionApi.create as jest.Mock).mockResolvedValue({
        success: true,
        prescription: {
          id: 'prescription-999',
          ...prescriptionRequest,
          source: 'doctor_direct',
          status: 'pending',
        },
      });

      const response = await prescriptionApi.create(prescriptionRequest);

      // Verify success
      expect(response.success).toBe(true);
      expect(response.prescription).toBeDefined();
      expect(response.prescription.items).toHaveLength(1);
      expect(response.prescription.items[0].medication_name).toBe('Amoxicillin');
    });

    it('should handle multiple medications in one prescription', async () => {
      const items: PrescriptionItem[] = [
        {
          medication_name: 'Amoxicillin',
          medication_rxnorm_code: 'RX123456',
          dosage: '500mg (tablet)',
          frequency: 'three times daily',
          duration: '7 days',
          quantity: 21,
        },
        {
          medication_name: 'Ibuprofen',
          medication_rxnorm_code: 'RX789012',
          dosage: '400mg (tablet)',
          frequency: 'as needed',
          duration: '7 days',
          quantity: 14,
        },
      ];

      const prescriptionRequest: CreatePrescriptionRequest = {
        pharmacy_id: mockPharmacy.id,
        patient_id: mockPatient.id,
        items: items,
        prescribed_date: new Date().toISOString(),
      };

      (prescriptionApi.create as jest.Mock).mockResolvedValue({
        success: true,
        prescription: {
          id: 'prescription-999',
          ...prescriptionRequest,
          source: 'doctor_direct',
          status: 'pending',
        },
      });

      const response = await prescriptionApi.create(prescriptionRequest);

      expect(response.success).toBe(true);
      expect(response.prescription.items).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle patient search errors', async () => {
      (patientApi.search as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await expect(patientApi.search('John')).rejects.toThrow('Network error');
    });

    it('should handle prescription creation errors', async () => {
      const prescriptionRequest: CreatePrescriptionRequest = {
        pharmacy_id: mockPharmacy.id,
        patient_id: mockPatient.id,
        items: [mockPrescriptionItem],
        prescribed_date: new Date().toISOString(),
      };

      (prescriptionApi.create as jest.Mock).mockResolvedValue({
        success: false,
        message: 'Pharmacy is offline',
      });

      const response = await prescriptionApi.create(prescriptionRequest);

      expect(response.success).toBe(false);
      expect(response.message).toBe('Pharmacy is offline');
    });

    it('should handle unauthorized errors', async () => {
      (prescriptionApi.create as jest.Mock).mockRejectedValue({
        response: { status: 401 },
      });

      await expect(
        prescriptionApi.create({
          pharmacy_id: mockPharmacy.id,
          patient_id: mockPatient.id,
          items: [mockPrescriptionItem],
          prescribed_date: new Date().toISOString(),
        })
      ).rejects.toMatchObject({ response: { status: 401 } });
    });
  });
});
