/**
 * Audit Client Tests
 * Task: T8-009 - Audit Service Integration
 */

import axios from 'axios';
import { AuditClient } from '../auditClient';

jest.mock('axios');

describe('AuditClient', () => {
  let auditClient: AuditClient;
  const mockBaseUrl = 'http://audit-service:4003';
  const mockServiceKey = 'test-key';

  beforeEach(() => {
    jest.clearAllMocks();
    auditClient = new AuditClient(mockBaseUrl, mockServiceKey);
  });

  describe('Constructor', () => {
    it('should initialize with custom base URL and service key', () => {
      const client = new AuditClient(mockBaseUrl, mockServiceKey);
      expect(client).toBeDefined();
    });

    it('should use environment variables when not provided', () => {
      process.env.AUDIT_SERVICE_URL = 'http://custom-audit:4003';
      process.env.SERVICE_KEY = 'env-key';

      const client = new AuditClient();
      expect(client).toBeDefined();

      delete process.env.AUDIT_SERVICE_URL;
      delete process.env.SERVICE_KEY;
    });
  });

  describe('logEvent', () => {
    it('should log a generic audit event', async () => {
      const mockResponse = {
        data: {
          id: 'AUDIT-0000000001',
          timestamp: new Date().toISOString(),
        },
      };

      (axios.create as jest.Mock).mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
      });

      const client = new AuditClient(mockBaseUrl, mockServiceKey);
      const result = await client.logEvent({
        userId: 'user-123',
        userRole: 'pharmacist',
        action: 'prescription_creation',
        resource: 'prescription',
        resourceId: 'rx-001',
        result: 'success',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(result).toBeDefined();
      expect(result?.success).toBe(true);
    });

    it('should handle audit service errors gracefully', async () => {
      (axios.create as jest.Mock).mockReturnValue({
        post: jest.fn().mockRejectedValue(new Error('Service unavailable')),
      });

      const client = new AuditClient(mockBaseUrl, mockServiceKey);
      const result = await client.logEvent({
        userId: 'user-123',
        userRole: 'pharmacist',
        action: 'prescription_creation',
        resource: 'prescription',
        result: 'success',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(result).toBeNull();
    });
  });

  describe('logPrescriptionCreation', () => {
    it('should log prescription creation event', async () => {
      const mockResponse = { data: { id: 'AUDIT-0000000001' } };

      (axios.create as jest.Mock).mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
      });

      const client = new AuditClient(mockBaseUrl, mockServiceKey);
      const result = await client.logPrescriptionCreation(
        'user-123',
        'rx-001',
        { patient_id: 'pat-001', drug: 'Aspirin' },
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(result).toBeDefined();
      expect(result?.success).toBe(true);
    });
  });

  describe('logPrescriptionModification', () => {
    it('should log prescription modification with before/after state', async () => {
      const mockResponse = { data: { id: 'AUDIT-0000000001' } };

      (axios.create as jest.Mock).mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
      });

      const client = new AuditClient(mockBaseUrl, mockServiceKey);
      const result = await client.logPrescriptionModification(
        'user-123',
        'rx-001',
        [
          {
            field: 'quantity',
            oldValue: 30,
            newValue: 60,
          },
        ],
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(result).toBeDefined();
      expect(result?.success).toBe(true);
    });
  });

  describe('logPrescriptionDispensing', () => {
    it('should log prescription dispensing event', async () => {
      const mockResponse = { data: { id: 'AUDIT-0000000001' } };

      (axios.create as jest.Mock).mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
      });

      const client = new AuditClient(mockBaseUrl, mockServiceKey);
      const result = await client.logPrescriptionDispensing(
        'user-123',
        'rx-001',
        { batch_number: 'BATCH-123', dispensed_quantity: 30 },
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(result).toBeDefined();
      expect(result?.success).toBe(true);
    });
  });

  describe('logPrescriptionRejection', () => {
    it('should log prescription rejection with reason', async () => {
      const mockResponse = { data: { id: 'AUDIT-0000000001' } };

      (axios.create as jest.Mock).mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
      });

      const client = new AuditClient(mockBaseUrl, mockServiceKey);
      const result = await client.logPrescriptionRejection(
        'user-123',
        'rx-001',
        'Drug interaction detected',
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(result).toBeDefined();
      expect(result?.success).toBe(true);
    });
  });

  describe('logQRCodeScan', () => {
    it('should log successful QR code scan', async () => {
      const mockResponse = { data: { id: 'AUDIT-0000000001' } };

      (axios.create as jest.Mock).mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
      });

      const client = new AuditClient(mockBaseUrl, mockServiceKey);
      const result = await client.logQRCodeScan(
        'user-123',
        'rx-001',
        'pat-001',
        'success',
        '192.168.1.1',
        'Mozilla/5.0',
        { scan_time_ms: 150 }
      );

      expect(result).toBeDefined();
      expect(result?.success).toBe(true);
    });

    it('should log failed QR code scan', async () => {
      const mockResponse = { data: { id: 'AUDIT-0000000001' } };

      (axios.create as jest.Mock).mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
      });

      const client = new AuditClient(mockBaseUrl, mockServiceKey);
      const result = await client.logQRCodeScan(
        'user-123',
        'rx-001',
        'pat-001',
        'failure',
        '192.168.1.1',
        'Mozilla/5.0',
        { error: 'Checksum mismatch' }
      );

      expect(result).toBeDefined();
    });
  });

  describe('logDrugInteractionAcknowledgment', () => {
    it('should log drug interaction acknowledgment', async () => {
      const mockResponse = { data: { id: 'AUDIT-0000000001' } };

      (axios.create as jest.Mock).mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
      });

      const client = new AuditClient(mockBaseUrl, mockServiceKey);
      const result = await client.logDrugInteractionAcknowledgment(
        'user-123',
        'rx-001',
        'moderate_interaction',
        '192.168.1.1',
        'Mozilla/5.0',
        { drug1: 'Aspirin', drug2: 'Warfarin' }
      );

      expect(result).toBeDefined();
      expect(result?.success).toBe(true);
    });
  });

  describe('queryAuditLogs', () => {
    it('should query audit logs with filters', async () => {
      const mockResponse = {
        data: {
          logs: [
            {
              id: 'AUDIT-0000000001',
              userId: 'user-123',
              action: 'prescription_creation',
            },
          ],
          total: 1,
        },
      };

      (axios.create as jest.Mock).mockReturnValue({
        get: jest.fn().mockResolvedValue(mockResponse),
      });

      const client = new AuditClient(mockBaseUrl, mockServiceKey);
      const result = await client.queryAuditLogs({
        userId: 'user-123',
        action: 'prescription_creation',
        limit: 10,
      });

      expect(result).toBeDefined();
      expect(result?.logs).toHaveLength(1);
      expect(result?.total).toBe(1);
    });
  });

  describe('healthCheck', () => {
    it('should return true when service is healthy', async () => {
      (axios.create as jest.Mock).mockReturnValue({
        get: jest.fn().mockResolvedValue({ status: 200 }),
      });

      const client = new AuditClient(mockBaseUrl, mockServiceKey);
      const result = await client.healthCheck();

      expect(result).toBe(true);
    });

    it('should return false when service is unavailable', async () => {
      (axios.create as jest.Mock).mockReturnValue({
        get: jest.fn().mockRejectedValue(new Error('Service unavailable')),
      });

      const client = new AuditClient(mockBaseUrl, mockServiceKey);
      const result = await client.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('Retry Logic', () => {
    it('should retry on network errors', async () => {
      const mockError = new Error('ECONNREFUSED');
      (mockError as any).code = 'ECONNREFUSED';

      const mockPost = jest
        .fn()
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce({ data: { id: 'AUDIT-0000000001' } });

      (axios.create as jest.Mock).mockReturnValue({
        post: mockPost,
      });

      const client = new AuditClient(mockBaseUrl, mockServiceKey);
      const result = await client.logEvent({
        userId: 'user-123',
        userRole: 'pharmacist',
        action: 'test',
        resource: 'test',
        result: 'success',
        ipAddress: '192.168.1.1',
        userAgent: 'test',
      });

      expect(mockPost).toHaveBeenCalledTimes(2);
      expect(result?.success).toBe(true);
    });

    it('should retry on 5xx server errors', async () => {
      const mockPost = jest
        .fn()
        .mockRejectedValueOnce({ response: { status: 503 } })
        .mockResolvedValueOnce({ data: { id: 'AUDIT-0000000001' } });

      (axios.create as jest.Mock).mockReturnValue({
        post: mockPost,
      });

      const client = new AuditClient(mockBaseUrl, mockServiceKey);
      const result = await client.logEvent({
        userId: 'user-123',
        userRole: 'pharmacist',
        action: 'test',
        resource: 'test',
        result: 'success',
        ipAddress: '192.168.1.1',
        userAgent: 'test',
      });

      expect(mockPost).toHaveBeenCalledTimes(2);
    });
  });
});
