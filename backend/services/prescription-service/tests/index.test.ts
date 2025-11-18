/**
 * Prescription Service Unit Tests
 * Tests all endpoints and validation logic
 */

import request from 'supertest';
import { Prescription, PrescriptionStatus } from '../src/models/Prescription';
import { Medication } from '../src/models/Medication';
import { createMockPrescription, createMockMedication, generateTestId, clearTestData } from './test-setup';

// Mock database module BEFORE importing app
jest.mock('../src/config/database', () => ({
  initializeDatabase: jest.fn().mockResolvedValue({
    isInitialized: true,
    getRepository: jest.fn(),
  }),
  closeDatabase: jest.fn().mockResolvedValue(undefined),
  AppDataSource: {
    isInitialized: true,
    getRepository: jest.fn(),
  },
}));

// Mock repository class
class MockPrescriptionRepository {
  private prescriptions = new Map<string, Prescription>();

  async create(data: any): Promise<Prescription> {
    const prescriptionId = generateTestId();
    const now = new Date();

    const medications = data.medications.map((med: any) => {
      const medication = createMockMedication({
        ...med,
        prescriptionId,
      });
      return medication;
    });

    const prescription = createMockPrescription({
      id: prescriptionId,
      patientId: data.patientId,
      doctorId: data.doctorId,
      pharmacyId: data.pharmacyId,
      medications,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });

    this.prescriptions.set(prescriptionId, prescription);
    return prescription;
  }

  async findAll(): Promise<Prescription[]> {
    return Array.from(this.prescriptions.values());
  }

  async findById(id: string): Promise<Prescription | null> {
    return this.prescriptions.get(id) || null;
  }

  async updateStatus(id: string, status: PrescriptionStatus): Promise<Prescription | null> {
    const prescription = this.prescriptions.get(id);
    if (!prescription) {
      return null;
    }

    prescription.status = status;
    prescription.updatedAt = new Date();

    if (status === 'dispensed') {
      prescription.dispensedAt = new Date();
    }

    this.prescriptions.set(id, prescription);
    return prescription;
  }

  async delete(id: string): Promise<boolean> {
    return this.prescriptions.delete(id);
  }

  async clear(): Promise<void> {
    this.prescriptions.clear();
  }
}

// Create mock repository instance
const mockRepository = new MockPrescriptionRepository();

// Mock the PrescriptionRepository module
jest.mock('../src/repository/PrescriptionRepository', () => {
  return {
    PrescriptionRepository: jest.fn().mockImplementation(() => mockRepository),
  };
});

// Now import app after mocks are set up
import app from '../src/index';

// Import the index module to inject the repository
const indexModule = require('../src/index');
indexModule.prescriptionRepository = mockRepository;

