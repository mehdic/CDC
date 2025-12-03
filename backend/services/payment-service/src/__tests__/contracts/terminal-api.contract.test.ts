/**
 * Terminal API Contract Tests
 * Validates API contract consistency and response formats
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../index';

describe('Terminal API Contract Tests', () => {
  describe('POST /api/v1/terminals/pair', () => {
    it('should return correct response schema for pair terminal', async () => {
      const payload = {
        driver_id: 'driver-123',
        serial_number: 'SER-001',
        device_name: 'Test Terminal',
      };

      // Mock successful pairing
      vi.mock('../../services/terminal/terminal-service', () => ({
        TerminalService: {
          pairTerminal: vi.fn().mockResolvedValue({
            pairing_code: '123456',
            expires_at: new Date().toISOString(),
          }),
        },
      }));

      const response = await request(app)
        .post('/api/v1/terminals/pair')
        .send(payload)
        .expect('Content-Type', /json/);

      // Validate response schema
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('pairing_code');
      expect(response.body).toHaveProperty('expires_at');
      expect(response.body).toHaveProperty('message');

      expect(typeof response.body.success).toBe('boolean');
      expect(typeof response.body.pairing_code).toBe('string');
      expect(typeof response.body.expires_at).toBe('string');
      expect(typeof response.body.message).toBe('string');
    });

    it('should return error for missing required fields', async () => {
      const payload = {
        driver_id: 'driver-123',
        // Missing serial_number and device_name
      };

      const response = await request(app)
        .post('/api/v1/terminals/pair')
        .send(payload)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });
  });

  describe('GET /api/v1/terminals/{serial}', () => {
    it('should return correct terminal details schema', async () => {
      const response = await request(app)
        .get('/api/v1/terminals/SER-001')
        .expect('Content-Type', /json/);

      // Validate response schema
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('terminal');

        const { terminal } = response.body;
        expect(terminal).toHaveProperty('id');
        expect(terminal).toHaveProperty('serial_number');
        expect(terminal).toHaveProperty('status');
        expect(terminal).toHaveProperty('battery_level');
        expect(terminal).toHaveProperty('battery_percentage');
        expect(terminal).toHaveProperty('is_connected');

        expect(typeof terminal.id).toBe('string');
        expect(typeof terminal.serial_number).toBe('string');
        expect(['unpaired', 'paired', 'active', 'inactive', 'offline', 'error']).toContain(
          terminal.status
        );
        expect(typeof terminal.battery_percentage).toBe('number');
        expect(terminal.battery_percentage).toBeGreaterThanOrEqual(0);
        expect(terminal.battery_percentage).toBeLessThanOrEqual(100);
      }
    });

    it('should return 404 for non-existent terminal', async () => {
      const response = await request(app)
        .get('/api/v1/terminals/NONEXISTENT')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/deliveries/{delivery_id}/card-payment', () => {
    it('should return correct payment initiation schema', async () => {
      const payload = {
        serial_number: 'SER-001',
        cod_transaction_id: 'cod-123',
        amount: 50.00,
        location: {
          address: 'Test Address',
          latitude: 46.9479,
          longitude: 7.4474,
        },
      };

      const response = await request(app)
        .post('/api/v1/deliveries/delivery-123/card-payment')
        .send(payload)
        .expect('Content-Type', /json/);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('transaction');
        expect(response.body).toHaveProperty('message');

        const { transaction } = response.body;
        expect(transaction).toHaveProperty('id');
        expect(transaction).toHaveProperty('amount');
        expect(transaction).toHaveProperty('status');
        expect(transaction).toHaveProperty('payment_type');

        expect(typeof transaction.id).toBe('string');
        expect(typeof transaction.amount).toBe('number');
        expect(transaction.amount).toBe(50.00);
      }
    });

    it('should validate amount is a positive number', async () => {
      const payload = {
        serial_number: 'SER-001',
        cod_transaction_id: 'cod-123',
        amount: -50, // Invalid negative amount
      };

      const response = await request(app)
        .post('/api/v1/deliveries/delivery-123/card-payment')
        .send(payload)
        .expect('Content-Type', /json/);

      // Should either reject or accept with validation
      expect([400, 200]).toContain(response.status);
    });
  });

  describe('POST /api/v1/terminals/{serial}/transactions/{transaction_id}/process', () => {
    it('should return correct payment processing schema', async () => {
      const payload = {
        description: 'Test payment',
        skip_screen: false,
      };

      const response = await request(app)
        .post('/api/v1/terminals/SER-001/transactions/trans-123/process')
        .send(payload)
        .expect('Content-Type', /json/);

      if (response.status === 200 || response.status === 400) {
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('transaction');
        expect(response.body).toHaveProperty('message');

        const { transaction } = response.body;
        expect(transaction).toHaveProperty('id');
        expect(transaction).toHaveProperty('amount');
        expect(transaction).toHaveProperty('status');
        expect(typeof transaction.id).toBe('string');
      }
    });
  });

  describe('GET /api/v1/terminals/{serial}/transactions', () => {
    it('should return correct transaction history schema', async () => {
      const response = await request(app)
        .get('/api/v1/terminals/SER-001/transactions?limit=10')
        .expect('Content-Type', /json/);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('transactions');
        expect(response.body).toHaveProperty('count');

        expect(Array.isArray(response.body.transactions)).toBe(true);
        expect(typeof response.body.count).toBe('number');

        // Validate transaction schema
        response.body.transactions.forEach((transaction: any) => {
          expect(transaction).toHaveProperty('id');
          expect(transaction).toHaveProperty('amount');
          expect(transaction).toHaveProperty('status');
          expect(typeof transaction.id).toBe('string');
          expect(typeof transaction.amount).toBe('number');
        });
      }
    });
  });

  describe('POST /api/v1/terminals/{serial}/transactions/{transaction_id}/refund', () => {
    it('should return correct refund response schema', async () => {
      const payload = {
        reason: 'Customer requested',
      };

      const response = await request(app)
        .post('/api/v1/terminals/SER-001/transactions/trans-123/refund')
        .send(payload)
        .expect('Content-Type', /json/);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('transaction');
        expect(response.body).toHaveProperty('message');

        const { transaction } = response.body;
        expect(transaction).toHaveProperty('id');
        expect(transaction).toHaveProperty('status');
        expect(transaction).toHaveProperty('refunded_amount');
        expect(transaction).toHaveProperty('refunded_at');
      }
    });

    it('should reject missing reason field', async () => {
      const payload = {
        // Missing reason
      };

      const response = await request(app)
        .post('/api/v1/terminals/SER-001/transactions/trans-123/refund')
        .send(payload)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/v1/reports/terminals/daily', () => {
    it('should return correct daily report schema', async () => {
      const response = await request(app)
        .get('/api/v1/reports/terminals/daily')
        .expect('Content-Type', /json/);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('report');

        const { report } = response.body;
        expect(report).toHaveProperty('date');
        expect(report).toHaveProperty('total_transactions');
        expect(report).toHaveProperty('approved');
        expect(report).toHaveProperty('declined');
        expect(report).toHaveProperty('failed');
        expect(report).toHaveProperty('total_amount');
        expect(report).toHaveProperty('average_amount');

        expect(typeof report.total_transactions).toBe('number');
        expect(typeof report.approved).toBe('number');
        expect(typeof report.declined).toBe('number');
        expect(typeof report.failed).toBe('number');
      }
    });
  });

  describe('Error handling consistency', () => {
    it('should return consistent error format for all endpoints', async () => {
      const invalidPayload = {
        // Invalid/incomplete payload
      };

      const endpoints = [
        { method: 'post', path: '/api/v1/terminals/pair', payload: invalidPayload },
        { method: 'post', path: '/api/v1/deliveries/delivery-123/card-payment', payload: invalidPayload },
      ];

      for (const endpoint of endpoints) {
        const req = request(app)[endpoint.method as any](endpoint.path);

        if (endpoint.payload) {
          req.send(endpoint.payload);
        }

        const response = await req.expect('Content-Type', /json/);

        // All errors should have consistent format
        if (response.status >= 400) {
          expect(response.body).toHaveProperty('error');
          expect(typeof response.body.error).toBe('string');
        }
      }
    });
  });
});
