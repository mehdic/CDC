/**
 * Contract Tests for Account Hierarchy API (T6-009)
 * Tests: API contract validation, request/response schemas, HTTP status codes
 * Uses Pact or similar contract testing approach
 */

import request from 'supertest';
import express, { Express } from 'express';
import { DataSource } from 'typeorm';
import { createAccountHierarchyRouter } from '../../shared/routes/accountHierarchyRoutes';
import { PharmacyAccount } from '../../shared/models/PharmacyAccount';
import { AccountRole } from '../../shared/models/AccountRole';
import jwt from 'jsonwebtoken';

describe('Account Hierarchy API - Contract Tests', () => {
  let app: Express;
  let dataSource: DataSource;
  let authToken: string;

  beforeAll(async () => {
    // Initialize test database
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

    // Create Express app with routes
    app = express();
    app.use(express.json());
    app.use('/api/v1/accounts', createAccountHierarchyRouter(dataSource));

    // Generate test JWT token
    authToken = jwt.sign(
      {
        userId: '00000000-0000-0000-0000-000000000002',
        role: 'pharmacist',
      },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    // Clean up
    await dataSource.query('DELETE FROM account_audit_log');
    await dataSource.query('DELETE FROM account_users');
    await dataSource.query('DELETE FROM account_roles');
    await dataSource.query('DELETE FROM pharmacy_accounts_closure');
    await dataSource.query('DELETE FROM pharmacy_accounts');
  });

  describe('POST /api/v1/accounts/master - Create Master Account', () => {
    it('should conform to contract: successful creation', async () => {
      const response = await request(app)
        .post('/api/v1/accounts/master')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Master Account',
          pharmacy_id: '00000000-0000-0000-0000-000000000001',
          data_sharing_mode: 'isolated',
          cross_account_reporting_enabled: true,
        })
        .expect(201);

      // Validate response schema
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('message');

      // Validate data object
      const { data } = response.body;
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('name', 'Test Master Account');
      expect(data).toHaveProperty('account_type', 'master');
      expect(data).toHaveProperty('level', 1);
      expect(data).toHaveProperty('status', 'active');
      expect(data).toHaveProperty('created_at');
      expect(data).toHaveProperty('updated_at');
    });

    it('should conform to contract: validation error', async () => {
      const response = await request(app)
        .post('/api/v1/accounts/master')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required fields
          pharmacy_id: 'invalid-uuid',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    it('should conform to contract: unauthorized request', async () => {
      await request(app)
        .post('/api/v1/accounts/master')
        // No authorization header
        .send({
          name: 'Test Master',
          pharmacy_id: '00000000-0000-0000-0000-000000000001',
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/accounts/master/:id - Get Master Account', () => {
    let masterAccountId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/accounts/master')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Master',
          pharmacy_id: '00000000-0000-0000-0000-000000000001',
        });

      masterAccountId = response.body.data.id;
    });

    it('should conform to contract: successful retrieval', async () => {
      const response = await request(app)
        .get(`/api/v1/accounts/master/${masterAccountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');

      const { data } = response.body;
      expect(data).toHaveProperty('id', masterAccountId);
      expect(data).toHaveProperty('name');
      expect(data).toHaveProperty('account_type');
      expect(data).toHaveProperty('pharmacy');
    });

    it('should conform to contract: account not found', async () => {
      const response = await request(app)
        .get('/api/v1/accounts/master/00000000-0000-0000-0000-999999999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/v1/accounts/master/:id/sub-accounts - Create Sub-Account', () => {
    let masterAccountId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/accounts/master')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Master for Sub-Account',
          pharmacy_id: '00000000-0000-0000-0000-000000000001',
        });

      masterAccountId = response.body.data.id;
    });

    it('should conform to contract: successful sub-account creation', async () => {
      const response = await request(app)
        .post(`/api/v1/accounts/master/${masterAccountId}/sub-accounts`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Sub-Account',
          pharmacy_id: '00000000-0000-0000-0000-000000000003',
          data_sharing_mode: 'shared_products',
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('message');

      const { data } = response.body;
      expect(data).toHaveProperty('account_type', 'sub');
      expect(data).toHaveProperty('level', 2);
      expect(data).toHaveProperty('parent_id', masterAccountId);
    });
  });

  describe('GET /api/v1/accounts/master/:id/sub-accounts - List Sub-Accounts', () => {
    let masterAccountId: string;

    beforeEach(async () => {
      const masterResponse = await request(app)
        .post('/api/v1/accounts/master')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Master with Subs',
          pharmacy_id: '00000000-0000-0000-0000-000000000001',
        });

      masterAccountId = masterResponse.body.data.id;

      // Create 2 sub-accounts
      await request(app)
        .post(`/api/v1/accounts/master/${masterAccountId}/sub-accounts`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Sub 1',
          pharmacy_id: '00000000-0000-0000-0000-000000000003',
        });

      await request(app)
        .post(`/api/v1/accounts/master/${masterAccountId}/sub-accounts`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Sub 2',
          pharmacy_id: '00000000-0000-0000-0000-000000000004',
        });
    });

    it('should conform to contract: successful list retrieval', async () => {
      const response = await request(app)
        .get(`/api/v1/accounts/master/${masterAccountId}/sub-accounts`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('count');

      const { data, count } = response.body;
      expect(Array.isArray(data)).toBe(true);
      expect(count).toBe(2);
      expect(data.length).toBe(2);

      // Validate each item in array
      data.forEach((item: any) => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('account_type');
        expect(item).toHaveProperty('level');
      });
    });
  });

  describe('PUT /api/v1/accounts/:id - Update Account', () => {
    let accountId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/accounts/master')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Account to Update',
          pharmacy_id: '00000000-0000-0000-0000-000000000001',
        });

      accountId = response.body.data.id;
    });

    it('should conform to contract: successful update', async () => {
      const response = await request(app)
        .put(`/api/v1/accounts/${accountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
          data_sharing_mode: 'shared_pricing',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('message');

      const { data } = response.body;
      expect(data).toHaveProperty('name', 'Updated Name');
      expect(data).toHaveProperty('data_sharing_mode', 'shared_pricing');
    });
  });

  describe('DELETE /api/v1/accounts/:id - Delete Account', () => {
    let accountId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/accounts/master')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Account to Delete',
          pharmacy_id: '00000000-0000-0000-0000-000000000001',
        });

      accountId = response.body.data.id;
    });

    it('should conform to contract: successful deletion', async () => {
      const response = await request(app)
        .delete(`/api/v1/accounts/${accountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });

    it('should conform to contract: cannot delete account with children', async () => {
      // Create sub-account
      await request(app)
        .post(`/api/v1/accounts/master/${accountId}/sub-accounts`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Child Account',
          pharmacy_id: '00000000-0000-0000-0000-000000000003',
        });

      const response = await request(app)
        .delete(`/api/v1/accounts/${accountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500); // Or 400, depending on error handling

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('sub-accounts');
    });
  });

  describe('POST /api/v1/accounts/:id/transfer - Initiate Transfer', () => {
    let subAccountId: string;
    let targetMasterId: string;

    beforeEach(async () => {
      const sourceMaster = await request(app)
        .post('/api/v1/accounts/master')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Source Master',
          pharmacy_id: '00000000-0000-0000-0000-000000000001',
        });

      const targetMaster = await request(app)
        .post('/api/v1/accounts/master')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Target Master',
          pharmacy_id: '00000000-0000-0000-0000-000000000003',
        });

      targetMasterId = targetMaster.body.data.id;

      const subAccount = await request(app)
        .post(`/api/v1/accounts/master/${sourceMaster.body.data.id}/sub-accounts`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Sub to Transfer',
          pharmacy_id: '00000000-0000-0000-0000-000000000004',
        });

      subAccountId = subAccount.body.data.id;
    });

    it('should conform to contract: successful transfer initiation', async () => {
      const response = await request(app)
        .post(`/api/v1/accounts/${subAccountId}/transfer`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          target_parent_id: targetMasterId,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('message');

      const { data } = response.body;
      expect(data).toHaveProperty('status', 'pending_transfer');
      expect(data).toHaveProperty('pending_transfer_to_account_id', targetMasterId);
    });
  });

  describe('GET /api/v1/accounts/:id/permissions - Get Account Permissions', () => {
    let accountId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/accounts/master')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Account with Roles',
          pharmacy_id: '00000000-0000-0000-0000-000000000001',
        });

      accountId = response.body.data.id;
    });

    it('should conform to contract: successful permissions retrieval', async () => {
      const response = await request(app)
        .get(`/api/v1/accounts/${accountId}/permissions`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');

      const { data } = response.body;
      expect(data).toHaveProperty('account_id');
      expect(data).toHaveProperty('roles');
      expect(Array.isArray(data.roles)).toBe(true);

      // Validate role structure
      if (data.roles.length > 0) {
        const role = data.roles[0];
        expect(role).toHaveProperty('id');
        expect(role).toHaveProperty('name');
        expect(role).toHaveProperty('role_type');
        expect(role).toHaveProperty('permissions');
        expect(typeof role.permissions).toBe('object');
      }
    });
  });
});
