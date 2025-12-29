/**
 * Account Role Entity (T6-009)
 * Role-Based Access Control (RBAC) for pharmacy account hierarchy
 * Supports role inheritance and permission overrides
 * Security-sensitive: Permission boundary enforcement
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
import { PharmacyAccount } from './PharmacyAccount';

export enum RoleType {
  MASTER_ADMIN = 'master_admin', // Full control over master and all sub-accounts
  SUB_ACCOUNT_MANAGER = 'sub_account_manager', // Manage specific sub-account
  STAFF = 'staff', // Limited access to specific sub-account
  READ_ONLY = 'read_only', // View-only access
}

/**
 * Permission categories aligned with MetaPharm Connect features
 */
export interface PermissionSet {
  // Account Management
  'accounts.create'?: boolean;
  'accounts.update'?: boolean;
  'accounts.delete'?: boolean;
  'accounts.view'?: boolean;
  'accounts.transfer'?: boolean;
  'accounts.suspend'?: boolean;

  // User Management
  'users.create'?: boolean;
  'users.update'?: boolean;
  'users.delete'?: boolean;
  'users.view'?: boolean;
  'users.assign_roles'?: boolean;

  // Prescription Management
  'prescriptions.create'?: boolean;
  'prescriptions.approve'?: boolean;
  'prescriptions.view'?: boolean;
  'prescriptions.delete'?: boolean;

  // Inventory Management
  'inventory.manage'?: boolean;
  'inventory.view'?: boolean;
  'inventory.scan_qr'?: boolean;
  'inventory.alerts'?: boolean;

  // Teleconsultation
  'teleconsult.conduct'?: boolean;
  'teleconsult.view'?: boolean;
  'teleconsult.schedule'?: boolean;

  // Delivery Management
  'deliveries.create'?: boolean;
  'deliveries.assign'?: boolean;
  'deliveries.track'?: boolean;
  'deliveries.view'?: boolean;

  // E-commerce/Orders
  'orders.create'?: boolean;
  'orders.fulfill'?: boolean;
  'orders.cancel'?: boolean;
  'orders.refund'?: boolean;
  'orders.view'?: boolean;

  // Analytics & Reporting
  'analytics.view'?: boolean;
  'analytics.export'?: boolean;
  'analytics.cross_account'?: boolean; // Master only

  // Marketing
  'marketing.campaigns'?: boolean;
  'marketing.loyalty'?: boolean;
  'marketing.view'?: boolean;

  // Settings
  'settings.pharmacy'?: boolean;
  'settings.integrations'?: boolean;
  'settings.billing'?: boolean;
  'settings.view'?: boolean;

  // Audit & Compliance
  'audit.view'?: boolean;
  'audit.export'?: boolean;
  'compliance.view'?: boolean;
}

/**
 * Default permission sets for each role type
 */
export const DEFAULT_PERMISSIONS: Record<RoleType, PermissionSet> = {
  [RoleType.MASTER_ADMIN]: {
    // Full permissions
    'accounts.create': true,
    'accounts.update': true,
    'accounts.delete': true,
    'accounts.view': true,
    'accounts.transfer': true,
    'accounts.suspend': true,
    'users.create': true,
    'users.update': true,
    'users.delete': true,
    'users.view': true,
    'users.assign_roles': true,
    'prescriptions.create': true,
    'prescriptions.approve': true,
    'prescriptions.view': true,
    'prescriptions.delete': true,
    'inventory.manage': true,
    'inventory.view': true,
    'inventory.scan_qr': true,
    'inventory.alerts': true,
    'teleconsult.conduct': true,
    'teleconsult.view': true,
    'teleconsult.schedule': true,
    'deliveries.create': true,
    'deliveries.assign': true,
    'deliveries.track': true,
    'deliveries.view': true,
    'orders.create': true,
    'orders.fulfill': true,
    'orders.cancel': true,
    'orders.refund': true,
    'orders.view': true,
    'analytics.view': true,
    'analytics.export': true,
    'analytics.cross_account': true,
    'marketing.campaigns': true,
    'marketing.loyalty': true,
    'marketing.view': true,
    'settings.pharmacy': true,
    'settings.integrations': true,
    'settings.billing': true,
    'settings.view': true,
    'audit.view': true,
    'audit.export': true,
    'compliance.view': true,
  },
  [RoleType.SUB_ACCOUNT_MANAGER]: {
    // Sub-account management (no cross-account, no master-level settings)
    'accounts.view': true,
    'users.create': true,
    'users.update': true,
    'users.view': true,
    'users.assign_roles': false, // Cannot change roles
    'prescriptions.create': true,
    'prescriptions.approve': true,
    'prescriptions.view': true,
    'inventory.manage': true,
    'inventory.view': true,
    'inventory.scan_qr': true,
    'inventory.alerts': true,
    'teleconsult.conduct': true,
    'teleconsult.view': true,
    'teleconsult.schedule': true,
    'deliveries.create': true,
    'deliveries.assign': true,
    'deliveries.track': true,
    'deliveries.view': true,
    'orders.create': true,
    'orders.fulfill': true,
    'orders.cancel': true,
    'orders.view': true,
    'analytics.view': true,
    'marketing.view': true,
    'settings.view': true,
    'audit.view': true,
    'compliance.view': true,
  },
  [RoleType.STAFF]: {
    // Limited staff access
    'prescriptions.view': true,
    'inventory.view': true,
    'inventory.scan_qr': true,
    'teleconsult.view': true,
    'deliveries.track': true,
    'deliveries.view': true,
    'orders.create': true,
    'orders.view': true,
    'settings.view': true,
  },
  [RoleType.READ_ONLY]: {
    // View-only access
    'accounts.view': true,
    'users.view': true,
    'prescriptions.view': true,
    'inventory.view': true,
    'teleconsult.view': true,
    'deliveries.view': true,
    'orders.view': true,
    'analytics.view': true,
    'marketing.view': true,
    'settings.view': true,
    'audit.view': true,
    'compliance.view': true,
  },
};

