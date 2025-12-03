/**
 * Driver Verification Repository
 * Data access layer for driver verification system
 */

import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import {
  GovernmentID,
  DriverLicense,
  ControlledSubstanceAuthorization,
  PhotoVerification,
  ElectronicSignature,
  VerificationAuditLog,
  EmergencyOverride,
  VerificationStatus,
  AuthorizationLevel,
  VerificationEventType
} from '../types/driver-verification.types';

/**
 * Encryption utilities for sensitive data
 */
class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;

  constructor() {
    // In production, load from secure environment variable
    const keyString = process.env.DRIVER_VERIFICATION_ENCRYPTION_KEY ||
                     crypto.randomBytes(32).toString('hex');
    this.key = Buffer.from(keyString.slice(0, 64), 'hex');
  }

  encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  decrypt(encrypted: string, iv: string, tag: string): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(tag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }
}

/**
 * Mock database interface (replace with actual DB connection)
 */
interface DatabaseConnection {
  query(sql: string, params: any[]): Promise<any[]>;
  execute(sql: string, params: any[]): Promise<{ insertId?: string; affectedRows: number }>;
}

/**
 * Driver Verification Repository
 */
export class DriverVerificationRepository {
  private encryption: EncryptionService;
  private db: DatabaseConnection;

  constructor(dbConnection: DatabaseConnection) {
    this.encryption = new EncryptionService();
    this.db = dbConnection;
  }

  // =========================================================================
  // Government ID Operations
  // =========================================================================

