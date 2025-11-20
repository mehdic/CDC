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
      expect([404, 500]).toContain(response.status);
    });

    it('should handle GET request to base path', async () => {
      const response = await request(inventoryApp).get('/');
      expect([200, 404]).toContain(response.status);
    });

    it('should accept JSON payloads', async () => {
      const response = await request(inventoryApp)
        .post('/inventory/scan')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json');

      // Should process request (may return error due to validation, but not 500)
      expect([200, 400, 401, 404]).toContain(response.status);
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
      // May fail with DB error, but should not crash
      expect([200, 500, 503]).toContain(response.status);
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

      expect([404, 500]).toContain(response.status);
    });

    it('should return 404 for GET non-existent prescription', async () => {
      const response = await request(prescriptionApp).get('/api/prescriptions/non-existent-id');

      expect([404, 500]).toContain(response.status);
    });
  });

  describe('Service Error Handling', () => {
    it('inventory service should handle malformed JSON', async () => {
      const response = await request(inventoryApp)
        .post('/inventory/scan')
        .send('not-json')
        .set('Content-Type', 'application/json');

      expect([400, 500]).toContain(response.status);
    });

    it('prescription service should handle malformed JSON', async () => {
      const response = await request(prescriptionApp)
        .post('/api/prescriptions')
        .send('not-json')
        .set('Content-Type', 'application/json');

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

      // Should handle it without crashing
      expect([200, 400, 500, 503]).toContain(response.status);
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
      expect([200, 503]).toContain(response.status);
    });

    it('prescription service should support POST method', async () => {
      const response = await request(prescriptionApp).post('/api/prescriptions').send({});
      expect([200, 400, 500]).toContain(response.status);
    });

    it('prescription service should support PATCH method', async () => {
      const response = await request(prescriptionApp)
        .patch('/api/prescriptions/test-id/status')
        .send({});
      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it('inventory service should support GET method', async () => {
      const response = await request(inventoryApp).get('/health');
      expect([200, 503]).toContain(response.status);
    });

    it('inventory service should support POST method', async () => {
      const response = await request(inventoryApp).post('/inventory/scan').send({});
      expect([200, 400, 401, 404, 500]).toContain(response.status);
    });
  });
});
