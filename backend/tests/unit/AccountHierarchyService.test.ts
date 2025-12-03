/**
 * Unit Tests for Account Hierarchy Service (T6-009)
 * Tests: Account creation, hierarchy validation, RBAC logic, data isolation
 */

import { DataSource } from 'typeorm';
import { AccountHierarchyService } from '../../shared/services/AccountHierarchyService';
import { PharmacyAccount, AccountType, AccountStatus } from '../../shared/models/PharmacyAccount';
import { AccountRole, RoleType } from '../../shared/models/AccountRole';

describe('AccountHierarchyService - Unit Tests', () => {
  let dataSource: DataSource;
  let service: AccountHierarchyService;

  beforeAll(async () => {
    // Initialize test database connection
    dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USER || 'metapharm',
      password: process.env.DATABASE_PASSWORD || 'metapharm_dev_password',
      database: process.env.DATABASE_NAME || 'metapharm_test',
      entities: [PharmacyAccount, AccountRole],
      synchronize: false,
    });

    await dataSource.initialize();
    service = new AccountHierarchyService(dataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    // Clean up tables before each test
    await dataSource.query('DELETE FROM account_audit_log');
    await dataSource.query('DELETE FROM account_users');
    await dataSource.query('DELETE FROM account_roles');
    await dataSource.query('DELETE FROM pharmacy_accounts_closure');
    await dataSource.query('DELETE FROM pharmacy_accounts');
  });

  describe('Master Account Creation', () => {
    it('should create a master account successfully', async () => {
      const input = {
        name: 'Test Pharmacy Master',
        pharmacy_id: '00000000-0000-0000-0000-000000000001',
        created_by_user_id: '00000000-0000-0000-0000-000000000002',
        data_sharing_mode: 'isolated' as const,
        cross_account_reporting_enabled: true,
      };

      const account = await service.createMasterAccount(input);

      expect(account).toBeDefined();
      expect(account.id).toBeDefined();
      expect(account.name).toBe('Test Pharmacy Master');
      expect(account.account_type).toBe(AccountType.MASTER);
      expect(account.level).toBe(1);
      expect(account.parent_id).toBeNull();
      expect(account.status).toBe(AccountStatus.ACTIVE);
      expect(account.cross_account_reporting_enabled).toBe(true);
    });

    it('should create system roles for new master account', async () => {
      const input = {
        name: 'Test Master with Roles',
        pharmacy_id: '00000000-0000-0000-0000-000000000001',
        created_by_user_id: '00000000-0000-0000-0000-000000000002',
      };

      const account = await service.createMasterAccount(input);

      const roles = await dataSource.getRepository(AccountRole).find({
        where: { account_id: account.id },
      });

      expect(roles.length).toBe(4); // MASTER_ADMIN, SUB_ACCOUNT_MANAGER, STAFF, READ_ONLY
      expect(roles.every(r => r.is_system_role)).toBe(true);

      const masterAdminRole = roles.find(r => r.role_type === RoleType.MASTER_ADMIN);
      expect(masterAdminRole).toBeDefined();
      expect(masterAdminRole!.name).toBe('Master Administrator');
    });

    it('should log audit trail on master account creation', async () => {
      const input = {
        name: 'Test Audit Master',
        pharmacy_id: '00000000-0000-0000-0000-000000000001',
        created_by_user_id: '00000000-0000-0000-0000-000000000002',
      };

      const account = await service.createMasterAccount(input);

      const auditLogs = await dataSource.query(
        'SELECT * FROM account_audit_log WHERE account_id = $1',
        [account.id]
      );

      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].action).toBe('account.created');
      expect(auditLogs[0].user_id).toBe(input.created_by_user_id);
    });
  });

  describe('Sub-Account Creation', () => {
    let masterAccount: PharmacyAccount;

    beforeEach(async () => {
      masterAccount = await service.createMasterAccount({
        name: 'Master for Sub-Accounts',
        pharmacy_id: '00000000-0000-0000-0000-000000000001',
        created_by_user_id: '00000000-0000-0000-0000-000000000002',
      });
    });

    it('should create a sub-account under master', async () => {
      const input = {
        name: 'Test Sub-Account',
        pharmacy_id: '00000000-0000-0000-0000-000000000003',
        parent_id: masterAccount.id,
        created_by_user_id: '00000000-0000-0000-0000-000000000002',
      };

      const subAccount = await service.createSubAccount(input);

      expect(subAccount).toBeDefined();
      expect(subAccount.account_type).toBe(AccountType.SUB);
      expect(subAccount.level).toBe(2);
      expect(subAccount.parent_id).toBe(masterAccount.id);
      expect(subAccount.root_master_id).toBe(masterAccount.id);
    });

    it('should create nested sub-account (level 3)', async () => {
      // Create level 2 sub-account
      const level2Sub = await service.createSubAccount({
        name: 'Level 2 Sub',
        pharmacy_id: '00000000-0000-0000-0000-000000000003',
        parent_id: masterAccount.id,
        created_by_user_id: '00000000-0000-0000-0000-000000000002',
      });

      // Create level 3 sub-account
      const level3Sub = await service.createSubAccount({
        name: 'Level 3 Sub',
        pharmacy_id: '00000000-0000-0000-0000-000000000004',
        parent_id: level2Sub.id,
        created_by_user_id: '00000000-0000-0000-0000-000000000002',
      });

      expect(level3Sub.level).toBe(3);
      expect(level3Sub.root_master_id).toBe(masterAccount.id);
    });

    it('should reject sub-account creation beyond level 3', async () => {
      // Create level 2
      const level2 = await service.createSubAccount({
        name: 'Level 2',
        pharmacy_id: '00000000-0000-0000-0000-000000000003',
        parent_id: masterAccount.id,
        created_by_user_id: '00000000-0000-0000-0000-000000000002',
      });

      // Create level 3
      const level3 = await service.createSubAccount({
        name: 'Level 3',
        pharmacy_id: '00000000-0000-0000-0000-000000000004',
        parent_id: level2.id,
        created_by_user_id: '00000000-0000-0000-0000-000000000002',
      });

      // Attempt level 4 (should fail)
      await expect(
        service.createSubAccount({
          name: 'Level 4 (Invalid)',
          pharmacy_id: '00000000-0000-0000-0000-000000000005',
          parent_id: level3.id,
          created_by_user_id: '00000000-0000-0000-0000-000000000002',
        })
      ).rejects.toThrow('cannot have children');
    });

    it('should reject sub-account creation with non-existent parent', async () => {
      await expect(
        service.createSubAccount({
          name: 'Invalid Sub',
          pharmacy_id: '00000000-0000-0000-0000-000000000003',
          parent_id: '00000000-0000-0000-0000-999999999999',
          created_by_user_id: '00000000-0000-0000-0000-000000000002',
        })
      ).rejects.toThrow('not found');
    });
  });

  describe('Account Retrieval', () => {
    let masterAccount: PharmacyAccount;
    let subAccount1: PharmacyAccount;
    let subAccount2: PharmacyAccount;

    beforeEach(async () => {
      masterAccount = await service.createMasterAccount({
        name: 'Master for Retrieval',
        pharmacy_id: '00000000-0000-0000-0000-000000000001',
        created_by_user_id: '00000000-0000-0000-0000-000000000002',
      });

      subAccount1 = await service.createSubAccount({
        name: 'Sub 1',
        pharmacy_id: '00000000-0000-0000-0000-000000000003',
        parent_id: masterAccount.id,
        created_by_user_id: '00000000-0000-0000-0000-000000000002',
      });

      subAccount2 = await service.createSubAccount({
        name: 'Sub 2',
        pharmacy_id: '00000000-0000-0000-0000-000000000004',
        parent_id: masterAccount.id,
        created_by_user_id: '00000000-0000-0000-0000-000000000002',
      });
    });

    it('should retrieve account by ID', async () => {
      const account = await service.getAccount(masterAccount.id);

      expect(account).toBeDefined();
      expect(account!.id).toBe(masterAccount.id);
      expect(account!.name).toBe('Master for Retrieval');
    });

    it('should retrieve all sub-accounts under parent', async () => {
      const subAccounts = await service.getSubAccounts(masterAccount.id);

      expect(subAccounts.length).toBe(2);
      expect(subAccounts.map(a => a.name).sort()).toEqual(['Sub 1', 'Sub 2']);
    });

    it('should retrieve account hierarchy tree', async () => {
      const tree = await service.getAccountHierarchy(masterAccount.id);

      expect(tree).toBeDefined();
      expect(tree.id).toBe(masterAccount.id);
      expect(tree.children.length).toBe(2);
    });

    it('should retrieve ancestors of sub-account', async () => {
      const ancestors = await service.getAncestors(subAccount1.id);

      expect(ancestors.length).toBeGreaterThanOrEqual(1);
      expect(ancestors.some(a => a.id === masterAccount.id)).toBe(true);
    });
  });

  describe('Account Updates', () => {
    let account: PharmacyAccount;

    beforeEach(async () => {
      account = await service.createMasterAccount({
        name: 'Account to Update',
        pharmacy_id: '00000000-0000-0000-0000-000000000001',
        created_by_user_id: '00000000-0000-0000-0000-000000000002',
      });
    });

    it('should update account name', async () => {
      const updated = await service.updateAccount(
        account.id,
        { name: 'Updated Name' },
        '00000000-0000-0000-0000-000000000002'
      );

      expect(updated.name).toBe('Updated Name');
    });

    it('should update account data sharing mode', async () => {
      const updated = await service.updateAccount(
        account.id,
        { data_sharing_mode: 'shared_products' },
        '00000000-0000-0000-0000-000000000002'
      );

      expect(updated.data_sharing_mode).toBe('shared_products');
    });

    it('should suspend account with reason', async () => {
      const suspended = await service.suspendAccount(
        account.id,
        'Testing suspension',
        '00000000-0000-0000-0000-000000000002'
      );

      expect(suspended.status).toBe(AccountStatus.SUSPENDED);
      expect(suspended.suspension_reason).toBe('Testing suspension');
      expect(suspended.suspended_at).toBeDefined();
    });

    it('should reactivate suspended account', async () => {
      await service.suspendAccount(
        account.id,
        'Test',
        '00000000-0000-0000-0000-000000000002'
      );

      const reactivated = await service.reactivateAccount(
        account.id,
        '00000000-0000-0000-0000-000000000002'
      );

      expect(reactivated.status).toBe(AccountStatus.ACTIVE);
      expect(reactivated.suspension_reason).toBeNull();
    });
  });

  describe('Account Deletion', () => {
    it('should soft delete account without children', async () => {
      const account = await service.createMasterAccount({
        name: 'Account to Delete',
        pharmacy_id: '00000000-0000-0000-0000-000000000001',
        created_by_user_id: '00000000-0000-0000-0000-000000000002',
      });

      await service.deleteAccount(account.id, '00000000-0000-0000-0000-000000000002');

      const deleted = await service.getAccount(account.id);
      expect(deleted).toBeNull(); // Soft deleted accounts are filtered out
    });

    it('should reject deletion of account with active children', async () => {
      const master = await service.createMasterAccount({
        name: 'Master with Children',
        pharmacy_id: '00000000-0000-0000-0000-000000000001',
        created_by_user_id: '00000000-0000-0000-0000-000000000002',
      });

      await service.createSubAccount({
        name: 'Child Account',
        pharmacy_id: '00000000-0000-0000-0000-000000000003',
        parent_id: master.id,
        created_by_user_id: '00000000-0000-0000-0000-000000000002',
      });

      await expect(
        service.deleteAccount(master.id, '00000000-0000-0000-0000-000000000002')
      ).rejects.toThrow('active sub-accounts');
    });
  });

  describe('Account Transfer', () => {
    let sourceMaster: PharmacyAccount;
    let targetMaster: PharmacyAccount;
    let subAccount: PharmacyAccount;

    beforeEach(async () => {
      sourceMaster = await service.createMasterAccount({
        name: 'Source Master',
        pharmacy_id: '00000000-0000-0000-0000-000000000001',
        created_by_user_id: '00000000-0000-0000-0000-000000000002',
      });

      targetMaster = await service.createMasterAccount({
        name: 'Target Master',
        pharmacy_id: '00000000-0000-0000-0000-000000000003',
        created_by_user_id: '00000000-0000-0000-0000-000000000002',
      });

      subAccount = await service.createSubAccount({
        name: 'Sub to Transfer',
        pharmacy_id: '00000000-0000-0000-0000-000000000004',
        parent_id: sourceMaster.id,
        created_by_user_id: '00000000-0000-0000-0000-000000000002',
      });
    });

    it('should initiate transfer successfully', async () => {
      const initiated = await service.initiateTransfer({
        account_id: subAccount.id,
        target_parent_id: targetMaster.id,
        requested_by_user_id: '00000000-0000-0000-0000-000000000002',
      });

      expect(initiated.status).toBe(AccountStatus.PENDING_TRANSFER);
      expect(initiated.pending_transfer_to_account_id).toBe(targetMaster.id);
    });

    it('should complete transfer successfully', async () => {
      await service.initiateTransfer({
        account_id: subAccount.id,
        target_parent_id: targetMaster.id,
        requested_by_user_id: '00000000-0000-0000-0000-000000000002',
      });

      const completed = await service.completeTransfer(
        subAccount.id,
        '00000000-0000-0000-0000-000000000002'
      );

      expect(completed.status).toBe(AccountStatus.ACTIVE);
      expect(completed.parent_id).toBe(targetMaster.id);
      expect(completed.root_master_id).toBe(targetMaster.id);
      expect(completed.pending_transfer_to_account_id).toBeNull();
    });

    it('should cancel transfer successfully', async () => {
      await service.initiateTransfer({
        account_id: subAccount.id,
        target_parent_id: targetMaster.id,
        requested_by_user_id: '00000000-0000-0000-0000-000000000002',
      });

      const cancelled = await service.cancelTransfer(
        subAccount.id,
        '00000000-0000-0000-0000-000000000002'
      );

      expect(cancelled.status).toBe(AccountStatus.ACTIVE);
      expect(cancelled.pending_transfer_to_account_id).toBeNull();
    });

    it('should reject transfer of master account', async () => {
      await expect(
        service.initiateTransfer({
          account_id: sourceMaster.id,
          target_parent_id: targetMaster.id,
          requested_by_user_id: '00000000-0000-0000-0000-000000000002',
        })
      ).rejects.toThrow('Cannot transfer master accounts');
    });
  });

  describe('RBAC - Role Permissions', () => {
    it('should verify master admin has all permissions', () => {
      const role = new AccountRole();
      role.role_type = RoleType.MASTER_ADMIN;
      role.permissions = {};

      const effectivePerms = role.getEffectivePermissions();

      expect(effectivePerms['accounts.create']).toBe(true);
      expect(effectivePerms['users.create']).toBe(true);
      expect(effectivePerms['analytics.cross_account']).toBe(true);
    });

    it('should verify sub-account manager has limited permissions', () => {
      const role = new AccountRole();
      role.role_type = RoleType.SUB_ACCOUNT_MANAGER;
      role.permissions = {};

      const effectivePerms = role.getEffectivePermissions();

      expect(effectivePerms['accounts.view']).toBe(true);
      expect(effectivePerms['users.create']).toBe(true);
      expect(effectivePerms['analytics.cross_account']).toBeUndefined(); // Not allowed
    });

    it('should verify staff has minimal permissions', () => {
      const role = new AccountRole();
      role.role_type = RoleType.STAFF;
      role.permissions = {};

      const effectivePerms = role.getEffectivePermissions();

      expect(effectivePerms['prescriptions.view']).toBe(true);
      expect(effectivePerms['users.create']).toBeUndefined(); // Not allowed
      expect(effectivePerms['accounts.create']).toBeUndefined(); // Not allowed
    });

    it('should verify read-only has view-only permissions', () => {
      const role = new AccountRole();
      role.role_type = RoleType.READ_ONLY;
      role.permissions = {};

      const effectivePerms = role.getEffectivePermissions();

      expect(effectivePerms['accounts.view']).toBe(true);
      expect(effectivePerms['prescriptions.view']).toBe(true);
      expect(effectivePerms['prescriptions.create']).toBeUndefined(); // Not allowed
    });
  });
});
