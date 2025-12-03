/**
 * Driver Verification Service
 * Business logic for driver identity verification and authorization
 */

import { DriverVerificationRepository } from '../../repository/driver-verification.repository';
import {
  GovernmentID,
  DriverLicense,
  ControlledSubstanceAuthorization,
  PreDeliveryCheckResponse,
  AtDeliveryVerificationRequest,
  DriverVerificationRequest,
  AuthorizationRequest,
  VerificationStatus,
  AuthorizationLevel,
  VerificationEventType,
  RegulatoryReport
} from '../../types/driver-verification.types';

/**
 * Swiss Government ID Verification Service (mock implementation)
 * In production, this would integrate with actual Swiss government databases
 */
class SwissIDVerificationService {
  async verifyID(
    idType: string,
    idNumber: string,
    issuingAuthority: string
  ): Promise<{ valid: boolean; reason?: string }> {
    // Mock implementation - always returns valid for testing
    // Production: Call Swiss e-ID API (HIN provider)

    // Basic format validation
    if (idType === 'swiss_id') {
      // Swiss ID format: XXX.XXXX.XXXX.XX (13 digits with dots)
      const swissIdRegex = /^\d{3}\.\d{4}\.\d{4}\.\d{2}$/;
      if (!swissIdRegex.test(idNumber)) {
        return { valid: false, reason: 'Invalid Swiss ID format' };
      }
    }

    if (idType === 'passport') {
      // Swiss passport format: CXXXXXXXX (C + 8 digits)
      const passportRegex = /^C\d{8}$/;
      if (!passportRegex.test(idNumber)) {
        return { valid: false, reason: 'Invalid Swiss passport format' };
      }
    }

    // Mock: Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return { valid: true };
  }

  async verifyDriverLicense(
    licenseNumber: string,
    categories: string[]
  ): Promise<{ valid: boolean; activeCategories: string[]; reason?: string }> {
    // Mock implementation
    // Production: Call Swiss vehicle registration office API

    // Basic validation: Swiss driver license is 8-digit number
    const licenseRegex = /^\d{8}$/;
    if (!licenseRegex.test(licenseNumber)) {
      return {
        valid: false,
        activeCategories: [],
        reason: 'Invalid Swiss driver license format'
      };
    }

    // Mock: All categories are active
    return {
      valid: true,
      activeCategories: categories
    };
  }
}

/**
 * Photo matching service (facial recognition)
 */
class PhotoMatchingService {
  async matchPhoto(
    referencePhotoUrl: string,
    capturedPhotoBase64: string
  ): Promise<{ match: boolean; confidence: number }> {
    // Mock implementation
    // Production: Integrate with facial recognition API (e.g., AWS Rekognition, Azure Face API)

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 200));

    // Mock: Random confidence score between 80-95 for valid photos
    const confidence = Math.floor(Math.random() * 15) + 80;

    return {
      match: confidence >= 75,
      confidence
    };
  }
}

/**
 * Driver Verification Service
 */
export class DriverVerificationService {
  private repository: DriverVerificationRepository;
  private swissIDService: SwissIDVerificationService;
  private photoMatcher: PhotoMatchingService;

  constructor(repository: DriverVerificationRepository) {
    this.repository = repository;
    this.swissIDService = new SwissIDVerificationService();
    this.photoMatcher = new PhotoMatchingService();
  }

  // =========================================================================
  // Driver Identity Verification
  // =========================================================================

