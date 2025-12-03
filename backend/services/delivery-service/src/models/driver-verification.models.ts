/**
 * Database Models for Driver Verification System
 * Using Prisma-style schema definitions
 */

import {
  GovernmentIDType,
  AuthorizationLevel,
  VerificationStatus,
  VerificationEventType
} from '../types/driver-verification.types';

/**
 * Database model for government-issued IDs
 */
export interface GovernmentIDModel {
  id: string;
  driver_id: string;
  id_type: GovernmentIDType;
  id_number_encrypted: string;    // Encrypted with AES-256
  id_number_hash: string;         // SHA-256 hash for lookup
  issuing_authority: string;
  issuing_country: string;
  issue_date: Date;
  expiry_date: Date;
  photo_url_encrypted?: string;   // Encrypted storage path
  verification_status: VerificationStatus;
  verified_at?: Date;
  verified_by?: string;
  created_at: Date;
  updated_at: Date;

  // Indexes
  // PRIMARY KEY: id
  // INDEX: driver_id
  // UNIQUE INDEX: id_number_hash
  // INDEX: verification_status
  // INDEX: expiry_date
}

/**
 * Database model for driver licenses
 */
export interface DriverLicenseModel {
  id: string;
  driver_id: string;
  license_number_encrypted: string;
  license_number_hash: string;
  categories: string;              // JSON array stored as string
  issuing_authority: string;
  issue_date: Date;
  expiry_date: Date;
  photo_url_encrypted?: string;
  verification_status: VerificationStatus;
  verified_at?: Date;
  created_at: Date;
  updated_at: Date;

  // Indexes
  // PRIMARY KEY: id
  // INDEX: driver_id
  // UNIQUE INDEX: license_number_hash
  // INDEX: expiry_date
}

/**
 * Database model for controlled substance authorizations
 */
export interface ControlledSubstanceAuthorizationModel {
  id: string;
  driver_id: string;
  authorization_level: AuthorizationLevel;
  pharmacy_id: string;
  issued_by: string;
  valid_from: Date;
  valid_until: Date;
  restrictions?: string;           // JSON array stored as string
  training_certificate_url?: string;
  status: VerificationStatus;
  revoked_at?: Date;
  revoked_by?: string;
  revoked_reason?: string;
  created_at: Date;
  updated_at: Date;

  // Indexes
  // PRIMARY KEY: id
  // INDEX: driver_id
  // INDEX: pharmacy_id
  // INDEX: authorization_level
  // INDEX: status
  // INDEX: valid_from, valid_until (composite for range queries)
}

/**
 * Database model for photo verifications
 */
export interface PhotoVerificationModel {
  id: string;
  delivery_id: string;
  driver_id: string;
  photo_url_encrypted: string;
  captured_at: Date;
  gps_latitude: number;
  gps_longitude: number;
  match_score?: number;
  verification_method: string;
  verified_by?: string;
  passed: boolean;
  failure_reason?: string;
  created_at: Date;

  // Indexes
  // PRIMARY KEY: id
  // INDEX: delivery_id
  // INDEX: driver_id
  // INDEX: captured_at
  // INDEX: passed
}

/**
 * Database model for electronic signatures
 */
export interface ElectronicSignatureModel {
  id: string;
  delivery_id: string;
  driver_id: string;
  signature_data_url_encrypted: string;
  signed_at: Date;
  gps_latitude: number;
  gps_longitude: number;
  device_id: string;
  ip_address: string;
  created_at: Date;

  // Indexes
  // PRIMARY KEY: id
  // UNIQUE INDEX: delivery_id (one signature per delivery)
  // INDEX: driver_id
  // INDEX: signed_at
}

/**
 * Database model for verification audit logs
 */
export interface VerificationAuditLogModel {
  id: string;
  driver_id: string;
  delivery_id?: string;
  event_type: VerificationEventType;
  event_description: string;
  performed_by: string;
  performed_by_role: string;
  timestamp: Date;
  gps_latitude?: number;
  gps_longitude?: number;
  ip_address?: string;
  device_id?: string;
  metadata?: string;               // JSON stored as string
  severity: string;
  created_at: Date;

  // Indexes
  // PRIMARY KEY: id
  // INDEX: driver_id
  // INDEX: delivery_id
  // INDEX: event_type
  // INDEX: timestamp (DESC for recent queries)
  // INDEX: severity
  // FULLTEXT INDEX: event_description (for audit search)
}

/**
 * Database model for emergency overrides
 */
export interface EmergencyOverrideModel {
  id: string;
  delivery_id: string;
  driver_id: string;
  requested_by: string;
  approved_by: string;
  reason: string;
  justification: string;
  timestamp: Date;
  expires_at: Date;
  used: boolean;
  used_at?: Date;
  created_at: Date;

  // Indexes
  // PRIMARY KEY: id
  // INDEX: delivery_id
  // INDEX: driver_id
  // INDEX: approved_by
  // INDEX: used
  // INDEX: timestamp (DESC)
}

