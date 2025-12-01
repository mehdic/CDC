/**
 * Refill Request Database Model
 * TypeORM entity for prescription refill request tracking
 * Tasks: T2-101, T2-102, T2-103, T2-104
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type RefillStatus =
  | 'pending'
  | 'approved'
  | 'denied'
  | 'expired'
  | 'filled';

export type RefillDecisionType = 'auto_approved' | 'manual_reviewed' | 'denied';

@Entity('refill_requests')
@Index(['patientId', 'prescriptionId'])
@Index(['prescriptionId', 'status'])
@Index(['pharmacyId', 'status'])
export class RefillRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  prescriptionId!: string;

  @Column({ type: 'varchar', length: 255 })
  patientId!: string;

  @Column({ type: 'varchar', length: 255 })
  pharmacyId!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  pharmacistId?: string;

  /**
   * Number of refills requested (typically 1, but can be multiple)
   */
  @Column({ type: 'integer', default: 1 })
  quantityRequested!: number;

  /**
   * Refill request status workflow
   */
  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'denied', 'expired', 'filled'],
    default: 'pending',
  })
  status!: RefillStatus;

  /**
   * Whether this was auto-approved or requires manual review
   */
  @Column({
    type: 'enum',
    enum: ['auto_approved', 'manual_reviewed', 'denied'],
    nullable: true,
  })
  decisionType?: RefillDecisionType;

  /**
   * Reason for denial (if applicable)
   */
  @Column({ type: 'text', nullable: true })
  denialReason?: string;

  /**
   * Comments from pharmacist during review
   */
  @Column({ type: 'text', nullable: true })
  pharmacistNotes?: string;

  /**
   * When the refill was approved
   */
  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  /**
   * When the refill was filled/dispensed
   */
  @Column({ type: 'timestamp', nullable: true })
  filledAt?: Date;

  /**
   * When the refill request expires (default 30 days from request)
   */
  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  /**
   * Refill eligibility check results (stored for audit trail)
   */
  @Column({ type: 'jsonb', nullable: true })
  eligibilityCheckResult?: {
    isEligible: boolean;
    remainingRefills: number;
    daysUntilNextRefill: number;
    controlledSubstance: boolean;
    requiresManualApproval: boolean;
    checkReason?: string;
  };

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
