/**
 * Birthday Bonus Service
 * Manages birthday bonus generation, tracking, and redemption for VIP members
 * T6-023: Implement birthday bonus system for VIP program
 */

import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../config/database';
import {
  BirthdayBonus,
  BonusType,
} from '../../../../shared/models/BirthdayBonus';
import { VipMembership } from '../../../../shared/models/VipMembership';
import { User } from '../../../../shared/models/User';
import { PointsTransaction, TransactionSource } from '../../../../shared/models/PointsTransaction';

export interface BirthdayBonusDto {
  id: string;
  bonusType: BonusType;
  bonusValue: number;
  bonusCode: string;
  validFrom: Date;
  validUntil: Date;
  isRedeemed: boolean;
  redeemedAt: Date | null;
  notificationSentAt: Date | null;
  description: string;
  daysRemaining: number;
  status: 'upcoming' | 'active' | 'expiring_soon' | 'expired' | 'redeemed';
}

export class BirthdayBonusService {
  private birthdayBonusRepo: Repository<BirthdayBonus>;
  private vipMembershipRepo: Repository<VipMembership>;
  private userRepo: Repository<User>;
  private pointsTransactionRepo: Repository<PointsTransaction>;

  constructor() {
    this.birthdayBonusRepo = AppDataSource.getRepository(BirthdayBonus);
    this.vipMembershipRepo = AppDataSource.getRepository(VipMembership);
    this.userRepo = AppDataSource.getRepository(User);
    this.pointsTransactionRepo = AppDataSource.getRepository(PointsTransaction);
  }

  /**
   * T6-023: Generate birthday bonus for a patient
   * Called on patient's birthday or manually for VIP members
   */
  async generateBirthdayBonus(
    patientId: string,
    bonusType: BonusType = BonusType.DISCOUNT,
    bonusValue: number = 15
  ): Promise<BirthdayBonus> {
    const patient = await this.userRepo.findOne({ where: { id: patientId } });

    if (!patient) {
      throw new Error('Patient not found');
    }

    // Check if bonus already exists for this year
    const currentYear = new Date().getFullYear();
    const existingBonus = await this.birthdayBonusRepo.findOne({
      where: {
        patient_id: patientId,
        year: currentYear,
      },
    });

    if (existingBonus && !existingBonus.isRedeemed) {
      // Return existing bonus instead of creating duplicate
      return existingBonus;
    }

    // Generate unique bonus code
    const bonusCode = this.generateBonusCode();

    // Calculate validity period (30-90 days from birthday)
    const today = new Date();
    const validFrom = new Date(today);
    validFrom.setHours(0, 0, 0, 0);

    const validUntil = new Date(validFrom);
    validUntil.setDate(validUntil.getDate() + 30); // 30 days validity

    // Determine description based on bonus type
    const description = this.getDefaultDescription(bonusType, bonusValue);

    const birthdayBonus = this.birthdayBonusRepo.create({
      patient_id: patientId,
      patient: patient,
      year: currentYear,
      bonusType,
      bonusValue,
      bonusCode,
      validFrom,
      validUntil,
      isRedeemed: false,
      redeemedAt: null,
      description,
      descriptionInFrench: description,
      notificationSentAt: null,
      notificationChannel: null,
      notificationMessage: null,
    });

    await this.birthdayBonusRepo.save(birthdayBonus);

    return birthdayBonus;
  }

  /**
   * T6-023: Get current active birthday bonus for patient
   */
  async getBirthdayBonus(patientId: string): Promise<BirthdayBonusDto | null> {
    const bonus = await this.birthdayBonusRepo.findOne({
      where: {
        patient_id: patientId,
      },
      order: {
        created_at: 'DESC',
      },
    });

    if (!bonus) {
      return null;
    }

    return this.mapToDto(bonus);
  }

  /**
   * T6-023: Get all birthday bonuses for patient (including redeemed)
   */
  async getAllBirthdayBonuses(patientId: string): Promise<BirthdayBonusDto[]> {
    const bonuses = await this.birthdayBonusRepo.find({
      where: {
        patient_id: patientId,
      },
      order: {
        created_at: 'DESC',
      },
    });

    return bonuses.map((bonus) => this.mapToDto(bonus));
  }

  /**
   * T6-023: Redeem birthday bonus
   * Applies bonus to order and creates corresponding transaction
   */
  async redeemBonus(
    patientId: string,
    bonusCode: string,
    orderId?: string
  ): Promise<BirthdayBonusDto> {
    const bonus = await this.birthdayBonusRepo.findOne({
      where: {
        patient_id: patientId,
        bonusCode,
      },
    });

    if (!bonus) {
      throw new Error('Birthday bonus not found');
    }

    if (!bonus.isValid()) {
      throw new Error('Birthday bonus has expired or already redeemed');
    }

    // Mark as redeemed
    bonus.isRedeemed = true;
    bonus.redeemedAt = new Date();
    bonus.redeemedInOrderId = orderId || null;

    await this.birthdayBonusRepo.save(bonus);

    // Create VIP points transaction if applicable
    if (bonus.bonusType === BonusType.POINTS) {
      const vipMembership = await this.vipMembershipRepo.findOne({
        where: { user_id: patientId },
      });

      if (vipMembership) {
        const pointsTransaction = this.pointsTransactionRepo.create({
          vip_membership_id: vipMembership.id,
          vip_membership: vipMembership,
          type: 'earned',
          source: TransactionSource.BIRTHDAY,
          amount: Math.round(bonus.bonusValue),
          description: `Birthday bonus - ${bonus.bonusCode}`,
          reference_id: bonus.id,
          order_id: orderId || null,
        });

        await this.pointsTransactionRepo.save(pointsTransaction);

        // Update VIP membership points
        vipMembership.current_points += Math.round(bonus.bonusValue);
        vipMembership.lifetime_points += Math.round(bonus.bonusValue);
        vipMembership.last_activity_at = new Date();

        await this.vipMembershipRepo.save(vipMembership);
      }
    }

    return this.mapToDto(bonus);
  }

