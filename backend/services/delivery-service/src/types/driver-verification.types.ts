/**
 * Driver Verification System Types
 * Swiss Pharmacy Regulatory Compliance for Controlled Substance Deliveries
 */

/**
 * Government-issued ID types accepted for driver verification
 */
export enum GovernmentIDType {
  SWISS_ID = 'swiss_id',
  PASSPORT = 'passport',
  RESIDENCE_PERMIT = 'residence_permit',
  DRIVER_LICENSE = 'driver_license'
}

/**
 * Driver authorization levels for controlled substance handling
 */
export enum AuthorizationLevel {
  STANDARD = 'standard',           // Regular OTC and prescriptions
  CONTROLLED = 'controlled',       // Controlled substances (Schedule III-V)
  NARCOTIC = 'narcotic'           // Narcotic substances (Schedule I-II)
}

/**
 * Verification status for driver identity checks
 */
export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  FAILED = 'failed',
  EXPIRED = 'expired',
  REVOKED = 'revoked'
}

/**
 * Government ID document information
 */
export interface GovernmentID {
  id: string;
  driverId: string;
  idType: GovernmentIDType;
  idNumber: string;
  issuingAuthority: string;
  issuingCountry: string;
  issueDate: Date;
  expiryDate: Date;
  photoUrl?: string;
  verificationStatus: VerificationStatus;
  verifiedAt?: Date;
  verifiedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Driver license specific information
 */
export interface DriverLicense {
  id: string;
  driverId: string;
  licenseNumber: string;
  categories: string[];          // A, B, C, D, etc.
  issuingAuthority: string;
  issueDate: Date;
  expiryDate: Date;
  photoUrl?: string;
  verificationStatus: VerificationStatus;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Controlled substance authorization for a driver
 */
export interface ControlledSubstanceAuthorization {
  id: string;
  driverId: string;
  authorizationLevel: AuthorizationLevel;
  pharmacyId: string;             // Pharmacy-specific authorization
  issuedBy: string;               // Pharmacist who granted authorization
  validFrom: Date;
  validUntil: Date;
  restrictions?: string[];        // Additional restrictions
  trainingCertificateUrl?: string;
  status: VerificationStatus;
  revokedAt?: Date;
  revokedBy?: string;
  revokedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Photo verification record for at-delivery identity check
 */
export interface PhotoVerification {
  id: string;
  deliveryId: string;
  driverId: string;
  photoUrl: string;
  capturedAt: Date;
  gpsLatitude: number;
  gpsLongitude: number;
  matchScore?: number;            // 0-100, facial recognition confidence
  verificationMethod: 'manual' | 'automated' | 'hybrid';
  verifiedBy?: string;            // If manual verification
  passed: boolean;
  failureReason?: string;
  createdAt: Date;
}

/**
 * Electronic signature for controlled substance delivery
 */
export interface ElectronicSignature {
  id: string;
  deliveryId: string;
  driverId: string;
  signatureDataUrl: string;       // Base64 encoded signature
  signedAt: Date;
  gpsLatitude: number;
  gpsLongitude: number;
  deviceId: string;
  ipAddress: string;
  createdAt: Date;
}

/**
 * Audit trail entry for verification events
 */
export interface VerificationAuditLog {
  id: string;
  driverId: string;
  deliveryId?: string;
  eventType: VerificationEventType;
  eventDescription: string;
  performedBy: string;            // User ID who performed action
  performedByRole: string;        // Role: driver, pharmacist, admin
  timestamp: Date;
  gpsLatitude?: number;
  gpsLongitude?: number;
  ipAddress?: string;
  deviceId?: string;
  metadata?: Record<string, any>;
  severity: 'info' | 'warning' | 'error' | 'critical';
  createdAt: Date;
}

/**
 * Types of verification events tracked in audit log
 */
export enum VerificationEventType {
  ID_SUBMITTED = 'id_submitted',
  ID_VERIFIED = 'id_verified',
  ID_REJECTED = 'id_rejected',
  LICENSE_VERIFIED = 'license_verified',
  LICENSE_EXPIRED = 'license_expired',
  AUTHORIZATION_GRANTED = 'authorization_granted',
  AUTHORIZATION_REVOKED = 'authorization_revoked',
  AUTHORIZATION_EXPIRED = 'authorization_expired',
  PHOTO_VERIFICATION_PASSED = 'photo_verification_passed',
  PHOTO_VERIFICATION_FAILED = 'photo_verification_failed',
  SIGNATURE_CAPTURED = 'signature_captured',
  EMERGENCY_OVERRIDE = 'emergency_override',
  DELIVERY_COMPLETED = 'delivery_completed',
  DELIVERY_REJECTED = 'delivery_rejected'
}

/**
 * Emergency override record (requires approval and full audit trail)
 */
export interface EmergencyOverride {
  id: string;
  deliveryId: string;
  driverId: string;
  requestedBy: string;            // User who requested override
  approvedBy: string;             // Supervisor/pharmacist who approved
  reason: string;
  justification: string;
  timestamp: Date;
  expiresAt: Date;
  used: boolean;
  usedAt?: Date;
  createdAt: Date;
}

/**
 * Driver verification request payload
 */
export interface DriverVerificationRequest {
  driverId: string;
  idType: GovernmentIDType;
  idNumber: string;
  issuingAuthority: string;
  issuingCountry: string;
  issueDate: string;
  expiryDate: string;
  photoBase64?: string;
}

/**
 * Authorization request payload
 */
export interface AuthorizationRequest {
  driverId: string;
  authorizationLevel: AuthorizationLevel;
  pharmacyId: string;
  validFrom: string;
  validUntil: string;
  restrictions?: string[];
  trainingCertificateBase64?: string;
}

/**
 * Pre-delivery verification check response
 */
export interface PreDeliveryCheckResponse {
  canDeliver: boolean;
  driverId: string;
  deliveryId: string;
  requiredAuthorizationLevel: AuthorizationLevel;
  hasAuthorization: boolean;
  idVerified: boolean;
  licenseValid: boolean;
  authorizationExpiry?: Date;
  warnings: string[];
  blockers: string[];
}

/**
 * At-delivery verification request
 */
export interface AtDeliveryVerificationRequest {
  deliveryId: string;
  driverId: string;
  photoBase64: string;
  signatureBase64: string;
  gpsLatitude: number;
  gpsLongitude: number;
  deviceId: string;
}

/**
 * Regulatory reporting export format
 */
export interface RegulatoryReport {
  reportId: string;
  reportType: 'daily' | 'weekly' | 'monthly' | 'custom';
  startDate: Date;
  endDate: Date;
  totalVerifications: number;
  successfulVerifications: number;
  failedVerifications: number;
  emergencyOverrides: number;
  authorizations: {
    granted: number;
    revoked: number;
    expired: number;
  };
  verificationsByDriver: Array<{
    driverId: string;
    driverName: string;
    totalDeliveries: number;
    controlledSubstances: number;
    verificationFailures: number;
  }>;
  auditTrail: VerificationAuditLog[];
  generatedAt: Date;
  generatedBy: string;
}