/**
 * SQL table creation scripts (for reference)
 */
export const TABLE_SCHEMAS = `
-- Government IDs table with encryption
CREATE TABLE government_ids (
  id VARCHAR(36) PRIMARY KEY,
  driver_id VARCHAR(36) NOT NULL,
  id_type VARCHAR(50) NOT NULL,
  id_number_encrypted TEXT NOT NULL,
  id_number_hash VARCHAR(64) NOT NULL UNIQUE,
  issuing_authority VARCHAR(255) NOT NULL,
  issuing_country VARCHAR(3) NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  photo_url_encrypted TEXT,
  verification_status VARCHAR(20) NOT NULL,
  verified_at TIMESTAMP,
  verified_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_driver_id (driver_id),
  INDEX idx_verification_status (verification_status),
  INDEX idx_expiry_date (expiry_date)
);

-- Driver licenses table
CREATE TABLE driver_licenses (
  id VARCHAR(36) PRIMARY KEY,
  driver_id VARCHAR(36) NOT NULL,
  license_number_encrypted TEXT NOT NULL,
  license_number_hash VARCHAR(64) NOT NULL UNIQUE,
  categories TEXT NOT NULL,
  issuing_authority VARCHAR(255) NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  photo_url_encrypted TEXT,
  verification_status VARCHAR(20) NOT NULL,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_driver_id (driver_id),
  INDEX idx_expiry_date (expiry_date)
);

-- Controlled substance authorizations table
CREATE TABLE controlled_substance_authorizations (
  id VARCHAR(36) PRIMARY KEY,
  driver_id VARCHAR(36) NOT NULL,
  authorization_level VARCHAR(20) NOT NULL,
  pharmacy_id VARCHAR(36) NOT NULL,
  issued_by VARCHAR(36) NOT NULL,
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  restrictions TEXT,
  training_certificate_url TEXT,
  status VARCHAR(20) NOT NULL,
  revoked_at TIMESTAMP,
  revoked_by VARCHAR(36),
  revoked_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_driver_id (driver_id),
  INDEX idx_pharmacy_id (pharmacy_id),
  INDEX idx_authorization_level (authorization_level),
  INDEX idx_status (status),
  INDEX idx_valid_range (valid_from, valid_until)
);

-- Photo verifications table
CREATE TABLE photo_verifications (
  id VARCHAR(36) PRIMARY KEY,
  delivery_id VARCHAR(36) NOT NULL,
  driver_id VARCHAR(36) NOT NULL,
  photo_url_encrypted TEXT NOT NULL,
  captured_at TIMESTAMP NOT NULL,
  gps_latitude DECIMAL(10, 8) NOT NULL,
  gps_longitude DECIMAL(11, 8) NOT NULL,
  match_score INT,
  verification_method VARCHAR(20) NOT NULL,
  verified_by VARCHAR(36),
  passed BOOLEAN NOT NULL,
  failure_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_delivery_id (delivery_id),
  INDEX idx_driver_id (driver_id),
  INDEX idx_captured_at (captured_at),
  INDEX idx_passed (passed)
);

-- Electronic signatures table
CREATE TABLE electronic_signatures (
  id VARCHAR(36) PRIMARY KEY,
  delivery_id VARCHAR(36) NOT NULL UNIQUE,
  driver_id VARCHAR(36) NOT NULL,
  signature_data_url_encrypted TEXT NOT NULL,
  signed_at TIMESTAMP NOT NULL,
  gps_latitude DECIMAL(10, 8) NOT NULL,
  gps_longitude DECIMAL(11, 8) NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_driver_id (driver_id),
  INDEX idx_signed_at (signed_at)
);

-- Verification audit logs table
CREATE TABLE verification_audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  driver_id VARCHAR(36) NOT NULL,
  delivery_id VARCHAR(36),
  event_type VARCHAR(50) NOT NULL,
  event_description TEXT NOT NULL,
  performed_by VARCHAR(36) NOT NULL,
  performed_by_role VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  gps_latitude DECIMAL(10, 8),
  gps_longitude DECIMAL(11, 8),
  ip_address VARCHAR(45),
  device_id VARCHAR(255),
  metadata TEXT,
  severity VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_driver_id (driver_id),
  INDEX idx_delivery_id (delivery_id),
  INDEX idx_event_type (event_type),
  INDEX idx_timestamp (timestamp DESC),
  INDEX idx_severity (severity),
  FULLTEXT INDEX idx_event_description (event_description)
);

-- Emergency overrides table
CREATE TABLE emergency_overrides (
  id VARCHAR(36) PRIMARY KEY,
  delivery_id VARCHAR(36) NOT NULL,
  driver_id VARCHAR(36) NOT NULL,
  requested_by VARCHAR(36) NOT NULL,
  approved_by VARCHAR(36) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  justification TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_delivery_id (delivery_id),
  INDEX idx_driver_id (driver_id),
  INDEX idx_approved_by (approved_by),
  INDEX idx_used (used),
  INDEX idx_timestamp (timestamp DESC)
);
`;
