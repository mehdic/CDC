/**
 * Integration Tests for Delivery Service
 * Tests all REST API endpoints with TypeORM and SQLite
 */

import request from 'supertest';
import { app, dataSource } from '../src/index';
import { Delivery } from '../../../shared/models/Delivery';
import { User, UserRole } from '../../../shared/models/User';

describe('Delivery Service Integration Tests', () => {

  // Initialize database before all tests
  beforeAll(async () => {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    // Create test users for foreign key constraints
    const userRepo = dataSource.getRepository(User);

    // Helper to create encrypted buffer (in production would use AWS KMS)
    const encryptField = (value: string): Buffer => Buffer.from(value, 'utf8');

    // Create test patient
    const testPatient = userRepo.create({
      id: 'patient-001',
      email: 'patient@test.com',
      password_hash: 'test-hash',
      first_name_encrypted: encryptField('Test'),
      last_name_encrypted: encryptField('Patient'),
      phone_encrypted: encryptField('+41791234567'),
      role: UserRole.PATIENT,
      email_verified: true,
    });

    // Create test driver
    const testDriver = userRepo.create({
      id: 'driver-001',
      email: 'driver@test.com',
      password_hash: 'test-hash',
      first_name_encrypted: encryptField('Test'),
      last_name_encrypted: encryptField('Driver'),
      phone_encrypted: encryptField('+41797654321'),
      role: UserRole.DELIVERY,
      email_verified: true,
    });

    await userRepo.save([testPatient, testDriver]);
  });

  // Close database after all tests
  afterAll(async () => {
    if (dataSource.isInitialized) {
      // Clean up test data
      const userRepo = dataSource.getRepository(User);
      await userRepo.delete({ id: 'patient-001' });
      await userRepo.delete({ id: 'driver-001' });

      await dataSource.destroy();
    }
  });

  // Clear deliveries before each test
  beforeEach(async () => {
    const deliveryRepo = dataSource.getRepository(Delivery);
    await deliveryRepo.clear();
  });

  // Helper function to encrypt address for testing
  const encryptAddress = (plaintext: string): string => {
    // In production, use proper encryption (AES-256)
    // For tests, use base64 encoding as placeholder
    return Buffer.from(plaintext).toString('base64');
  };

  // Helper function to create a test delivery
  const createTestDelivery = async (overrides = {}) => {
    const deliveryAddress = overrides['deliveryAddress'] || '456 Patient Ave, Lausanne';
    const deliveryData = {
      user_id: 'patient-001',
      order_id: 'ORDER-123',
      delivery_address_encrypted: encryptAddress(deliveryAddress),
      scheduled_at: new Date().toISOString(),
      ...overrides,
    };

    // Remove non-API fields
    delete deliveryData['deliveryAddress'];

    const response = await request(app)
      .post('/deliveries')
      .set('Authorization', 'Bearer test-token')
      .send(deliveryData);

    return response;
  };

  describe('POST /deliveries - Create Delivery', () => {

    it('should create a new delivery with valid data', async () => {
      const deliveryData = {
        user_id: 'patient-001',
        order_id: 'ORDER-001',
        delivery_address_encrypted: encryptAddress('200 Oak Ave, Lausanne'),
        scheduled_at: new Date().toISOString(),
      };

      const response = await request(app)
        .post('/deliveries')
        .set('Authorization', 'Bearer test-token')
        .send(deliveryData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toMatchObject({
        id: expect.any(String),
        user_id: deliveryData.user_id,
        order_id: deliveryData.order_id,
        scheduled_at: deliveryData.scheduled_at,
        status: 'pending',
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });
      // Note: delivery_address_encrypted is excluded from response for security
      expect(response.body).not.toHaveProperty('delivery_address_encrypted');
    });

    it('should return 400 when user_id is missing', async () => {
      const deliveryData = {
        order_id: 'ORDER-002',
        delivery_address_encrypted: encryptAddress('456 Patient Ave'),
      };

      const response = await request(app)
        .post('/deliveries')
        .set('Authorization', 'Bearer test-token')
        .send(deliveryData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('user_id is required');
    });

    it('should return 400 when delivery_address_encrypted is missing', async () => {
      const deliveryData = {
        user_id: 'patient-001',
        order_id: 'ORDER-003',
      };

      const response = await request(app)
        .post('/deliveries')
        .set('Authorization', 'Bearer test-token')
        .send(deliveryData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('delivery_address_encrypted is required');
    });

    it('should accept delivery without order_id', async () => {
      const deliveryData = {
        user_id: 'patient-001',
        delivery_address_encrypted: encryptAddress('123 Test St'),
      };

      const response = await request(app)
        .post('/deliveries')
        .set('Authorization', 'Bearer test-token')
        .send(deliveryData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.user_id).toBe('patient-001');
      expect(response.body.order_id).toBeNull();
    });
  });

  describe('GET /deliveries - List All Deliveries', () => {

    it('should return an empty list when no deliveries exist', async () => {
      const response = await request(app)
        .get('/deliveries')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toHaveProperty('pagination');
      expect(response.body).toHaveProperty('deliveries');
      expect(Array.isArray(response.body.deliveries)).toBe(true);
      expect(response.body.deliveries.length).toBe(0);
    });

    it('should return all deliveries when they exist', async () => {
      // Create two deliveries
      await createTestDelivery({ order_id: 'ORDER-100' });
      await createTestDelivery({ order_id: 'ORDER-101' });

      const response = await request(app)
        .get('/deliveries')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.pagination.total_items).toBeGreaterThanOrEqual(2);
      expect(response.body.deliveries.length).toBeGreaterThanOrEqual(2);
      expect(response.body.deliveries[0]).toHaveProperty('id');
      expect(response.body.deliveries[0]).toHaveProperty('status');
    });
  });

  describe('GET /deliveries/:id - Get Delivery by ID', () => {

    it('should return a delivery when valid ID is provided', async () => {
      // Create a delivery first
      const createResponse = await createTestDelivery({ order_id: 'ORDER-200' });
      const deliveryId = createResponse.body.id;

      const response = await request(app)
        .get(`/deliveries/${deliveryId}`)
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toMatchObject({
        id: deliveryId,
        order_id: 'ORDER-200',
        status: 'pending',
      });
    });

    it('should return 404 when delivery does not exist', async () => {
      const fakeUuid = '550e8400-e29b-41d4-a716-446655440000';
      const response = await request(app)
        .get(`/deliveries/${fakeUuid}`)
        .set('Authorization', 'Bearer test-token')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not found');
    });
  });

  describe('PUT /deliveries/:id - Update Delivery', () => {

    it('should update delivery status from pending to in_transit', async () => {
      // Create a delivery first
      const createResponse = await createTestDelivery({ order_id: 'ORDER-300' });
      const deliveryId = createResponse.body.id;

      const response = await request(app)
        .put(`/deliveries/${deliveryId}`)
        .set('Authorization', 'Bearer test-token')
        .send({ status: 'in_transit', delivery_personnel_id: 'driver-001' })
        .expect(200);

      expect(response.body.status).toBe('in_transit');
      expect(response.body.delivery_personnel_id).toBe('driver-001');
      expect(response.body.picked_up_at).toBeTruthy();
    });

    it('should follow complete workflow: pending -> in_transit -> delivered', async () => {
      const createResponse = await createTestDelivery({ order_id: 'ORDER-301' });
      const deliveryId = createResponse.body.id;

      // pending -> in_transit
      let response = await request(app)
        .put(`/deliveries/${deliveryId}`)
        .set('Authorization', 'Bearer test-token')
        .send({ status: 'in_transit', delivery_personnel_id: 'driver-001' })
        .expect(200);
      expect(response.body.status).toBe('in_transit');
      expect(response.body.picked_up_at).toBeTruthy();

      // in_transit -> delivered
      response = await request(app)
        .put(`/deliveries/${deliveryId}`)
        .set('Authorization', 'Bearer test-token')
        .send({ status: 'delivered' })
        .expect(200);
      expect(response.body.status).toBe('delivered');
      expect(response.body.delivered_at).toBeTruthy();
    });

    it('should allow transitioning to failed from any status', async () => {
      const createResponse = await createTestDelivery({ order_id: 'ORDER-302' });
      const deliveryId = createResponse.body.id;

      const response = await request(app)
        .put(`/deliveries/${deliveryId}`)
        .set('Authorization', 'Bearer test-token')
        .send({ status: 'failed', failure_reason: 'Address not found' })
        .expect(200);

      expect(response.body.status).toBe('failed');
      expect(response.body.failure_reason).toBe('Address not found');
      expect(response.body.failed_at).toBeTruthy();
    });

    it('should return 404 when delivery does not exist', async () => {
      const fakeUuid = '550e8400-e29b-41d4-a716-446655440000';
      const response = await request(app)
        .put(`/deliveries/${fakeUuid}`)
        .set('Authorization', 'Bearer test-token')
        .send({ status: 'delivered' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not found');
    });
  });

  describe('GET /health - Health Check', () => {

    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        service: 'delivery-service',
        port: expect.any(Number),
      });
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
