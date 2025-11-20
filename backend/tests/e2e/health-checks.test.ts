/**
 * E2E Test: Service Health Checks
 * Tests that all services respond to health check endpoints
 */

import request from 'supertest';

// Import services
const inventoryApp = require('../../services/inventory-service/src/index').default;
const prescriptionApp = require('../../services/prescription-service/src/index').default;

describe('E2E: Service Health Checks', () => {
  describe('Inventory Service', () => {
    it('should respond to health check', async () => {
      const response = await request(inventoryApp).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('service', 'inventory-service');
    });
  });

  describe('Prescription Service', () => {
    it('should respond to health check', async () => {
      const response = await request(prescriptionApp).get('/health');

      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('service', 'prescription-service');
    });
  });
});
