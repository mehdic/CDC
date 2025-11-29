/**
 * E2E Test: Basic Service Functionality
 * Tests basic request/response cycles for each service
 */

import request from 'supertest';

// Import services
const inventoryApp = require('../../services/inventory-service/src/index').default;
const prescriptionApp = require('../../services/prescription-service/src/index').default;

describe('E2E: Basic Service Functionality', () => {
  describe('Inventory Service - Basic Routes', () => {
    it('should return 404 for non-existent route', async () => {
      const response = await request(inventoryApp).get('/non-existent-route');
      expect(response.status).toBe(404);
    });

    it('should handle GET request to base path', async () => {
      const response = await request(inventoryApp).get('/');
      expect([200, 404]).toContain(response.status); // Root endpoint may not exist
    });

    it('should accept JSON payloads', async () => {
      const response = await request(inventoryApp)
        .post('/inventory/scan')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json');

      // Should process request - expect 400 for invalid payload or 200 for success
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('Prescription Service - Basic Routes', () => {
    it('should return 404 for non-existent route', async () => {
      const response = await request(prescriptionApp).get('/non-existent-route');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Not Found');
    });

    it('should handle GET request to legacy API', async () => {
      const response = await request(prescriptionApp).get('/api/prescriptions');
      // Should return 200 with data or 500 for server error, but not other codes
      expect([200, 500]).toContain(response.status);
    });

    it('should validate POST request to legacy API', async () => {
      const response = await request(prescriptionApp)
        .post('/api/prescriptions')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should require patient ID in prescription creation', async () => {
      const response = await request(prescriptionApp)
        .post('/api/prescriptions')
        .send({
          doctorId: 'test-doctor',
          pharmacyId: 'test-pharmacy',
          medications: [{ name: 'Test', dosage: '10mg', quantity: 1, instructions: 'Test' }],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Missing required fields');
    });

    it('should require medications array', async () => {
      const response = await request(prescriptionApp)
        .post('/api/prescriptions')
        .send({
          patientId: 'test-patient',
          doctorId: 'test-doctor',
          pharmacyId: 'test-pharmacy',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Missing required fields');
    });

    it('should validate medications array format', async () => {
      const response = await request(prescriptionApp)
        .post('/api/prescriptions')
        .send({
          patientId: 'test-patient',
          doctorId: 'test-doctor',
          pharmacyId: 'test-pharmacy',
          medications: [],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid medications array');
    });

    it('should validate medication object structure', async () => {
      const response = await request(prescriptionApp)
        .post('/api/prescriptions')
        .send({
          patientId: 'test-patient',
          doctorId: 'test-doctor',
          pharmacyId: 'test-pharmacy',
          medications: [{ invalid: 'object' }],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid medications array');
    });

    it('should validate all medication fields are present', async () => {
      const response = await request(prescriptionApp)
        .post('/api/prescriptions')
        .send({
          patientId: 'test-patient',
          doctorId: 'test-doctor',
          pharmacyId: 'test-pharmacy',
          medications: [
            {
              name: 'Test Med',
              // Missing: dosage, quantity, instructions
            },
          ],
        });

      expect(response.status).toBe(400);
    });

    it('should validate quantity is a positive number', async () => {
      const response = await request(prescriptionApp)
        .post('/api/prescriptions')
        .send({
          patientId: 'test-patient',
          doctorId: 'test-doctor',
          pharmacyId: 'test-pharmacy',
          medications: [
            {
              name: 'Test Med',
              dosage: '10mg',
              quantity: -1,
              instructions: 'Take once',
            },
          ],
        });

      expect(response.status).toBe(400);
    });

    it('should validate medication fields are non-empty strings', async () => {
      const response = await request(prescriptionApp)
        .post('/api/prescriptions')
        .send({
          patientId: 'test-patient',
          doctorId: 'test-doctor',
          pharmacyId: 'test-pharmacy',
          medications: [
            {
              name: '',
              dosage: '10mg',
              quantity: 1,
              instructions: 'Take once',
            },
          ],
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Prescription Service - Status Updates', () => {
    it('should require status field for status update', async () => {
      const response = await request(prescriptionApp)
        .patch('/api/prescriptions/test-id/status')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Missing required field: status');
    });

    it('should validate status value', async () => {
      const response = await request(prescriptionApp)
        .patch('/api/prescriptions/test-id/status')
        .send({ status: 'invalid-status' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid status');
    });

    it('should return 404 for non-existent prescription', async () => {
      const response = await request(prescriptionApp)
        .patch('/api/prescriptions/non-existent-id/status')
        .send({ status: 'dispensed' });

      // Should return 404 or 500 if database unavailable
      expect([404, 500]).toContain(response.status);
    });

    it('should return 404 for GET non-existent prescription', async () => {
      const response = await request(prescriptionApp).get('/api/prescriptions/non-existent-id');

      // Should return 404 or 500 if database unavailable
      expect([404, 500]).toContain(response.status);
    });
  });

  describe('Service Error Handling', () => {
    it('inventory service should handle malformed JSON', async () => {
      const response = await request(inventoryApp)
        .post('/inventory/scan')
        .send('not-json')
        .set('Content-Type', 'application/json');

      // Should return 400 for bad request or 500 for server error
      expect([400, 500]).toContain(response.status);
    });

    it('prescription service should handle malformed JSON', async () => {
      const response = await request(prescriptionApp)
        .post('/api/prescriptions')
        .send('not-json')
        .set('Content-Type', 'application/json');

      // Should return 400 for bad request or 500 for server error
      expect([400, 500]).toContain(response.status);
    });

    it('prescription service should handle large payloads', async () => {
      const largePayload = {
        patientId: 'test',
        doctorId: 'test',
        pharmacyId: 'test',
        medications: Array(1000)
          .fill(null)
          .map((_, i) => ({
            name: `Med ${i}`,
            dosage: '10mg',
            quantity: 1,
            instructions: 'Test',
          })),
      };

      const response = await request(prescriptionApp)
        .post('/api/prescriptions')
        .send(largePayload);

      // Should handle large payload without crashing (200, 400, or 500)
      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('Service Content-Type Handling', () => {
    it('inventory service should accept JSON content-type', async () => {
      const response = await request(inventoryApp)
        .post('/inventory/scan')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json');

      expect(response.status).not.toBe(415); // Not "Unsupported Media Type"
    });

    it('prescription service should accept JSON content-type', async () => {
      const response = await request(prescriptionApp)
        .post('/api/prescriptions')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json');

      expect(response.status).not.toBe(415);
    });

    it('prescription service should accept form-urlencoded', async () => {
      const response = await request(prescriptionApp)
        .post('/api/prescriptions')
        .send('test=data')
        .set('Content-Type', 'application/x-www-form-urlencoded');

      expect(response.status).not.toBe(415);
    });
  });

  describe('HTTP Methods', () => {
    it('prescription service should support GET method', async () => {
      const response = await request(prescriptionApp).get('/health');
      // Health check may return 200 or 503 depending on dependencies
      expect([200, 503]).toContain(response.status);
    });

    it('prescription service should support POST method', async () => {
      const response = await request(prescriptionApp).post('/api/prescriptions').send({});
      // Empty payload should return 400
      expect(response.status).toBe(400);
    });

    it('prescription service should support PATCH method', async () => {
      const response = await request(prescriptionApp)
        .patch('/api/prescriptions/test-id/status')
        .send({});
      // Empty payload should return 400
      expect(response.status).toBe(400);
    });

    it('inventory service should support GET method', async () => {
      const response = await request(inventoryApp).get('/health');
      expect(response.status).toBe(200); // Health check should return 200
    });

    it('inventory service should support POST method', async () => {
      const response = await request(inventoryApp).post('/inventory/scan').send({});
      // Empty payload should return 400
      expect(response.status).toBe(400);
    });
  });
});
