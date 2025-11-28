/**
 * Delivery Tracking API Tests
 * T3-055: VALIDATION Tests for GPS Tracking
 */

import request from 'supertest';
import { app, dataSource } from '../src/index';
import { Delivery, DeliveryStatus } from '../../../shared/models/Delivery';
import { User, UserRole } from '../../../shared/models/User';

describe('Delivery Tracking API', () => {
  let testDelivery: Delivery;
  let testUser: User;

  beforeAll(async () => {
    // Initialize database
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
  });

  afterAll(async () => {
    // Close database connection
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  beforeEach(async () => {
    // Create test user
    const userRepo = dataSource.getRepository(User);
    testUser = userRepo.create({
      email: `test-${Date.now()}@example.com`,
      password_hash: 'hashedpassword',
      role: UserRole.PATIENT,
      first_name_encrypted: Buffer.from('Test', 'utf8'),
      last_name_encrypted: Buffer.from('Patient', 'utf8'),
    });
    await userRepo.save(testUser);

    // Create test delivery
    const deliveryRepo = dataSource.getRepository(Delivery);
    testDelivery = deliveryRepo.create({
      user_id: testUser.id,
      delivery_address_encrypted: Buffer.from('encrypted_address', 'base64'),
      status: DeliveryStatus.IN_TRANSIT,
      delivery_personnel_id: null,
      tracking_info: null,
      tracking_number: `TRACK-${Date.now()}`,
      scheduled_at: null,
      picked_up_at: null,
      delivered_at: null,
      failed_at: null,
      failure_reason: null,
    });
    await deliveryRepo.save(testDelivery);
  });

  afterEach(async () => {
    // Clean up test data
    const deliveryRepo = dataSource.getRepository(Delivery);
    const userRepo = dataSource.getRepository(User);

    await deliveryRepo.delete({ id: testDelivery.id });
    await userRepo.delete({ id: testUser.id });
  });

  describe('POST /tracking/:id/location', () => {
    it('should successfully update delivery location', async () => {
      const locationUpdate = {
        latitude: 46.8182,
        longitude: 8.2275,
        accuracy: 10.5,
        speed: 15.2,
        heading: 135,
        timestamp: new Date().toISOString(),
        battery_level: 85,
      };

      const response = await request(app)
        .post(`/tracking/${testDelivery.id}/location`)
        .send(locationUpdate)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        delivery_id: testDelivery.id,
      });

      // Verify location was saved
      const deliveryRepo = dataSource.getRepository(Delivery);
      const updatedDelivery = await deliveryRepo.findOne({
        where: { id: testDelivery.id },
      });

      expect(updatedDelivery?.tracking_info).toBeDefined();
      const trackingInfo = updatedDelivery?.tracking_info as any;
      expect(trackingInfo.current_location).toMatchObject({
        latitude: 46.8182,
        longitude: 8.2275,
        accuracy: 10.5,
      });
      expect(trackingInfo.location_history).toHaveLength(1);
      expect(trackingInfo.battery_level).toBe(85);
    });

    it('should reject location update with missing required fields', async () => {
      const invalidUpdate = {
        latitude: 46.8182,
        // Missing longitude
        timestamp: new Date().toISOString(),
      };

      const response = await request(app)
        .post(`/tracking/${testDelivery.id}/location`)
        .send(invalidUpdate)
        .expect(400);

      expect(response.body.error).toBe('Invalid location update');
    });

    it('should reject location update with invalid latitude', async () => {
      const invalidUpdate = {
        latitude: 95, // Invalid: > 90
        longitude: 8.2275,
        timestamp: new Date().toISOString(),
      };

      const response = await request(app)
        .post(`/tracking/${testDelivery.id}/location`)
        .send(invalidUpdate)
        .expect(400);

      expect(response.body.message).toContain('Invalid latitude');
    });

    it('should reject location update with invalid longitude', async () => {
      const invalidUpdate = {
        latitude: 46.8182,
        longitude: 200, // Invalid: > 180
        timestamp: new Date().toISOString(),
      };

      const response = await request(app)
        .post(`/tracking/${testDelivery.id}/location`)
        .send(invalidUpdate)
        .expect(400);

      expect(response.body.message).toContain('Invalid longitude');
    });

    it('should reject location update with low GPS accuracy', async () => {
      const invalidUpdate = {
        latitude: 46.8182,
        longitude: 8.2275,
        accuracy: 150, // Too low: > 100 meters
        timestamp: new Date().toISOString(),
      };

      const response = await request(app)
        .post(`/tracking/${testDelivery.id}/location`)
        .send(invalidUpdate)
        .expect(400);

      expect(response.body.message).toContain('GPS accuracy too low');
    });

    it('should reject location update with future timestamp', async () => {
      const futureTimestamp = new Date();
      futureTimestamp.setHours(futureTimestamp.getHours() + 1);

      const invalidUpdate = {
        latitude: 46.8182,
        longitude: 8.2275,
        timestamp: futureTimestamp.toISOString(),
      };

      const response = await request(app)
        .post(`/tracking/${testDelivery.id}/location`)
        .send(invalidUpdate)
        .expect(400);

      expect(response.body.message).toContain('Timestamp cannot be in the future');
    });

    it('should reject location update with old timestamp', async () => {
      const oldTimestamp = new Date();
      oldTimestamp.setMinutes(oldTimestamp.getMinutes() - 10); // 10 minutes ago

      const invalidUpdate = {
        latitude: 46.8182,
        longitude: 8.2275,
        timestamp: oldTimestamp.toISOString(),
      };

      const response = await request(app)
        .post(`/tracking/${testDelivery.id}/location`)
        .send(invalidUpdate)
        .expect(400);

      expect(response.body.message).toContain('Timestamp too old');
    });

    it('should reject location update for non-existent delivery', async () => {
      const locationUpdate = {
        latitude: 46.8182,
        longitude: 8.2275,
        timestamp: new Date().toISOString(),
      };

      const response = await request(app)
        .post('/tracking/non-existent-id/location')
        .send(locationUpdate)
        .expect(404);

      expect(response.body.error).toBe('Delivery not found');
    });

    it('should reject location update for delivered delivery', async () => {
      // Update delivery status to delivered
      const deliveryRepo = dataSource.getRepository(Delivery);
      testDelivery.status = DeliveryStatus.DELIVERED;
      await deliveryRepo.save(testDelivery);

      const locationUpdate = {
        latitude: 46.8182,
        longitude: 8.2275,
        timestamp: new Date().toISOString(),
      };

      const response = await request(app)
        .post(`/tracking/${testDelivery.id}/location`)
        .send(locationUpdate)
        .expect(400);

      expect(response.body.error).toBe('Delivery not in trackable state');
    });

    it('should handle multiple location updates and maintain history', async () => {
      // Send 3 location updates
      for (let i = 0; i < 3; i++) {
        const locationUpdate = {
          latitude: 46.8182 + i * 0.001,
          longitude: 8.2275 + i * 0.001,
          accuracy: 10,
          timestamp: new Date().toISOString(),
        };

        await request(app)
          .post(`/tracking/${testDelivery.id}/location`)
          .send(locationUpdate)
          .expect(200);

        // Wait 100ms between updates
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Verify all 3 locations are in history
      const deliveryRepo = dataSource.getRepository(Delivery);
      const updatedDelivery = await deliveryRepo.findOne({
        where: { id: testDelivery.id },
      });

      const trackingInfo = updatedDelivery?.tracking_info as any;
      expect(trackingInfo.location_history).toHaveLength(3);

      // Verify current location is the last one
      expect(trackingInfo.current_location.latitude).toBeCloseTo(46.8182 + 2 * 0.001);
    });
  });

  describe('GET /tracking/:id', () => {
    beforeEach(async () => {
      // Set up tracking info with location
      const deliveryRepo = dataSource.getRepository(Delivery);
      testDelivery.tracking_info = {
        current_location: {
          latitude: 46.8182,
          longitude: 8.2275,
          accuracy: 10,
          timestamp: new Date().toISOString(),
        },
        location_history: [
          {
            latitude: 46.8182,
            longitude: 8.2275,
            timestamp: new Date().toISOString(),
          },
        ],
        last_updated: new Date().toISOString(),
      };
      await deliveryRepo.save(testDelivery);
    });

    it('should return delivery tracking information', async () => {
      const response = await request(app)
        .get(`/tracking/${testDelivery.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        delivery_id: testDelivery.id,
        status: testDelivery.status,
        current_location: {
          latitude: 46.8182,
          longitude: 8.2275,
        },
      });

      expect(response.body.eta_minutes).toBeGreaterThan(0);
      expect(response.body.distance_remaining_km).toBeGreaterThan(0);
      expect(response.body.location_history).toHaveLength(1);
    });

    it('should return null location for delivery without tracking data', async () => {
      // Remove tracking info
      const deliveryRepo = dataSource.getRepository(Delivery);
      testDelivery.tracking_info = null;
      await deliveryRepo.save(testDelivery);

      const response = await request(app)
        .get(`/tracking/${testDelivery.id}`)
        .expect(200);

      expect(response.body.current_location).toBeNull();
      expect(response.body.eta_minutes).toBeNull();
      expect(response.body.location_history).toHaveLength(0);
    });

    it('should return 404 for non-existent delivery', async () => {
      const response = await request(app)
        .get('/tracking/non-existent-id')
        .expect(404);

      expect(response.body.error).toBe('Delivery not found');
    });
  });

  describe('GET /tracking/:id/history', () => {
    beforeEach(async () => {
      // Create location history with 10 points
      const locationHistory = [];
      for (let i = 0; i < 10; i++) {
        locationHistory.push({
          latitude: 46.8182 + i * 0.001,
          longitude: 8.2275 + i * 0.001,
          timestamp: new Date(Date.now() - (10 - i) * 60000).toISOString(),
        });
      }

      const deliveryRepo = dataSource.getRepository(Delivery);
      testDelivery.tracking_info = {
        location_history: locationHistory,
      };
      await deliveryRepo.save(testDelivery);
    });

    it('should return location history', async () => {
      const response = await request(app)
        .get(`/tracking/${testDelivery.id}/history`)
        .expect(200);

      expect(response.body.delivery_id).toBe(testDelivery.id);
      expect(response.body.location_history).toHaveLength(10);
      expect(response.body.count).toBe(10);
      expect(response.body.total_count).toBe(10);
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get(`/tracking/${testDelivery.id}/history?limit=5`)
        .expect(200);

      expect(response.body.location_history).toHaveLength(5);
      expect(response.body.count).toBe(5);
      expect(response.body.total_count).toBe(10);
    });

    it('should cap limit at 1000', async () => {
      const response = await request(app)
        .get(`/tracking/${testDelivery.id}/history?limit=5000`)
        .expect(200);

      // Should return all 10 (capped at total available)
      expect(response.body.location_history).toHaveLength(10);
    });

    it('should return empty history for delivery without tracking data', async () => {
      const deliveryRepo = dataSource.getRepository(Delivery);
      testDelivery.tracking_info = null;
      await deliveryRepo.save(testDelivery);

      const response = await request(app)
        .get(`/tracking/${testDelivery.id}/history`)
        .expect(200);

      expect(response.body.location_history).toHaveLength(0);
      expect(response.body.count).toBe(0);
    });
  });

  describe('ETA Calculation', () => {
    it('should calculate reasonable ETA based on distance', async () => {
      // Set driver location far from destination
      const deliveryRepo = dataSource.getRepository(Delivery);
      testDelivery.tracking_info = {
        current_location: {
          latitude: 46.5,  // About 40km away from destination (46.8182, 8.2275)
          longitude: 8.0,
          timestamp: new Date().toISOString(),
        },
        location_history: [],
      };
      await deliveryRepo.save(testDelivery);

      const response = await request(app)
        .get(`/tracking/${testDelivery.id}`)
        .expect(200);

      // ETA should be reasonable (greater than 0, less than 1000 minutes)
      expect(response.body.eta_minutes).toBeGreaterThan(0);
      expect(response.body.eta_minutes).toBeLessThan(1000);

      // Distance should be > 0
      expect(response.body.distance_remaining_km).toBeGreaterThan(0);
    });
  });
});
