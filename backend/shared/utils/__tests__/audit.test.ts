/**
 * Unit Tests for Audit Trail Logging Utility
 * Tests logAuditEvent(), extractRequestContext(), and helper functions
 */

import { DataSource, Repository } from 'typeorm';
import { Request } from 'express';
import {
  logAuditEvent,
  logAuditEventFromRequest,
  extractRequestContext,
  parseDeviceInfo,
  createChangesObject,
  LogAuditEventParams,
} from '../audit';
import { AuditTrailEntry, AuditAction, AuditChanges, DeviceInfo } from '../../models/AuditTrailEntry';

// Mock TypeORM
jest.mock('typeorm');

describe('Audit Trail Utility', () => {
  let mockDataSource: jest.Mocked<DataSource>;
  let mockRepository: jest.Mocked<Repository<AuditTrailEntry>>;

  beforeEach(() => {
    // Create mock repository
    mockRepository = {
      save: jest.fn(),
    } as any;

    // Create mock DataSource
    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepository),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('logAuditEvent()', () => {
    it('should create and save an audit entry with all parameters', async () => {
      const params: LogAuditEventParams = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        pharmacyId: '987fcdeb-51a2-43d7-a456-426614174111',
        eventType: 'prescription.approved',
        action: AuditAction.UPDATE,
        resourceType: 'prescription',
        resourceId: 'abc12345-e89b-12d3-a456-426614174222',
        changes: {
          status: { old: 'in_review', new: 'approved' },
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        deviceInfo: { os: 'iOS', browser: 'Safari', platform: 'mobile' },
      };

      const mockSavedEntry = { id: 'saved-entry-id', ...params } as unknown as AuditTrailEntry;
      mockRepository.save.mockResolvedValue(mockSavedEntry);

      const result = await logAuditEvent(mockDataSource, params);

      expect(mockDataSource.getRepository).toHaveBeenCalledWith(AuditTrailEntry);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSavedEntry);
    });

    it('should create audit entry without optional fields', async () => {
      const params: LogAuditEventParams = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        eventType: 'prescription.created',
        action: AuditAction.CREATE,
        resourceType: 'prescription',
        resourceId: 'abc12345-e89b-12d3-a456-426614174222',
      };

      const mockSavedEntry = { id: 'saved-entry-id', ...params } as unknown as AuditTrailEntry;
      mockRepository.save.mockResolvedValue(mockSavedEntry);

      const result = await logAuditEvent(mockDataSource, params);

      expect(result).toEqual(mockSavedEntry);
    });

    it('should throw error if userId is missing', async () => {
      const params = {
        eventType: 'prescription.approved',
        action: AuditAction.UPDATE,
        resourceType: 'prescription',
        resourceId: 'abc12345',
      } as LogAuditEventParams;

      await expect(logAuditEvent(mockDataSource, params)).rejects.toThrow('Audit event requires userId');
    });

    it('should throw error if eventType is missing', async () => {
      const params = {
        userId: '123e4567',
        action: AuditAction.UPDATE,
        resourceType: 'prescription',
        resourceId: 'abc12345',
      } as LogAuditEventParams;

      await expect(logAuditEvent(mockDataSource, params)).rejects.toThrow('Audit event requires eventType');
    });

    it('should throw error if action is missing', async () => {
      const params = {
        userId: '123e4567',
        eventType: 'prescription.approved',
        resourceType: 'prescription',
        resourceId: 'abc12345',
      } as LogAuditEventParams;

      await expect(logAuditEvent(mockDataSource, params)).rejects.toThrow('Audit event requires action');
    });

    it('should throw error if resourceType is missing', async () => {
      const params = {
        userId: '123e4567',
        eventType: 'prescription.approved',
        action: AuditAction.UPDATE,
        resourceId: 'abc12345',
      } as LogAuditEventParams;

      await expect(logAuditEvent(mockDataSource, params)).rejects.toThrow(
        'Audit event requires resourceType'
      );
    });

    it('should throw error if resourceId is missing', async () => {
      const params = {
        userId: '123e4567',
        eventType: 'prescription.approved',
        action: AuditAction.UPDATE,
        resourceType: 'prescription',
      } as LogAuditEventParams;

      await expect(logAuditEvent(mockDataSource, params)).rejects.toThrow('Audit event requires resourceId');
    });
  });

  describe('extractRequestContext()', () => {
    it('should extract IP address from x-forwarded-for header', () => {
      const req = {
        headers: {
          'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178',
          'user-agent': 'Mozilla/5.0',
        },
        socket: { remoteAddress: '127.0.0.1' },
      } as unknown as Request;

      const context = extractRequestContext(req);

      expect(context.ipAddress).toBe('203.0.113.195'); // First IP in chain
      expect(context.userAgent).toBe('Mozilla/5.0');
    });

    it('should extract IP address from x-real-ip header if x-forwarded-for is missing', () => {
      const req = {
        headers: {
          'x-real-ip': '203.0.113.195',
          'user-agent': 'Mozilla/5.0',
        },
        socket: { remoteAddress: '127.0.0.1' },
      } as unknown as Request;

      const context = extractRequestContext(req);

      expect(context.ipAddress).toBe('203.0.113.195');
    });

    it('should extract IP address from socket.remoteAddress if headers are missing', () => {
      const req = {
        headers: {
          'user-agent': 'Mozilla/5.0',
        },
        socket: { remoteAddress: '192.168.1.100' },
      } as unknown as Request;

      const context = extractRequestContext(req);

      expect(context.ipAddress).toBe('192.168.1.100');
    });

    it('should return null if IP address is unavailable', () => {
      const req = {
        headers: {},
        socket: {},
      } as unknown as Request;

      const context = extractRequestContext(req);

      expect(context.ipAddress).toBeNull();
    });

    it('should extract user agent', () => {
      const req = {
        headers: {
          'user-agent': 'MetaPharmApp/1.2.3 (iOS 14.0)',
        },
        socket: { remoteAddress: '192.168.1.100' },
      } as unknown as Request;

      const context = extractRequestContext(req);

      expect(context.userAgent).toBe('MetaPharmApp/1.2.3 (iOS 14.0)');
    });

    it('should parse device info from user agent', () => {
      const req = {
        headers: {
          'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        },
        socket: { remoteAddress: '192.168.1.100' },
      } as unknown as Request;

      const context = extractRequestContext(req);

      expect(context.deviceInfo).toEqual({
        os: 'iOS',
        browser: 'Safari',
        platform: 'mobile',
      });
    });
  });

  describe('parseDeviceInfo()', () => {
    it('should detect iOS device', () => {
      const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
      const deviceInfo = parseDeviceInfo(userAgent);

      expect(deviceInfo).toEqual({
        os: 'iOS',
        browser: 'Safari',
        platform: 'mobile',
      });
    });

    it('should detect Android device', () => {
      const userAgent = 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 Chrome/91.0.4472.120';
      const deviceInfo = parseDeviceInfo(userAgent);

      expect(deviceInfo).toEqual({
        os: 'Android',
        browser: 'Chrome',
        platform: 'mobile',
      });
    });

    it('should detect Windows desktop', () => {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0.4472.124';
      const deviceInfo = parseDeviceInfo(userAgent);

      expect(deviceInfo).toEqual({
        os: 'Windows',
        browser: 'Chrome',
        platform: 'desktop',
      });
    });

    it('should detect macOS desktop', () => {
      const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15';
      const deviceInfo = parseDeviceInfo(userAgent);

      expect(deviceInfo).toEqual({
        os: 'macOS',
        browser: 'Safari',
        platform: 'desktop',
      });
    });

    it('should detect app version from custom user agent', () => {
      const userAgent = 'MetaPharmApp/1.2.3 (iOS 14.0)';
      const deviceInfo = parseDeviceInfo(userAgent);

      expect(deviceInfo?.app_version).toBe('1.2.3');
    });

    it('should return null for null user agent', () => {
      const deviceInfo = parseDeviceInfo(null);
      expect(deviceInfo).toBeNull();
    });
  });

  describe('createChangesObject()', () => {
    it('should create changes object for modified fields', () => {
      const oldRecord = {
        status: 'pending',
        approved_at: null,
        pharmacist_id: null,
      };

      const newRecord = {
        status: 'approved',
        approved_at: new Date('2025-11-07T10:00:00Z'),
        pharmacist_id: '123e4567',
      };

      const changes = createChangesObject(oldRecord, newRecord, ['status', 'approved_at', 'pharmacist_id']);

      expect(changes).toEqual({
        status: { old: 'pending', new: 'approved' },
        approved_at: { old: null, new: new Date('2025-11-07T10:00:00Z') },
        pharmacist_id: { old: null, new: '123e4567' },
      });
    });

    it('should only include changed fields', () => {
      const oldRecord = {
        status: 'approved',
        approved_at: new Date('2025-11-07T10:00:00Z'),
        pharmacist_id: '123e4567',
      };

      const newRecord = {
        status: 'approved', // Not changed
        approved_at: new Date('2025-11-07T10:00:00Z'), // Not changed
        pharmacist_id: '987fcdeb', // Changed
      };

      const changes = createChangesObject(oldRecord, newRecord, ['status', 'approved_at', 'pharmacist_id']);

      expect(changes).toEqual({
        pharmacist_id: { old: '123e4567', new: '987fcdeb' },
      });
    });

    it('should return null if no fields changed', () => {
      const oldRecord = {
        status: 'approved',
        approved_at: new Date('2025-11-07T10:00:00Z'),
      };

      const newRecord = {
        status: 'approved',
        approved_at: new Date('2025-11-07T10:00:00Z'),
      };

      const changes = createChangesObject(oldRecord, newRecord, ['status', 'approved_at']);

      expect(changes).toBeNull();
    });

    it('should handle complex objects', () => {
      const oldRecord = {
        metadata: { version: 1, tags: ['urgent'] },
      };

      const newRecord = {
        metadata: { version: 2, tags: ['urgent', 'high-priority'] },
      };

      const changes = createChangesObject(oldRecord, newRecord, ['metadata']);

      expect(changes).toEqual({
        metadata: {
          old: { version: 1, tags: ['urgent'] },
          new: { version: 2, tags: ['urgent', 'high-priority'] },
        },
      });
    });
  });

  describe('logAuditEventFromRequest()', () => {
    it('should extract request context and log audit event', async () => {
      const req = {
        headers: {
          'x-forwarded-for': '203.0.113.195',
          'user-agent': 'MetaPharmApp/1.2.3 (iOS 14.0)',
        },
        socket: { remoteAddress: '127.0.0.1' },
      } as unknown as Request;

      const params = {
        userId: '123e4567',
        pharmacyId: '987fcdeb',
        eventType: 'prescription.approved',
        action: AuditAction.UPDATE,
        resourceType: 'prescription',
        resourceId: 'abc12345',
      };

      const mockSavedEntry = { id: 'saved-entry-id' } as AuditTrailEntry;
      mockRepository.save.mockResolvedValue(mockSavedEntry);

      const result = await logAuditEventFromRequest(mockDataSource, req, params);

      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSavedEntry);

      // Verify context was extracted
      const savedAuditEntry = mockRepository.save.mock.calls[0][0] as AuditTrailEntry;
      expect(savedAuditEntry.ip_address).toBe('203.0.113.195');
      expect(savedAuditEntry.user_agent).toBe('MetaPharmApp/1.2.3 (iOS 14.0)');
      expect(savedAuditEntry.device_info).toEqual({
        os: 'iOS',
        platform: 'mobile',
        app_version: '1.2.3',
      });
    });
  });
});
