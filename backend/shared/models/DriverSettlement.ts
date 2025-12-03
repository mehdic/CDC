/**
 * Driver Settlement Entity
 * Tracks daily driver COD collection settlements
 * Used for driver accountability and financial reconciliation
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

export enum SettlementStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  DISPUTED = 'disputed',
  RESOLVED = 'resolved',
}

@Entity('driver_settlements')
export class DriverSettlement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ============================================================================
  // Driver Relationship
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_driver_settlements_driver')
  driver_id!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'driver_id' })
  driver!: User;

  // ============================================================================
  // Settlement Period
  // ============================================================================

  @Column({ type: 'date' })
  @Index('idx_driver_settlements_date')
  settlement_date!: Date;

  // ============================================================================
  // Financial Summary
  // ============================================================================

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_expected!: number; // Sum of all COD transactions

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_collected!: number; // Sum of all collected amounts

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_settled!: number; // Amount actually handed over

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  variance!: number; // Difference (deficit or surplus)

  @Column({ type: 'int' })
  transaction_count!: number; // Number of COD transactions

  // ============================================================================
  // Breakdown by Payment Method
  // ============================================================================

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  cash_amount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  card_amount!: number;

  // ============================================================================
  // Settlement Status
  // ============================================================================

  @Column({
    type: 'enum',
    enum: SettlementStatus,
    default: SettlementStatus.PENDING,
  })
  @Index('idx_driver_settlements_status')
  status!: SettlementStatus;

  @Column({ type: 'text', nullable: true })
  driver_notes!: string | null; // Driver's explanation for variance

  @Column({ type: 'text', nullable: true })
  manager_notes!: string | null; // Manager's notes on approval/dispute

  // ============================================================================
  // Approval & Processing
  // ============================================================================

  @Column({ type: 'uuid', nullable: true })
  approved_by!: string | null; // Manager/admin who approved

  @Column({ type: 'timestamp', nullable: true })
  approved_at!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  resolved_by!: string | null; // User who resolved dispute

  @Column({ type: 'timestamp', nullable: true })
  resolved_at!: Date | null;

  // ============================================================================
  // Metadata
  // ============================================================================

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamp' })
  @Index('idx_driver_settlements_created')
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  // ============================================================================
  // Business Logic Methods
  // ============================================================================

  /**
   * Calculate variance
   */
  calculateVariance(): void {
    this.variance = this.total_settled - this.total_expected;
  }

  /**
   * Approve settlement
   */
  approve(approvedBy: string, managerNotes?: string): void {
    this.status = SettlementStatus.APPROVED;
    this.approved_by = approvedBy;
    this.approved_at = new Date();
    if (managerNotes) {
      this.manager_notes = managerNotes;
    }
  }

  /**
   * Dispute settlement
   */
  dispute(disputedBy: string, reason: string): void {
    this.status = SettlementStatus.DISPUTED;
    this.approved_by = disputedBy;
    this.manager_notes = reason;
    this.approved_at = new Date();
  }

  /**
   * Resolve dispute
   */
  resolve(resolvedBy: string, resolution: string): void {
    this.status = SettlementStatus.RESOLVED;
    this.resolved_by = resolvedBy;
    this.resolved_at = new Date();
    this.manager_notes = (this.manager_notes || '') + '\n\nResolution: ' + resolution;
  }

  /**
   * Check if has deficit
   */
  hasDeficit(): boolean {
    return this.variance < 0;
  }

  /**
   * Check if has surplus
   */
  hasSurplus(): boolean {
    return this.variance > 0;
  }

  /**
   * Check if variance exceeds threshold (business rule: CHF 50)
   */
  requiresManagerApproval(): boolean {
    const THRESHOLD = 50;
    return Math.abs(this.variance) > THRESHOLD;
  }

  /**
   * Get variance percentage
   */
  getVariancePercentage(): number {
    if (this.total_expected === 0) {
      return 0;
    }
    return (this.variance / this.total_expected) * 100;
  }

  /**
   * Check if pending
   */
  isPending(): boolean {
    return this.status === SettlementStatus.PENDING;
  }

  /**
   * Check if approved
   */
  isApproved(): boolean {
    return this.status === SettlementStatus.APPROVED;
  }

  /**
   * Check if disputed
   */
  isDisputed(): boolean {
    return this.status === SettlementStatus.DISPUTED;
  }

  /**
   * Get settlement summary for driver dashboard
   */
  getSummary(): {
    date: Date;
    transactions: number;
    expected: number;
    collected: number;
    variance: number;
    status: SettlementStatus;
  } {
    return {
      date: this.settlement_date,
      transactions: this.transaction_count,
      expected: this.total_expected,
      collected: this.total_settled,
      variance: this.variance,
      status: this.status,
    };
  }
}
