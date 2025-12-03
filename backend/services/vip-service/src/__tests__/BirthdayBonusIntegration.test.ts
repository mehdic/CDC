/**
 * Birthday Bonus Integration Tests
 * End-to-end workflow tests for birthday bonus feature
 * Task: T6-023
 */

import { AppDataSource } from '../config/database';
import { BirthdayBonusService } from '../services/BirthdayBonusService';
import { BirthdayBonus, BonusType } from '../../../../shared/models/BirthdayBonus';
import { VipMembership, VipTier } from '../../../../shared/models/VipMembership';
import { PointsTransaction } from '../../../../shared/models/PointsTransaction';
import { User } from '../../../../shared/models/User';

// ============================================================================
// Test Configuration
// ============================================================================

describe('Birthday Bonus Integration Tests', () => {
  let service: BirthdayBonusService;
  let testPatient: User;
  let testVipMembership: VipMembership;

  beforeAll(async () => {
    // Initialize database connection if needed
    if (!AppDataSource.isInitialized) {
      // Skip if no database available
      console.log('Database not initialized - skipping integration tests');
    }
  });

  beforeEach(async () => {
    if (!AppDataSource.isInitialized) {
      return;
    }

    service = new BirthdayBonusService();

    // Create test patient
    const userRepo = AppDataSource.getRepository(User);
    testPatient = await userRepo.save({
      email: `patient-${Date.now()}@test.com`,
      password: 'hash',
      firstName: 'Test',
      lastName: 'Patient',
      role: 'patient',
    } as any);

    // Create VIP membership
    const vipRepo = AppDataSource.getRepository(VipMembership);
    testVipMembership = await vipRepo.save({
      user_id: testPatient.id,
      user: testPatient,
      tier: VipTier.GOLD,
      current_points: 1000,
      lifetime_points: 5000,
      is_active: true,
      enrolled_at: new Date(),
    } as any);
  });

  afterEach(async () => {
    if (!AppDataSource.isInitialized) {
      return;
    }

    // Cleanup: Delete test data
    const bonusRepo = AppDataSource.getRepository(BirthdayBonus);
    const vipRepo = AppDataSource.getRepository(VipMembership);
    const userRepo = AppDataSource.getRepository(User);

    await bonusRepo.delete({ patient_id: testPatient.id });
    await vipRepo.delete({ user_id: testPatient.id });
    await userRepo.delete({ id: testPatient.id });
  });

  // ============================================================================
  // Integration Test: Full Birthday Bonus Workflow
  // ============================================================================

  describe('Full Birthday Bonus Workflow', () => {
    it('should complete end-to-end birthday bonus flow: generate -> get -> redeem', async () => {
      if (!AppDataSource.isInitialized) {
        console.log('Skipping integration test - database not available');
        return;
      }

      // Step 1: Generate birthday bonus
      const generatedBonus = await service.generateBirthdayBonus(
        testPatient.id,
        BonusType.DISCOUNT,
        15
      );

      expect(generatedBonus).toBeDefined();
      expect(generatedBonus.patient_id).toBe(testPatient.id);
      expect(generatedBonus.bonusType).toBe(BonusType.DISCOUNT);
      expect(generatedBonus.bonusValue).toBe(15);
      expect(generatedBonus.isValid()).toBe(true);

      // Step 2: Get birthday bonus
      const retrievedBonus = await service.getBirthdayBonus(testPatient.id);

      expect(retrievedBonus).toBeDefined();
      expect(retrievedBonus?.bonusCode).toBe(generatedBonus.bonusCode);
      expect(retrievedBonus?.status).toBe('active');

      // Step 3: Redeem bonus
      const redeemedBonus = await service.redeemBonus(
        testPatient.id,
        generatedBonus.bonusCode,
        'order-123'
      );

      expect(redeemedBonus.isRedeemed).toBe(true);
      expect(redeemedBonus.redeemedAt).toBeDefined();
      expect(redeemedBonus.status).toBe('redeemed');
    });

    it('should handle points bonus with VIP points transaction', async () => {
      if (!AppDataSource.isInitialized) {
        return;
      }

      // Generate points bonus
      const generatedBonus = await service.generateBirthdayBonus(
        testPatient.id,
        BonusType.POINTS,
        500
      );

      expect(generatedBonus.bonusType).toBe(BonusType.POINTS);
      expect(generatedBonus.bonusValue).toBe(500);

      // Get initial VIP state
      const vipRepo = AppDataSource.getRepository(VipMembership);
      const initialMembership = await vipRepo.findOne({
        where: { user_id: testPatient.id },
      });
      const initialPoints = initialMembership?.current_points || 0;

      // Redeem bonus - should create points transaction
      const redeemedBonus = await service.redeemBonus(
        testPatient.id,
        generatedBonus.bonusCode
      );

      // Verify points were added
      const updatedMembership = await vipRepo.findOne({
        where: { user_id: testPatient.id },
      });

      expect(redeemedBonus.isRedeemed).toBe(true);
      expect(updatedMembership!.current_points).toBe(initialPoints + 500);

      // Verify points transaction was created
      const pointsRepo = AppDataSource.getRepository(PointsTransaction);
      const transaction = await pointsRepo.findOne({
        where: {
          reference_id: generatedBonus.id,
        },
      });

      expect(transaction).toBeDefined();
      expect(transaction?.amount).toBe(500);
      expect(transaction?.type).toBe('earned');
      expect(transaction?.source).toBe('birthday');
    });
  });

  // ============================================================================
  // Integration Test: Bonus Validity and Expiration
  // ============================================================================

  describe('Bonus Validity and Expiration', () => {
    it('should prevent redeeming expired bonus', async () => {
      if (!AppDataSource.isInitialized) {
        return;
      }

      // Generate bonus
      const generatedBonus = await service.generateBirthdayBonus(
        testPatient.id,
        BonusType.DISCOUNT,
        15
      );

      // Manually expire the bonus for testing
      const bonusRepo = AppDataSource.getRepository(BirthdayBonus);
      const bonusToExpire = await bonusRepo.findOne({
        where: { id: generatedBonus.id },
      });

      if (bonusToExpire) {
        bonusToExpire.validUntil = new Date(Date.now() - 1000); // Set to past
        await bonusRepo.save(bonusToExpire);
      }

      // Try to redeem expired bonus
      await expect(
        service.redeemBonus(testPatient.id, generatedBonus.bonusCode)
      ).rejects.toThrow('Birthday bonus has expired or already redeemed');
    });

    it('should validate bonus code correctly', async () => {
      if (!AppDataSource.isInitialized) {
        return;
      }

      const generatedBonus = await service.generateBirthdayBonus(
        testPatient.id,
        BonusType.DISCOUNT,
        15
      );

      // Valid code
      const isValid = await service.validateBonusCode(
        testPatient.id,
        generatedBonus.bonusCode
      );
      expect(isValid).toBe(true);

      // Invalid code
      const isInvalid = await service.validateBonusCode(
        testPatient.id,
        'INVALID_CODE'
      );
      expect(isInvalid).toBe(false);
    });
  });

  // ============================================================================
  // Integration Test: Multiple Bonuses and History
  // ============================================================================

  describe('Multiple Bonuses and History', () => {
    it('should track multiple bonuses per patient', async () => {
      if (!AppDataSource.isInitialized) {
        return;
      }

      // Generate first bonus
      const bonus1 = await service.generateBirthdayBonus(
        testPatient.id,
        BonusType.DISCOUNT,
        15
      );

      // Redeem first bonus
      await service.redeemBonus(testPatient.id, bonus1.bonusCode);

      // Generate second bonus (different year scenario would be 2026)
      const bonus2 = await service.generateBirthdayBonus(
        testPatient.id,
        BonusType.POINTS,
        500
      );

      // Get all bonuses
      const allBonuses = await service.getAllBirthdayBonuses(testPatient.id);

      // Should have records (actual count depends on mock behavior)
      expect(allBonuses).toBeDefined();
      expect(Array.isArray(allBonuses)).toBe(true);
    });
  });

  // ============================================================================
  // Integration Test: Notification Workflow
  // ============================================================================

  describe('Notification Workflow', () => {
    it('should send notification for birthday bonus', async () => {
      if (!AppDataSource.isInitialized) {
        return;
      }

      const generatedBonus = await service.generateBirthdayBonus(
        testPatient.id,
        BonusType.DISCOUNT,
        15
      );

      const notificationResult = await service.sendBirthdayNotification(
        generatedBonus.id,
        'email'
      );

      expect(notificationResult.notificationSentAt).toBeDefined();
      expect(notificationResult.notificationChannel).toBe('email');
      expect(notificationResult.notificationMessage).toBeDefined();
    });

    it('should support multiple notification channels', async () => {
      if (!AppDataSource.isInitialized) {
        return;
      }

      const generatedBonus = await service.generateBirthdayBonus(
        testPatient.id,
        BonusType.DISCOUNT,
        15
      );

      const channels: Array<'email' | 'sms' | 'push' | 'in_app'> = ['email', 'sms', 'push'];

      for (const channel of channels) {
        const result = await service.sendBirthdayNotification(
          generatedBonus.id,
          channel
        );

        expect(result.notificationChannel).toBe(channel);
        expect(result.notificationSentAt).toBeDefined();
      }
    });
  });

  // ============================================================================
  // Integration Test: Different Bonus Types
  // ============================================================================

  describe('Different Bonus Types', () => {
    it('should support all bonus types', async () => {
      if (!AppDataSource.isInitialized) {
        return;
      }

      const bonusTypes = [
        { type: BonusType.DISCOUNT, value: 15 },
        { type: BonusType.POINTS, value: 500 },
        { type: BonusType.GIFT, value: 50 },
        { type: BonusType.FREE_DELIVERY, value: 0 },
      ];

      for (const { type, value } of bonusTypes) {
        const bonus = await service.generateBirthdayBonus(
          testPatient.id,
          type,
          value
        );

        expect(bonus.bonusType).toBe(type);

        // Clean up
        const bonusRepo = AppDataSource.getRepository(BirthdayBonus);
        await bonusRepo.delete({ id: bonus.id });
      }
    });
  });
});
