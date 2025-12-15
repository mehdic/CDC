/**
 * QR Code Parser Service
 * Parses and validates QR codes for package verification
 *
 * Features:
 * - Parse QR code formats (standard, delivery package, patient ID)
 * - Validate QR code structure and data
 * - Extract package and patient information
 * - Check for controlled substances handling
 */

/**
 * Supported QR code types
 */
export enum QRCodeType {
  PACKAGE = 'package',
  PATIENT_ID = 'patient_id',
  DELIVERY_MANIFEST = 'delivery_manifest',
  UNKNOWN = 'unknown',
}

/**
 * Parsed QR code data
 */
export interface ParsedQRCode {
  readonly type: QRCodeType;
  readonly isValid: boolean;
  readonly data: {
    readonly packageId?: string;
    readonly deliveryId?: string;
    readonly patientId?: string;
    readonly batchNumber?: string;
    readonly expiryDate?: string;
    readonly controlledSubstance?: boolean;
    readonly storageConditions?: string[];
  };
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * QR Code Parser Service
 */
export class QRParserService {
  /**
   * Format: METAPHARM-PKG-{deliveryId}-{packageId}-{checksum}
   * Example: METAPHARM-PKG-DEL001-PKG0001-A7F3
   */
  private static readonly PACKAGE_QR_PATTERN = /^METAPHARM-PKG-([A-Z0-9]+)-([A-Z0-9]+)-([A-F0-9]{4})$/i;

  /**
   * Format: METAPHARM-PATIENT-{patientId}-{checksum}
   * Example: METAPHARM-PATIENT-PAT123456-B2E9
   */
  private static readonly PATIENT_QR_PATTERN = /^METAPHARM-PATIENT-([A-Z0-9]+)-([A-F0-9]{4})$/i;

  /**
   * Format: METAPHARM-MANIFEST-{deliveryId}-{itemCount}-{checksum}
   * Example: METAPHARM-MANIFEST-DEL001-5-C4D1
   */
  private static readonly MANIFEST_QR_PATTERN = /^METAPHARM-MANIFEST-([A-Z0-9]+)-(\d+)-([A-F0-9]{4})$/i;

  /**
   * Parse QR code data
   */
  static parseQRCode(rawQRData: string): ParsedQRCode {
    const trimmedData = rawQRData.trim();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!trimmedData) {
      return {
        type: QRCodeType.UNKNOWN,
        isValid: false,
        data: {},
        errors: ['QR code data is empty'],
        warnings: [],
      };
    }

    // Try to detect QR code type and parse
    if (this.PACKAGE_QR_PATTERN.test(trimmedData)) {
      return this.parsePackageQR(trimmedData);
    }

    if (this.PATIENT_QR_PATTERN.test(trimmedData)) {
      return this.parsePatientQR(trimmedData);
    }

    if (this.MANIFEST_QR_PATTERN.test(trimmedData)) {
      return this.parseManifestQR(trimmedData);
    }

    // Try JSON format (fallback)
    try {
      return this.parseJsonQR(trimmedData);
    } catch {
      // Continue to unknown format
    }

    return {
      type: QRCodeType.UNKNOWN,
      isValid: false,
      data: {},
      errors: ['QR code format not recognized'],
      warnings: [],
    };
  }

  /**
   * Parse package QR code
   * Format: METAPHARM-PKG-{deliveryId}-{packageId}-{checksum}
   */
  private static parsePackageQR(qrData: string): ParsedQRCode {
    const match = qrData.match(this.PACKAGE_QR_PATTERN);
    if (!match) {
      return {
        type: QRCodeType.PACKAGE,
        isValid: false,
        data: {},
        errors: ['Invalid package QR code format'],
        warnings: [],
      };
    }

    const deliveryId = match[1];
    const packageId = match[2];
    const checksum = match[3];

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate checksum
    if (!this.validateChecksum(qrData, checksum)) {
      errors.push('QR code checksum validation failed');
    }

    // Validate IDs
    if (!deliveryId || deliveryId.length === 0) {
      errors.push('Delivery ID is missing or invalid');
    }

    if (!packageId || packageId.length === 0) {
      errors.push('Package ID is missing or invalid');
    }

    return {
      type: QRCodeType.PACKAGE,
      isValid: errors.length === 0,
      data: {
        deliveryId,
        packageId,
      },
      errors,
      warnings,
    };
  }

  /**
   * Parse patient ID QR code
   * Format: METAPHARM-PATIENT-{patientId}-{checksum}
   */
  private static parsePatientQR(qrData: string): ParsedQRCode {
    const match = qrData.match(this.PATIENT_QR_PATTERN);
    if (!match) {
      return {
        type: QRCodeType.PATIENT_ID,
        isValid: false,
        data: {},
        errors: ['Invalid patient QR code format'],
        warnings: [],
      };
    }

    const patientId = match[1];
    const checksum = match[2];

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate checksum
    if (!this.validateChecksum(qrData, checksum)) {
      errors.push('Patient ID QR code checksum validation failed');
    }

    if (!patientId || patientId.length === 0) {
      errors.push('Patient ID is missing or invalid');
    }

    // Check for additional validations if needed
    if (patientId.length > 20) {
      warnings.push('Patient ID is unusually long');
    }

    return {
      type: QRCodeType.PATIENT_ID,
      isValid: errors.length === 0,
      data: {
        patientId,
      },
      errors,
      warnings,
    };
  }

