/**
 * Pharmacy Account Entity (T6-009)
 * Comprehensive pharmacy account hierarchy supporting master/sub-account relationships
 * Implements multi-level hierarchy (up to 3 levels) with RBAC
 * Security-sensitive: Tenant isolation and permission boundaries
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Tree,
  TreeParent,
  TreeChildren,
} from 'typeorm';
import { Pharmacy } from './Pharmacy';
import { AccountRole } from './AccountRole';

export enum AccountType {
  MASTER = 'master',
  SUB = 'sub',
}

export enum AccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_TRANSFER = 'pending_transfer',
}

/**
 * PharmacyAccount entity implementing hierarchical multi-tenant structure
 * Supports:
 * - Master accounts (parent = null)
 * - Sub-accounts (parent = master or another sub-account)
 * - Up to 3 levels of nesting
 * - Data isolation with cross-account reporting for masters
 */
@Entity('pharmacy_accounts')
@Tree('closure-table')
export class PharmacyAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // Hierarchy Fields
  // ============================================================================

  @Column({
    type: 'varchar',
    length: 20,
  })
  @Index('idx_pharmacy_accounts_type')
  account_type: AccountType;

  @Column({
    type: 'int',
    default: 1,
  })
  @Index('idx_pharmacy_accounts_level')
  level: number; // 1 = master, 2 = first sub, 3 = nested sub (max)

  @Column({ type: 'varchar', length: 36, nullable: true })
  @Index('idx_pharmacy_accounts_parent')
  parent_id: string | null;

  @TreeParent()
  @ManyToOne(() => PharmacyAccount, (account) => account.children, {
    onDelete: 'RESTRICT', // Prevent deletion if children exist
    nullable: true,
  })
  @JoinColumn({ name: 'parent_id' })
  parent: PharmacyAccount | null;

  @TreeChildren()
  @OneToMany(() => PharmacyAccount, (account) => account.parent)
  children: PharmacyAccount[];

  // Root master account (for quick lookup)
  @Column({ type: 'varchar', length: 36, nullable: true })
  @Index('idx_pharmacy_accounts_root')
  root_master_id: string | null;

  @ManyToOne(() => PharmacyAccount, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'root_master_id' })
  root_master: PharmacyAccount | null;

  // ============================================================================
  // Account Identity
  // ============================================================================

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 36 })
  @Index('idx_pharmacy_accounts_pharmacy')
  pharmacy_id: string;

  @ManyToOne(() => Pharmacy, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pharmacy_id' })
  pharmacy: Pharmacy;

  // ============================================================================
  // Status
  // ============================================================================

  @Column({
    type: 'varchar',
    length: 20,
    default: AccountStatus.ACTIVE,
  })
  @Index('idx_pharmacy_accounts_status')
  status: AccountStatus;

  @Column({ type: 'text', nullable: true })
  suspension_reason: string | null;

  @Column({ type: 'timestamp', nullable: true })
  suspended_at: Date | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  suspended_by_user_id: string | null;

  // ============================================================================
  // Data Isolation & Sharing Configuration
  // ============================================================================

  /**
   * Data sharing mode:
   * - 'isolated': Complete isolation (default for sub-accounts)
   * - 'shared_products': Share product catalog from master
   * - 'shared_pricing': Share pricing from master
   * - 'full_shared': Share products, pricing, and customers (with master)
   */
  @Column({
    type: 'varchar',
    length: 50,
    default: 'isolated',
  })
  data_sharing_mode: 'isolated' | 'shared_products' | 'shared_pricing' | 'full_shared';

  /**
   * Cross-account reporting enabled for master
   * If true, master can view aggregated reports from sub-accounts
   */
  @Column({ type: 'boolean', default: false })
  cross_account_reporting_enabled: boolean;

  // ============================================================================
  // Roles & Permissions
  // ============================================================================

  @OneToMany(() => AccountRole, (role) => role.account)
  roles: AccountRole[];

  // ============================================================================
  // Transfer Management
  // ============================================================================

  @Column({ type: 'varchar', length: 36, nullable: true })
  pending_transfer_to_account_id: string | null;

  @Column({ type: 'timestamp', nullable: true })
  transfer_requested_at: Date | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  transfer_requested_by_user_id: string | null;

  // ============================================================================
  // Metadata
  // ============================================================================

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date | null; // Soft delete

  @Column({ type: 'varchar', length: 36, nullable: true })
  created_by_user_id: string | null;

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Check if account is a master account
   */
  isMaster(): boolean {
    return this.account_type === AccountType.MASTER && this.parent_id === null;
  }

  /**
   * Check if account is a sub-account
   */
  isSubAccount(): boolean {
    return this.account_type === AccountType.SUB && this.parent_id !== null;
  }

  /**
   * Check if account is active
   */
  isActive(): boolean {
    return this.status === AccountStatus.ACTIVE && this.deleted_at === null;
  }

  /**
   * Check if account can have children (max 3 levels)
   */
  canHaveChildren(): boolean {
    return this.level < 3;
  }

  /**
   * Check if account has pending transfer
   */
  hasPendingTransfer(): boolean {
    return (
      this.status === AccountStatus.PENDING_TRANSFER &&
      this.pending_transfer_to_account_id !== null
    );
  }

  /**
   * Suspend account
   */
  suspend(reason: string, suspendedByUserId: string): void {
    this.status = AccountStatus.SUSPENDED;
    this.suspension_reason = reason;
    this.suspended_at = new Date();
    this.suspended_by_user_id = suspendedByUserId;
  }

  /**
   * Reactivate suspended account
   */
  reactivate(): void {
    if (this.status === AccountStatus.SUSPENDED) {
      this.status = AccountStatus.ACTIVE;
      this.suspension_reason = null;
      this.suspended_at = null;
      this.suspended_by_user_id = null;
    }
  }

  /**
   * Soft delete account
   */
  softDelete(): void {
    this.deleted_at = new Date();
    this.status = AccountStatus.INACTIVE;
  }

  /**
   * Initiate transfer to another master account
   */
  initiateTransfer(targetAccountId: string, requestedByUserId: string): void {
    this.status = AccountStatus.PENDING_TRANSFER;
    this.pending_transfer_to_account_id = targetAccountId;
    this.transfer_requested_at = new Date();
    this.transfer_requested_by_user_id = requestedByUserId;
  }

  /**
   * Complete transfer
   */
  completeTransfer(newParentId: string, newRootMasterId: string, newLevel: number): void {
    this.parent_id = newParentId;
    this.root_master_id = newRootMasterId;
    this.level = newLevel;
    this.status = AccountStatus.ACTIVE;
    this.pending_transfer_to_account_id = null;
    this.transfer_requested_at = null;
    this.transfer_requested_by_user_id = null;
  }

  /**
   * Cancel transfer
   */
  cancelTransfer(): void {
    this.status = AccountStatus.ACTIVE;
    this.pending_transfer_to_account_id = null;
    this.transfer_requested_at = null;
    this.transfer_requested_by_user_id = null;
  }

  /**
   * Check if data sharing is enabled with master
   */
  hasDataSharingEnabled(): boolean {
    return this.data_sharing_mode !== 'isolated';
  }

  /**
   * Check if can access master's cross-account reports
   */
  canAccessCrossAccountReports(): boolean {
    return this.isMaster() && this.cross_account_reporting_enabled;
  }
}
