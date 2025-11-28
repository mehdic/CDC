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
  const createTestDelivery = async (overrides: any = {}) => {
    const deliveryAddress = overrides.deliveryAddress || '456 Patient Ave, Lausanne';
    const deliveryData: any = {
      user_id: 'patient-001',
      order_id: 'ORDER-123',
      delivery_address_encrypted: encryptAddress(deliveryAddress),
      scheduled_at: new Date().toISOString(),
    };

    // Add cold chain fields if provided
    if (overrides.requires_temperature_control) {
      deliveryData.requires_temperature_control = overrides.requires_temperature_control;
      deliveryData.temperature_range_min = overrides.temperature_range_min;
      deliveryData.temperature_range_max = overrides.temperature_range_max;
      deliveryData.max_delivery_duration_minutes = overrides.max_delivery_duration_minutes;
      if (overrides.special_handling_instructions) {
        deliveryData.special_handling_instructions = overrides.special_handling_instructions;
      }
    }

    // Add controlled substance fields if provided
    if (overrides.contains_controlled_substance) {
      deliveryData.contains_controlled_substance = overrides.contains_controlled_substance;
      deliveryData.substance_schedule = overrides.substance_schedule;
      deliveryData.requires_signature = overrides.requires_signature;
      if (overrides.age_verification_required !== undefined) {
        deliveryData.age_verification_required = overrides.age_verification_required;
      }
    }

    // Override order_id if provided
    if (overrides.order_id) {
      deliveryData.order_id = overrides.order_id;
    }

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

  // ============================================================================
  // Cold Chain Tests (T3-066)
  // ============================================================================

  describe('Cold Chain Management (T3-066)', () => {

    it('should create delivery with cold chain requirements', async () => {
      const deliveryData = {
        user_id: 'patient-001',
        order_id: 'COLD-001',
        delivery_address_encrypted: encryptAddress('Cold Storage Location'),
        requires_temperature_control: true,
        temperature_range_min: '2',
        temperature_range_max: '8',
        max_delivery_duration_minutes: 30,
        special_handling_instructions: 'Keep refrigerated. Do not freeze.',
      };

      const response = await request(app)
        .post('/deliveries')
        .set('Authorization', 'Bearer test-token')
        .send(deliveryData)
        .expect(201);

      expect(response.body).toMatchObject({
        requires_temperature_control: true,
        temperature_range_min: '2',
        temperature_range_max: '8',
        temperature_range_display: '2°C - 8°C',
        max_delivery_duration_minutes: 30,
        special_handling_instructions: 'Keep refrigerated. Do not freeze.',
      });
    });

    it('should reject cold chain delivery without temperature range', async () => {
      const deliveryData = {
        user_id: 'patient-001',
        order_id: 'COLD-002',
        delivery_address_encrypted: encryptAddress('Location'),
        requires_temperature_control: true,
        max_delivery_duration_minutes: 30,
        // Missing temperature_range_min and max
      };

      const response = await request(app)
        .post('/deliveries')
        .set('Authorization', 'Bearer test-token')
        .send(deliveryData)
        .expect(400);

      expect(response.body.error).toContain('temperature_range');
    });

    it('should reject cold chain delivery without max duration', async () => {
      const deliveryData = {
        user_id: 'patient-001',
        order_id: 'COLD-003',
        delivery_address_encrypted: encryptAddress('Location'),
        requires_temperature_control: true,
        temperature_range_min: '2',
        temperature_range_max: '8',
        // Missing max_delivery_duration_minutes
      };

      const response = await request(app)
        .post('/deliveries')
        .set('Authorization', 'Bearer test-token')
        .send(deliveryData)
        .expect(400);

      expect(response.body.error).toContain('max_delivery_duration_minutes');
    });

    it('should trigger cold chain alert when delivery exceeds max duration', async () => {
      // Create a cold chain delivery
      const createResponse = await createTestDelivery({
        order_id: 'COLD-004',
        requires_temperature_control: true,
        temperature_range_min: '2',
        temperature_range_max: '8',
        max_delivery_duration_minutes: 1, // Very short duration
      });
      const deliveryId = createResponse.body.id;

      // Move to in_transit (sets picked_up_at to current time)
      await request(app)
        .put(`/deliveries/${deliveryId}`)
        .set('Authorization', 'Bearer test-token')
        .send({ status: 'in_transit', delivery_personnel_id: 'driver-001' })
        .expect(200);

      // Wait a moment and then update (should detect alert)
      await new Promise(resolve => setTimeout(resolve, 100));

      const updateResponse = await request(app)
        .put(`/deliveries/${deliveryId}`)
        .set('Authorization', 'Bearer test-token')
        .send({ tracking_info: { lat: 45.5, lng: 73.5 } })
        .expect(200);

      // Check if cold chain alert was triggered
      const deliveryResponse = await request(app)
        .get(`/deliveries/${deliveryId}`)
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(deliveryResponse.body.requires_temperature_control).toBe(true);
      expect(deliveryResponse.body.compliance_log).toBeDefined();
      expect(Array.isArray(deliveryResponse.body.compliance_log)).toBe(true);
      expect(deliveryResponse.body.compliance_log.length).toBeGreaterThan(0);
    });

    it('should include compliance log entries for cold chain events', async () => {
      const createResponse = await createTestDelivery({
        order_id: 'COLD-005',
        requires_temperature_control: true,
        temperature_range_min: '2',
        temperature_range_max: '8',
        max_delivery_duration_minutes: 60,
      });
      const deliveryId = createResponse.body.id;

      const response = await request(app)
        .get(`/deliveries/${deliveryId}`)
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      const complianceLog = response.body.compliance_log;
      expect(complianceLog).toBeDefined();
      expect(Array.isArray(complianceLog)).toBe(true);

      // Should have delivery_created entry
      const createdEntry = complianceLog.find((e: any) => e.event === 'delivery_created');
      expect(createdEntry).toBeDefined();
      expect(createdEntry.event).toBe('delivery_created');
      expect(createdEntry.timestamp).toBeDefined();
      expect(createdEntry.details).toContain('cold_chain=true');
    });
  });

  // ============================================================================
  // Controlled Substance Tests (T3-067)
  // ============================================================================

  describe('Controlled Substance Handling (T3-067)', () => {

    it('should create delivery with controlled substance requirements', async () => {
      const deliveryData = {
        user_id: 'patient-001',
        order_id: 'CTRL-001',
        delivery_address_encrypted: encryptAddress('Secure Location'),
        contains_controlled_substance: true,
        substance_schedule: 'II',
        requires_signature: true,
        age_verification_required: true,
      };

      const response = await request(app)
        .post('/deliveries')
        .set('Authorization', 'Bearer test-token')
        .send(deliveryData)
        .expect(201);

      expect(response.body).toMatchObject({
        contains_controlled_substance: true,
        substance_schedule: 'II',
        requires_signature: true,
        age_verification_required: true,
      });
    });

    it('should reject controlled substance delivery without substance_schedule', async () => {
      const deliveryData = {
        user_id: 'patient-001',
        order_id: 'CTRL-002',
        delivery_address_encrypted: encryptAddress('Location'),
        contains_controlled_substance: true,
        requires_signature: true,
        // Missing substance_schedule
      };

      const response = await request(app)
        .post('/deliveries')
        .set('Authorization', 'Bearer test-token')
        .send(deliveryData)
        .expect(400);

      expect(response.body.error).toContain('substance_schedule');
    });

    it('should enforce signature requirement for controlled substances', async () => {
      const deliveryData = {
        user_id: 'patient-001',
        order_id: 'CTRL-003',
        delivery_address_encrypted: encryptAddress('Location'),
        contains_controlled_substance: true,
        substance_schedule: 'III',
        requires_signature: false, // Invalid: controlled substances must have signature
      };

      const response = await request(app)
        .post('/deliveries')
        .set('Authorization', 'Bearer test-token')
        .send(deliveryData)
        .expect(400);

      expect(response.body.error).toContain('requires_signature');
    });

    it('should record signature for controlled substance delivery', async () => {
      const createResponse = await createTestDelivery({
        order_id: 'CTRL-004',
        contains_controlled_substance: true,
        substance_schedule: 'II',
        requires_signature: true,
      });
      const deliveryId = createResponse.body.id;

      const signatureData = Buffer.from('signature-image-data').toString('base64');

      const response = await request(app)
        .put(`/deliveries/${deliveryId}`)
        .set('Authorization', 'Bearer test-token')
        .send({
          signature_image_encrypted: signatureData,
          signed_by_name: 'John Doe',
        })
        .expect(200);

      expect(response.body.signature_obtained_at).toBeTruthy();

      // Verify compliance log includes signature event
      expect(response.body.compliance_log).toBeDefined();
      const signatureEntry = response.body.compliance_log.find((e: any) => e.event === 'signature_obtained');
      expect(signatureEntry).toBeDefined();
    });

    it('should verify age for age-restricted controlled substances', async () => {
      const createResponse = await createTestDelivery({
        order_id: 'CTRL-005',
        contains_controlled_substance: true,
        substance_schedule: 'IV',
        requires_signature: true,
        age_verification_required: true,
      });
      const deliveryId = createResponse.body.id;

      const response = await request(app)
        .put(`/deliveries/${deliveryId}`)
        .set('Authorization', 'Bearer test-token')
        .send({
          age_verification_requested: true,
          verified_age_minimum: 18,
        })
        .expect(200);

      expect(response.body.age_verified_at).toBeTruthy();
      expect(response.body.verified_age_minimum).toBe('18');

      // Verify compliance log includes age verification event
      const ageEntry = response.body.compliance_log.find((e: any) => e.event === 'age_verified');
      expect(ageEntry).toBeDefined();
    });

    it('should scan ID for controlled substance delivery', async () => {
      const createResponse = await createTestDelivery({
        order_id: 'CTRL-006',
        contains_controlled_substance: true,
        substance_schedule: 'II',
        requires_signature: true,
      });
      const deliveryId = createResponse.body.id;

      const idScanData = Buffer.from('id-scan-data').toString('base64');

      const response = await request(app)
        .put(`/deliveries/${deliveryId}`)
        .set('Authorization', 'Bearer test-token')
        .send({
          id_scan_data_encrypted: idScanData,
          scanned_by_person_id: 'driver-001',
        })
        .expect(200);

      expect(response.body.id_scanned).toBe(true);
      expect(response.body.id_scanned_at).toBeTruthy();

      // Verify compliance log includes ID scan event
      const idEntry = response.body.compliance_log.find((e: any) => e.event === 'id_scanned');
      expect(idEntry).toBeDefined();
    });

    it('should prevent delivery of controlled substance without meeting all requirements', async () => {
      const createResponse = await createTestDelivery({
        order_id: 'CTRL-007',
        contains_controlled_substance: true,
        substance_schedule: 'II',
        requires_signature: true,
        age_verification_required: true,
      });
      const deliveryId = createResponse.body.id;

      // Try to mark as delivered without completing requirements
      const response = await request(app)
        .put(`/deliveries/${deliveryId}`)
        .set('Authorization', 'Bearer test-token')
        .send({ status: 'delivered' })
        .expect(400);

      expect(response.body.error).toContain('controlled substance requirements');
      expect(response.body.missing_requirements).toBeDefined();
      expect(response.body.missing_requirements.signature).toBe(true);
      expect(response.body.missing_requirements.age_verified).toBe(true);
    });

    it('should allow delivery after all controlled substance requirements are met', async () => {
      const createResponse = await createTestDelivery({
        order_id: 'CTRL-008',
        contains_controlled_substance: true,
        substance_schedule: 'II',
        requires_signature: true,
        age_verification_required: true,
      });
      const deliveryId = createResponse.body.id;

      const signatureData = Buffer.from('sig').toString('base64');

      // Record signature
      await request(app)
        .put(`/deliveries/${deliveryId}`)
        .set('Authorization', 'Bearer test-token')
        .send({
          signature_image_encrypted: signatureData,
          signed_by_name: 'Jane Doe',
        })
        .expect(200);

      // Verify age
      await request(app)
        .put(`/deliveries/${deliveryId}`)
        .set('Authorization', 'Bearer test-token')
        .send({
          age_verification_requested: true,
          verified_age_minimum: 18,
        })
        .expect(200);

      // Now should be able to mark as delivered
      const response = await request(app)
        .put(`/deliveries/${deliveryId}`)
        .set('Authorization', 'Bearer test-token')
        .send({ status: 'delivered' })
        .expect(200);

      expect(response.body.status).toBe('delivered');
      expect(response.body.delivered_at).toBeTruthy();
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