  async createGovernmentID(data: Omit<GovernmentID, 'id' | 'createdAt' | 'updatedAt'>): Promise<GovernmentID> {
    const id = uuidv4();
    const idNumberEncrypted = this.encryption.encrypt(data.idNumber);
    const idNumberHash = this.encryption.hash(data.idNumber);

    const photoEncrypted = data.photoUrl
      ? this.encryption.encrypt(data.photoUrl)
      : null;

    const sql = `
      INSERT INTO government_ids (
        id, driver_id, id_type, id_number_encrypted, id_number_hash,
        issuing_authority, issuing_country, issue_date, expiry_date,
        photo_url_encrypted, verification_status, verified_at, verified_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.execute(sql, [
      id,
      data.driverId,
      data.idType,
      JSON.stringify(idNumberEncrypted),
      idNumberHash,
      data.issuingAuthority,
      data.issuingCountry,
      data.issueDate,
      data.expiryDate,
      photoEncrypted ? JSON.stringify(photoEncrypted) : null,
      data.verificationStatus,
      data.verifiedAt || null,
      data.verifiedBy || null
    ]);

    return {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async getGovernmentIDByDriverId(driverId: string): Promise<GovernmentID[]> {
    const sql = `
      SELECT * FROM government_ids
      WHERE driver_id = ?
      ORDER BY created_at DESC
    `;

    const rows = await this.db.query(sql, [driverId]);
    return rows.map(row => this.mapGovernmentIDRow(row));
  }

  async updateVerificationStatus(
    idHash: string,
    status: VerificationStatus,
    verifiedBy?: string
  ): Promise<void> {
    const sql = `
      UPDATE government_ids
      SET verification_status = ?,
          verified_at = ?,
          verified_by = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id_number_hash = ?
    `;

    await this.db.execute(sql, [
      status,
      new Date(),
      verifiedBy || null,
      idHash
    ]);
  }

  // =========================================================================
  // Driver License Operations
  // =========================================================================

  async createDriverLicense(data: Omit<DriverLicense, 'id' | 'createdAt' | 'updatedAt'>): Promise<DriverLicense> {
    const id = uuidv4();
    const licenseEncrypted = this.encryption.encrypt(data.licenseNumber);
    const licenseHash = this.encryption.hash(data.licenseNumber);

    const sql = `
      INSERT INTO driver_licenses (
        id, driver_id, license_number_encrypted, license_number_hash,
        categories, issuing_authority, issue_date, expiry_date,
        photo_url_encrypted, verification_status, verified_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.execute(sql, [
      id,
      data.driverId,
      JSON.stringify(licenseEncrypted),
      licenseHash,
      JSON.stringify(data.categories),
      data.issuingAuthority,
      data.issueDate,
      data.expiryDate,
      data.photoUrl ? JSON.stringify(this.encryption.encrypt(data.photoUrl)) : null,
      data.verificationStatus,
      data.verifiedAt || null
    ]);

    return {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async getDriverLicenseByDriverId(driverId: string): Promise<DriverLicense | null> {
    const sql = `
      SELECT * FROM driver_licenses
      WHERE driver_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const rows = await this.db.query(sql, [driverId]);
    return rows.length > 0 ? this.mapDriverLicenseRow(rows[0]) : null;
  }

  // =========================================================================
  // Authorization Operations
  // =========================================================================

  async createAuthorization(
    data: Omit<ControlledSubstanceAuthorization, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ControlledSubstanceAuthorization> {
    const id = uuidv4();

    const sql = `
      INSERT INTO controlled_substance_authorizations (
        id, driver_id, authorization_level, pharmacy_id, issued_by,
        valid_from, valid_until, restrictions, training_certificate_url, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.execute(sql, [
      id,
      data.driverId,
      data.authorizationLevel,
      data.pharmacyId,
      data.issuedBy,
      data.validFrom,
      data.validUntil,
      data.restrictions ? JSON.stringify(data.restrictions) : null,
      data.trainingCertificateUrl || null,
      data.status
    ]);

    return {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async getActiveAuthorizations(
    driverId: string,
    pharmacyId: string,
    requiredLevel: AuthorizationLevel
  ): Promise<ControlledSubstanceAuthorization[]> {
    const sql = `
      SELECT * FROM controlled_substance_authorizations
      WHERE driver_id = ?
        AND pharmacy_id = ?
        AND authorization_level >= ?
        AND status = 'verified'
        AND valid_from <= CURRENT_DATE
        AND valid_until >= CURRENT_DATE
      ORDER BY authorization_level DESC
    `;

    const rows = await this.db.query(sql, [driverId, pharmacyId, requiredLevel]);
    return rows.map(row => this.mapAuthorizationRow(row));
  }

  async revokeAuthorization(
    authorizationId: string,
    revokedBy: string,
    reason: string
  ): Promise<void> {
    const sql = `
      UPDATE controlled_substance_authorizations
      SET status = 'revoked',
          revoked_at = CURRENT_TIMESTAMP,
          revoked_by = ?,
          revoked_reason = ?
      WHERE id = ?
    `;

    await this.db.execute(sql, [revokedBy, reason, authorizationId]);
  }

  // =========================================================================
  // Photo Verification Operations
  // =========================================================================

  async createPhotoVerification(
    data: Omit<PhotoVerification, 'id' | 'createdAt'>
  ): Promise<PhotoVerification> {
    const id = uuidv4();
    const photoEncrypted = this.encryption.encrypt(data.photoUrl);

    const sql = `
      INSERT INTO photo_verifications (
        id, delivery_id, driver_id, photo_url_encrypted, captured_at,
        gps_latitude, gps_longitude, match_score, verification_method,
        verified_by, passed, failure_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.execute(sql, [
      id,
      data.deliveryId,
      data.driverId,
      JSON.stringify(photoEncrypted),
      data.capturedAt,
      data.gpsLatitude,
      data.gpsLongitude,
      data.matchScore || null,
      data.verificationMethod,
      data.verifiedBy || null,
      data.passed,
      data.failureReason || null
    ]);

    return {
      ...data,
      id,
      createdAt: new Date()
    };
  }

  // =========================================================================
  // Electronic Signature Operations
  // =========================================================================

  async createElectronicSignature(
    data: Omit<ElectronicSignature, 'id' | 'createdAt'>
  ): Promise<ElectronicSignature> {
    const id = uuidv4();
    const signatureEncrypted = this.encryption.encrypt(data.signatureDataUrl);

    const sql = `
      INSERT INTO electronic_signatures (
        id, delivery_id, driver_id, signature_data_url_encrypted,
        signed_at, gps_latitude, gps_longitude, device_id, ip_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.execute(sql, [
      id,
      data.deliveryId,
      data.driverId,
      JSON.stringify(signatureEncrypted),
      data.signedAt,
      data.gpsLatitude,
      data.gpsLongitude,
      data.deviceId,
      data.ipAddress
    ]);

    return {
      ...data,
      id,
      createdAt: new Date()
    };
  }

  // =========================================================================
  // Audit Log Operations
  // =========================================================================

  async logVerificationEvent(
    data: Omit<VerificationAuditLog, 'id' | 'createdAt'>
  ): Promise<VerificationAuditLog> {
    const id = uuidv4();

    const sql = `
      INSERT INTO verification_audit_logs (
        id, driver_id, delivery_id, event_type, event_description,
        performed_by, performed_by_role, timestamp, gps_latitude,
        gps_longitude, ip_address, device_id, metadata, severity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.execute(sql, [
      id,
      data.driverId,
      data.deliveryId || null,
      data.eventType,
      data.eventDescription,
      data.performedBy,
      data.performedByRole,
      data.timestamp,
      data.gpsLatitude || null,
      data.gpsLongitude || null,
      data.ipAddress || null,
      data.deviceId || null,
      data.metadata ? JSON.stringify(data.metadata) : null,
      data.severity
    ]);

    return {
      ...data,
      id,
      createdAt: new Date()
    };
  }

  async getAuditLogsByDriver(
    driverId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<VerificationAuditLog[]> {
    let sql = `
      SELECT * FROM verification_audit_logs
      WHERE driver_id = ?
    `;

    const params: any[] = [driverId];

    if (startDate) {
      sql += ' AND timestamp >= ?';
      params.push(startDate);
    }

    if (endDate) {
      sql += ' AND timestamp <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY timestamp DESC';

    const rows = await this.db.query(sql, params);
    return rows.map(row => this.mapAuditLogRow(row));
  }

  // =========================================================================
  // Emergency Override Operations
  // =========================================================================

  async createEmergencyOverride(
    data: Omit<EmergencyOverride, 'id' | 'createdAt'>
  ): Promise<EmergencyOverride> {
    const id = uuidv4();

    const sql = `
      INSERT INTO emergency_overrides (
        id, delivery_id, driver_id, requested_by, approved_by,
        reason, justification, timestamp, expires_at, used, used_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.execute(sql, [
      id,
      data.deliveryId,
      data.driverId,
      data.requestedBy,
      data.approvedBy,
      data.reason,
      data.justification,
      data.timestamp,
      data.expiresAt,
      data.used,
      data.usedAt || null
    ]);

    return {
      ...data,
      id,
      createdAt: new Date()
    };
  }

  async markOverrideAsUsed(overrideId: string): Promise<void> {
    const sql = `
      UPDATE emergency_overrides
      SET used = TRUE,
          used_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await this.db.execute(sql, [overrideId]);
  }

  // =========================================================================
  // Helper Methods for Row Mapping
  // =========================================================================

  private mapGovernmentIDRow(row: any): GovernmentID {
    const idNumberData = JSON.parse(row.id_number_encrypted);

    return {
      id: row.id,
      driverId: row.driver_id,
      idType: row.id_type,
      idNumber: this.encryption.decrypt(
        idNumberData.encrypted,
        idNumberData.iv,
        idNumberData.tag
      ),
      issuingAuthority: row.issuing_authority,
      issuingCountry: row.issuing_country,
      issueDate: new Date(row.issue_date),
      expiryDate: new Date(row.expiry_date),
      photoUrl: row.photo_url_encrypted
        ? (() => {
            const photoData = JSON.parse(row.photo_url_encrypted);
            return this.encryption.decrypt(photoData.encrypted, photoData.iv, photoData.tag);
          })()
        : undefined,
      verificationStatus: row.verification_status,
      verifiedAt: row.verified_at ? new Date(row.verified_at) : undefined,
      verifiedBy: row.verified_by || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapDriverLicenseRow(row: any): DriverLicense {
    const licenseData = JSON.parse(row.license_number_encrypted);

    return {
      id: row.id,
      driverId: row.driver_id,
      licenseNumber: this.encryption.decrypt(
        licenseData.encrypted,
        licenseData.iv,
        licenseData.tag
      ),
      categories: JSON.parse(row.categories),
      issuingAuthority: row.issuing_authority,
      issueDate: new Date(row.issue_date),
      expiryDate: new Date(row.expiry_date),
      verificationStatus: row.verification_status,
      verifiedAt: row.verified_at ? new Date(row.verified_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapAuthorizationRow(row: any): ControlledSubstanceAuthorization {
    return {
      id: row.id,
      driverId: row.driver_id,
      authorizationLevel: row.authorization_level,
      pharmacyId: row.pharmacy_id,
      issuedBy: row.issued_by,
      validFrom: new Date(row.valid_from),
      validUntil: new Date(row.valid_until),
      restrictions: row.restrictions ? JSON.parse(row.restrictions) : undefined,
      trainingCertificateUrl: row.training_certificate_url || undefined,
      status: row.status,
      revokedAt: row.revoked_at ? new Date(row.revoked_at) : undefined,
      revokedBy: row.revoked_by || undefined,
      revokedReason: row.revoked_reason || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapAuditLogRow(row: any): VerificationAuditLog {
    return {
      id: row.id,
      driverId: row.driver_id,
      deliveryId: row.delivery_id || undefined,
      eventType: row.event_type,
      eventDescription: row.event_description,
      performedBy: row.performed_by,
      performedByRole: row.performed_by_role,
      timestamp: new Date(row.timestamp),
      gpsLatitude: row.gps_latitude || undefined,
      gpsLongitude: row.gps_longitude || undefined,
      ipAddress: row.ip_address || undefined,
      deviceId: row.device_id || undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      severity: row.severity,
      createdAt: new Date(row.created_at)
    };
  }
}