/**
 * AccountRole entity implementing fine-grained RBAC
 */
@Entity('account_roles')
export class AccountRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // Account Association
  // ============================================================================

  @Column({ type: 'varchar', length: 36 })
  @Index('idx_account_roles_account')
  account_id: string;

  @ManyToOne(() => PharmacyAccount, (account) => account.roles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'account_id' })
  account: PharmacyAccount;

  // ============================================================================
  // Role Definition
  // ============================================================================

  @Column({
    type: 'varchar',
    length: 100,
  })
  name: string; // Display name (e.g., "Pharmacy Manager", "Inventory Clerk")

  @Column({
    type: 'varchar',
    length: 50,
  })
  @Index('idx_account_roles_type')
  role_type: RoleType;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // ============================================================================
  // Permissions
  // ============================================================================

  /**
   * Permissions for this role (JSONB)
   * Merges with DEFAULT_PERMISSIONS[role_type]
   * Override specific permissions by setting true/false
   */
  @Column({ type: 'simple-json' })
  permissions: PermissionSet;

  /**
   * Inherits permissions from another role
   * Used for creating custom roles based on existing ones
   */
  @Column({ type: 'varchar', length: 36, nullable: true })
  inherits_from_role_id: string | null;

  @ManyToOne(() => AccountRole, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'inherits_from_role_id' })
  inherits_from: AccountRole | null;

  // ============================================================================
  // Status
  // ============================================================================

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_system_role: boolean; // System-defined roles cannot be deleted

  // ============================================================================
  // Metadata
  // ============================================================================

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @Column({ type: 'varchar', length: 36, nullable: true })
  created_by_user_id: string | null;

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Get effective permissions for this role
   * Merges default permissions with custom overrides and inherited permissions
   */
  getEffectivePermissions(): PermissionSet {
    // Start with default permissions for role type
    const defaultPerms = DEFAULT_PERMISSIONS[this.role_type] || {};

    // Merge with custom permissions (overrides)
    const effectivePerms = { ...defaultPerms, ...this.permissions };

    return effectivePerms;
  }

  /**
   * Check if role has a specific permission
   */
  hasPermission(permission: keyof PermissionSet): boolean {
    const effectivePerms = this.getEffectivePermissions();
    return effectivePerms[permission] === true;
  }

  /**
   * Check if role can manage accounts
   */
  canManageAccounts(): boolean {
    return (
      this.hasPermission('accounts.create') ||
      this.hasPermission('accounts.update') ||
      this.hasPermission('accounts.delete')
    );
  }

  /**
   * Check if role can manage users
   */
  canManageUsers(): boolean {
    return (
      this.hasPermission('users.create') ||
      this.hasPermission('users.update') ||
      this.hasPermission('users.delete')
    );
  }

  /**
   * Check if role can access cross-account analytics (master only)
   */
  canAccessCrossAccountAnalytics(): boolean {
    return this.hasPermission('analytics.cross_account');
  }

  /**
   * Check if role is master admin
   */
  isMasterAdmin(): boolean {
    return this.role_type === RoleType.MASTER_ADMIN;
  }

  /**
   * Deactivate role
   */
  deactivate(): void {
    this.is_active = false;
  }

  /**
   * Activate role
   */
  activate(): void {
    this.is_active = true;
  }
}
