/**
 * Birthday Bonus Entity
 * Tracks birthday bonuses for VIP program members
 * T6-023: Implement birthday bonus system for VIP program
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './User';

export enum BonusType {
  DISCOUNT = 'discount', // Percentage discount
  POINTS = 'points', // VIP points reward
  GIFT = 'gift', // Physical gift voucher
  FREE_DELIVERY = 'freeDelivery', // Free delivery coupon
}

@Entity('birthday_bonuses')
export class BirthdayBonus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // Relations
  // ============================================================================

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: User;

  @Column({ type: 'uuid' })
  @Index('idx_birthday_bonus_patient_id')
  patient_id: string;

  // ============================================================================
  // Bonus Details
  // ============================================================================

  @Column({ type: 'integer' })
  year: number; // Year the bonus is for (e.g., 2025, 2026)

  @Column({
    type: 'varchar',
    length: 20,
  })
  @Index('idx_birthday_bonus_type')
  bonusType: BonusType; // Type of bonus offered

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  bonusValue: number; // Value of bonus (e.g., 15 for 15% discount, 500 for 500 points, etc.)

  @Column({ type: 'varchar', length: 100 })
  bonusCode: string; // Unique code to redeem bonus

  // ============================================================================
  // Validity Period
  // ============================================================================

  @Column({ type: 'timestamp' })
  @Index('idx_birthday_bonus_valid_from')
  validFrom: Date; // Bonus becomes valid (typically birthday date)

  @Column({ type: 'timestamp' })
  @Index('idx_birthday_bonus_valid_until')
  validUntil: Date; // Bonus expires (typically 30-90 days after birthday)

  // ============================================================================
  // Redemption Tracking
  // ============================================================================

  @Column({ type: 'boolean', default: false })
  isRedeemed: boolean; // Whether the bonus has been used

  @Column({ type: 'timestamp', nullable: true })
  redeemedAt: Date | null; // When the bonus was redeemed

  @Column({ type: 'uuid', nullable: true })
  redeemedInOrderId: string | null; // Which order used this bonus

  // ============================================================================
  // Notification Tracking
  // ============================================================================

  @Column({ type: 'timestamp', nullable: true })
  notificationSentAt: Date | null; // When notification was sent to patient

  @Column({ type: 'varchar', length: 50, nullable: true })
  notificationChannel: string | null; // email, sms, push, in_app

  @Column({ type: 'text', nullable: true })
  notificationMessage: string | null; // Message sent to patient

  // ============================================================================
  // Description for UI/UX
  // ============================================================================

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null; // Human-readable description in French

  @Column({ type: 'varchar', length: 255, nullable: true })
  descriptionInFrench: string | null; // French description for UI

  // ============================================================================
  // Timestamps
  // ============================================================================

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // ============================================================================
  // Methods
  // ============================================================================

  /**
   * Check if bonus is still valid
   */
  isValid(): boolean {
    const now = new Date();
    return now >= this.validFrom && now <= this.validUntil && !this.isRedeemed;
  }

  /**
   * Get days remaining until expiration
   */
  getDaysRemaining(): number {
    const now = new Date();
    if (now > this.validUntil) {
      return 0;
    }
    const diff = this.validUntil.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Get bonus description based on type and value
   */
  getFormattedDescription(): string {
    switch (this.bonusType) {
      case BonusType.DISCOUNT:
        return `${this.bonusValue}% de réduction sur votre commande`;
      case BonusType.POINTS:
        return `${Math.round(this.bonusValue)} points VIP gratuits`;
      case BonusType.GIFT:
        return `Bon cadeau d'une valeur de CHF ${this.bonusValue}`;
      case BonusType.FREE_DELIVERY:
        return 'Livraison gratuite sur votre prochaine commande';
      default:
        return 'Bonus anniversaire spécial';
    }
  }

  /**
   * Get expiry status for UI
   */
  getExpiryStatus(): 'upcoming' | 'active' | 'expiring_soon' | 'expired' | 'redeemed' {
    const now = new Date();

    if (this.isRedeemed) {
      return 'redeemed';
    }

    if (now < this.validFrom) {
      return 'upcoming';
    }

    if (now > this.validUntil) {
      return 'expired';
    }

    const daysRemaining = this.getDaysRemaining();
    if (daysRemaining <= 7) {
      return 'expiring_soon';
    }

    return 'active';
  }
}
