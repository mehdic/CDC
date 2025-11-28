/**
 * Audit Service Tests
 * Task T3-028: Write comprehensive tests
 */

import { DataSource, Repository } from 'typeorm';
import { Request } from 'express';
import {
  AuditService,
  initializeAuditService,
  getAuditService,
  AuditEventType,
  AuditResourceType,
} from '../auditService';
import { AuditTrailEntry, AuditAction } from '../../models/AuditTrailEntry';

// Mock TypeORM
jest.mock('typeorm', () => ({
  DataSource: jest.fn(),
  Repository: jest.fn(),
  LessThanOrEqual: jest.fn(),
  MoreThanOrEqual: jest.fn(),
  In: jest.fn(),
}));

// Mock audit utilities
jest.mock('../../utils/audit', () => ({
  logAuditEvent: jest.fn().mockResolvedValue({
    id: 'audit-123',
    event_type: 'test.event',
  }),
  logAuditEventFromRequest: jest.fn().mockResolvedValue({
    id: 'audit-456',
    event_type: 'test.event',
  }),
  createChangesObject: jest.fn((oldRecord, newRecord, fields) => {
    const changes: any = {};
    fields.forEach((field: string) => {
      if (oldRecord[field] !== newRecord[field]) {
        changes[field] = { old: oldRecord[field], new: newRecord[field] };
      }
    });
    return changes;
  }),
}));

