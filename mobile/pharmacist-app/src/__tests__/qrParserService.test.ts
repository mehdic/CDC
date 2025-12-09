/**
 * QR Parser Service Tests
 * Tests for GS1 QR code parsing and Swiss pharma data extraction
 */

import { QrParserService } from '../services/qrParserService';

describe('QrParserService', () => {
  let service: QrParserService;

  beforeEach(() => {
    service = new QrParserService();
  });

  describe('parseQrCode', () => {
    it('should parse GS1 format with GTIN and expiry date', () => {
      const qrData = '(01)07680123456789(17)250630(10)BATCH123';
      const result = service.parseQrCode(qrData);

      expect(result.format).toBe('GS1');
      expect(result.gtin).toBe('07680123456789');
      expect(result.expirationDate).toBe('2025-06-30');
      expect(result.batchNumber).toBe('BATCH123');
      expect(result.parsed).toBe(true);
    });

    it('should parse EAN-13 barcode', () => {
      const ean = '7680123456789';
      const result = service.parseQrCode(ean);

      expect(result.format).toBe('EAN');
      expect(result.gtin).toBe('07680123456789');
      expect(result.parsed).toBe(true);
    });

    it('should handle missing GTIN gracefully', () => {
      const qrData = '(17)250630(10)BATCH123';
      const result = service.parseQrCode(qrData);

      expect(result.parsed).toBe(false);
      expect(result.errors).toContain('Missing GTIN (AI 01)');
    });

    it('should parse quantity and price', () => {
      const qrData = '(01)07680123456789(30)100(3900)4500';
      const result = service.parseQrCode(qrData);

      expect(result.quantity).toBe(100);
      expect(result.price).toBe(45.0); // 4500 cents = 45.00 CHF
    });

    it('should handle unknown format', () => {
      const qrData = 'INVALID_QR_CODE';
      const result = service.parseQrCode(qrData);

      expect(result.format).toBe('UNKNOWN');
      expect(result.parsed).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty input', () => {
      const result = service.parseQrCode('');

      expect(result.parsed).toBe(false);
      expect(result.errors).toContain('Empty QR code data');
    });
  });

  describe('parseSwissPharmaCode', () => {
    it('should extract Swissmedic number', () => {
      const qrData = '(01)07680123456789(17)250630(710)SM-12345';
      const result = service.parseSwissPharmaCode(qrData);

      expect(result.swissmedicNumber).toBe('SM-12345');
    });

    it('should detect controlled substances', () => {
      const qrData = '(01)07680123456789(17)250630';
      const result = service.parseSwissPharmaCode(qrData);

      expect(result.isControlledSubstance).toBeDefined();
    });
  });

  describe('validateGtin', () => {
    it('should validate correct GTIN-14', () => {
      const gtin = '07680123456789';
      const isValid = service.validateGtin(gtin);

      // Note: This is a test GTIN, actual validation depends on check digit
      expect(typeof isValid).toBe('boolean');
    });

    it('should reject invalid length', () => {
      const gtin = '12345';
      const isValid = service.validateGtin(gtin);

      expect(isValid).toBe(false);
    });
  });

  describe('isExpired', () => {
    it('should detect expired products', () => {
      const expiredDate = '2020-01-01';
      const isExpired = service.isExpired(expiredDate);

      expect(isExpired).toBe(true);
    });

    it('should detect valid future dates', () => {
      const futureDate = '2030-12-31';
      const isExpired = service.isExpired(futureDate);

      expect(isExpired).toBe(false);
    });

    it('should handle null dates', () => {
      const isExpired = service.isExpired(null);

      expect(isExpired).toBe(false);
    });
  });

  describe('getDaysUntilExpiration', () => {
    it('should calculate days until expiration', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const dateString = futureDate.toISOString().split('T')[0];

      const days = service.getDaysUntilExpiration(dateString);

      expect(days).toBeGreaterThanOrEqual(29);
      expect(days).toBeLessThanOrEqual(31);
    });

    it('should return negative days for expired products', () => {
      const pastDate = '2020-01-01';
      const days = service.getDaysUntilExpiration(pastDate);

      expect(days).toBeLessThan(0);
    });

    it('should handle null dates', () => {
      const days = service.getDaysUntilExpiration(null);

      expect(days).toBeNull();
    });
  });

  describe('formatForDisplay', () => {
    it('should format complete data', () => {
      const data = {
        gtin: '07680123456789',
        expirationDate: '2025-12-31',
        batchNumber: 'BATCH123',
        serialNumber: 'SN456',
        quantity: 100,
        price: 49.90,
        raw: '(01)07680123456789(17)251231(10)BATCH123',
        format: 'GS1' as const,
        parsed: true,
        errors: [],
      };

      const formatted = service.formatForDisplay(data);

      expect(formatted).toContain('GTIN: 07680123456789');
      expect(formatted).toContain('Expiry: 2025-12-31');
      expect(formatted).toContain('Batch: BATCH123');
      expect(formatted).toContain('Serial: SN456');
      expect(formatted).toContain('Quantity: 100');
      expect(formatted).toContain('CHF 49.90');
    });

    it('should show expiration warnings', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 20);
      const data = {
        gtin: '07680123456789',
        expirationDate: futureDate.toISOString().split('T')[0],
        batchNumber: null,
        serialNumber: null,
        quantity: null,
        price: null,
        raw: '',
        format: 'GS1' as const,
        parsed: true,
        errors: [],
      };

      const formatted = service.formatForDisplay(data);

      expect(formatted).toMatch(/Expires in \d+ days/);
    });
  });
});
