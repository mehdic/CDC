/**
 * Unit Tests: Driver Verification Service
 * Tests core business logic for driver identity verification
 */

import { DriverVerificationService } from '../../src/services/driver-verification/driver-verification.service';
import { DriverVerificationRepository } from '../../src/repository/driver-verification.repository';
import {
  GovernmentIDType,
  VerificationStatus,
  AuthorizationLevel,
  VerificationEventType
} from '../../src/types/driver-verification.types';

describe('Driver Verification Service - Unit Tests', () => {
  let service: DriverVerificationService;
  let mockRepository: jest.Mocked<DriverVerificationRepository>;

  beforeEach(() => {
    // Mock repository
    mockRepository = {
      createGovernmentID: jest.fn(),
      getGovernmentIDByDriverId: jest.fn(),
      updateVerificationStatus: jest.fn(),
      createDriverLicense: jest.fn(),
      getDriverLicenseByDriverId: jest.fn(),
      createAuthorization: jest.fn(),
      getActiveAuthorizations: jest.fn(),
      revokeAuthorization: jest.fn(),
      createPhotoVerification: jest.fn(),
      createElectronicSignature: jest.fn(),
      logVerificationEvent: jest.fn(),
      getAuditLogsByDriver: jest.fn(),
      createEmergencyOverride: jest.fn(),
      markOverrideAsUsed: jest.fn()
    } as any;

    service = new DriverVerificationService(mockRepository);
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // Test Suite 1: Government ID Verification
  // =========================================================================

  describe('Government ID Verification', () => {
    test('verifies valid Swiss ID successfully', async () => {
      const validSwissID = {
        driverId: 'driver-123',
        idType: GovernmentIDType.SWISS_ID,
        idNumber: '756.1234.5678.90',
        issuingAuthority: 'Canton de Genève',
        issuingCountry: 'CHE',
        issueDate: '2020-01-01',
        expiryDate: '2030-01-01'
      };

      mockRepository.createGovernmentID.mockResolvedValue({
        ...validSwissID,
        id: 'id-123',
        issueDate: new Date(validSwissID.issueDate),
        expiryDate: new Date(validSwissID.expiryDate),
        verificationStatus: VerificationStatus.VERIFIED,
        verifiedAt: new Date(),
        verifiedBy: 'pharmacist-1',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockRepository.logVerificationEvent.mockResolvedValue({} as any);

      const result = await service.verifyDriverID(validSwissID, 'pharmacist-1');

      expect(result.success).toBe(true);
      expect(result.governmentID).toBeDefined();
      expect(result.errors).toHaveLength(0);
      expect(mockRepository.createGovernmentID).toHaveBeenCalled();
      expect(mockRepository.logVerificationEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: VerificationEventType.ID_VERIFIED
        })
      );
    });

    test('rejects invalid Swiss ID format', async () => {
      const invalidSwissID = {
        driverId: 'driver-123',
        idType: GovernmentIDType.SWISS_ID,
        idNumber: 'invalid-format',
        issuingAuthority: 'Canton de Genève',
        issuingCountry: 'CHE',
        issueDate: '2020-01-01',
        expiryDate: '2030-01-01'
      };

      const result = await service.verifyDriverID(invalidSwissID, 'pharmacist-1');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Invalid Swiss ID format');
      expect(mockRepository.createGovernmentID).not.toHaveBeenCalled();
    });

    test('rejects expired ID', async () => {
      const expiredID = {
        driverId: 'driver-123',
        idType: GovernmentIDType.SWISS_ID,
        idNumber: '756.1234.5678.90',
        issuingAuthority: 'Canton de Genève',
        issuingCountry: 'CHE',
        issueDate: '2010-01-01',
        expiryDate: '2020-01-01' // Expired
      };

      const result = await service.verifyDriverID(expiredID, 'pharmacist-1');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('ID has expired');
    });

    test('verifies valid Swiss passport successfully', async () => {
      const validPassport = {
        driverId: 'driver-123',
        idType: GovernmentIDType.PASSPORT,
        idNumber: 'C12345678',
        issuingAuthority: 'Swiss Government',
        issuingCountry: 'CHE',
        issueDate: '2020-01-01',
        expiryDate: '2030-01-01'
      };

      mockRepository.createGovernmentID.mockResolvedValue({
        ...validPassport,
        id: 'id-123',
        issueDate: new Date(validPassport.issueDate),
        expiryDate: new Date(validPassport.expiryDate),
        verificationStatus: VerificationStatus.VERIFIED,
        verifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockRepository.logVerificationEvent.mockResolvedValue({} as any);

      const result = await service.verifyDriverID(validPassport, 'pharmacist-1');

      expect(result.success).toBe(true);
      expect(result.governmentID).toBeDefined();
    });

    test('rejects invalid passport format', async () => {
      const invalidPassport = {
        driverId: 'driver-123',
        idType: GovernmentIDType.PASSPORT,
        idNumber: 'INVALID',
        issuingAuthority: 'Swiss Government',
        issuingCountry: 'CHE',
        issueDate: '2020-01-01',
        expiryDate: '2030-01-01'
      };

      const result = await service.verifyDriverID(invalidPassport, 'pharmacist-1');

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Invalid Swiss passport format');
    });
  });

  // =========================================================================
  // Test Suite 2: Driver License Verification
  // =========================================================================

  describe('Driver License Verification', () => {
    test('verifies valid driver license successfully', async () => {
      const validLicense = {
        driverId: 'driver-123',
        licenseNumber: '12345678',
        categories: ['B', 'BE'],
        issuingAuthority: 'Swiss Vehicle Registration Office',
        issueDate: new Date('2018-01-01'),
        expiryDate: new Date('2028-01-01')
      };

      mockRepository.createDriverLicense.mockResolvedValue({
        ...validLicense,
        id: 'license-123',
        verificationStatus: VerificationStatus.VERIFIED,
        verifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockRepository.logVerificationEvent.mockResolvedValue({} as any);

      const result = await service.verifyDriverLicense(
        validLicense.driverId,
        validLicense.licenseNumber,
        validLicense.categories,
        validLicense.issuingAuthority,
        validLicense.issueDate,
        validLicense.expiryDate,
        'pharmacist-1'
      );

      expect(result.success).toBe(true);
      expect(result.driverLicense).toBeDefined();
      expect(result.driverLicense?.categories).toEqual(['B', 'BE']);
    });

    test('rejects invalid license number format', async () => {
      const result = await service.verifyDriverLicense(
        'driver-123',
        'invalid',
        ['B'],
        'Swiss Vehicle Registration Office',
        new Date('2018-01-01'),
        new Date('2028-01-01'),
        'pharmacist-1'
      );

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Invalid Swiss driver license format');
    });

    test('rejects expired license', async () => {
      const result = await service.verifyDriverLicense(
        'driver-123',
        '12345678',
        ['B'],
        'Swiss Vehicle Registration Office',
        new Date('2008-01-01'),
        new Date('2018-01-01'), // Expired
        'pharmacist-1'
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Driver license has expired');
    });
  });

  // =========================================================================
  // Test Suite 3: Authorization Management
  // =========================================================================

  describe('Authorization Management', () => {
    test('grants authorization to verified driver', async () => {
      const validID = {
        id: 'id-123',
        driverId: 'driver-123',
        idType: GovernmentIDType.SWISS_ID,
        idNumber: '756.1234.5678.90',
        issuingAuthority: 'Canton de Genève',
        issuingCountry: 'CHE',
        issueDate: new Date('2020-01-01'),
        expiryDate: new Date('2030-01-01'),
        verificationStatus: VerificationStatus.VERIFIED,
        verifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const validLicense = {
        id: 'license-123',
        driverId: 'driver-123',
        licenseNumber: '12345678',
        categories: ['B'],
        issuingAuthority: 'Swiss Vehicle Registration Office',
        issueDate: new Date('2018-01-01'),
        expiryDate: new Date('2028-01-01'),
        verificationStatus: VerificationStatus.VERIFIED,
        verifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRepository.getGovernmentIDByDriverId.mockResolvedValue([validID]);
      mockRepository.getDriverLicenseByDriverId.mockResolvedValue(validLicense);
      mockRepository.createAuthorization.mockResolvedValue({
        id: 'auth-123',
        driverId: 'driver-123',
        authorizationLevel: AuthorizationLevel.CONTROLLED,
        pharmacyId: 'pharmacy-1',
        issuedBy: 'pharmacist-1',
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: VerificationStatus.VERIFIED,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockRepository.logVerificationEvent.mockResolvedValue({} as any);

      const authRequest = {
        driverId: 'driver-123',
        authorizationLevel: AuthorizationLevel.CONTROLLED,
        pharmacyId: 'pharmacy-1',
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      };

      const result = await service.grantAuthorization(authRequest, 'pharmacist-1');

      expect(result.success).toBe(true);
      expect(result.authorization).toBeDefined();
      expect(result.authorization?.authorizationLevel).toBe(AuthorizationLevel.CONTROLLED);
    });

    test('rejects authorization when driver has no verified ID', async () => {
      mockRepository.getGovernmentIDByDriverId.mockResolvedValue([]);

      const authRequest = {
        driverId: 'driver-123',
        authorizationLevel: AuthorizationLevel.CONTROLLED,
        pharmacyId: 'pharmacy-1',
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      };

      const result = await service.grantAuthorization(authRequest, 'pharmacist-1');

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('verified government ID');
    });

    test('rejects authorization when driver has no valid license', async () => {
      const validID = {
        id: 'id-123',
        driverId: 'driver-123',
        idType: GovernmentIDType.SWISS_ID,
        idNumber: '756.1234.5678.90',
        issuingAuthority: 'Canton de Genève',
        issuingCountry: 'CHE',
        issueDate: new Date('2020-01-01'),
        expiryDate: new Date('2030-01-01'),
        verificationStatus: VerificationStatus.VERIFIED,
        verifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRepository.getGovernmentIDByDriverId.mockResolvedValue([validID]);
      mockRepository.getDriverLicenseByDriverId.mockResolvedValue(null);

      const authRequest = {
        driverId: 'driver-123',
        authorizationLevel: AuthorizationLevel.CONTROLLED,
        pharmacyId: 'pharmacy-1',
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      };

      const result = await service.grantAuthorization(authRequest, 'pharmacist-1');

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('valid driver license');
    });

    test('revokes authorization successfully', async () => {
      mockRepository.revokeAuthorization.mockResolvedValue(undefined);
      mockRepository.logVerificationEvent.mockResolvedValue({} as any);

      const result = await service.revokeAuthorization(
        'auth-123',
        'pharmacist-1',
        'Driver no longer authorized'
      );

      expect(result.success).toBe(true);
      expect(mockRepository.revokeAuthorization).toHaveBeenCalledWith(
        'auth-123',
        'pharmacist-1',
        'Driver no longer authorized'
      );
    });
  });

  // =========================================================================
  // Test Suite 4: Pre-Delivery Authorization Check
  // =========================================================================

  describe('Pre-Delivery Authorization Check', () => {
    test('passes check for fully authorized driver', async () => {
      const validID = {
        id: 'id-123',
        driverId: 'driver-123',
        idType: GovernmentIDType.SWISS_ID,
        idNumber: '756.1234.5678.90',
        issuingAuthority: 'Canton de Genève',
        issuingCountry: 'CHE',
        issueDate: new Date('2020-01-01'),
        expiryDate: new Date('2030-01-01'),
        verificationStatus: VerificationStatus.VERIFIED,
        verifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const validLicense = {
        id: 'license-123',
        driverId: 'driver-123',
        licenseNumber: '12345678',
        categories: ['B'],
        issuingAuthority: 'Swiss Vehicle Registration Office',
        issueDate: new Date('2018-01-01'),
        expiryDate: new Date('2028-01-01'),
        verificationStatus: VerificationStatus.VERIFIED,
        verifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const validAuthorization = {
        id: 'auth-123',
        driverId: 'driver-123',
        authorizationLevel: AuthorizationLevel.CONTROLLED,
        pharmacyId: 'pharmacy-1',
        issuedBy: 'pharmacist-1',
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2025-12-31'),
        status: VerificationStatus.VERIFIED,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRepository.getGovernmentIDByDriverId.mockResolvedValue([validID]);
      mockRepository.getDriverLicenseByDriverId.mockResolvedValue(validLicense);
      mockRepository.getActiveAuthorizations.mockResolvedValue([validAuthorization]);
      mockRepository.logVerificationEvent.mockResolvedValue({} as any);

      const result = await service.checkPreDeliveryAuthorization(
        'driver-123',
        'delivery-456',
        'pharmacy-1',
        AuthorizationLevel.CONTROLLED
      );

      expect(result.canDeliver).toBe(true);
      expect(result.hasAuthorization).toBe(true);
      expect(result.idVerified).toBe(true);
      expect(result.licenseValid).toBe(true);
      expect(result.blockers).toHaveLength(0);
    });

    test('fails check when driver has no authorization', async () => {
      const validID = {
        id: 'id-123',
        driverId: 'driver-123',
        idType: GovernmentIDType.SWISS_ID,
        idNumber: '756.1234.5678.90',
        issuingAuthority: 'Canton de Genève',
        issuingCountry: 'CHE',
        issueDate: new Date('2020-01-01'),
        expiryDate: new Date('2030-01-01'),
        verificationStatus: VerificationStatus.VERIFIED,
        verifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const validLicense = {
        id: 'license-123',
        driverId: 'driver-123',
        licenseNumber: '12345678',
        categories: ['B'],
        issuingAuthority: 'Swiss Vehicle Registration Office',
        issueDate: new Date('2018-01-01'),
        expiryDate: new Date('2028-01-01'),
        verificationStatus: VerificationStatus.VERIFIED,
        verifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRepository.getGovernmentIDByDriverId.mockResolvedValue([validID]);
      mockRepository.getDriverLicenseByDriverId.mockResolvedValue(validLicense);
      mockRepository.getActiveAuthorizations.mockResolvedValue([]);
      mockRepository.logVerificationEvent.mockResolvedValue({} as any);

      const result = await service.checkPreDeliveryAuthorization(
        'driver-123',
        'delivery-456',
        'pharmacy-1',
        AuthorizationLevel.NARCOTIC
      );

      expect(result.canDeliver).toBe(false);
      expect(result.hasAuthorization).toBe(false);
      expect(result.blockers.length).toBeGreaterThan(0);
      expect(result.blockers[0]).toContain('narcotic authorization');
    });

    test('warns when documents expire soon', async () => {
      const soonToExpireID = {
        id: 'id-123',
        driverId: 'driver-123',
        idType: GovernmentIDType.SWISS_ID,
        idNumber: '756.1234.5678.90',
        issuingAuthority: 'Canton de Genève',
        issuingCountry: 'CHE',
        issueDate: new Date('2020-01-01'),
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        verificationStatus: VerificationStatus.VERIFIED,
        verifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const validLicense = {
        id: 'license-123',
        driverId: 'driver-123',
        licenseNumber: '12345678',
        categories: ['B'],
        issuingAuthority: 'Swiss Vehicle Registration Office',
        issueDate: new Date('2018-01-01'),
        expiryDate: new Date('2028-01-01'),
        verificationStatus: VerificationStatus.VERIFIED,
        verifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const validAuthorization = {
        id: 'auth-123',
        driverId: 'driver-123',
        authorizationLevel: AuthorizationLevel.STANDARD,
        pharmacyId: 'pharmacy-1',
        issuedBy: 'pharmacist-1',
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2025-12-31'),
        status: VerificationStatus.VERIFIED,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRepository.getGovernmentIDByDriverId.mockResolvedValue([soonToExpireID]);
      mockRepository.getDriverLicenseByDriverId.mockResolvedValue(validLicense);
      mockRepository.getActiveAuthorizations.mockResolvedValue([validAuthorization]);
      mockRepository.logVerificationEvent.mockResolvedValue({} as any);

      const result = await service.checkPreDeliveryAuthorization(
        'driver-123',
        'delivery-456',
        'pharmacy-1',
        AuthorizationLevel.STANDARD
      );

      expect(result.canDeliver).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('expires soon');
    });
  });

  // =========================================================================
  // Test Suite 5: Emergency Override
  // =========================================================================

  describe('Emergency Override', () => {
    test('creates emergency override successfully', async () => {
      mockRepository.createEmergencyOverride.mockResolvedValue({
        id: 'override-123',
        deliveryId: 'delivery-456',
        driverId: 'driver-123',
        requestedBy: 'driver-123',
        approvedBy: 'supervisor-1',
        reason: 'Urgent delivery',
        justification: 'Patient needs medication immediately',
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        used: false,
        createdAt: new Date()
      });

      mockRepository.logVerificationEvent.mockResolvedValue({} as any);

      const result = await service.createEmergencyOverride(
        'delivery-456',
        'driver-123',
        'driver-123',
        'supervisor-1',
        'Urgent delivery',
        'Patient needs medication immediately'
      );

      expect(result.success).toBe(true);
      expect(result.overrideId).toBe('override-123');
      expect(mockRepository.logVerificationEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: VerificationEventType.EMERGENCY_OVERRIDE,
          severity: 'critical'
        })
      );
    });
  });
});
