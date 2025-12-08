/**
 * Export Service Unit Tests
 * Tests GDPR data collection and rate limiting
 */

import { DataSource, Repository } from 'typeorm';
import { ExportService } from '../services/export.service';
import { User } from '@shared/models/User';
import { Prescription } from '@shared/models/Prescription';
import { Order } from '@shared/models/Order';
import { Teleconsultation } from '@shared/models/Teleconsultation';
import { AuditTrailEntry } from '@shared/models/AuditTrailEntry';
import { Payment } from '@shared/models/Payment';
import { VipMembership } from '@shared/models/VipMembership';
import { ExportFormat } from '../interfaces/export.interface';

// Mock dependencies
jest.mock('@shared/utils/userDecryption');

describe('ExportService', () => {
  let exportService: ExportService;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockUserRepo: jest.Mocked<Repository<User>>;
  let mockAuditRepo: jest.Mocked<Repository<AuditTrailEntry>>;

  beforeEach(() => {
    // Create mock repositories
    mockUserRepo = {
      findOne: jest.fn(),
    } as any;

    mockAuditRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    } as any;

    // Create mock data source
    mockDataSource = {
      getRepository: jest.fn((entity) => {
        if (entity === User) return mockUserRepo;
        if (entity === AuditTrailEntry) return mockAuditRepo;
        return {
          find: jest.fn().mockResolvedValue([]),
          findOne: jest.fn().mockResolvedValue(null),
        } as any;
      }),
    } as any;

    exportService = new ExportService(mockDataSource);
  });

  describe('collectPatientData', () => {
    it('should collect patient data successfully', async () => {
      // Mock patient user
      const mockPatient = {
        id: 'patient-123',
        email: 'patient@test.com',
        role: 'patient',
        status: 'active',
        email_verified: true,
        mfa_enabled: false,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-12-01'),
        last_login_at: new Date('2023-12-08'),
      };

      mockUserRepo.findOne.mockResolvedValue(mockPatient as any);

      // Mock decryptUserPII
      const { decryptUserPII } = require('@shared/utils/userDecryption');
      decryptUserPII.mockResolvedValue({
        first_name: 'John',
        last_name: 'Doe',
        phone: '+41791234567',
      });

      const result = await exportService.collectPatientData(
        'patient-123',
        ExportFormat.JSON
      );

      expect(result).toBeDefined();
      expect(result.personalInformation.userId).toBe('patient-123');
      expect(result.personalInformation.firstName).toBe('John');
      expect(result.personalInformation.lastName).toBe('Doe');
      expect(result.exportMetadata.format).toBe(ExportFormat.JSON);
    });

    it('should throw error if patient not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(
        exportService.collectPatientData('invalid-id', ExportFormat.JSON)
      ).rejects.toThrow('Patient not found');
    });

    it('should throw error if user is not a patient', async () => {
      const mockUser = {
        id: 'user-123',
        role: 'pharmacist',
      };

      mockUserRepo.findOne.mockResolvedValue(mockUser as any);

      await expect(
        exportService.collectPatientData('user-123', ExportFormat.JSON)
      ).rejects.toThrow('User is not a patient');
    });
  });

  describe('canRequestExport (Rate Limiting)', () => {
    it('should allow export if no previous export', async () => {
      mockAuditRepo.findOne.mockResolvedValue(null);

      const result = await exportService.canRequestExport('patient-123');

      expect(result.allowed).toBe(true);
    });

    it('should block export if requested within 24 hours', async () => {
      const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);

      const mockAuditEntry = {
        created_at: oneHourAgo,
      };

      mockAuditRepo.findOne.mockResolvedValue(mockAuditEntry as any);

      const result = await exportService.canRequestExport('patient-123');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Please wait');
    });

    it('should allow export if more than 24 hours since last export', async () => {
      const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);

      const mockAuditEntry = {
        created_at: twentyFiveHoursAgo,
      };

      mockAuditRepo.findOne.mockResolvedValue(mockAuditEntry as any);

      const result = await exportService.canRequestExport('patient-123');

      expect(result.allowed).toBe(true);
    });
  });
});
