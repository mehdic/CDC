/**
 * Birthday Bonus Service Unit Tests
 * Tests for BirthdayBonusService core functionality
 * Task: T6-023
 */

import { BirthdayBonusService } from '../services/BirthdayBonusService';
import { BirthdayBonus, BonusType } from '../../../../shared/models/BirthdayBonus';
import { AppDataSource } from '../config/database';
import { User } from '../../../../shared/models/User';
import { VipMembership, VipTier } from '../../../../shared/models/VipMembership';
import { PointsTransaction, TransactionType } from '../../../../shared/models/PointsTransaction';

// ============================================================================
// Mock Setup
// ============================================================================

jest.mock('../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('BirthdayBonusService', () => {
  let service: BirthdayBonusService;
  let mockBirthdayBonusRepo: any;
  let mockVipMembershipRepo: any;
  let mockUserRepo: any;
  let mockPointsTransactionRepo: any;

  const testPatientId = '00000000-0000-0000-0000-000000000001';
  const testYear = new Date().getFullYear();

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup mock repositories
    mockBirthdayBonusRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockVipMembershipRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    mockUserRepo = {
      findOne: jest.fn(),
    };

    mockPointsTransactionRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };

    // Mock AppDataSource.getRepository
    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === BirthdayBonus) return mockBirthdayBonusRepo;
      if (entity === VipMembership) return mockVipMembershipRepo;
      if (entity === User) return mockUserRepo;
      if (entity === PointsTransaction) return mockPointsTransactionRepo;
      return null;
    });

    // Create service instance
    service = new BirthdayBonusService();
  });

  // ============================================================================
  // Test: generateBirthdayBonus
  // ============================================================================

  describe('generateBirthdayBonus', () => {
    it('should generate a birthday bonus for a valid patient', async () => {
      const mockPatient = {
        id: testPatientId,
        name: 'John Doe',
      } as User;

      mockUserRepo.findOne.mockResolvedValue(mockPatient);
      mockBirthdayBonusRepo.findOne.mockResolvedValue(null);

      const createdBonus = {
        id: '00000000-0000-0000-0000-000000000002',
        patient_id: testPatientId,
        bonusCode: `BDAY${testYear}ABC12345`,
        bonusType: BonusType.DISCOUNT,
        bonusValue: 15,
        year: testYear,
        isValid: jest.fn().mockReturnValue(true),
      } as any;

      mockBirthdayBonusRepo.create.mockReturnValue(createdBonus);
      mockBirthdayBonusRepo.save.mockResolvedValue(createdBonus);

      const result = await service.generateBirthdayBonus(testPatientId);

      expect(result).toBeDefined();
      expect(result.patient_id).toBe(testPatientId);
      expect(result.bonusType).toBe(BonusType.DISCOUNT);
      expect(result.bonusValue).toBe(15);
      expect(mockBirthdayBonusRepo.save).toHaveBeenCalled();
    });

    it('should return existing non-redeemed bonus instead of creating duplicate', async () => {
      const mockPatient = { id: testPatientId } as User;
      const existingBonus = {
        id: '00000000-0000-0000-0000-000000000002',
        patient_id: testPatientId,
        isRedeemed: false,
        year: testYear,
      } as any;

      mockUserRepo.findOne.mockResolvedValue(mockPatient);
      mockBirthdayBonusRepo.findOne.mockResolvedValue(existingBonus);

      const result = await service.generateBirthdayBonus(testPatientId);

      expect(result).toBe(existingBonus);
      expect(mockBirthdayBonusRepo.create).not.toHaveBeenCalled();
      expect(mockBirthdayBonusRepo.save).not.toHaveBeenCalled();
    });

    it('should throw error if patient not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.generateBirthdayBonus(testPatientId)).rejects.toThrow(
        'Patient not found'
      );
    });

    it('should support different bonus types', async () => {
      const mockPatient = { id: testPatientId } as User;

      mockUserRepo.findOne.mockResolvedValue(mockPatient);
      mockBirthdayBonusRepo.findOne.mockResolvedValue(null);

      const bonusTypes = [
        BonusType.DISCOUNT,
        BonusType.POINTS,
        BonusType.GIFT,
        BonusType.FREE_DELIVERY,
      ];

      for (const bonusType of bonusTypes) {
        mockBirthdayBonusRepo.create.mockReturnValue({ bonusType } as any);
        mockBirthdayBonusRepo.save.mockResolvedValue({ bonusType } as any);

        const result = await service.generateBirthdayBonus(
          testPatientId,
          bonusType,
          20
        );

        expect(result.bonusType).toBe(bonusType);
      }
    });
  });

  // ============================================================================
  // Test: getBirthdayBonus
  // ============================================================================

  describe('getBirthdayBonus', () => {
    it('should return current bonus for patient', async () => {
      const mockBonus = {
        id: '00000000-0000-0000-0000-000000000002',
        patient_id: testPatientId,
        bonusType: BonusType.DISCOUNT,
        bonusValue: 15,
        bonusCode: `BDAY${testYear}ABC12345`,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isRedeemed: false,
        redeemedAt: null,
        notificationSentAt: null,
        description: '15% de réduction',
        getDaysRemaining: () => 25,
        getExpiryStatus: () => 'active',
      } as any;

      mockBirthdayBonusRepo.findOne.mockResolvedValue(mockBonus);

      const result = await service.getBirthdayBonus(testPatientId);

      expect(result).toBeDefined();
      expect(result?.bonusCode).toBe(mockBonus.bonusCode);
      expect(mockBirthdayBonusRepo.findOne).toHaveBeenCalledWith({
        where: { patient_id: testPatientId },
        order: { created_at: 'DESC' },
      });
    });

    it('should return null if no bonus found', async () => {
      mockBirthdayBonusRepo.findOne.mockResolvedValue(null);

      const result = await service.getBirthdayBonus(testPatientId);

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // Test: getAllBirthdayBonuses
  // ============================================================================

  describe('getAllBirthdayBonuses', () => {
    it('should return all bonuses for patient', async () => {
      const mockBonuses = [
        {
          id: '00000000-0000-0000-0000-000000000002',
          patient_id: testPatientId,
          bonusType: BonusType.DISCOUNT,
          bonusValue: 15,
          bonusCode: `BDAY${testYear}ABC12345`,
          isRedeemed: false,
          redeemedAt: null,
          notificationSentAt: null,
          description: '15% de réduction',
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          getDaysRemaining: () => 25,
          getExpiryStatus: () => 'active',
          getFormattedDescription: () => '15% de réduction',
        },
        {
          id: '00000000-0000-0000-0000-000000000003',
          patient_id: testPatientId,
          bonusType: BonusType.POINTS,
          bonusValue: 500,
          bonusCode: `BDAY${testYear}XYZ67890`,
          isRedeemed: true,
          redeemedAt: new Date(),
          notificationSentAt: null,
          description: '500 points VIP',
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          getDaysRemaining: () => 0,
          getExpiryStatus: () => 'redeemed',
          getFormattedDescription: () => '500 points VIP',
        },
      ] as any;

      mockBirthdayBonusRepo.find.mockResolvedValue(mockBonuses);

      const result = await service.getAllBirthdayBonuses(testPatientId);

      expect(result).toHaveLength(2);
      expect(mockBirthdayBonusRepo.find).toHaveBeenCalledWith({
        where: { patient_id: testPatientId },
        order: { created_at: 'DESC' },
      });
    });
  });

  // ============================================================================
  // Test: redeemBonus
  // ============================================================================

  describe('redeemBonus', () => {
    it('should redeem bonus successfully', async () => {
      const bonusCode = `BDAY${testYear}ABC12345`;
      const mockBonus = {
        id: '00000000-0000-0000-0000-000000000002',
        patient_id: testPatientId,
        bonusCode,
        bonusType: BonusType.DISCOUNT,
        bonusValue: 15,
        isRedeemed: false,
        redeemedAt: null,
        description: '15% de réduction',
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isValid: jest.fn().mockReturnValue(true),
        getDaysRemaining: () => 25,
        getExpiryStatus: () => 'active',
        getFormattedDescription: () => '15% de réduction',
      } as any;

      mockBirthdayBonusRepo.findOne.mockResolvedValue(mockBonus);
      mockBirthdayBonusRepo.save.mockResolvedValue({
        ...mockBonus,
        isRedeemed: true,
        redeemedAt: new Date(),
        notificationSentAt: null,
      });

      const result = await service.redeemBonus(testPatientId, bonusCode);

      expect(result.isRedeemed).toBe(true);
      expect(mockBirthdayBonusRepo.save).toHaveBeenCalled();
    });

    it('should throw error if bonus not found', async () => {
      mockBirthdayBonusRepo.findOne.mockResolvedValue(null);

      await expect(
        service.redeemBonus(testPatientId, 'INVALID_CODE')
      ).rejects.toThrow('Birthday bonus not found');
    });

    it('should throw error if bonus is invalid or expired', async () => {
      const mockBonus = {
        id: '00000000-0000-0000-0000-000000000002',
        patient_id: testPatientId,
        bonusCode: 'BDAY2024ABC12345',
        isValid: jest.fn().mockReturnValue(false),
      } as any;

      mockBirthdayBonusRepo.findOne.mockResolvedValue(mockBonus);

      await expect(
        service.redeemBonus(testPatientId, 'BDAY2024ABC12345')
      ).rejects.toThrow('Birthday bonus has expired or already redeemed');
    });

    it('should create points transaction for points bonus type', async () => {
      const bonusCode = `BDAY${testYear}ABC12345`;
      const mockBonus = {
        id: '00000000-0000-0000-0000-000000000002',
        patient_id: testPatientId,
        bonusCode,
        bonusType: BonusType.POINTS,
        bonusValue: 500,
        isRedeemed: false,
        redeemedAt: null,
        description: '500 points VIP',
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isValid: jest.fn().mockReturnValue(true),
        getDaysRemaining: () => 25,
        getExpiryStatus: () => 'active',
        getFormattedDescription: () => '500 points VIP',
      } as any;

      const mockVipMembership = {
        id: '00000000-0000-0000-0000-000000000004',
        user_id: testPatientId,
        current_points: 1000,
        lifetime_points: 2000,
      } as any;

      mockBirthdayBonusRepo.findOne.mockResolvedValue(mockBonus);
      mockBirthdayBonusRepo.save.mockResolvedValue({
        ...mockBonus,
        isRedeemed: true,
        redeemedAt: new Date(),
        notificationSentAt: null,
      });
      mockVipMembershipRepo.findOne.mockResolvedValue(mockVipMembership);
      mockPointsTransactionRepo.create.mockReturnValue({} as any);
      mockPointsTransactionRepo.save.mockResolvedValue({} as any);
      mockVipMembershipRepo.save.mockResolvedValue({
        ...mockVipMembership,
        current_points: 1500,
      });

      const result = await service.redeemBonus(testPatientId, bonusCode);

      expect(result.isRedeemed).toBe(true);
      expect(mockPointsTransactionRepo.create).toHaveBeenCalled();
      expect(mockPointsTransactionRepo.save).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Test: validateBonusCode
  // ============================================================================

  describe('validateBonusCode', () => {
    it('should validate existing active bonus code', async () => {
      const bonusCode = `BDAY${testYear}ABC12345`;
      const mockBonus = {
        bonusCode,
        isValid: jest.fn().mockReturnValue(true),
      } as any;

      mockBirthdayBonusRepo.findOne.mockResolvedValue(mockBonus);

      const result = await service.validateBonusCode(testPatientId, bonusCode);

      expect(result).toBe(true);
    });

    it('should return false for invalid or expired bonus', async () => {
      const mockBonus = {
        bonusCode: `BDAY${testYear}ABC12345`,
        isValid: jest.fn().mockReturnValue(false),
      } as any;

      mockBirthdayBonusRepo.findOne.mockResolvedValue(mockBonus);

      const result = await service.validateBonusCode(testPatientId, 'BDAY2024ABC12345');

      expect(result).toBe(false);
    });

    it('should return false if bonus not found', async () => {
      mockBirthdayBonusRepo.findOne.mockResolvedValue(null);

      const result = await service.validateBonusCode(testPatientId, 'INVALID_CODE');

      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Test: sendBirthdayNotification
  // ============================================================================

  describe('sendBirthdayNotification', () => {
    it('should send notification and update bonus', async () => {
      const bonusId = '00000000-0000-0000-0000-000000000002';
      const mockBonus = {
        id: bonusId,
        patient: { email: 'patient@example.com' },
        notificationSentAt: null,
        notificationChannel: null,
        notificationMessage: null,
        bonusCode: `BDAY${testYear}ABC12345`,
        getFormattedDescription: () => '15% de réduction',
      } as any;

      mockBirthdayBonusRepo.findOne.mockResolvedValue(mockBonus);
      mockBirthdayBonusRepo.save.mockResolvedValue({
        ...mockBonus,
        notificationSentAt: new Date(),
        notificationChannel: 'email',
      });

      const result = await service.sendBirthdayNotification(bonusId, 'email');

      expect(result.notificationSentAt).toBeDefined();
      expect(result.notificationChannel).toBe('email');
      expect(mockBirthdayBonusRepo.save).toHaveBeenCalled();
    });

    it('should throw error if bonus not found', async () => {
      mockBirthdayBonusRepo.findOne.mockResolvedValue(null);

      await expect(
        service.sendBirthdayNotification('INVALID_ID')
      ).rejects.toThrow('Birthday bonus not found');
    });

    it('should support multiple notification channels', async () => {
      const bonusId = '00000000-0000-0000-0000-000000000002';
      const mockBonus = {
        id: bonusId,
        patient: {},
        notificationSentAt: null,
        getFormattedDescription: () => '15% de réduction',
      } as any;

      const channels: Array<'email' | 'sms' | 'push' | 'in_app'> = ['email', 'sms', 'push', 'in_app'];

      for (const channel of channels) {
        mockBirthdayBonusRepo.findOne.mockResolvedValue(mockBonus);
        mockBirthdayBonusRepo.save.mockResolvedValue({
          ...mockBonus,
          notificationChannel: channel,
        });

        const result = await service.sendBirthdayNotification(bonusId, channel);

        expect(result.notificationChannel).toBe(channel);
      }
    });
  });

  // ============================================================================
  // Test: checkUpcomingBirthdays
  // ============================================================================

  describe('checkUpcomingBirthdays', () => {
    it('should return empty array (pending implementation)', async () => {
      const result = await service.checkUpcomingBirthdays(7);

      expect(result).toEqual([]);
    });
  });
});
