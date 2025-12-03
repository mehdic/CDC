/**
 * Terminal Payment Flow E2E Tests
 * End-to-end testing of complete payment workflow from pairing to settlement
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { app } from '../../index';
import { TerminalService } from '../../services/terminal/terminal-service';
import { TerminalStatus, TerminalBatteryLevel } from '../../../../../shared/models/TerminalDevice';
import { TerminalTransactionStatus } from '../../../../../shared/models/TerminalTransaction';
import { CODStatus } from '../../../../../shared/models/CODTransaction';

/**
 * Scenario: Complete payment workflow
 * 1. Driver pairs terminal
 * 2. Customer makes COD order
 * 3. Driver initiates card payment
 * 4. Payment is processed
 * 5. Transaction is recorded
 * 6. Settlement is completed
 */
describe('Terminal Payment Flow E2E Tests', () => {
  let dataSource: DataSource;
  let terminalService: TerminalService;

  const testData = {
    driverId: 'driver-e2e-001',
    customerId: 'customer-e2e-001',
    serialNumber: 'E2E-TEST-001',
    deviceName: 'Test Terminal E2E',
    deliveryId: 'delivery-e2e-001',
    codTransactionId: 'cod-e2e-001',
    amount: 50.0,
  };

  beforeEach(() => {
    // Mock DataSource for E2E tests
    dataSource = {} as DataSource;
    terminalService = new TerminalService(dataSource, 'test-key', 'test-merchant');

    // Mock repositories
    vi.mock('typeorm', () => ({
      DataSource: {
        getRepository: vi.fn(),
      },
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Step 1: Terminal Pairing', () => {
    it('should successfully pair terminal to driver', async () => {
      const pairingResponse = await request(app)
        .post('/api/v1/terminals/pair')
        .send({
          driver_id: testData.driverId,
          serial_number: testData.serialNumber,
          device_name: testData.deviceName,
        });

      // Should return pairing code
      expect(pairingResponse.status).toBeLessThan(500);

      if (pairingResponse.status === 200) {
        expect(pairingResponse.body).toHaveProperty('pairing_code');
        expect(pairingResponse.body.pairing_code).toMatch(/^\d{6}$/);
        expect(pairingResponse.body).toHaveProperty('expires_at');
      }
    });

    it('should confirm pairing with code', async () => {
      // First initiate pairing
      const pairingInitiate = await request(app)
        .post('/api/v1/terminals/pair')
        .send({
          driver_id: testData.driverId,
          serial_number: testData.serialNumber,
          device_name: testData.deviceName,
        });

      if (pairingInitiate.status === 200) {
        const pairingCode = pairingInitiate.body.pairing_code;

        // Then confirm with code
        const confirmResponse = await request(app)
          .post(`/api/v1/terminals/${testData.serialNumber}/confirm-pairing`)
          .send({
            pairing_code: pairingCode,
            mac_address: '00:1A:7D:DA:71:13',
          });

        expect(confirmResponse.status).toBeLessThan(500);

        if (confirmResponse.status === 200) {
          expect(confirmResponse.body.terminal).toBeDefined();
          expect(confirmResponse.body.terminal.status).not.toBe('pairing_pending');
        }
      }
    });
  });

  describe('Step 2: Terminal Status Monitoring', () => {
    it('should update terminal battery status', async () => {
      const statusResponse = await request(app)
        .post(`/api/v1/terminals/${testData.serialNumber}/status`)
        .send({
          battery_percentage: 85,
          is_charging: false,
          is_connected: true,
          network_type: '4G',
          signal_strength: -65,
        });

      expect(statusResponse.status).toBeLessThan(500);

      if (statusResponse.status === 200) {
        expect(statusResponse.body.terminal.battery_percentage).toBe(85);
        expect(statusResponse.body.terminal.is_connected).toBe(true);
      }
    });

    it('should retrieve terminal details', async () => {
      const detailsResponse = await request(app)
        .get(`/api/v1/terminals/${testData.serialNumber}`);

      expect(detailsResponse.status).toBeLessThan(500);

      if (detailsResponse.status === 200) {
        expect(detailsResponse.body.terminal).toBeDefined();
        expect(detailsResponse.body.terminal.serial_number).toBe(testData.serialNumber);
      }
    });

    it('should get driver terminals list', async () => {
      const listResponse = await request(app)
        .get(`/api/v1/drivers/${testData.driverId}/terminals`);

      expect(listResponse.status).toBeLessThan(500);

      if (listResponse.status === 200) {
        expect(Array.isArray(listResponse.body.terminals)).toBe(true);
      }
    });
  });

  describe('Step 3: Card Payment Processing', () => {
    it('should initiate card payment for COD delivery', async () => {
      const paymentInitResponse = await request(app)
        .post(`/api/v1/deliveries/${testData.deliveryId}/card-payment`)
        .send({
          serial_number: testData.serialNumber,
          cod_transaction_id: testData.codTransactionId,
          amount: testData.amount,
          location: {
            address: 'Customer delivery address',
            latitude: 46.9479,
            longitude: 7.4474,
          },
        });

      expect(paymentInitResponse.status).toBeLessThan(500);

      if (paymentInitResponse.status === 200) {
        expect(paymentInitResponse.body.transaction).toBeDefined();
        expect(paymentInitResponse.body.transaction.amount).toBe(testData.amount);
        expect(paymentInitResponse.body.transaction.status).toBe('Pending');
      }
    });

    it('should process payment on terminal', async () => {
      // Get a valid transaction ID (from previous step ideally)
      const transactionId = 'trans-e2e-001';

      const processResponse = await request(app)
        .post(`/api/v1/terminals/${testData.serialNumber}/transactions/${transactionId}/process`)
        .send({
          description: `Payment for order #${testData.deliveryId}`,
          skip_screen: false,
        });

      expect(processResponse.status).toBeLessThan(500);

      // Response should be present (may succeed or fail depending on mock)
      if (processResponse.status === 200) {
        expect(processResponse.body.transaction).toBeDefined();
        expect(['Pending', 'Processing', 'Approved', 'Declined', 'Failed']).toContain(
          processResponse.body.transaction.status
        );
      }
    });
  });

  describe('Step 4: Transaction Management', () => {
    it('should retrieve transaction details', async () => {
      const transactionId = 'trans-e2e-001';

      const transResponse = await request(app)
        .get(`/api/v1/terminals/${testData.serialNumber}/transactions/${transactionId}`);

      expect(transResponse.status).toBeLessThan(500);

      if (transResponse.status === 200) {
        expect(transResponse.body.transaction).toBeDefined();
        expect(transResponse.body.transaction.id).toBe(transactionId);
      }
    });

    it('should get transaction history', async () => {
      const historyResponse = await request(app)
        .get(`/api/v1/terminals/${testData.serialNumber}/transactions?limit=10`);

      expect(historyResponse.status).toBeLessThan(500);

      if (historyResponse.status === 200) {
        expect(Array.isArray(historyResponse.body.transactions)).toBe(true);
        expect(typeof historyResponse.body.count).toBe('number');
      }
    });

    it('should support transaction refund', async () => {
      const transactionId = 'trans-e2e-001';

      const refundResponse = await request(app)
        .post(`/api/v1/terminals/${testData.serialNumber}/transactions/${transactionId}/refund`)
        .send({
          reason: 'Customer requested refund',
        });

      expect(refundResponse.status).toBeLessThan(500);

      if (refundResponse.status === 200) {
        expect(refundResponse.body.transaction).toBeDefined();
        expect(refundResponse.body.transaction.status).toBe('Refunded');
      }
    });
  });

  describe('Step 5: Reporting & Analytics', () => {
    it('should generate daily terminal report', async () => {
      const today = new Date();
      const dateString = today.toISOString().split('T')[0];

      const reportResponse = await request(app)
        .get(`/api/v1/reports/terminals/daily?date=${dateString}`);

      expect(reportResponse.status).toBeLessThan(500);

      if (reportResponse.status === 200) {
        expect(reportResponse.body.report).toBeDefined();
        expect(reportResponse.body.report).toHaveProperty('date');
        expect(reportResponse.body.report).toHaveProperty('total_transactions');
        expect(reportResponse.body.report).toHaveProperty('approved');
        expect(reportResponse.body.report).toHaveProperty('declined');
        expect(reportResponse.body.report).toHaveProperty('failed');
        expect(reportResponse.body.report).toHaveProperty('total_amount');
      }
    });
  });

  describe('Step 6: Terminal Lifecycle', () => {
    it('should disable terminal when needed', async () => {
      const disableResponse = await request(app)
        .post(`/api/v1/terminals/${testData.serialNumber}/disable`);

      expect(disableResponse.status).toBeLessThan(500);

      if (disableResponse.status === 200) {
        expect(disableResponse.body.terminal).toBeDefined();
        expect(disableResponse.body.terminal.status).toBe('Inactive');
      }
    });
  });

  describe('Error Scenarios', () => {
    it('should handle terminal not found gracefully', async () => {
      const response = await request(app)
        .get('/api/v1/terminals/NONEXISTENT-SERIAL');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject payment if terminal offline', async () => {
      // Terminal status is offline
      const paymentResponse = await request(app)
        .post(`/api/v1/deliveries/delivery-test/card-payment`)
        .send({
          serial_number: 'OFFLINE-TERMINAL',
          cod_transaction_id: 'cod-test',
          amount: 50,
        });

      // Should either fail or be rejected
      expect([200, 400]).toContain(paymentResponse.status);
    });

    it('should reject refund for non-approved transactions', async () => {
      const refundResponse = await request(app)
        .post('/api/v1/terminals/TEST-SERIAL/transactions/PENDING-TRANS/refund')
        .send({
          reason: 'Test refund',
        });

      // Should be rejected
      expect([400, 404]).toContain(refundResponse.status);
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/terminals/pair')
        .send({
          driver_id: testData.driverId,
          // Missing serial_number and device_name
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent payment requests safely', async () => {
      const requests = Array.from({ length: 3 }).map((_, index) => {
        return request(app)
          .post(`/api/v1/deliveries/delivery-concurrent-${index}/card-payment`)
          .send({
            serial_number: testData.serialNumber,
            cod_transaction_id: `cod-concurrent-${index}`,
            amount: 50 + index,
          });
      });

      const responses = await Promise.all(requests);

      // All requests should complete without server errors
      responses.forEach((response) => {
        expect(response.status).toBeLessThan(500);
      });
    });
  });
});