  /**
   * Parse delivery manifest QR code
   * Format: METAPHARM-MANIFEST-{deliveryId}-{itemCount}-{checksum}
   */
  private static parseManifestQR(qrData: string): ParsedQRCode {
    const match = qrData.match(this.MANIFEST_QR_PATTERN);
    if (!match) {
      return {
        type: QRCodeType.DELIVERY_MANIFEST,
        isValid: false,
        data: {},
        errors: ['Invalid manifest QR code format'],
        warnings: [],
      };
    }

    const deliveryId = match[1];
    const itemCount = parseInt(match[2], 10);
    const checksum = match[3];

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate checksum
    if (!this.validateChecksum(qrData, checksum)) {
      errors.push('Manifest QR code checksum validation failed');
    }

    if (!deliveryId || deliveryId.length === 0) {
      errors.push('Delivery ID is missing or invalid');
    }

    if (itemCount <= 0) {
      errors.push('Item count must be greater than 0');
    }

    if (itemCount > 1000) {
      warnings.push('Item count is unusually high');
    }

    return {
      type: QRCodeType.DELIVERY_MANIFEST,
      isValid: errors.length === 0,
      data: {
        deliveryId,
      },
      errors,
      warnings,
    };
  }

  /**
   * Parse JSON-formatted QR code
   */
  private static parseJsonQR(qrData: string): ParsedQRCode {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const parsed = JSON.parse(qrData);

      if (!parsed.type) {
        errors.push('QR code type field is missing');
        return {
          type: QRCodeType.UNKNOWN,
          isValid: false,
          data: parsed,
          errors,
          warnings,
        };
      }

      const type = parsed.type.toUpperCase();
      let qrType = QRCodeType.UNKNOWN;

      if (type === 'PACKAGE') {
        qrType = QRCodeType.PACKAGE;
      } else if (type === 'PATIENT') {
        qrType = QRCodeType.PATIENT_ID;
      } else if (type === 'MANIFEST') {
        qrType = QRCodeType.DELIVERY_MANIFEST;
      }

      // Validate required fields based on type
      if (qrType === QRCodeType.PACKAGE) {
        if (!parsed.deliveryId) errors.push('deliveryId is required for package QR');
        if (!parsed.packageId) errors.push('packageId is required for package QR');
      } else if (qrType === QRCodeType.PATIENT_ID) {
        if (!parsed.patientId) errors.push('patientId is required for patient QR');
      } else if (qrType === QRCodeType.DELIVERY_MANIFEST) {
        if (!parsed.deliveryId) errors.push('deliveryId is required for manifest QR');
      }

      return {
        type: qrType,
        isValid: errors.length === 0 && qrType !== QRCodeType.UNKNOWN,
        data: {
          packageId: parsed.packageId,
          deliveryId: parsed.deliveryId,
          patientId: parsed.patientId,
          batchNumber: parsed.batchNumber,
          expiryDate: parsed.expiryDate,
          controlledSubstance: parsed.controlledSubstance || false,
          storageConditions: parsed.storageConditions || [],
        },
        errors,
        warnings,
      };
    } catch (error) {
      errors.push('Invalid JSON format in QR code');
      return {
        type: QRCodeType.UNKNOWN,
        isValid: false,
        data: {},
        errors,
        warnings,
      };
    }
  }

  /**
   * Validate checksum using simple algorithm
   * Checksum: First 4 hex digits of the hash of the data part
   */
  private static validateChecksum(qrData: string, checksum: string): boolean {
    try {
      // Extract data part (everything except the checksum)
      const dataPart = qrData.substring(0, qrData.lastIndexOf('-'));

      // Simple checksum: sum of character codes modulo 65536, converted to hex
      let sum = 0;
      for (let i = 0; i < dataPart.length; i++) {
        sum = (sum + dataPart.charCodeAt(i)) % 65536;
      }

      const calculatedChecksum = sum.toString(16).toUpperCase().padStart(4, '0').substring(0, 4);

      return calculatedChecksum === checksum.toUpperCase();
    } catch {
      return false;
    }
  }

  /**
   * Check if QR code indicates controlled substance
   */
  static isControlledSubstance(parsedQR: ParsedQRCode): boolean {
    return parsedQR.data.controlledSubstance ?? false;
  }

  /**
   * Get storage condition requirements from QR code
   */
  static getStorageRequirements(parsedQR: ParsedQRCode): string[] {
    return parsedQR.data.storageConditions ?? [];
  }

  /**
   * Check if QR code requires additional patient verification
   */
  static requiresPatientVerification(parsedQR: ParsedQRCode): boolean {
    // Package QR codes require patient ID verification for controlled substances
    return parsedQR.type === QRCodeType.PACKAGE && this.isControlledSubstance(parsedQR);
  }
}

export default QRParserService;