describe('Prescription Service', () => {
  beforeEach(() => {
    mockRepository.clear();
    clearTestData();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'prescription-service');
      expect(response.body).toHaveProperty('database', 'connected');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version', '1.0.0');
    });
  });

  describe('POST /api/prescriptions', () => {
    it('should create a new prescription with valid data', async () => {
      const prescriptionData = {
        patientId: 'patient-123',
        doctorId: 'doctor-456',
        pharmacyId: 'pharmacy-789',
        medications: [
          {
            name: 'Amoxicillin',
            dosage: '500mg',
            quantity: 30,
            instructions: 'Take one capsule three times daily with food',
          },
        ],
      };

      const response = await request(app)
        .post('/api/prescriptions')
        .send(prescriptionData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Prescription created successfully');
      expect(response.body).toHaveProperty('prescription');
      expect(response.body.prescription).toMatchObject({
        id: expect.any(String),
        patientId: 'patient-123',
        doctorId: 'doctor-456',
        pharmacyId: 'pharmacy-789',
        status: 'pending',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
      expect(response.body.prescription.medications).toHaveLength(1);
      expect(response.body.prescription.medications[0]).toMatchObject({
        name: 'Amoxicillin',
        dosage: '500mg',
        quantity: 30,
        instructions: 'Take one capsule three times daily with food',
      });
    });

    it('should create a prescription with multiple medications', async () => {
      const prescriptionData = {
        patientId: 'patient-123',
        doctorId: 'doctor-456',
        pharmacyId: 'pharmacy-789',
        medications: [
          {
            name: 'Lisinopril',
            dosage: '10mg',
            quantity: 30,
            instructions: 'Take one tablet daily in the morning',
          },
          {
            name: 'Metformin',
            dosage: '500mg',
            quantity: 60,
            instructions: 'Take one tablet twice daily with meals',
          },
        ],
      };

      const response = await request(app)
        .post('/api/prescriptions')
        .send(prescriptionData);

      expect(response.status).toBe(201);
      expect(response.body.prescription.medications).toHaveLength(2);
    });

    it('should return 400 when missing required fields', async () => {
      const invalidData = {
        patientId: 'patient-123',
        // missing doctorId, pharmacyId, medications
      };

      const response = await request(app)
        .post('/api/prescriptions')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation Error');
      expect(response.body.message).toContain('Missing required fields');
    });

    it('should return 400 when medications array is empty', async () => {
      const invalidData = {
        patientId: 'patient-123',
        doctorId: 'doctor-456',
        pharmacyId: 'pharmacy-789',
        medications: [],
      };

      const response = await request(app)
        .post('/api/prescriptions')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation Error');
      expect(response.body.message).toContain('Invalid medications array');
    });

    it('should return 400 when medication has invalid quantity', async () => {
      const invalidData = {
        patientId: 'patient-123',
        doctorId: 'doctor-456',
        pharmacyId: 'pharmacy-789',
        medications: [
          {
            name: 'Amoxicillin',
            dosage: '500mg',
            quantity: -10,
            instructions: 'Take one capsule',
          },
        ],
      };

      const response = await request(app)
        .post('/api/prescriptions')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation Error');
    });
  });

  describe('GET /api/prescriptions', () => {
    it('should return empty array when no prescriptions exist', async () => {
      const response = await request(app).get('/api/prescriptions');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('count', 0);
      expect(response.body).toHaveProperty('prescriptions');
      expect(response.body.prescriptions).toEqual([]);
    });

    it('should return all prescriptions', async () => {
      // Create test prescriptions
      await mockRepository.create({
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        pharmacyId: 'pharmacy-1',
        medications: [
          {
            name: 'Med A',
            dosage: '10mg',
            quantity: 10,
            instructions: 'Test',
          },
        ],
      });

      await mockRepository.create({
        patientId: 'patient-2',
        doctorId: 'doctor-2',
        pharmacyId: 'pharmacy-2',
        medications: [
          {
            name: 'Med B',
            dosage: '20mg',
            quantity: 20,
            instructions: 'Test',
          },
        ],
      });

      const response = await request(app).get('/api/prescriptions');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('count', 2);
      expect(response.body.prescriptions).toHaveLength(2);
    });
  });

  describe('GET /api/prescriptions/:id', () => {
    it('should return prescription by ID', async () => {
      const created = await mockRepository.create({
        patientId: 'patient-123',
        doctorId: 'doctor-456',
        pharmacyId: 'pharmacy-789',
        medications: [
          {
            name: 'Amoxicillin',
            dosage: '500mg',
            quantity: 30,
            instructions: 'Take one capsule',
          },
        ],
      });

      const response = await request(app).get(`/api/prescriptions/${created.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('prescription');
      expect(response.body.prescription.id).toBe(created.id);
      expect(response.body.prescription.patientId).toBe('patient-123');
    });

    it('should return 404 when prescription not found', async () => {
      const response = await request(app).get('/api/prescriptions/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Not Found');
    });
  });

  describe('PATCH /api/prescriptions/:id/status', () => {
    it('should update prescription status from pending to dispensed', async () => {
      const created = await mockRepository.create({
        patientId: 'patient-123',
        doctorId: 'doctor-456',
        pharmacyId: 'pharmacy-789',
        medications: [
          {
            name: 'Amoxicillin',
            dosage: '500mg',
            quantity: 30,
            instructions: 'Take one capsule',
          },
        ],
      });

      const response = await request(app)
        .patch(`/api/prescriptions/${created.id}/status`)
        .send({ status: 'dispensed' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Prescription status updated successfully');
      expect(response.body.prescription.status).toBe('dispensed');
      expect(response.body.prescription).toHaveProperty('dispensedAt');
    });

    it('should update prescription status from pending to cancelled', async () => {
      const created = await mockRepository.create({
        patientId: 'patient-123',
        doctorId: 'doctor-456',
        pharmacyId: 'pharmacy-789',
        medications: [
          {
            name: 'Amoxicillin',
            dosage: '500mg',
            quantity: 30,
            instructions: 'Take one capsule',
          },
        ],
      });

      const response = await request(app)
        .patch(`/api/prescriptions/${created.id}/status`)
        .send({ status: 'cancelled' });

      expect(response.status).toBe(200);
      expect(response.body.prescription.status).toBe('cancelled');
    });

    it('should return 409 when trying to update dispensed prescription', async () => {
      const created = await mockRepository.create({
        patientId: 'patient-123',
        doctorId: 'doctor-456',
        pharmacyId: 'pharmacy-789',
        medications: [
          {
            name: 'Amoxicillin',
            dosage: '500mg',
            quantity: 30,
            instructions: 'Take one capsule',
          },
        ],
      });

      // First update to dispensed
      await mockRepository.updateStatus(created.id, 'dispensed');

      // Try to update again
      const response = await request(app)
        .patch(`/api/prescriptions/${created.id}/status`)
        .send({ status: 'cancelled' });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'Conflict');
    });

    it('should return 400 when status is missing', async () => {
      const created = await mockRepository.create({
        patientId: 'patient-123',
        doctorId: 'doctor-456',
        pharmacyId: 'pharmacy-789',
        medications: [
          {
            name: 'Amoxicillin',
            dosage: '500mg',
            quantity: 30,
            instructions: 'Take one capsule',
          },
        ],
      });

      const response = await request(app)
        .patch(`/api/prescriptions/${created.id}/status`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation Error');
    });

    it('should return 400 when status is invalid', async () => {
      const created = await mockRepository.create({
        patientId: 'patient-123',
        doctorId: 'doctor-456',
        pharmacyId: 'pharmacy-789',
        medications: [
          {
            name: 'Amoxicillin',
            dosage: '500mg',
            quantity: 30,
            instructions: 'Take one capsule',
          },
        ],
      });

      const response = await request(app)
        .patch(`/api/prescriptions/${created.id}/status`)
        .send({ status: 'invalid-status' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation Error');
    });

    it('should return 404 when prescription not found', async () => {
      const response = await request(app)
        .patch('/api/prescriptions/non-existent-id/status')
        .send({ status: 'dispensed' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Not Found');
    });
  });
});
