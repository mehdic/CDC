/**
 * Unit Tests for RenewalSchedulerService
 * Task: T8-055
 */

import { DataSource, Repository } from 'typeorm';
import { RenewalSchedulerService, CreateReminderRequest } from '../services/RenewalSchedulerService';
import { RenewalReminder, ReminderStatus } from '../models/RenewalReminder';
import { RenewalPrediction } from '../models/RenewalPrediction';

describe('RenewalSchedulerService', () => {
  let service: RenewalSchedulerService;
  let mockReminderRepository: jest.Mocked<Repository<RenewalReminder>>;
  let mockPredictionRepository: jest.Mocked<Repository<RenewalPrediction>>;
  let mockDataSource: jest.Mocked<DataSource>;

  beforeEach(() => {
    // Create mock repositories
    mockReminderRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<RenewalReminder>>;

    mockPredictionRepository = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<RenewalPrediction>>;

    // Create mock data source
    mockDataSource = {
      getRepository: jest.fn((entity) => {
        if (entity === RenewalReminder) {
          return mockReminderRepository;
        }
        if (entity === RenewalPrediction) {
          return mockPredictionRepository;
        }
        throw new Error(`Unknown entity: ${entity}`);
      }),
    } as unknown as jest.Mocked<DataSource>;

    service = new RenewalSchedulerService(mockDataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createReminder', () => {
    const validRequest: CreateReminderRequest = {
      predictionId: 'pred-1',
      patientId: 'patient-456',
      scheduledFor: new Date('2025-01-15'),
      channel: 'email',
      message: 'Your prescription renewal is coming up',
    };

    it('should create reminder successfully', async () => {
      const mockPrediction: RenewalPrediction = {
        id: 'pred-1',
        prescriptionId: 'rx-123',
        patientId: 'patient-456',
        pharmacyId: 'pharmacy-789',
        predictedDate: new Date('2025-01-22'),
        confidence: 'high',
        confidenceScore: 90,
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockReminder: RenewalReminder = {
        id: 'reminder-1',
        predictionId: validRequest.predictionId,
        patientId: validRequest.patientId,
        scheduledFor: validRequest.scheduledFor,
        channel: validRequest.channel,
        message: validRequest.message,
        status: 'scheduled',
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPredictionRepository.findOne.mockResolvedValue(mockPrediction);
      mockReminderRepository.create.mockReturnValue(mockReminder);
      mockReminderRepository.save.mockResolvedValue(mockReminder);

      const result = await service.createReminder(validRequest);

      expect(mockPredictionRepository.findOne).toHaveBeenCalledWith({
        where: { id: validRequest.predictionId },
      });
      expect(mockReminderRepository.create).toHaveBeenCalled();
      expect(mockReminderRepository.save).toHaveBeenCalled();
      expect(result.status).toBe('scheduled');
      expect(result.retryCount).toBe(0);
    });

    it('should throw error for missing required fields', async () => {
      const invalidRequest = {
        predictionId: '',
        patientId: 'patient-456',
        scheduledFor: new Date(),
        channel: 'email' as const,
        message: 'Test',
      };

      await expect(service.createReminder(invalidRequest)).rejects.toThrow(
        'Missing required fields'
      );
    });

    it('should throw error when prediction not found', async () => {
      mockPredictionRepository.findOne.mockResolvedValue(null);

      await expect(service.createReminder(validRequest)).rejects.toThrow(
        'Prediction not found'
      );
    });
  });

  describe('scheduleRemindersForPrediction', () => {
    it('should schedule multiple reminders for approved prediction', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const mockPrediction: RenewalPrediction = {
        id: 'pred-1',
        prescriptionId: 'rx-123',
        patientId: 'patient-456',
        pharmacyId: 'pharmacy-789',
        predictedDate: futureDate,
        confidence: 'high',
        confidenceScore: 90,
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockReminder: RenewalReminder = {
        id: 'reminder-1',
        predictionId: 'pred-1',
        patientId: 'patient-456',
        scheduledFor: new Date(),
        channel: 'email',
        message: 'Reminder',
        status: 'scheduled',
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPredictionRepository.findOne.mockResolvedValue(mockPrediction);
      mockReminderRepository.create.mockReturnValue(mockReminder);
      mockReminderRepository.save.mockResolvedValue(mockReminder);

      const result = await service.scheduleRemindersForPrediction('pred-1');

      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(3); // Max 3 reminders (7 days, 3 days, 0 days)
    });

    it('should throw error for non-approved prediction', async () => {
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

      mockPredictionRepository.findOne.mockResolvedValue(mockPrediction);

      await expect(service.scheduleRemindersForPrediction('pred-1')).rejects.toThrow(
        'must be approved'
      );
    });
  });

  describe('sendReminder', () => {
    it('should send reminder successfully', async () => {
      const mockReminder: RenewalReminder = {
        id: 'reminder-1',
        predictionId: 'pred-1',
        patientId: 'patient-456',
        scheduledFor: new Date(),
        channel: 'email',
        message: 'Test reminder',
        status: 'scheduled',
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const sentReminder = {
        ...mockReminder,
        status: 'sent' as ReminderStatus,
        sentAt: new Date(),
      };

      mockReminderRepository.findOne.mockResolvedValue(mockReminder);
      mockReminderRepository.save.mockResolvedValue(sentReminder);

      const result = await service.sendReminder({ reminderId: 'reminder-1' });

      expect(result.success).toBe(true);
      expect(mockReminderRepository.save).toHaveBeenCalled();
    });

    it('should throw error when reminder already sent', async () => {
      const mockReminder: RenewalReminder = {
        id: 'reminder-1',
        predictionId: 'pred-1',
        patientId: 'patient-456',
        scheduledFor: new Date(),
        channel: 'email',
        message: 'Test reminder',
        status: 'sent',
        sentAt: new Date(),
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockReminderRepository.findOne.mockResolvedValue(mockReminder);

      await expect(service.sendReminder({ reminderId: 'reminder-1' })).rejects.toThrow(
        'already sent'
      );
    });

    it('should throw error when reminder not found', async () => {
      mockReminderRepository.findOne.mockResolvedValue(null);

      await expect(service.sendReminder({ reminderId: 'nonexistent' })).rejects.toThrow(
        'Reminder not found'
      );
    });
  });

  describe('getRemindersForPatient', () => {
    it('should return patient reminders ordered by scheduled date', async () => {
      const mockReminders: RenewalReminder[] = [
        {
          id: 'reminder-1',
          predictionId: 'pred-1',
          patientId: 'patient-456',
          scheduledFor: new Date('2025-01-15'),
          channel: 'email',
          message: 'Reminder 1',
          status: 'sent',
          sentAt: new Date(),
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'reminder-2',
          predictionId: 'pred-1',
          patientId: 'patient-456',
          scheduledFor: new Date('2025-01-18'),
          channel: 'sms',
          message: 'Reminder 2',
          status: 'scheduled',
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockReminderRepository.find.mockResolvedValue(mockReminders);

      const result = await service.getRemindersForPatient('patient-456');

      expect(mockReminderRepository.find).toHaveBeenCalledWith({
        where: { patientId: 'patient-456' },
        order: { scheduledFor: 'DESC' },
      });
      expect(result.length).toBe(2);
    });
  });

  describe('cancelReminder', () => {
    it('should cancel scheduled reminder', async () => {
      const mockReminder: RenewalReminder = {
        id: 'reminder-1',
        predictionId: 'pred-1',
        patientId: 'patient-456',
        scheduledFor: new Date(),
        channel: 'email',
        message: 'Test reminder',
        status: 'scheduled',
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const cancelledReminder = {
        ...mockReminder,
        status: 'cancelled' as ReminderStatus,
      };

      mockReminderRepository.findOne.mockResolvedValue(mockReminder);
      mockReminderRepository.save.mockResolvedValue(cancelledReminder);

      const result = await service.cancelReminder('reminder-1');

      expect(result.status).toBe('cancelled');
    });

    it('should throw error when cancelling sent reminder', async () => {
      const mockReminder: RenewalReminder = {
        id: 'reminder-1',
        predictionId: 'pred-1',
        patientId: 'patient-456',
        scheduledFor: new Date(),
        channel: 'email',
        message: 'Test reminder',
        status: 'sent',
        sentAt: new Date(),
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockReminderRepository.findOne.mockResolvedValue(mockReminder);

      await expect(service.cancelReminder('reminder-1')).rejects.toThrow(
        'Cannot cancel sent reminder'
      );
    });
  });
});
