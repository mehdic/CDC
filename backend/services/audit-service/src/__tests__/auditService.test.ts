/**
 * Audit Service Tests
 * Tests for immutable audit logging and compliance features
 */

import { AuditService } from '../services/auditService';

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(() => {
    service = new AuditService();
  });

  describe('logEvent', () => {
    it('should create audit log with ID and timestamp', async () => {
      const logId = await service.logEvent({
        userId: 'USER-001',
        userRole: 'pharmacist',
        action: 'prescription_access',
        resource: 'prescription',
        resourceId: 'PRESC-123',
        result: 'success',
        ipAddress: '192.168.1.1',
        userAgent: 'Test Agent',
      });

      expect(logId).toMatch(/^AUDIT-\d{10}$/);
    });

    it('should log authentication events', async () => {
      const logId = await service.logAuthentication(
        'USER-001',
        'pharmacist',
        'success',
        '192.168.1.1',
        'Test Agent',
      );

      expect(logId).toBeDefined();

      const { logs } = await service.queryAuditLogs({ action: 'authentication' });
      expect(logs).toHaveLength(1);
      expect(logs[0].userId).toBe('USER-001');
      expect(logs[0].result).toBe('success');
    });

    it('should log data access events', async () => {
      const logId = await service.logDataAccess(
        'USER-001',
        'doctor',
        'patient',
        'PATIENT-456',
        '192.168.1.1',
        'Test Agent',
      );

      const { logs } = await service.queryAuditLogs({ action: 'data_access' });
      expect(logs).toHaveLength(1);
      expect(logs[0].resource).toBe('patient');
      expect(logs[0].resourceId).toBe('PATIENT-456');
      expect(logs[0].sensitiveData).toBe(true);
    });

    it('should log controlled substance transactions', async () => {
      const logId = await service.logControlledSubstance(
        'USER-001',
        'pharmacist',
        'DRUG-789',
        'dispense',
        10,
        '192.168.1.1',
        'Test Agent',
        { patientId: 'PATIENT-456' },
      );

      const { logs } = await service.queryAuditLogs({ action: 'controlled_substance_dispense' });
      expect(logs).toHaveLength(1);
      expect(logs[0].sensitiveData).toBe(true);
    });
  });

  describe('queryAuditLogs', () => {
    beforeEach(async () => {
      // Create test logs
      await service.logEvent({
        userId: 'USER-001',
        userRole: 'pharmacist',
        action: 'prescription_create',
        resource: 'prescription',
        result: 'success',
        ipAddress: '192.168.1.1',
        userAgent: 'Test',
      });

      await service.logEvent({
        userId: 'USER-002',
        userRole: 'doctor',
        action: 'patient_view',
        resource: 'patient',
        result: 'success',
        ipAddress: '192.168.1.2',
        userAgent: 'Test',
      });

      await service.logEvent({
        userId: 'USER-001',
        userRole: 'pharmacist',
        action: 'prescription_dispense',
        resource: 'prescription',
        result: 'failure',
        ipAddress: '192.168.1.1',
        userAgent: 'Test',
      });
    });

    it('should filter by userId', async () => {
      const { logs, total } = await service.queryAuditLogs({ userId: 'USER-001' });

      expect(total).toBe(2);
      expect(logs.every((log) => log.userId === 'USER-001')).toBe(true);
    });

    it('should filter by action', async () => {
      const { logs, total } = await service.queryAuditLogs({ action: 'prescription_create' });

      expect(total).toBe(1);
      expect(logs[0].action).toBe('prescription_create');
    });

    it('should filter by result', async () => {
      const { logs, total } = await service.queryAuditLogs({ result: 'failure' });

      expect(total).toBe(1);
      expect(logs[0].result).toBe('failure');
    });

    it('should support pagination', async () => {
      const { logs } = await service.queryAuditLogs({ limit: 2, offset: 1 });

      expect(logs.length).toBe(2);
    });

    it('should return logs in reverse chronological order', async () => {
      const { logs } = await service.queryAuditLogs({});

      for (let i = 0; i < logs.length - 1; i++) {
        expect(logs[i].timestamp.getTime()).toBeGreaterThanOrEqual(
          logs[i + 1].timestamp.getTime(),
        );
      }
    });
  });

  describe('exportAuditLogs', () => {
    beforeEach(async () => {
      await service.logEvent({
        userId: 'USER-001',
        userRole: 'pharmacist',
        action: 'test_action',
        resource: 'test_resource',
        result: 'success',
        ipAddress: '192.168.1.1',
        userAgent: 'Test',
      });
    });

    it('should export as JSON', async () => {
      const exported = await service.exportAuditLogs({
        format: 'json',
        query: {},
      });

      expect(exported.format).toBe('json');
      expect(exported.data).toBeTruthy();
      expect(exported.checksum).toBeDefined();

      const parsed = JSON.parse(exported.data);
      expect(parsed.logs).toBeDefined();
      expect(parsed.totalRecords).toBeGreaterThan(0);
    });

    it('should export as CSV', async () => {
      const exported = await service.exportAuditLogs({
        format: 'csv',
        query: {},
      });

      expect(exported.format).toBe('csv');
      expect(exported.data).toContain('ID,Timestamp');
    });

    it('should sanitize logs when not including details', async () => {
      const exported = await service.exportAuditLogs({
        format: 'json',
        query: {},
        includeDetails: false,
      });

      const parsed = JSON.parse(exported.data);
      const firstLog = parsed.logs[0];

      expect(firstLog.id).toBeDefined();
      expect(firstLog.ipAddress).toBeUndefined();
      expect(firstLog.details).toBeUndefined();
    });
  });

  describe('verifyLogIntegrity', () => {
    it('should verify unmodified logs', async () => {
      const logId = await service.logEvent({
        userId: 'USER-001',
        userRole: 'pharmacist',
        action: 'test',
        resource: 'test',
        result: 'success',
        ipAddress: '192.168.1.1',
        userAgent: 'Test',
      });

      const verification = await service.verifyLogIntegrity(logId);

      expect(verification.valid).toBe(true);
      expect(verification.tampered).toBe(false);
    });

    it('should return false for non-existent logs', async () => {
      const verification = await service.verifyLogIntegrity('INVALID-ID');

      expect(verification.valid).toBe(false);
      expect(verification.message).toContain('not found');
    });
  });

  describe('getAuditStatistics', () => {
    beforeEach(async () => {
      await service.logEvent({
        userId: 'USER-001',
        userRole: 'pharmacist',
        action: 'prescription_create',
        resource: 'prescription',
        result: 'success',
        ipAddress: '192.168.1.1',
        userAgent: 'Test',
      });

      await service.logEvent({
        userId: 'USER-002',
        userRole: 'doctor',
        action: 'prescription_create',
        resource: 'prescription',
        result: 'failure',
        ipAddress: '192.168.1.2',
        userAgent: 'Test',
      });
    });

    it('should return overall statistics', async () => {
      const stats = await service.getAuditStatistics();

      expect(stats.totalLogs).toBeGreaterThan(0);
      expect(stats.successCount).toBeGreaterThan(0);
      expect(stats.failureCount).toBeGreaterThan(0);
    });

    it('should count by action', async () => {
      const stats = await service.getAuditStatistics();

      expect(stats.byAction).toHaveProperty('prescription_create');
      expect(stats.byAction.prescription_create).toBe(2);
    });

    it('should count by resource', async () => {
      const stats = await service.getAuditStatistics();

      expect(stats.byResource).toHaveProperty('prescription');
    });

    it('should count by user', async () => {
      const stats = await service.getAuditStatistics();

      expect(stats.byUser).toHaveProperty('USER-001');
      expect(stats.byUser).toHaveProperty('USER-002');
    });
  });

  describe('applyRetentionPolicy', () => {
    it('should retain recent logs', async () => {
      await service.logEvent({
        userId: 'USER-001',
        userRole: 'pharmacist',
        action: 'test',
        resource: 'test',
        result: 'success',
        ipAddress: '192.168.1.1',
        userAgent: 'Test',
      });

      const result = await service.applyRetentionPolicy(365);

      expect(result.retainedCount).toBeGreaterThan(0);
    });
  });
});
