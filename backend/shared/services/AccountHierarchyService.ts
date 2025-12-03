/**
 * Account Hierarchy Service (T6-009)
 * Business logic for pharmacy account hierarchy management
 * Features: CRUD operations, hierarchy validation, RBAC enforcement
 * Security: Tenant isolation, permission boundaries, audit logging
 */

import { DataSource, Repository } from 'typeorm';
import { PharmacyAccount, AccountType, AccountStatus } from '../models/PharmacyAccount';
import { AccountRole, RoleType, DEFAULT_PERMISSIONS } from '../models/AccountRole';

export interface CreateMasterAccountInput {
  name: string;
  pharmacy_id: string;
  created_by_user_id: string;
  data_sharing_mode?: 'isolated' | 'shared_products' | 'shared_pricing' | 'full_shared';
  cross_account_reporting_enabled?: boolean;
}

export interface CreateSubAccountInput {
  name: string;
  pharmacy_id: string;
  parent_id: string;
  created_by_user_id: string;
  data_sharing_mode?: 'isolated' | 'shared_products' | 'shared_pricing' | 'full_shared';
}

export interface UpdateAccountInput {
  name?: string;
  status?: AccountStatus;
  data_sharing_mode?: 'isolated' | 'shared_products' | 'shared_pricing' | 'full_shared';
  cross_account_reporting_enabled?: boolean;
}

export interface TransferAccountInput {
  account_id: string;
  target_parent_id: string;
  requested_by_user_id: string;
}

