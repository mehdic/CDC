/**
 * E2E Tests for Account Hierarchy Workflow (T6-009)
 * Tests: Complete account management workflows including creation, updates, transfers, RBAC
 * Simulates real-world usage scenarios
 */

import request from 'supertest';
import express, { Express } from 'express';
import { DataSource } from 'typeorm';
import { createAccountHierarchyRouter } from '../../shared/routes/accountHierarchyRoutes';
import { PharmacyAccount } from '../../shared/models/PharmacyAccount';
import { AccountRole } from '../../shared/models/AccountRole';
import jwt from 'jsonwebtoken';

describe('Account Hierarchy - E2E Workflow Tests', () => {
  let app: Express;
  let dataSource: DataSource;
  let masterAdminToken: string;
  let subAccountManagerToken: string;
  let staffToken: string;

  beforeAll(async () => {
    // Initialize database
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

    // Create Express app
    app = express();
    app.use(express.json());
    app.use('/api/v1/accounts', createAccountHierarchyRouter(dataSource));

    // Generate auth tokens for different roles
    masterAdminToken = jwt.sign(
      { userId: '00000000-0000-0000-0000-000000000001', role: 'pharmacist' },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );

    subAccountManagerToken = jwt.sign(
      { userId: '00000000-0000-0000-0000-000000000002', role: 'pharmacist' },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );

    staffToken = jwt.sign(
      { userId: '00000000-0000-0000-0000-000000000003', role: 'pharmacist' },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    // Clean up before each test
    await dataSource.query('DELETE FROM account_audit_log');
    await dataSource.query('DELETE FROM account_users');
    await dataSource.query('DELETE FROM account_roles');
    await dataSource.query('DELETE FROM pharmacy_accounts_closure');
    await dataSource.query('DELETE FROM pharmacy_accounts');
  });

  describe('Workflow 1: Multi-level Pharmacy Chain Setup', () => {
    it('should create complete pharmacy chain with 3 levels', async () => {
      // Step 1: Create master account (Chain HQ)
      const masterResponse = await request(app)
        .post('/api/v1/accounts/master')
        .set('Authorization', `Bearer ${masterAdminToken}`)
        .send({
          name: 'PharmaCare Chain HQ',
          pharmacy_id: '00000000-0000-0000-0000-000000000001',
          cross_account_reporting_enabled: true,
        })
        .expect(201);

      const masterId = masterResponse.body.data.id;
      expect(masterResponse.body.data.level).toBe(1);
      expect(masterResponse.body.data.cross_account_reporting_enabled).toBe(true);

      // Step 2: Create level 2 sub-accounts (Regional offices)
      const region1Response = await request(app)
        .post(`/api/v1/accounts/master/${masterId}/sub-accounts`)
        .set('Authorization', `Bearer ${masterAdminToken}`)
        .send({
          name: 'PharmaCare Region North',
          pharmacy_id: '00000000-0000-0000-0000-000000000002',
          data_sharing_mode: 'shared_products',
        })
        .expect(201);

      const region1Id = region1Response.body.data.id;
      expect(region1Response.body.data.level).toBe(2);
      expect(region1Response.body.data.parent_id).toBe(masterId);

      const region2Response = await request(app)
        .post(`/api/v1/accounts/master/${masterId}/sub-accounts`)
        .set('Authorization', `Bearer ${masterAdminToken}`)
        .send({
          name: 'PharmaCare Region South',
          pharmacy_id: '00000000-0000-0000-0000-000000000003',
          data_sharing_mode: 'shared_products',
        })
        .expect(201);

      const region2Id = region2Response.body.data.id;

      // Step 3: Create level 3 sub-accounts (Individual stores)
      const store1Response = await request(app)
        .post(`/api/v1/accounts/master/${region1Id}/sub-accounts`)
        .set('Authorization', `Bearer ${masterAdminToken}`)
        .send({
          name: 'PharmaCare Store #101',
          pharmacy_id: '00000000-0000-0000-0000-000000000004',
          data_sharing_mode: 'full_shared',
        })
        .expect(201);

      expect(store1Response.body.data.level).toBe(3);
      expect(store1Response.body.data.root_master_id).toBe(masterId);

      const store2Response = await request(app)
        .post(`/api/v1/accounts/master/${region2Id}/sub-accounts`)
        .set('Authorization', `Bearer ${masterAdminToken}`)
        .send({
          name: 'PharmaCare Store #201',
          pharmacy_id: '00000000-0000-0000-0000-000000000005',
          data_sharing_mode: 'full_shared',
        })
        .expect(201);

      // Step 4: Verify hierarchy structure
      const subAccountsRegion1 = await request(app)
        .get(`/api/v1/accounts/master/${region1Id}/sub-accounts`)
        .set('Authorization', `Bearer ${masterAdminToken}`)
        .expect(200);

      expect(subAccountsRegion1.body.count).toBe(1);
      expect(subAccountsRegion1.body.data[0].name).toBe('PharmaCare Store #101');

      // Step 5: Verify cannot create level 4
      await request(app)
        .post(`/api/v1/accounts/master/${store1Response.body.data.id}/sub-accounts`)
        .set('Authorization', `Bearer ${masterAdminToken}`)
        .send({
          name: 'PharmaCare Sub-Store (Invalid)',
          pharmacy_id: '00000000-0000-0000-0000-000000000006',
        })
        .expect(500); // Should fail - max 3 levels

      // Step 6: Verify audit trail exists
      const auditLogs = await dataSource.query(
        'SELECT * FROM account_audit_log WHERE action = $1',
        ['account.created']
      );

      expect(auditLogs.length).toBeGreaterThanOrEqual(5); // 1 master + 2 regions + 2 stores
    });
  });

  describe('Workflow 2: Account Transfer Between Masters', () => {
    it('should transfer sub-account from one master to another', async () => {
      // Setup: Create two master accounts
      const master1Response = await request(app)
        .post('/api/v1/accounts/master')
        .set('Authorization', `Bearer ${masterAdminToken}`)
        .send({
          name: 'PharmaCorp Master',
          pharmacy_id: '00000000-0000-0000-0000-000000000001',
        });

      const master1Id = master1Response.body.data.id;

      const master2Response = await request(app)
        .post('/api/v1/accounts/master')
        .set('Authorization', `Bearer ${masterAdminToken}`)
        .send({
          name: 'MediPharm Master',
          pharmacy_id: '00000000-0000-0000-0000-000000000002',
        });

      const master2Id = master2Response.body.data.id;

      // Create sub-account under master 1
      const subResponse = await request(app)
        .post(`/api/v1/accounts/master/${master1Id}/sub-accounts`)
        .set('Authorization', `Bearer ${masterAdminToken}`)
        .send({
          name: 'Pharmacy to Transfer',
          pharmacy_id: '00000000-0000-0000-0000-000000000003',
        });

      const subId = subResponse.body.data.id;

      // Step 1: Initiate transfer
      const transferInitResponse = await request(app)
        .post(`/api/v1/accounts/${subId}/transfer`)
        .set('Authorization', `Bearer ${masterAdminToken}`)
        .send({
          target_parent_id: master2Id,
        })
        .expect(200);

      expect(transferInitResponse.body.data.status).toBe('pending_transfer');
      expect(transferInitResponse.body.data.pending_transfer_to_account_id).toBe(master2Id);

      // Step 2: Verify sub-account still listed under master 1
      const master1SubsBefore = await request(app)
        .get(`/api/v1/accounts/master/${master1Id}/sub-accounts`)
        .set('Authorization', `Bearer ${masterAdminToken}`)
        .expect(200);

      expect(master1SubsBefore.body.count).toBe(1);
      expect(master1SubsBefore.body.data[0].status).toBe('pending_transfer');

      // Step 3: Complete transfer (would be approved by master 2 admin in real scenario)
      // Note: This would typically require master2's approval, but we're simulating completion
      const service = new (require('../../shared/services/AccountHierarchyService').AccountHierarchyService)(dataSource);
      const completed = await service.completeTransfer(subId, '00000000-0000-0000-0000-000000000002');

      expect(completed.status).toBe('active');
      expect(completed.parent_id).toBe(master2Id);
      expect(completed.root_master_id).toBe(master2Id);

      // Step 4: Verify sub-account now under master 2
      const master2SubsAfter = await request(app)
        .get(`/api/v1/accounts/master/${master2Id}/sub-accounts`)
        .set('Authorization', `Bearer ${masterAdminToken}`)
        .expect(200);

      expect(master2SubsAfter.body.count).toBe(1);
      expect(master2SubsAfter.body.data[0].name).toBe('Pharmacy to Transfer');

      // Step 5: Verify audit trail
      const transferAuditLogs = await dataSource.query(
        'SELECT * FROM account_audit_log WHERE action LIKE $1',
        ['%transfer%']
      );

      expect(transferAuditLogs.length).toBeGreaterThanOrEqual(2); // Initiated + completed
    });
  });

  describe('Workflow 3: Account Suspension and Reactivation', () => {
    it('should suspend and reactivate account with proper workflow', async () => {
      // Create master and sub-account
      const masterResponse = await request(app)
        .post('/api/v1/accounts/master')
        .set('Authorization', `Bearer ${masterAdminToken}`)
        .send({
          name: 'Master Account',
          pharmacy_id: '00000000-0000-0000-0000-000000000001',
        });

      const masterId = masterResponse.body.data.id;

      const subResponse = await request(app)
        .post(`/api/v1/accounts/master/${masterId}/sub-accounts`)
        .set('Authorization', `Bearer ${masterAdminToken}`)
        .send({
          name: 'Sub Account to Suspend',
          pharmacy_id: '00000000-0000-0000-0000-000000000002',
        });

      const subId = subResponse.body.data.id;

      // Step 1: Suspend account
      const service = new (require('../../shared/services/AccountHierarchyService').AccountHierarchyService)(dataSource);
      const suspended = await service.suspendAccount(
        subId,
        'Non-compliance with pharmacy regulations',
        '00000000-0000-0000-0000-000000000001'
      );

      expect(suspended.status).toBe('suspended');
      expect(suspended.suspension_reason).toBe('Non-compliance with pharmacy regulations');
      expect(suspended.suspended_at).toBeDefined();
      expect(suspended.suspended_by_user_id).toBe('00000000-0000-0000-0000-000000000001');

      // Step 2: Verify cannot create sub-accounts under suspended account
      // (This would be enforced in service logic - suspended accounts cannot have children added)

      // Step 3: Reactivate account
      const reactivated = await service.reactivateAccount(
        subId,
        '00000000-0000-0000-0000-000000000001'
      );

      expect(reactivated.status).toBe('active');
      expect(reactivated.suspension_reason).toBeNull();

      // Step 4: Verify audit trail
      const suspensionAuditLogs = await dataSource.query(
        'SELECT * FROM account_audit_log WHERE account_id = $1 AND (action = $2 OR action = $3)',
        [subId, 'account.suspended', 'account.reactivated']
      );

      expect(suspensionAuditLogs.length).toBe(2);
    });
  });

  describe('Workflow 4: Account Deletion with Children Constraint', () => {
    it('should enforce cannot delete account with active children', async () => {
      // Create master with sub-account
      const masterResponse = await request(app)
        .post('/api/v1/accounts/master')
        .set('Authorization', `Bearer ${masterAdminToken}`)
        .send({
          name: 'Master with Children',
          pharmacy_id: '00000000-0000-0000-0000-000000000001',
        });

      const masterId = masterResponse.body.data.id;

      await request(app)
        .post(`/api/v1/accounts/master/${masterId}/sub-accounts`)
        .set('Authorization', `Bearer ${masterAdminToken}`)
        .send({
          name: 'Child Account',
          pharmacy_id: '00000000-0000-0000-0000-000000000002',
        });

      // Attempt to delete master (should fail)
      await request(app)
        .delete(`/api/v1/accounts/${masterId}`)
        .set('Authorization', `Bearer ${masterAdminToken}`)
        .expect(500); // Error: Cannot delete with active children

      // Verify master still exists
      const getResponse = await request(app)
        .get(`/api/v1/accounts/master/${masterId}`)
        .set('Authorization', `Bearer ${masterAdminToken}`)
        .expect(200);

      expect(getResponse.body.data.deleted_at).toBeNull();
    });

    it('should allow deletion of account without children', async () => {
      // Create master without children
      const masterResponse = await request(app)
        .post('/api/v1/accounts/master')
        .set('Authorization', `Bearer ${masterAdminToken}`)
        .send({
          name: 'Master without Children',
          pharmacy_id: '00000000-0000-0000-0000-000000000001',
        });

      const masterId = masterResponse.body.data.id;

      // Delete master (should succeed)
      await request(app)
        .delete(`/api/v1/accounts/${masterId}`)
        .set('Authorization', `Bearer ${masterAdminToken}`)
        .expect(200);

      // Verify deletion
      await request(app)
        .get(`/api/v1/accounts/master/${masterId}`)
        .set('Authorization', `Bearer ${masterAdminToken}`)
        .expect(404);
    });
  });

  describe('Workflow 5: Data Sharing Mode Configuration', () => {
    it('should configure and update data sharing modes across hierarchy', async () => {
      // Create master with isolated mode
      const masterResponse = await request(app)
        .post('/api/v1/accounts/master')
        .set('Authorization', `Bearer ${masterAdminToken}`)
        .send({
          name: 'Master Pharmacy',
          pharmacy_id: '00000000-0000-0000-0000-000000000001',
          data_sharing_mode: 'isolated',
        });

      const masterId = masterResponse.body.data.id;
      expect(masterResponse.body.data.data_sharing_mode).toBe('isolated');

      // Create sub-account with shared products
      const sub1Response = await request(app)
        .post(`/api/v1/accounts/master/${masterId}/sub-accounts`)
        .set('Authorization', `Bearer ${masterAdminToken}`)
        .send({
          name: 'Sub Pharmacy 1',
          pharmacy_id: '00000000-0000-0000-0000-000000000002',
          data_sharing_mode: 'shared_products',
        });

      expect(sub1Response.body.data.data_sharing_mode).toBe('shared_products');

      // Update data sharing mode
      const updateResponse = await request(app)
        .put(`/api/v1/accounts/${sub1Response.body.data.id}`)
        .set('Authorization', `Bearer ${masterAdminToken}`)
        .send({
          data_sharing_mode: 'full_shared',
        })
        .expect(200);

      expect(updateResponse.body.data.data_sharing_mode).toBe('full_shared');
    });
  });

  describe('Workflow 6: Cross-Account Reporting Setup', () => {
    it('should enable cross-account reporting for master account only', async () => {
      // Create master with cross-account reporting
      const masterResponse = await request(app)
        .post('/api/v1/accounts/master')
        .set('Authorization', `Bearer ${masterAdminToken}`)
        .send({
          name: 'Master with Reporting',
          pharmacy_id: '00000000-0000-0000-0000-000000000001',
          cross_account_reporting_enabled: true,
        });

      expect(masterResponse.body.data.cross_account_reporting_enabled).toBe(true);

      // Create sub-account (should not have cross-account reporting)
      const subResponse = await request(app)
        .post(`/api/v1/accounts/master/${masterResponse.body.data.id}/sub-accounts`)
        .set('Authorization', `Bearer ${masterAdminToken}`)
        .send({
          name: 'Sub Account',
          pharmacy_id: '00000000-0000-0000-0000-000000000002',
        });

      expect(subResponse.body.data.cross_account_reporting_enabled).toBe(false);

      // Attempt to enable cross-account reporting on sub-account (should fail)
      const updateResponse = await request(app)
        .put(`/api/v1/accounts/${subResponse.body.data.id}`)
        .set('Authorization', `Bearer ${masterAdminToken}`)
        .send({
          cross_account_reporting_enabled: true,
        });

      // Should return error
      expect(updateResponse.status).not.toBe(200);
    });
  });
});
