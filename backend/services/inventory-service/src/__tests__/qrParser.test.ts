/**
 * QR Parser Unit Tests
 * Tests for GS1 DataMatrix QR code parsing
 */

import { parseGS1QRCode, isValidGS1QRCode, extractGTIN } from '../utils/qrParser';

describe('QR Parser', () => {
  describe('parseGS1QRCode', () => {
    it('should parse complete GS1 QR code with all fields', () => {
      const qrCode = '(01)08901234567890(17)250630(10)ABC123(21)XYZ789';
      const result = parseGS1QRCode(qrCode);

      expect(result.gtin).toBe('08901234567890');
      expect(result.expiryDate).toEqual(new Date(2025, 5, 30)); // Month is 0-indexed
      expect(result.batchNumber).toBe('ABC123');
      expect(result.serialNumber).toBe('XYZ789');
      expect(result.raw).toBe(qrCode);
    });

    it('should parse QR code with only GTIN', () => {
      const qrCode = '(01)08901234567890';
      const result = parseGS1QRCode(qrCode);

      expect(result.gtin).toBe('08901234567890');
      expect(result.expiryDate).toBeNull();
      expect(result.batchNumber).toBeNull();
      expect(result.serialNumber).toBeNull();
    });

    it('should parse QR code with GTIN and batch number', () => {
      const qrCode = '(01)08901234567890(10)BATCH001';
      const result = parseGS1QRCode(qrCode);

      expect(result.gtin).toBe('08901234567890');
      expect(result.batchNumber).toBe('BATCH001');
      expect(result.expiryDate).toBeNull();
      expect(result.serialNumber).toBeNull();
    });

    it('should throw error for QR code without GTIN', () => {
      const qrCode = '(17)250630(10)ABC123';

      expect(() => parseGS1QRCode(qrCode)).toThrow('QR code missing GTIN');
    });

    it('should handle expiration date parsing correctly', () => {
      const qrCode = '(01)08901234567890(17)240315';
      const result = parseGS1QRCode(qrCode);

      expect(result.expiryDate).toEqual(new Date(2024, 2, 15)); // March 15, 2024
    });

    it('should handle century rollover (1900s vs 2000s)', () => {
      const qrCode1 = '(01)08901234567890(17)250630'; // 2025
      const qrCode2 = '(01)08901234567890(17)990630'; // 1999

      const result1 = parseGS1QRCode(qrCode1);
      const result2 = parseGS1QRCode(qrCode2);

      expect(result1.expiryDate?.getFullYear()).toBe(2025);
      expect(result2.expiryDate?.getFullYear()).toBe(1999);
    });
  });

  describe('isValidGS1QRCode', () => {
    it('should return true for valid GS1 QR code', () => {
      const qrCode = '(01)08901234567890(17)250630';
      expect(isValidGS1QRCode(qrCode)).toBe(true);
    });

    it('should return false for QR code without GTIN', () => {
      const qrCode = '(17)250630(10)ABC123';
      expect(isValidGS1QRCode(qrCode)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidGS1QRCode('')).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isValidGS1QRCode(null as any)).toBe(false);
      expect(isValidGS1QRCode(undefined as any)).toBe(false);
    });
  });

  describe('extractGTIN', () => {
    it('should extract GTIN from QR code', () => {
      const qrCode = '(01)08901234567890(17)250630';
      expect(extractGTIN(qrCode)).toBe('08901234567890');
    });

    it('should return null if GTIN not found', () => {
      const qrCode = '(17)250630(10)ABC123';
      expect(extractGTIN(qrCode)).toBeNull();
    });
  });
});