export class AccountHierarchyService {
  private accountRepo: Repository<PharmacyAccount>;
  private roleRepo: Repository<AccountRole>;
  private dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.accountRepo = dataSource.getRepository(PharmacyAccount);
    this.roleRepo = dataSource.getRepository(AccountRole);
  }

  // ============================================================================
  // Account Creation
  // ============================================================================

  /**
   * Create a master pharmacy account
   */
  async createMasterAccount(input: CreateMasterAccountInput): Promise<PharmacyAccount> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create master account
      const masterAccount = this.accountRepo.create({
        account_type: AccountType.MASTER,
        level: 1,
        parent_id: null,
        root_master_id: null, // Will be set to self by trigger
        name: input.name,
        pharmacy_id: input.pharmacy_id,
        status: AccountStatus.ACTIVE,
        data_sharing_mode: input.data_sharing_mode || 'isolated',
        cross_account_reporting_enabled: input.cross_account_reporting_enabled || false,
        created_by_user_id: input.created_by_user_id,
      });

      const savedAccount = await queryRunner.manager.save(masterAccount);

      // Create default system roles for the master account
      await this.createSystemRoles(savedAccount.id, queryRunner);

      // Log audit trail
      await this.logAudit({
        account_id: savedAccount.id,
        user_id: input.created_by_user_id,
        action: 'account.created',
        resource_type: 'account',
        resource_id: savedAccount.id,
        details: { account_type: 'master', name: input.name },
      }, queryRunner);

      await queryRunner.commitTransaction();

      return savedAccount;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Create a sub-account under a parent account
   */
  async createSubAccount(input: CreateSubAccountInput): Promise<PharmacyAccount> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate parent account
      const parent = await this.accountRepo.findOne({
        where: { id: input.parent_id },
      });

      if (!parent) {
        throw new Error(`Parent account ${input.parent_id} not found`);
      }

      if (!parent.canHaveChildren()) {
        throw new Error(`Parent account at level ${parent.level} cannot have children (max 3 levels)`);
      }

      if (!parent.isActive()) {
        throw new Error(`Parent account ${input.parent_id} is not active`);
      }

      // Create sub-account
      const subAccount = this.accountRepo.create({
        account_type: AccountType.SUB,
        level: parent.level + 1,
        parent_id: input.parent_id,
        root_master_id: parent.root_master_id || parent.id,
        name: input.name,
        pharmacy_id: input.pharmacy_id,
        status: AccountStatus.ACTIVE,
        data_sharing_mode: input.data_sharing_mode || 'isolated',
        cross_account_reporting_enabled: false, // Only master can have this
        created_by_user_id: input.created_by_user_id,
      });

      const savedAccount = await queryRunner.manager.save(subAccount);

      // Create default system roles for the sub-account
      await this.createSystemRoles(savedAccount.id, queryRunner);

      // Log audit trail
      await this.logAudit({
        account_id: savedAccount.id,
        user_id: input.created_by_user_id,
        action: 'account.created',
        resource_type: 'account',
        resource_id: savedAccount.id,
        details: { account_type: 'sub', parent_id: input.parent_id, name: input.name },
      }, queryRunner);

      await queryRunner.commitTransaction();

      return savedAccount;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Create system roles for a new account
   */
  private async createSystemRoles(accountId: string, queryRunner: any): Promise<void> {
    const systemRoles = [
      {
        account_id: accountId,
        name: 'Master Administrator',
        role_type: RoleType.MASTER_ADMIN,
        description: 'Full administrative access to account and sub-accounts',
        permissions: DEFAULT_PERMISSIONS[RoleType.MASTER_ADMIN],
        is_system_role: true,
        is_active: true,
      },
      {
        account_id: accountId,
        name: 'Account Manager',
        role_type: RoleType.SUB_ACCOUNT_MANAGER,
        description: 'Manage account operations without administrative privileges',
        permissions: DEFAULT_PERMISSIONS[RoleType.SUB_ACCOUNT_MANAGER],
        is_system_role: true,
        is_active: true,
      },
      {
        account_id: accountId,
        name: 'Staff',
        role_type: RoleType.STAFF,
        description: 'Standard staff access to account',
        permissions: DEFAULT_PERMISSIONS[RoleType.STAFF],
        is_system_role: true,
        is_active: true,
      },
      {
        account_id: accountId,
        name: 'Read-Only',
        role_type: RoleType.READ_ONLY,
        description: 'View-only access to account',
        permissions: DEFAULT_PERMISSIONS[RoleType.READ_ONLY],
        is_system_role: true,
        is_active: true,
      },
    ];

    for (const roleData of systemRoles) {
      const role = this.roleRepo.create(roleData);
      await queryRunner.manager.save(role);
    }
  }

  // ============================================================================
  // Account Retrieval
  // ============================================================================

  /**
   * Get account by ID
   */
  async getAccount(accountId: string): Promise<PharmacyAccount | null> {
    return this.accountRepo.findOne({
      where: { id: accountId, deleted_at: null },
      relations: ['parent', 'children', 'pharmacy', 'roles'],
    });
  }

  /**
   * Get all sub-accounts under a parent
   */
  async getSubAccounts(parentId: string): Promise<PharmacyAccount[]> {
    return this.accountRepo.find({
      where: { parent_id: parentId, deleted_at: null },
      relations: ['pharmacy'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Get entire hierarchy tree for a master account
   */
  async getAccountHierarchy(masterAccountId: string): Promise<PharmacyAccount> {
    const master = await this.accountRepo.findOne({
      where: { id: masterAccountId, deleted_at: null },
      relations: ['pharmacy'],
    });

    if (!master || !master.isMaster()) {
      throw new Error(`Master account ${masterAccountId} not found`);
    }

    // Use TypeORM tree repository to get full hierarchy
    const treeRepo = this.dataSource.getTreeRepository(PharmacyAccount);
    const tree = await treeRepo.findDescendantsTree(master);

    return tree;
  }

  /**
   * Get all ancestor accounts (up to root master)
   */
  async getAncestors(accountId: string): Promise<PharmacyAccount[]> {
    const account = await this.accountRepo.findOne({
      where: { id: accountId },
    });

    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    const treeRepo = this.dataSource.getTreeRepository(PharmacyAccount);
    const ancestors = await treeRepo.findAncestors(account);

    return ancestors;
  }

  // ============================================================================
  // Account Updates
  // ============================================================================

  /**
   * Update account details
   */
  async updateAccount(accountId: string, input: UpdateAccountInput, userId: string): Promise<PharmacyAccount> {
    const account = await this.accountRepo.findOne({
      where: { id: accountId, deleted_at: null },
    });

    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    const oldValues = { ...account };

    // Update fields
    if (input.name !== undefined) account.name = input.name;
    if (input.status !== undefined) account.status = input.status;
    if (input.data_sharing_mode !== undefined) account.data_sharing_mode = input.data_sharing_mode;
    if (input.cross_account_reporting_enabled !== undefined) {
      if (!account.isMaster()) {
        throw new Error('Only master accounts can have cross-account reporting');
      }
      account.cross_account_reporting_enabled = input.cross_account_reporting_enabled;
    }

    const updated = await this.accountRepo.save(account);

    // Log audit trail
    await this.logAudit({
      account_id: accountId,
      user_id: userId,
      action: 'account.updated',
      resource_type: 'account',
      resource_id: accountId,
      details: { old_values: oldValues, new_values: input },
    });

    return updated;
  }

  /**
   * Suspend account
   */
  async suspendAccount(accountId: string, reason: string, userId: string): Promise<PharmacyAccount> {
    const account = await this.accountRepo.findOne({
      where: { id: accountId, deleted_at: null },
    });

    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    account.suspend(reason, userId);
    const updated = await this.accountRepo.save(account);

    // Log audit trail
    await this.logAudit({
      account_id: accountId,
      user_id: userId,
      action: 'account.suspended',
      resource_type: 'account',
      resource_id: accountId,
      details: { reason },
    });

    return updated;
  }

  /**
   * Reactivate suspended account
   */
  async reactivateAccount(accountId: string, userId: string): Promise<PharmacyAccount> {
    const account = await this.accountRepo.findOne({
      where: { id: accountId, deleted_at: null },
    });

    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    account.reactivate();
    const updated = await this.accountRepo.save(account);

    // Log audit trail
    await this.logAudit({
      account_id: accountId,
      user_id: userId,
      action: 'account.reactivated',
      resource_type: 'account',
      resource_id: accountId,
      details: {},
    });

    return updated;
  }

  /**
   * Soft delete account
   */
  async deleteAccount(accountId: string, userId: string): Promise<void> {
    const account = await this.accountRepo.findOne({
      where: { id: accountId, deleted_at: null },
      relations: ['children'],
    });

    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    // Cannot delete if has active children
    const activeChildren = account.children.filter(c => c.deleted_at === null);
    if (activeChildren.length > 0) {
      throw new Error(`Cannot delete account with ${activeChildren.length} active sub-accounts`);
    }

    account.softDelete();
    await this.accountRepo.save(account);

    // Log audit trail
    await this.logAudit({
      account_id: accountId,
      user_id: userId,
      action: 'account.deleted',
      resource_type: 'account',
      resource_id: accountId,
      details: {},
    });
  }

  // ============================================================================
  // Account Transfer
  // ============================================================================

  /**
   * Initiate transfer of sub-account to another master
   */
  async initiateTransfer(input: TransferAccountInput): Promise<PharmacyAccount> {
    const account = await this.accountRepo.findOne({
      where: { id: input.account_id, deleted_at: null },
    });

    if (!account) {
      throw new Error(`Account ${input.account_id} not found`);
    }

    if (account.isMaster()) {
      throw new Error('Cannot transfer master accounts');
    }

    const targetParent = await this.accountRepo.findOne({
      where: { id: input.target_parent_id, deleted_at: null },
    });

    if (!targetParent) {
      throw new Error(`Target parent ${input.target_parent_id} not found`);
    }

    if (!targetParent.canHaveChildren()) {
      throw new Error('Target parent cannot accept more children');
    }

    account.initiateTransfer(input.target_parent_id, input.requested_by_user_id);
    const updated = await this.accountRepo.save(account);

    // Log audit trail
    await this.logAudit({
      account_id: input.account_id,
      user_id: input.requested_by_user_id,
      action: 'account.transfer_initiated',
      resource_type: 'account',
      resource_id: input.account_id,
      details: { target_parent_id: input.target_parent_id },
    });

    return updated;
  }

  /**
   * Complete account transfer
   */
  async completeTransfer(accountId: string, approvedByUserId: string): Promise<PharmacyAccount> {
    const account = await this.accountRepo.findOne({
      where: { id: accountId, deleted_at: null },
    });

    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    if (!account.hasPendingTransfer()) {
      throw new Error('No pending transfer for this account');
    }

    const newParent = await this.accountRepo.findOne({
      where: { id: account.pending_transfer_to_account_id! },
    });

    if (!newParent) {
      throw new Error('Target parent account no longer exists');
    }

    const newLevel = newParent.level + 1;
    const newRootMasterId = newParent.root_master_id || newParent.id;

    account.completeTransfer(newParent.id, newRootMasterId, newLevel);
    const updated = await this.accountRepo.save(account);

    // Log audit trail
    await this.logAudit({
      account_id: accountId,
      user_id: approvedByUserId,
      action: 'account.transfer_completed',
      resource_type: 'account',
      resource_id: accountId,
      details: { new_parent_id: newParent.id, new_level: newLevel },
    });

    return updated;
  }

  /**
   * Cancel pending transfer
   */
  async cancelTransfer(accountId: string, userId: string): Promise<PharmacyAccount> {
    const account = await this.accountRepo.findOne({
      where: { id: accountId, deleted_at: null },
    });

    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    if (!account.hasPendingTransfer()) {
      throw new Error('No pending transfer to cancel');
    }

    account.cancelTransfer();
    const updated = await this.accountRepo.save(account);

    // Log audit trail
    await this.logAudit({
      account_id: accountId,
      user_id: userId,
      action: 'account.transfer_cancelled',
      resource_type: 'account',
      resource_id: accountId,
      details: {},
    });

    return updated;
  }

  // ============================================================================
  // Audit Logging
  // ============================================================================

  private async logAudit(
    data: {
      account_id: string;
      user_id: string;
      action: string;
      resource_type?: string;
      resource_id?: string;
      details?: any;
    },
    queryRunner?: any
  ): Promise<void> {
    const manager = queryRunner ? queryRunner.manager : this.dataSource.manager;

    await manager.query(
      `INSERT INTO account_audit_log (account_id, user_id, action, resource_type, resource_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        data.account_id,
        data.user_id,
        data.action,
        data.resource_type || null,
        data.resource_id || null,
        JSON.stringify(data.details || {}),
      ]
    );
  }
}
