/**
 * Refill History Database Model
 * TypeORM entity for tracking refill patterns and analytics
 * Tasks: T2-106
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type RefillAction = 'requested' | 'approved' | 'denied' | 'filled' | 'expired';

@Entity('refill_history')
@Index(['patientId', 'prescriptionId'])
@Index(['patientId', 'createdAt'])
@Index(['pharmacyId', 'createdAt'])
export class RefillHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Reference to the refill request
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  refillRequestId?: string;

  /**
   * Reference to the prescription
   */
  @Column({ type: 'varchar', length: 255 })
  prescriptionId!: string;

  /**
   * Patient ID
   */
  @Column({ type: 'varchar', length: 255 })
  patientId!: string;

  /**
   * Pharmacy ID
   */
  @Column({ type: 'varchar', length: 255 })
  pharmacyId!: string;

  /**
   * Pharmacist ID (if action taken by pharmacist)
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  pharmacistId?: string;

  /**
   * Type of action taken
   */
  @Column({
    type: 'enum',
    enum: ['requested', 'approved', 'denied', 'filled', 'expired'],
  })
  action!: RefillAction;

  /**
   * Quantity refilled
   */
  @Column({ type: 'integer', nullable: true })
  quantity?: number;

  /**
   * Details about the action
   */
  @Column({ type: 'jsonb', nullable: true })
  details?: {
    reason?: string;
    notes?: string;
    [key: string]: any;
  };

  /**
   * IP address of the user who initiated the action
   */
  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  /**
   * User agent for audit trail
   */
  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;
}