describe('AuditService', () => {
  let dataSource: DataSource;
  let auditService: AuditService;
  let mockRequest: Partial<Request>;

  beforeEach(() => {
    dataSource = new DataSource({} as any);
    auditService = new AuditService(dataSource);

    mockRequest = {
      headers: {
        'user-agent': 'Mozilla/5.0',
        'x-forwarded-for': '192.168.1.1',
      },
      socket: {
        remoteAddress: '192.168.1.1',
      } as any,
    };

    jest.clearAllMocks();
  });

  describe('Prescription Audit Logging', () => {
    it('should log prescription approval', async () => {
      const { logAuditEventFromRequest } = require('../../utils/audit');

      await auditService.logPrescriptionApproval(
        mockRequest as Request,
        'prescription-123',
        'user-456',
        'pharmacy-789',
        'pending'
      );

      expect(logAuditEventFromRequest).toHaveBeenCalledWith(
        dataSource,
        mockRequest,
        expect.objectContaining({
          userId: 'user-456',
          pharmacyId: 'pharmacy-789',
          eventType: AuditEventType.PRESCRIPTION_APPROVED,
          action: AuditAction.UPDATE,
          resourceType: AuditResourceType.PRESCRIPTION,
          resourceId: 'prescription-123',
          changes: expect.objectContaining({
            status: { old: 'pending', new: 'approved' },
          }),
        })
      );
    });

    it('should log prescription rejection with reason', async () => {
      const { logAuditEventFromRequest } = require('../../utils/audit');

      await auditService.logPrescriptionRejection(
        mockRequest as Request,
        'prescription-123',
        'user-456',
        'pharmacy-789',
        'pending',
        'Invalid prescription format'
      );

      expect(logAuditEventFromRequest).toHaveBeenCalledWith(
        dataSource,
        mockRequest,
        expect.objectContaining({
          eventType: AuditEventType.PRESCRIPTION_REJECTED,
          changes: expect.objectContaining({
            status: { old: 'pending', new: 'rejected' },
            rejection_reason: { old: null, new: 'Invalid prescription format' },
          }),
        })
      );
    });

    it('should log prescription dispensing', async () => {
      const { logAuditEventFromRequest } = require('../../utils/audit');

      await auditService.logPrescriptionDispensed(
        mockRequest as Request,
        'prescription-123',
        'user-456',
        'pharmacy-789'
      );

      expect(logAuditEventFromRequest).toHaveBeenCalledWith(
        dataSource,
        mockRequest,
        expect.objectContaining({
          eventType: AuditEventType.PRESCRIPTION_DISPENSED,
          changes: expect.objectContaining({
            status: { old: 'approved', new: 'dispensed' },
          }),
        })
      );
    });
  });

  describe('Drug Interaction Audit Logging', () => {
    it('should log drug interaction check', async () => {
      const { logAuditEventFromRequest } = require('../../utils/audit');

      const interactions = [
        { severity: 'high', description: 'Test interaction' },
      ];

      await auditService.logDrugInteractionCheck(
        mockRequest as Request,
        'prescription-123',
        'user-456',
        'pharmacy-789',
        ['drug-1', 'drug-2'],
        interactions
      );

      expect(logAuditEventFromRequest).toHaveBeenCalledWith(
        dataSource,
        mockRequest,
        expect.objectContaining({
          eventType: AuditEventType.DRUG_INTERACTION_CHECKED,
          action: AuditAction.READ,
          changes: expect.objectContaining({
            drugs_checked: { old: null, new: ['drug-1', 'drug-2'] },
            interactions_found: { old: null, new: 1 },
          }),
        })
      );
    });

    it('should log drug interaction override with justification', async () => {
      const { logAuditEventFromRequest } = require('../../utils/audit');

      await auditService.logDrugInteractionOverride(
        mockRequest as Request,
        'prescription-123',
        'user-456',
        'pharmacy-789',
        'interaction-999',
        'Patient already taking both medications under supervision'
      );

      expect(logAuditEventFromRequest).toHaveBeenCalledWith(
        dataSource,
        mockRequest,
        expect.objectContaining({
          eventType: AuditEventType.DRUG_INTERACTION_OVERRIDE,
          resourceType: AuditResourceType.DRUG_INTERACTION,
          resourceId: 'interaction-999',
          changes: expect.objectContaining({
            justification: { old: null, new: 'Patient already taking both medications under supervision' },
            overridden_by: { old: null, new: 'user-456' },
          }),
        })
      );
    });
  });

  describe('Patient Data Audit Logging', () => {
    it('should log patient record access', async () => {
      const { logAuditEventFromRequest } = require('../../utils/audit');

      await auditService.logPatientRecordAccess(
        mockRequest as Request,
        'patient-123',
        'user-456',
        'pharmacy-789',
        'Prescription validation'
      );

      expect(logAuditEventFromRequest).toHaveBeenCalledWith(
        dataSource,
        mockRequest,
        expect.objectContaining({
          eventType: AuditEventType.PATIENT_RECORD_ACCESSED,
          action: AuditAction.READ,
          resourceType: AuditResourceType.PATIENT_RECORD,
          resourceId: 'patient-123',
          changes: { access_reason: { old: null, new: 'Prescription validation' } },
        })
      );
    });

    it('should log patient record update', async () => {
      const { logAuditEventFromRequest } = require('../../utils/audit');

      const oldRecord = { phone: '0123456789', email: 'old@example.com' };
      const newRecord = { phone: '0987654321', email: 'old@example.com' };

      await auditService.logPatientRecordUpdate(
        mockRequest as Request,
        'patient-123',
        'user-456',
        'pharmacy-789',
        oldRecord,
        newRecord,
        ['phone', 'email']
      );

      expect(logAuditEventFromRequest).toHaveBeenCalledWith(
        dataSource,
        mockRequest,
        expect.objectContaining({
          eventType: AuditEventType.PATIENT_RECORD_UPDATED,
          action: AuditAction.UPDATE,
        })
      );
    });

    it('should log patient record export (GDPR)', async () => {
      const { logAuditEventFromRequest } = require('../../utils/audit');

      await auditService.logPatientRecordExport(
        mockRequest as Request,
        'patient-123',
        'user-456',
        'PDF'
      );

      expect(logAuditEventFromRequest).toHaveBeenCalledWith(
        dataSource,
        mockRequest,
        expect.objectContaining({
          eventType: AuditEventType.PATIENT_RECORD_EXPORTED,
          pharmacyId: null, // Global event
          changes: expect.objectContaining({
            export_format: { old: null, new: 'PDF' },
          }),
        })
      );
    });
  });

  describe('Teleconsultation Audit Logging', () => {
    it('should log teleconsultation started', async () => {
      const { logAuditEventFromRequest } = require('../../utils/audit');

      await auditService.logTeleconsultationStarted(
        mockRequest as Request,
        'telecon-123',
        'user-456',
        'pharmacy-789',
        'patient-111',
        'pharmacist-222'
      );

      expect(logAuditEventFromRequest).toHaveBeenCalledWith(
        dataSource,
        mockRequest,
        expect.objectContaining({
          eventType: AuditEventType.TELECONSULTATION_STARTED,
          resourceType: AuditResourceType.TELECONSULTATION,
          changes: expect.objectContaining({
            status: { old: 'scheduled', new: 'in_progress' },
            patient_id: { old: null, new: 'patient-111' },
            pharmacist_id: { old: null, new: 'pharmacist-222' },
          }),
        })
      );
    });

    it('should log teleconsultation ended with duration', async () => {
      const { logAuditEventFromRequest } = require('../../utils/audit');

      await auditService.logTeleconsultationEnded(
        mockRequest as Request,
        'telecon-123',
        'user-456',
        'pharmacy-789',
        15
      );

      expect(logAuditEventFromRequest).toHaveBeenCalledWith(
        dataSource,
        mockRequest,
        expect.objectContaining({
          eventType: AuditEventType.TELECONSULTATION_ENDED,
          changes: expect.objectContaining({
            status: { old: 'in_progress', new: 'completed' },
            duration_minutes: { old: null, new: 15 },
          }),
        })
      );
    });
  });

  describe('Authentication Audit Logging', () => {
    it('should log successful user login', async () => {
      const { logAuditEventFromRequest } = require('../../utils/audit');

      await auditService.logUserLogin(
        mockRequest as Request,
        'user-456',
        'user@example.com',
        true
      );

      expect(logAuditEventFromRequest).toHaveBeenCalledWith(
        dataSource,
        mockRequest,
        expect.objectContaining({
          userId: 'user-456',
          eventType: AuditEventType.USER_LOGIN,
          pharmacyId: null, // Global event
          changes: expect.objectContaining({
            success: { old: null, new: true },
          }),
        })
      );
    });

    it('should log failed user login', async () => {
      const { logAuditEventFromRequest } = require('../../utils/audit');

      await auditService.logUserLogin(
        mockRequest as Request,
        'unknown-user',
        'wrong@example.com',
        false
      );

      expect(logAuditEventFromRequest).toHaveBeenCalledWith(
        dataSource,
        mockRequest,
        expect.objectContaining({
          userId: 'unknown',
          eventType: AuditEventType.USER_LOGIN_FAILED,
          changes: expect.objectContaining({
            success: { old: null, new: false },
          }),
        })
      );
    });

    it('should log MFA verification', async () => {
      const { logAuditEventFromRequest } = require('../../utils/audit');

      await auditService.logMFAVerification(
        mockRequest as Request,
        'user-456',
        true,
        'totp'
      );

      expect(logAuditEventFromRequest).toHaveBeenCalledWith(
        dataSource,
        mockRequest,
        expect.objectContaining({
          eventType: AuditEventType.MFA_VERIFIED,
          changes: expect.objectContaining({
            mfa_method: { old: null, new: 'totp' },
            success: { old: null, new: true },
          }),
        })
      );
    });
  });

  describe('Inventory Audit Logging', () => {
    it('should log low stock alert', async () => {
      const { logAuditEvent } = require('../../utils/audit');

      await auditService.logInventoryLowStock(
        'user-456',
        'pharmacy-789',
        'item-123',
        5,
        10
      );

      expect(logAuditEvent).toHaveBeenCalledWith(
        dataSource,
        expect.objectContaining({
          eventType: AuditEventType.INVENTORY_LOW_STOCK,
          resourceType: AuditResourceType.INVENTORY_ITEM,
          changes: expect.objectContaining({
            current_quantity: { old: null, new: 5 },
            threshold: { old: null, new: 10 },
          }),
        })
      );
    });

    it('should log inventory restock', async () => {
      const { logAuditEventFromRequest } = require('../../utils/audit');

      await auditService.logInventoryRestock(
        mockRequest as Request,
        'item-123',
        'user-456',
        'pharmacy-789',
        5,
        100,
        'supplier-999'
      );

      expect(logAuditEventFromRequest).toHaveBeenCalledWith(
        dataSource,
        mockRequest,
        expect.objectContaining({
          eventType: AuditEventType.INVENTORY_RESTOCKED,
          changes: expect.objectContaining({
            quantity: { old: 5, new: 100 },
            supplier_id: { old: null, new: 'supplier-999' },
          }),
        })
      );
    });
  });

  describe('Service Initialization', () => {
    it('should initialize audit service', () => {
      const service = initializeAuditService(dataSource);
      expect(service).toBeInstanceOf(AuditService);
    });

    it('should return initialized audit service', () => {
      initializeAuditService(dataSource);
      const service = getAuditService();
      expect(service).toBeInstanceOf(AuditService);
    });

    it('should throw error if service not initialized', () => {
      // Reset the singleton
      jest.resetModules();
      const { getAuditService: freshGetService } = require('../auditService');
      expect(() => freshGetService()).toThrow('AuditService not initialized');
    });
  });
});