  /**
   * T6-023: Check upcoming birthdays and generate bonuses
   * Designed to be called by cron job daily
   * Generates bonuses for patients whose birthday is today
   */
  async checkUpcomingBirthdays(daysAdvance: number = 7): Promise<BirthdayBonus[]> {
    // This is a simplified implementation
    // In production, you'd query users with birthday in next N days
    // For now, return empty array - to be implemented with actual birthday field on User

    console.log(
      `[BirthdayBonusService] Checking for birthdays in next ${daysAdvance} days`
    );

    // TODO: Implement full birthday check logic once User model has birthday field
    // SELECT * FROM users WHERE DATE_PART('month', birthday) = MONTH(NOW())
    //   AND DATE_PART('day', birthday) = DAY(NOW() + INTERVAL '7 days')

    return [];
  }

  /**
   * T6-023: Send birthday notification
   * Notifies patient about their birthday bonus
   */
  async sendBirthdayNotification(
    bonusId: string,
    channel: 'email' | 'sms' | 'push' | 'in_app' = 'email'
  ): Promise<BirthdayBonus> {
    const bonus = await this.birthdayBonusRepo.findOne({
      where: { id: bonusId },
      relations: ['patient'],
    });

    if (!bonus) {
      throw new Error('Birthday bonus not found');
    }

    const message = this.generateNotificationMessage(bonus);

    bonus.notificationSentAt = new Date();
    bonus.notificationChannel = channel;
    bonus.notificationMessage = message;

    await this.birthdayBonusRepo.save(bonus);

    // In production, integrate with notification service
    // await notificationService.send(bonus.patient.email, message, channel);

    console.log(
      `[BirthdayBonusService] Notification sent via ${channel} for bonus ${bonusId}`
    );

    return bonus;
  }

  /**
   * T6-023: Validate bonus code
   * Used during checkout to validate bonus before redemption
   */
  async validateBonusCode(patientId: string, bonusCode: string): Promise<boolean> {
    const bonus = await this.birthdayBonusRepo.findOne({
      where: {
        patient_id: patientId,
        bonusCode,
      },
    });

    if (!bonus) {
      return false;
    }

    return bonus.isValid();
  }

  /**
   * Get upcoming birthdays for a batch of patients
   * Returns patients whose birthdays are within specified days
   * NOTE: Requires User model to have birthday field
   */
  async getUpcomingBirthdayPatients(daysAdvance: number = 7): Promise<User[]> {
    // TODO: Implement when User model has birthday field
    // Current implementation returns empty array
    return [];
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Generate unique bonus code
   */
  private generateBonusCode(): string {
    const prefix = 'BDAY';
    const year = new Date().getFullYear();
    const randomSuffix = uuidv4().substring(0, 8).toUpperCase();
    return `${prefix}${year}${randomSuffix}`;
  }

  /**
   * Get default description based on bonus type and value
   */
  private getDefaultDescription(bonusType: BonusType, bonusValue: number): string {
    switch (bonusType) {
      case BonusType.DISCOUNT:
        return `${bonusValue}% de réduction - Bon anniversaire`;
      case BonusType.POINTS:
        return `${Math.round(bonusValue)} points VIP - Bon anniversaire`;
      case BonusType.GIFT:
        return `Bon cadeau CHF ${bonusValue} - Bon anniversaire`;
      case BonusType.FREE_DELIVERY:
        return 'Livraison gratuite - Bon anniversaire';
      default:
        return 'Bonus anniversaire spécial';
    }
  }

  /**
   * Generate notification message
   */
  private generateNotificationMessage(bonus: BirthdayBonus): string {
    return `Joyeux anniversaire! Vous avez reçu un bonus: ${bonus.getFormattedDescription()} Code: ${bonus.bonusCode}`;
  }

  /**
   * Map BirthdayBonus to DTO
   */
  private mapToDto(bonus: BirthdayBonus): BirthdayBonusDto {
    return {
      id: bonus.id,
      bonusType: bonus.bonusType,
      bonusValue: bonus.bonusValue,
      bonusCode: bonus.bonusCode,
      validFrom: bonus.validFrom,
      validUntil: bonus.validUntil,
      isRedeemed: bonus.isRedeemed,
      redeemedAt: bonus.redeemedAt,
      notificationSentAt: bonus.notificationSentAt,
      description: bonus.description || bonus.getFormattedDescription(),
      daysRemaining: bonus.getDaysRemaining(),
      status: bonus.getExpiryStatus(),
    };
  }
}
