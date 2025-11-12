/**
 * Pharmacy Entity
 * Pharmacy locations serving as multi-tenant root entities
 * Based on: /specs/002-metapharm-platform/data-model.md
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './User';

export enum SubscriptionTier {
  BASIC = 'basic',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

export enum SubscriptionStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
}

export interface OperatingHours {
  monday?: { open: string | null; close: string | null };
  tuesday?: { open: string | null; close: string | null };
  wednesday?: { open: string | null; close: string | null };
  thursday?: { open: string | null; close: string | null };
  friday?: { open: string | null; close: string | null };
  saturday?: { open: string | null; close: string | null };
  sunday?: { open: string | null; close: string | null };
}

@Entity('pharmacies')
export class Pharmacy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // Identity
  // ============================================================================

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  license_number: string; // Swiss pharmacy license

  // ============================================================================
  // Location (encrypted for privacy)
  // ============================================================================

  @Column({ type: 'bytea' })
  address_encrypted: Buffer; // AWS KMS encrypted

  @Column({ type: 'varchar', length: 100 })
  city: string; // Plaintext for reporting

  @Column({ type: 'varchar', length: 50 })
  @Index('idx_pharmacies_canton')
  canton: string; // Swiss canton (VD, GE, ZH, etc.)

  @Column({ type: 'varchar', length: 10 })
  postal_code: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number | null; // For delivery routing

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number | null;

  // ============================================================================
  // Contact
  // ============================================================================

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  // ============================================================================
  // Operating Hours (JSON for flexibility)
  // ============================================================================

  @Column({ type: 'jsonb', nullable: true })
  operating_hours: OperatingHours | null;

  // ============================================================================
  // Subscription
  // ============================================================================

  @Column({
    type: 'enum',
    enum: SubscriptionTier,
    default: SubscriptionTier.BASIC,
  })
  subscription_tier: SubscriptionTier;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  @Index('idx_pharmacies_status')
  subscription_status: SubscriptionStatus;

  // ============================================================================
  // Relationships
  // ============================================================================

  @OneToMany(() => User, (user) => user.primary_pharmacy)
  users: User[];

  // TODO: Add relationships for Prescription, Teleconsultation, InventoryItem, etc. in later migrations

  // ============================================================================
  // Metadata
  // ============================================================================

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date | null; // Soft delete

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Check if pharmacy is soft deleted
   */
  isDeleted(): boolean {
    return this.deleted_at !== null;
  }

  /**
   * Check if pharmacy subscription is active
   */
  isActive(): boolean {
    return (
      this.subscription_status === SubscriptionStatus.ACTIVE && !this.isDeleted()
    );
  }

  /**
   * Check if pharmacy is in trial period
   */
  isTrial(): boolean {
    return this.subscription_status === SubscriptionStatus.TRIAL;
  }

  /**
   * Check if pharmacy has enterprise subscription
   */
  isEnterprise(): boolean {
    return this.subscription_tier === SubscriptionTier.ENTERPRISE;
  }

  /**
   * Check if pharmacy is open on a given day
   */
  isOpenOnDay(day: keyof OperatingHours): boolean {
    if (!this.operating_hours) return false;
    const hours = this.operating_hours[day];
    return hours !== undefined && hours.open !== null && hours.close !== null;
  }

  /**
   * Get operating hours for a specific day
   */
  getHoursForDay(day: keyof OperatingHours): { open: string; close: string } | null {
    if (!this.operating_hours) return null;
    const hours = this.operating_hours[day];
    if (!hours || hours.open === null || hours.close === null) return null;
    return { open: hours.open, close: hours.close };
  }

  /**
   * Check if pharmacy has GPS coordinates for delivery routing
   */
  hasLocation(): boolean {
    return this.latitude !== null && this.longitude !== null;
  }

  /**
   * Soft delete pharmacy
   */
  softDelete(): void {
    this.deleted_at = new Date();
    this.subscription_status = SubscriptionStatus.CANCELLED;
  }

  /**
   * Suspend pharmacy subscription
   */
  suspend(): void {
    this.subscription_status = SubscriptionStatus.SUSPENDED;
  }

  /**
   * Activate pharmacy subscription
   */
  activate(): void {
    this.subscription_status = SubscriptionStatus.ACTIVE;
  }
}
