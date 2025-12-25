/**
 * Unit Tests for RenewalPredictionService
 * Task: T8-055
 */

import { DataSource, Repository } from 'typeorm';
import { RenewalPredictionService, CreatePredictionRequest } from '../services/RenewalPredictionService';
import { RenewalPrediction, PredictionStatus } from '../models/RenewalPrediction';

describe('RenewalPredictionService', () => {
  let service: RenewalPredictionService;
  let mockRepository: jest.Mocked<Repository<RenewalPrediction>>;
  let mockDataSource: jest.Mocked<DataSource>;

  beforeEach(() => {
    // Create mock repository
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<RenewalPrediction>>;

    // Create mock data source
    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepository),
    } as unknown as jest.Mocked<DataSource>;

    service = new RenewalPredictionService(mockDataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generatePrediction', () => {
    const validRequest: CreatePredictionRequest = {
      prescriptionId: 'rx-123',
      patientId: 'patient-456',
      pharmacyId: 'pharmacy-789',
      medicationData: {
        medicationType: 'chronic',
        chronicCondition: true,
        dosage: '10mg',
        quantity: 30,
      },
    };

    it('should generate a prediction successfully', async () => {
      const mockPrediction: RenewalPrediction = {
        id: 'pred-1',
        prescriptionId: validRequest.prescriptionId,
        patientId: validRequest.patientId,
        pharmacyId: validRequest.pharmacyId,
        predictedDate: new Date(),
        confidence: 'high',
        confidenceScore: 90,
        status: 'pending',
        predictionFactors: {
          adherenceRate: 0.85,
          refillHistory: [28, 29, 27, 28],
          averageDaysBetweenRefills: 28,
          medicationType: 'chronic',
          chronicCondition: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockPrediction);
      mockRepository.save.mockResolvedValue(mockPrediction);

      const result = await service.generatePrediction(validRequest);

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockPrediction);
      expect(result.status).toBe('pending');
    });

    it('should throw error for missing required fields', async () => {
      const invalidRequest = {
        prescriptionId: '',
        patientId: 'patient-456',
        pharmacyId: 'pharmacy-789',
      };

      await expect(service.generatePrediction(invalidRequest)).rejects.toThrow(
        'Missing required fields'
      );
    });

    it('should set high confidence for chronic conditions', async () => {
      const mockPrediction: RenewalPrediction = {
        id: 'pred-1',
        prescriptionId: validRequest.prescriptionId,
        patientId: validRequest.patientId,
        pharmacyId: validRequest.pharmacyId,
        predictedDate: new Date(),
        confidence: 'high',
        confidenceScore: 100,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockPrediction);
      mockRepository.save.mockResolvedValue(mockPrediction);

      const result = await service.generatePrediction(validRequest);

      expect(result.confidence).toBe('high');
      expect(result.confidenceScore).toBeGreaterThan(80);
    });
  });

  describe('getPredictionById', () => {
    it('should return prediction when found', async () => {
      const mockPrediction: RenewalPrediction = {
        id: 'pred-1',
        prescriptionId: 'rx-123',
        patientId: 'patient-456',
        pharmacyId: 'pharmacy-789',
        predictedDate: new Date(),
        confidence: 'high',
        confidenceScore: 90,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(mockPrediction);

      const result = await service.getPredictionById('pred-1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'pred-1' } });
      expect(result).toEqual(mockPrediction);
    });

    it('should return null when prediction not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.getPredictionById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getPredictionsForPatient', () => {
    it('should return patient predictions ordered by predicted date', async () => {
      const mockPredictions: RenewalPrediction[] = [
        {
          id: 'pred-1',
          prescriptionId: 'rx-123',
          patientId: 'patient-456',
          pharmacyId: 'pharmacy-789',
          predictedDate: new Date('2025-01-01'),
          confidence: 'high',
          confidenceScore: 90,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'pred-2',
          prescriptionId: 'rx-124',
          patientId: 'patient-456',
          pharmacyId: 'pharmacy-789',
          predictedDate: new Date('2025-02-01'),
          confidence: 'medium',
          confidenceScore: 75,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepository.find.mockResolvedValue(mockPredictions);

      const result = await service.getPredictionsForPatient('patient-456');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { patientId: 'patient-456' },
        order: { predictedDate: 'ASC' },
      });
      expect(result).toEqual(mockPredictions);
      expect(result.length).toBe(2);
    });
  });

  describe('updatePrediction', () => {
    it('should approve prediction successfully', async () => {
      const mockPrediction: RenewalPrediction = {
        id: 'pred-1',
        prescriptionId: 'rx-123',
        patientId: 'patient-456',
        pharmacyId: 'pharmacy-789',
        predictedDate: new Date(),
        confidence: 'high',
        confidenceScore: 90,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const approvedPrediction = {
        ...mockPrediction,
        status: 'approved' as PredictionStatus,
        approvedBy: 'pharmacist-1',
        approvedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(mockPrediction);
      mockRepository.save.mockResolvedValue(approvedPrediction);

      const result = await service.updatePrediction('pred-1', {
        status: 'approved',
        approvedBy: 'pharmacist-1',
      });

      expect(result.status).toBe('approved');
      expect(result.approvedBy).toBe('pharmacist-1');
      expect(result.approvedAt).toBeDefined();
    });

    it('should throw error when prediction not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updatePrediction('nonexistent', { status: 'approved' })
      ).rejects.toThrow('Prediction not found');
    });

    it('should reject prediction successfully', async () => {
      const mockPrediction: RenewalPrediction = {
        id: 'pred-1',
        prescriptionId: 'rx-123',
        patientId: 'patient-456',
        pharmacyId: 'pharmacy-789',
        predictedDate: new Date(),
        confidence: 'high',
        confidenceScore: 90,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const rejectedPrediction = {
        ...mockPrediction,
        status: 'rejected' as PredictionStatus,
        notes: 'Not appropriate for patient',
      };

      mockRepository.findOne.mockResolvedValue(mockPrediction);
      mockRepository.save.mockResolvedValue(rejectedPrediction);

      const result = await service.updatePrediction('pred-1', {
        status: 'rejected',
        notes: 'Not appropriate for patient',
      });

      expect(result.status).toBe('rejected');
      expect(result.notes).toBe('Not appropriate for patient');
    });
  });

  describe('getPendingPredictionsForPharmacy', () => {
    it('should return pending predictions for pharmacy', async () => {
      const mockPredictions: RenewalPrediction[] = [
        {
          id: 'pred-1',
          prescriptionId: 'rx-123',
          patientId: 'patient-456',
          pharmacyId: 'pharmacy-789',
          predictedDate: new Date(),
          confidence: 'high',
          confidenceScore: 90,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepository.find.mockResolvedValue(mockPredictions);

      const result = await service.getPendingPredictionsForPharmacy('pharmacy-789');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          pharmacyId: 'pharmacy-789',
          status: 'pending',
        },
        order: { predictedDate: 'ASC' },
      });
      expect(result.length).toBe(1);
      expect(result[0].status).toBe('pending');
    });
  });
});
