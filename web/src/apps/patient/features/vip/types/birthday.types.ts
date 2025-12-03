/**
 * Birthday Bonus Types
 * Type definitions for birthday bonus feature
 * Task: T6-023
 */

export enum BonusType {
  DISCOUNT = 'discount',
  POINTS = 'points',
  GIFT = 'gift',
  FREE_DELIVERY = 'freeDelivery',
}

export enum BonusStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  EXPIRING_SOON = 'expiring_soon',
  EXPIRED = 'expired',
  REDEEMED = 'redeemed',
}

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
  status: BonusStatus;
}

export interface BirthdayBonusResponse {
  message: string;
  bonus: BirthdayBonusDto | null;
}

export interface RedeemBonusResponse {
  message: string;
  bonus: {
    id: string;
    bonusCode: string;
    bonusType: BonusType;
    bonusValue: number;
    isRedeemed: boolean;
    redeemedAt: Date | null;
  };
}

export interface ValidateBonusResponse {
  valid: boolean;
  message: string;
}