  /**
   * Verify and register a driver's government-issued ID
   */
  async verifyDriverID(
    request: DriverVerificationRequest,
    performedBy: string
  ): Promise<{ success: boolean; governmentID?: GovernmentID; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Step 1: Validate ID format and check with government database
      const verification = await this.swissIDService.verifyID(
        request.idType,
        request.idNumber,
        request.issuingAuthority
      );

      if (!verification.valid) {
        errors.push(verification.reason || 'ID verification failed');

        // Log failed verification
        await this.repository.logVerificationEvent({
          driverId: request.driverId,
          eventType: VerificationEventType.ID_REJECTED,
          eventDescription: `ID verification failed: ${verification.reason}`,
          performedBy,
          performedByRole: 'system',
          timestamp: new Date(),
          severity: 'error'
        });

        return { success: false, errors };
      }

      // Step 2: Check expiry date
      const expiryDate = new Date(request.expiryDate);
      if (expiryDate < new Date()) {
        errors.push('ID has expired');
        return { success: false, errors };
      }

      // Step 3: Create government ID record
      const governmentID = await this.repository.createGovernmentID({
        driverId: request.driverId,
        idType: request.idType,
        idNumber: request.idNumber,
        issuingAuthority: request.issuingAuthority,
        issuingCountry: request.issuingCountry,
        issueDate: new Date(request.issueDate),
        expiryDate,
        photoUrl: request.photoBase64,
        verificationStatus: VerificationStatus.VERIFIED,
        verifiedAt: new Date(),
        verifiedBy: performedBy
      });

      // Step 4: Log successful verification
      await this.repository.logVerificationEvent({
        driverId: request.driverId,
        eventType: VerificationEventType.ID_VERIFIED,
        eventDescription: `Government ID ${request.idType} verified successfully`,
        performedBy,
        performedByRole: 'pharmacist',
        timestamp: new Date(),
        severity: 'info'
      });

      return { success: true, governmentID, errors: [] };

    } catch (error) {
      errors.push(`Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, errors };
    }
  }

  /**
   * Verify driver's license
   */
  async verifyDriverLicense(
    driverId: string,
    licenseNumber: string,
    categories: string[],
    issuingAuthority: string,
    issueDate: Date,
    expiryDate: Date,
    performedBy: string
  ): Promise<{ success: boolean; driverLicense?: DriverLicense; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Verify with Swiss vehicle registration office
      const verification = await this.swissIDService.verifyDriverLicense(
        licenseNumber,
        categories
      );

      if (!verification.valid) {
        errors.push(verification.reason || 'License verification failed');

        await this.repository.logVerificationEvent({
          driverId,
          eventType: VerificationEventType.LICENSE_EXPIRED,
          eventDescription: `License verification failed: ${verification.reason}`,
          performedBy,
          performedByRole: 'system',
          timestamp: new Date(),
          severity: 'error'
        });

        return { success: false, errors };
      }

      // Check expiry
      if (expiryDate < new Date()) {
        errors.push('Driver license has expired');
        return { success: false, errors };
      }

      // Create license record
      const driverLicense = await this.repository.createDriverLicense({
        driverId,
        licenseNumber,
        categories: verification.activeCategories,
        issuingAuthority,
        issueDate,
        expiryDate,
        verificationStatus: VerificationStatus.VERIFIED,
        verifiedAt: new Date()
      });

      await this.repository.logVerificationEvent({
        driverId,
        eventType: VerificationEventType.LICENSE_VERIFIED,
        eventDescription: `Driver license verified with categories: ${categories.join(', ')}`,
        performedBy,
        performedByRole: 'pharmacist',
        timestamp: new Date(),
        severity: 'info'
      });

      return { success: true, driverLicense, errors: [] };

    } catch (error) {
      errors.push(`License verification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, errors };
    }
  }

  // =========================================================================
  // Authorization Management
  // =========================================================================

  /**
   * Grant controlled substance authorization to a driver
   */
  async grantAuthorization(
    request: AuthorizationRequest,
    issuedBy: string
  ): Promise<{ success: boolean; authorization?: ControlledSubstanceAuthorization; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Validate driver has verified ID
      const governmentIDs = await this.repository.getGovernmentIDByDriverId(request.driverId);
      const hasVerifiedID = governmentIDs.some(
        id => id.verificationStatus === VerificationStatus.VERIFIED && id.expiryDate > new Date()
      );

      if (!hasVerifiedID) {
        errors.push('Driver must have a verified government ID before receiving authorization');
        return { success: false, errors };
      }

      // Validate driver has valid license
      const license = await this.repository.getDriverLicenseByDriverId(request.driverId);
      if (!license || license.verificationStatus !== VerificationStatus.VERIFIED || license.expiryDate < new Date()) {
        errors.push('Driver must have a valid driver license');
        return { success: false, errors };
      }

      // Create authorization
      const authorization = await this.repository.createAuthorization({
        driverId: request.driverId,
        authorizationLevel: request.authorizationLevel,
        pharmacyId: request.pharmacyId,
        issuedBy,
        validFrom: new Date(request.validFrom),
        validUntil: new Date(request.validUntil),
        restrictions: request.restrictions,
        trainingCertificateUrl: request.trainingCertificateBase64,
        status: VerificationStatus.VERIFIED
      });

      // Log authorization
      await this.repository.logVerificationEvent({
        driverId: request.driverId,
        eventType: VerificationEventType.AUTHORIZATION_GRANTED,
        eventDescription: `${request.authorizationLevel} authorization granted for pharmacy ${request.pharmacyId}`,
        performedBy: issuedBy,
        performedByRole: 'pharmacist',
        timestamp: new Date(),
        metadata: { authorizationId: authorization.id },
        severity: 'info'
      });

      return { success: true, authorization, errors: [] };

    } catch (error) {
      errors.push(`Authorization error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, errors };
    }
  }

  /**
   * Revoke driver authorization
   */
  async revokeAuthorization(
    authorizationId: string,
    revokedBy: string,
    reason: string
  ): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      await this.repository.revokeAuthorization(authorizationId, revokedBy, reason);

      await this.repository.logVerificationEvent({
        driverId: 'unknown', // Would need to fetch from authorization record
        eventType: VerificationEventType.AUTHORIZATION_REVOKED,
        eventDescription: `Authorization ${authorizationId} revoked: ${reason}`,
        performedBy: revokedBy,
        performedByRole: 'pharmacist',
        timestamp: new Date(),
        severity: 'warning'
      });

      return { success: true, errors: [] };

    } catch (error) {
      errors.push(`Revocation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, errors };
    }
  }

  // =========================================================================
  // Pre-Delivery Verification
  // =========================================================================

  /**
   * Check if driver is authorized to deliver controlled substances
   */
  async checkPreDeliveryAuthorization(
    driverId: string,
    deliveryId: string,
    pharmacyId: string,
    requiredLevel: AuthorizationLevel
  ): Promise<PreDeliveryCheckResponse> {
    const warnings: string[] = [];
    const blockers: string[] = [];

    try {
      // Check ID verification
      const governmentIDs = await this.repository.getGovernmentIDByDriverId(driverId);
      const validID = governmentIDs.find(
        id => id.verificationStatus === VerificationStatus.VERIFIED && id.expiryDate > new Date()
      );

      if (!validID) {
        blockers.push('Driver does not have a valid verified ID');
      }

      // Check license
      const license = await this.repository.getDriverLicenseByDriverId(driverId);
      const licenseValid = license?.verificationStatus === VerificationStatus.VERIFIED &&
                          license.expiryDate > new Date();

      if (!licenseValid) {
        blockers.push('Driver license is not valid or has expired');
      }

      // Check authorization
      const authorizations = await this.repository.getActiveAuthorizations(
        driverId,
        pharmacyId,
        requiredLevel
      );

      const hasAuthorization = authorizations.length > 0;

      if (!hasAuthorization) {
        blockers.push(`Driver does not have ${requiredLevel} authorization for this pharmacy`);
      }

      // Check expiry warnings (within 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      if (validID && validID.expiryDate < thirtyDaysFromNow) {
        warnings.push(`Government ID expires soon: ${validID.expiryDate.toDateString()}`);
      }

      if (license && license.expiryDate < thirtyDaysFromNow) {
        warnings.push(`Driver license expires soon: ${license.expiryDate.toDateString()}`);
      }

      if (hasAuthorization && authorizations[0].validUntil < thirtyDaysFromNow) {
        warnings.push(`Authorization expires soon: ${authorizations[0].validUntil.toDateString()}`);
      }

      const canDeliver = blockers.length === 0;

      // Log pre-delivery check
      await this.repository.logVerificationEvent({
        driverId,
        deliveryId,
        eventType: canDeliver
          ? VerificationEventType.PHOTO_VERIFICATION_PASSED
          : VerificationEventType.DELIVERY_REJECTED,
        eventDescription: canDeliver
          ? 'Pre-delivery authorization check passed'
          : `Pre-delivery check failed: ${blockers.join('; ')}`,
        performedBy: 'system',
        performedByRole: 'system',
        timestamp: new Date(),
        severity: canDeliver ? 'info' : 'warning'
      });

      return {
        canDeliver,
        driverId,
        deliveryId,
        requiredAuthorizationLevel: requiredLevel,
        hasAuthorization,
        idVerified: !!validID,
        licenseValid: !!licenseValid,
        authorizationExpiry: hasAuthorization ? authorizations[0].validUntil : undefined,
        warnings,
        blockers
      };

    } catch (error) {
      blockers.push(`Pre-delivery check error: ${error instanceof Error ? error.message : 'Unknown error'}`);

      return {
        canDeliver: false,
        driverId,
        deliveryId,
        requiredAuthorizationLevel: requiredLevel,
        hasAuthorization: false,
        idVerified: false,
        licenseValid: false,
        warnings,
        blockers
      };
    }
  }

  // =========================================================================
  // At-Delivery Verification
  // =========================================================================

  /**
   * Verify driver identity at time of delivery using photo matching
   */
  async verifyAtDelivery(
    request: AtDeliveryVerificationRequest
  ): Promise<{ success: boolean; matchScore?: number; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Get driver's registered photo
      const governmentIDs = await this.repository.getGovernmentIDByDriverId(request.driverId);
      const validID = governmentIDs.find(
        id => id.verificationStatus === VerificationStatus.VERIFIED && id.photoUrl
      );

      if (!validID || !validID.photoUrl) {
        errors.push('No reference photo found for driver');
        return { success: false, errors };
      }

      // Perform photo matching
      const photoMatch = await this.photoMatcher.matchPhoto(
        validID.photoUrl,
        request.photoBase64
      );

      const passed = photoMatch.match && photoMatch.confidence >= 75;

      // Record photo verification
      await this.repository.createPhotoVerification({
        deliveryId: request.deliveryId,
        driverId: request.driverId,
        photoUrl: request.photoBase64,
        capturedAt: new Date(),
        gpsLatitude: request.gpsLatitude,
        gpsLongitude: request.gpsLongitude,
        matchScore: photoMatch.confidence,
        verificationMethod: 'automated',
        passed,
        failureReason: passed ? undefined : 'Photo match confidence below threshold'
      });

      // Record electronic signature
      await this.repository.createElectronicSignature({
        deliveryId: request.deliveryId,
        driverId: request.driverId,
        signatureDataUrl: request.signatureBase64,
        signedAt: new Date(),
        gpsLatitude: request.gpsLatitude,
        gpsLongitude: request.gpsLongitude,
        deviceId: request.deviceId,
        ipAddress: 'unknown' // Would come from request context
      });

      // Log verification event
      await this.repository.logVerificationEvent({
        driverId: request.driverId,
        deliveryId: request.deliveryId,
        eventType: passed
          ? VerificationEventType.PHOTO_VERIFICATION_PASSED
          : VerificationEventType.PHOTO_VERIFICATION_FAILED,
        eventDescription: passed
          ? `Photo verification passed with ${photoMatch.confidence}% confidence`
          : `Photo verification failed - confidence: ${photoMatch.confidence}%`,
        performedBy: request.driverId,
        performedByRole: 'driver',
        timestamp: new Date(),
        gpsLatitude: request.gpsLatitude,
        gpsLongitude: request.gpsLongitude,
        deviceId: request.deviceId,
        metadata: { matchScore: photoMatch.confidence },
        severity: passed ? 'info' : 'warning'
      });

      if (!passed) {
        errors.push(`Photo verification failed - confidence: ${photoMatch.confidence}%`);
      }

      return {
        success: passed,
        matchScore: photoMatch.confidence,
        errors
      };

    } catch (error) {
      errors.push(`At-delivery verification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, errors };
    }
  }

  // =========================================================================
  // Emergency Override
  // =========================================================================

  /**
   * Create emergency override for blocked delivery (requires supervisor approval)
   */
  async createEmergencyOverride(
    deliveryId: string,
    driverId: string,
    requestedBy: string,
    approvedBy: string,
    reason: string,
    justification: string
  ): Promise<{ success: boolean; overrideId?: string; errors: string[] }> {
    const errors: string[] = [];

    try {
      const override = await this.repository.createEmergencyOverride({
        deliveryId,
        driverId,
        requestedBy,
        approvedBy,
        reason,
        justification,
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        used: false
      });

      await this.repository.logVerificationEvent({
        driverId,
        deliveryId,
        eventType: VerificationEventType.EMERGENCY_OVERRIDE,
        eventDescription: `Emergency override created: ${reason}`,
        performedBy: approvedBy,
        performedByRole: 'supervisor',
        timestamp: new Date(),
        metadata: { overrideId: override.id, justification },
        severity: 'critical'
      });

      return { success: true, overrideId: override.id, errors: [] };

    } catch (error) {
      errors.push(`Override creation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, errors };
    }
  }

  // =========================================================================
  // Regulatory Reporting
  // =========================================================================

  /**
   * Generate regulatory compliance report
   */
  async generateRegulatoryReport(
    startDate: Date,
    endDate: Date,
    generatedBy: string
  ): Promise<RegulatoryReport> {
    // This would aggregate all verification data for the period
    // Mock implementation for now

    const auditLogs = await this.repository.getAuditLogsByDriver(
      'all', // Would need to fetch all drivers
      startDate,
      endDate
    );

    return {
      reportId: `REG-${Date.now()}`,
      reportType: 'custom',
      startDate,
      endDate,
      totalVerifications: auditLogs.length,
      successfulVerifications: auditLogs.filter(
        log => log.eventType === VerificationEventType.PHOTO_VERIFICATION_PASSED
      ).length,
      failedVerifications: auditLogs.filter(
        log => log.eventType === VerificationEventType.PHOTO_VERIFICATION_FAILED
      ).length,
      emergencyOverrides: auditLogs.filter(
        log => log.eventType === VerificationEventType.EMERGENCY_OVERRIDE
      ).length,
      authorizations: {
        granted: auditLogs.filter(log => log.eventType === VerificationEventType.AUTHORIZATION_GRANTED).length,
        revoked: auditLogs.filter(log => log.eventType === VerificationEventType.AUTHORIZATION_REVOKED).length,
        expired: auditLogs.filter(log => log.eventType === VerificationEventType.AUTHORIZATION_EXPIRED).length
      },
      verificationsByDriver: [], // Would aggregate by driver
      auditTrail: auditLogs,
      generatedAt: new Date(),
      generatedBy
    };
  }
}
