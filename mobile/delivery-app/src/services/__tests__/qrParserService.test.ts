/**
 * Tests for QR Parser Service
 * Covers QR code parsing, validation, and checksum verification
 */

import { QRParserService, QRCodeType, ParsedQRCode } from '../qrParserService';

describe('QRParserService', () => {
  describe('parseQRCode - Package QR', () => {
    it('should parse valid package QR code', () => {
      const qrData = 'METAPHARM-PKG-DEL001-PKG0001-A7F3';
      const result = QRParserService.parseQRCode(qrData);

      expect(result.type).toBe(QRCodeType.PACKAGE);
      expect(result.data.deliveryId).toBe('DEL001');
      expect(result.data.packageId).toBe('PKG0001');
    });

    it('should detect invalid package QR with wrong checksum', () => {
      const qrData = 'METAPHARM-PKG-DEL001-PKG0001-XXXX';
      const result = QRParserService.parseQRCode(qrData);

      expect(result.type).toBe(QRCodeType.PACKAGE);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('checksum');
    });

    it('should reject package QR with missing delivery ID', () => {
      const qrData = 'METAPHARM-PKG---PKG0001-A7F3';
      const result = QRParserService.parseQRCode(qrData);

      expect(result.type).toBe(QRCodeType.PACKAGE);
      expect(result.isValid).toBe(false);
    });

    it('should reject package QR with missing package ID', () => {
      const qrData = 'METAPHARM-PKG-DEL001--A7F3';
      const result = QRParserService.parseQRCode(qrData);

      expect(result.type).toBe(QRCodeType.PACKAGE);
      expect(result.isValid).toBe(false);
    });

    it('should handle case-insensitive package QR codes', () => {
      const qrData = 'metapharm-pkg-del001-pkg0001-a7f3';
      const result = QRParserService.parseQRCode(qrData);

      expect(result.type).toBe(QRCodeType.PACKAGE);
      expect(result.data.deliveryId).toBe('del001');
      expect(result.data.packageId).toBe('pkg0001');
    });
  });

  describe('parseQRCode - Patient ID QR', () => {
    it('should parse valid patient QR code', () => {
      const qrData = 'METAPHARM-PATIENT-PAT123456-B2E9';
      const result = QRParserService.parseQRCode(qrData);

      expect(result.type).toBe(QRCodeType.PATIENT_ID);
      expect(result.data.patientId).toBe('PAT123456');
    });

    it('should reject patient QR with invalid checksum', () => {
      const qrData = 'METAPHARM-PATIENT-PAT123456-YYYY';
      const result = QRParserService.parseQRCode(qrData);

      expect(result.type).toBe(QRCodeType.PATIENT_ID);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should warn for unusually long patient IDs', () => {
      const longPatientId = 'A'.repeat(25);
      const qrData = `METAPHARM-PATIENT-${longPatientId}-1234`;
      const result = QRParserService.parseQRCode(qrData);

      expect(result.type).toBe(QRCodeType.PATIENT_ID);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('parseQRCode - Manifest QR', () => {
    it('should parse valid manifest QR code', () => {
      const qrData = 'METAPHARM-MANIFEST-DEL001-5-C4D1';
      const result = QRParserService.parseQRCode(qrData);

      expect(result.type).toBe(QRCodeType.DELIVERY_MANIFEST);
      expect(result.data.deliveryId).toBe('DEL001');
    });

    it('should reject manifest with zero items', () => {
      const qrData = 'METAPHARM-MANIFEST-DEL001-0-C4D1';
      const result = QRParserService.parseQRCode(qrData);

      expect(result.type).toBe(QRCodeType.DELIVERY_MANIFEST);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('greater than 0');
    });

    it('should warn for unusually high item counts', () => {
      const qrData = 'METAPHARM-MANIFEST-DEL001-5000-C4D1';
      const result = QRParserService.parseQRCode(qrData);

      expect(result.type).toBe(QRCodeType.DELIVERY_MANIFEST);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('unusually high');
    });
  });

  describe('parseQRCode - JSON Format', () => {
    it('should parse valid JSON package QR', () => {
      const jsonQR = JSON.stringify({
        type: 'package',
        deliveryId: 'DEL001',
        packageId: 'PKG0001',
      });

      const result = QRParserService.parseQRCode(jsonQR);

      expect(result.type).toBe(QRCodeType.PACKAGE);
      expect(result.isValid).toBe(true);
      expect(result.data.deliveryId).toBe('DEL001');
    });

    it('should parse JSON patient QR', () => {
      const jsonQR = JSON.stringify({
        type: 'patient',
        patientId: 'PAT123456',
      });

      const result = QRParserService.parseQRCode(jsonQR);

      expect(result.type).toBe(QRCodeType.PATIENT_ID);
      expect(result.isValid).toBe(true);
    });

    it('should parse JSON manifest QR', () => {
      const jsonQR = JSON.stringify({
        type: 'manifest',
        deliveryId: 'DEL001',
      });

      const result = QRParserService.parseQRCode(jsonQR);

      expect(result.type).toBe(QRCodeType.DELIVERY_MANIFEST);
      expect(result.isValid).toBe(true);
    });

    it('should reject JSON package without deliveryId', () => {
      const jsonQR = JSON.stringify({
        type: 'package',
        packageId: 'PKG0001',
      });

      const result = QRParserService.parseQRCode(jsonQR);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('deliveryId');
    });

    it('should reject JSON package without packageId', () => {
      const jsonQR = JSON.stringify({
        type: 'package',
        deliveryId: 'DEL001',
      });

      const result = QRParserService.parseQRCode(jsonQR);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('packageId');
    });

    it('should extract controlled substance flag', () => {
      const jsonQR = JSON.stringify({
        type: 'package',
        deliveryId: 'DEL001',
        packageId: 'PKG0001',
        controlledSubstance: true,
      });

      const result = QRParserService.parseQRCode(jsonQR);

      expect(result.data.controlledSubstance).toBe(true);
    });

    it('should extract storage conditions', () => {
      const jsonQR = JSON.stringify({
        type: 'package',
        deliveryId: 'DEL001',
        packageId: 'PKG0001',
        storageConditions: ['refrigerated', 'protected_from_light'],
      });

      const result = QRParserService.parseQRCode(jsonQR);

      expect(result.data.storageConditions).toEqual(['refrigerated', 'protected_from_light']);
    });
  });

  describe('parseQRCode - Edge Cases', () => {
    it('should handle empty QR data', () => {
      const result = QRParserService.parseQRCode('');

      expect(result.type).toBe(QRCodeType.UNKNOWN);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('empty');
    });

    it('should handle whitespace-only QR data', () => {
      const result = QRParserService.parseQRCode('   ');

      expect(result.type).toBe(QRCodeType.UNKNOWN);
      expect(result.isValid).toBe(false);
    });

    it('should handle invalid JSON', () => {
      const result = QRParserService.parseQRCode('{ invalid json }');

      expect(result.type).toBe(QRCodeType.UNKNOWN);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle unrecognized format', () => {
      const result = QRParserService.parseQRCode('RANDOM_QR_DATA_HERE');

      expect(result.type).toBe(QRCodeType.UNKNOWN);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('not recognized');
    });

    it('should trim whitespace from QR data', () => {
      const qrData = '  METAPHARM-PKG-DEL001-PKG0001-A7F3  ';
      const result = QRParserService.parseQRCode(qrData);

      expect(result.type).toBe(QRCodeType.PACKAGE);
    });
  });

  describe('isControlledSubstance', () => {
    it('should return true for controlled substance flag', () => {
      const parsedQR: ParsedQRCode = {
        type: QRCodeType.PACKAGE,
        isValid: true,
        data: {
          controlledSubstance: true,
        },
        errors: [],
        warnings: [],
      };

      expect(QRParserService.isControlledSubstance(parsedQR)).toBe(true);
    });

    it('should return false when flag is false', () => {
      const parsedQR: ParsedQRCode = {
        type: QRCodeType.PACKAGE,
        isValid: true,
        data: {
          controlledSubstance: false,
        },
        errors: [],
        warnings: [],
      };

      expect(QRParserService.isControlledSubstance(parsedQR)).toBe(false);
    });

    it('should return false when flag is undefined', () => {
      const parsedQR: ParsedQRCode = {
        type: QRCodeType.PACKAGE,
        isValid: true,
        data: {},
        errors: [],
        warnings: [],
      };

      expect(QRParserService.isControlledSubstance(parsedQR)).toBe(false);
    });
  });

  describe('getStorageRequirements', () => {
    it('should return storage conditions', () => {
      const parsedQR: ParsedQRCode = {
        type: QRCodeType.PACKAGE,
        isValid: true,
        data: {
          storageConditions: ['refrigerated', 'protected_from_light'],
        },
        errors: [],
        warnings: [],
      };

      expect(QRParserService.getStorageRequirements(parsedQR)).toEqual([
        'refrigerated',
        'protected_from_light',
      ]);
    });

    it('should return empty array when no conditions', () => {
      const parsedQR: ParsedQRCode = {
        type: QRCodeType.PACKAGE,
        isValid: true,
        data: {},
        errors: [],
        warnings: [],
      };

      expect(QRParserService.getStorageRequirements(parsedQR)).toEqual([]);
    });
  });

  describe('requiresPatientVerification', () => {
    it('should return true for controlled substance packages', () => {
      const parsedQR: ParsedQRCode = {
        type: QRCodeType.PACKAGE,
        isValid: true,
        data: {
          controlledSubstance: true,
        },
        errors: [],
        warnings: [],
      };

      expect(QRParserService.requiresPatientVerification(parsedQR)).toBe(true);
    });

    it('should return false for non-controlled packages', () => {
      const parsedQR: ParsedQRCode = {
        type: QRCodeType.PACKAGE,
        isValid: true,
        data: {
          controlledSubstance: false,
        },
        errors: [],
        warnings: [],
      };

      expect(QRParserService.requiresPatientVerification(parsedQR)).toBe(false);
    });

    it('should return false for non-package QR codes', () => {
      const parsedQR: ParsedQRCode = {
        type: QRCodeType.PATIENT_ID,
        isValid: true,
        data: {
          controlledSubstance: true,
        },
        errors: [],
        warnings: [],
      };

      expect(QRParserService.requiresPatientVerification(parsedQR)).toBe(false);
    });
  });

  describe('Checksum Validation', () => {
    it('should validate correct checksums', () => {
      const validQRs = [
        'METAPHARM-PKG-DEL001-PKG0001-A7F3',
        'METAPHARM-PATIENT-PAT123456-B2E9',
        'METAPHARM-MANIFEST-DEL001-5-C4D1',
      ];

      validQRs.forEach(qrData => {
        const result = QRParserService.parseQRCode(qrData);
        const hasChecksumError = result.errors.some(e => e.includes('checksum'));
        expect(hasChecksumError).toBe(false);
      });
    });

    it('should reject incorrect checksums', () => {
      const invalidQRs = [
        'METAPHARM-PKG-DEL001-PKG0001-XXXX',
        'METAPHARM-PATIENT-PAT123456-YYYY',
        'METAPHARM-MANIFEST-DEL001-5-ZZZZ',
      ];

      invalidQRs.forEach(qrData => {
        const result = QRParserService.parseQRCode(qrData);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });
});
