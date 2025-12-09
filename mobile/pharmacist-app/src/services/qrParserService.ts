/**
 * QR Code Parser Service
 * Decodes Swiss pharmaceutical QR codes (GS1 format)
 *
 * Features:
 * - GS1 Application Identifier (AI) parsing
 * - Swiss pharma-specific data extraction
 * - Multiple barcode format support (QR, Code128, DataMatrix)
 * - Batch/lot tracking
 * - Expiration date parsing
 *
 * GS1 Standard: https://www.gs1.org/standards/barcodes
 */

export interface QrCodeData {
  gtin: string | null; // Global Trade Item Number (01)
  expirationDate: string | null; // Expiry date (17) - YYMMDD
  batchNumber: string | null; // Batch/Lot number (10)
  serialNumber: string | null; // Serial number (21)
  quantity: number | null; // Variable count (30)
  price: number | null; // Price (390n)
  raw: string; // Original raw data
  format: 'GS1' | 'EAN' | 'UNKNOWN';
  parsed: boolean;
  errors: string[];
}

export interface SwissPharmaData extends QrCodeData {
  productName: string | null;
  manufacturer: string | null;
  ndcCode: string | null; // National Drug Code
  swissmedicNumber: string | null; // Swiss specific
  isControlledSubstance: boolean;
}

/**
 * GS1 Application Identifiers
 * Format: (AI)VALUE
 * https://www.gs1.org/standards/barcodes/application-identifiers
 */
const GS1_AI_PATTERNS = {
  GTIN: /\(01\)(\d{14})/,
  EXPIRY_DATE: /\(17\)(\d{6})/,
  BATCH_LOT: /\(10\)([^\(]+)/,
  SERIAL_NUMBER: /\(21\)([^\(]+)/,
  QUANTITY: /\(30\)(\d+)/,
  PRICE: /\(390\d\)(\d+)/,
  NDC: /\(240\)([^\(]+)/, // Additional product identification
  SWISSMEDIC: /\(710\)([^\(]+)/, // Swiss-specific (custom AI)
};

/**
 * EAN-13/UPC barcode pattern
 */
const EAN_PATTERN = /^\d{13}$/;

/**
 * QR Code Parser Service
 */
export class QrParserService {
  /**
   * Parse QR code data (main entry point)
   * @param qrData - Raw QR code string from scanner
   */
  public parseQrCode(qrData: string): QrCodeData {
    if (!qrData || qrData.trim().length === 0) {
      return this.createEmptyResult(qrData, ['Empty QR code data']);
    }

    // Try GS1 format first (most common for pharma)
    if (qrData.includes('(')) {
      return this.parseGS1Format(qrData);
    }

    // Try EAN-13 format
    if (EAN_PATTERN.test(qrData.trim())) {
      return this.parseEanFormat(qrData.trim());
    }

    // Unknown format
    return this.createEmptyResult(qrData, ['Unknown QR code format']);
  }

  /**
   * Parse Swiss pharmaceutical QR code
   * Includes Swiss-specific fields
   */
  public parseSwissPharmaCode(qrData: string): SwissPharmaData {
    const baseData = this.parseQrCode(qrData);

    // Extract Swiss-specific fields
    const swissmedicMatch = qrData.match(GS1_AI_PATTERNS.SWISSMEDIC);
    const ndcMatch = qrData.match(GS1_AI_PATTERNS.NDC);

    // Determine if controlled substance (requires special tracking)
    // In production, check against Swissmedic controlled substance database
    const isControlledSubstance = this.isControlledSubstance(baseData.gtin);

    return {
      ...baseData,
      productName: null, // Requires database lookup by GTIN
      manufacturer: null, // Requires database lookup
      ndcCode: ndcMatch ? ndcMatch[1] : null,
      swissmedicNumber: swissmedicMatch ? swissmedicMatch[1] : null,
      isControlledSubstance,
    };
  }

  /**
   * Parse GS1 format QR code
   * Format: (AI1)VALUE1(AI2)VALUE2...
   */
  private parseGS1Format(qrData: string): QrCodeData {
    const errors: string[] = [];
    const result: QrCodeData = {
      gtin: null,
      expirationDate: null,
      batchNumber: null,
      serialNumber: null,
      quantity: null,
      price: null,
      raw: qrData,
      format: 'GS1',
      parsed: false,
      errors: [],
    };

    // Extract GTIN (01)
    const gtinMatch = qrData.match(GS1_AI_PATTERNS.GTIN);
    if (gtinMatch) {
      result.gtin = gtinMatch[1];
    } else {
      errors.push('Missing GTIN (AI 01)');
    }

    // Extract Expiration Date (17)
    const expiryMatch = qrData.match(GS1_AI_PATTERNS.EXPIRY_DATE);
    if (expiryMatch) {
      result.expirationDate = this.parseExpiryDate(expiryMatch[1]);
    }

    // Extract Batch/Lot Number (10)
    const batchMatch = qrData.match(GS1_AI_PATTERNS.BATCH_LOT);
    if (batchMatch) {
      result.batchNumber = batchMatch[1].trim();
    }

    // Extract Serial Number (21)
    const serialMatch = qrData.match(GS1_AI_PATTERNS.SERIAL_NUMBER);
    if (serialMatch) {
      result.serialNumber = serialMatch[1].trim();
    }

    // Extract Quantity (30)
    const quantityMatch = qrData.match(GS1_AI_PATTERNS.QUANTITY);
    if (quantityMatch) {
      result.quantity = parseInt(quantityMatch[1], 10);
    }

    // Extract Price (390n)
    const priceMatch = qrData.match(GS1_AI_PATTERNS.PRICE);
    if (priceMatch) {
      // Price is in minor units (cents), convert to major units
      result.price = parseInt(priceMatch[1], 10) / 100;
    }

    result.parsed = errors.length === 0;
    result.errors = errors;

    return result;
  }

  /**
   * Parse EAN-13 barcode
   */
  private parseEanFormat(ean: string): QrCodeData {
    return {
      gtin: this.eanToGtin(ean),
      expirationDate: null,
      batchNumber: null,
      serialNumber: null,
      quantity: null,
      price: null,
      raw: ean,
      format: 'EAN',
      parsed: true,
      errors: [],
    };
  }

  /**
   * Convert EAN-13 to GTIN-14
   * @param ean - 13-digit EAN code
   */
  private eanToGtin(ean: string): string {
    // GTIN-14 = '0' + EAN-13
    return '0' + ean;
  }

  /**
   * Parse expiry date from YYMMDD format
   * @param yymmdd - 6-digit date (e.g., "250630" = June 30, 2025)
   */
  private parseExpiryDate(yymmdd: string): string {
    if (yymmdd.length !== 6) {
      return yymmdd; // Return as-is if invalid
    }

    const yy = parseInt(yymmdd.substring(0, 2), 10);
    const mm = yymmdd.substring(2, 4);
    const dd = yymmdd.substring(4, 6);

    // Determine century (assume 2000-2099)
    const year = yy >= 0 && yy <= 99 ? 2000 + yy : yy;

    return `${year}-${mm}-${dd}`;
  }

  /**
   * Check if product is a controlled substance
   * In production, query Swissmedic database
   */
  private isControlledSubstance(gtin: string | null): boolean {
    if (!gtin) return false;

    // Stub implementation
    // In production, check against Swissmedic controlled substance list
    // Categories: Betäubungsmittel (narcotics), Psychotrope Stoffe (psychotropics)
    const controlledGtins = [
      '07680123456789', // Example: Morphine
      '07680234567890', // Example: Oxycodone
      '07680345678901', // Example: Fentanyl
    ];

    return controlledGtins.includes(gtin);
  }

  /**
   * Validate GTIN checksum
   * Uses GS1 check digit algorithm
   */
  public validateGtin(gtin: string): boolean {
    if (!gtin || gtin.length !== 14) {
      return false;
    }

    // GS1 check digit algorithm
    let sum = 0;
    for (let i = 0; i < 13; i++) {
      const digit = parseInt(gtin[i], 10);
      if (isNaN(digit)) return false;

      // Multiply odd positions by 3, even by 1
      sum += digit * (i % 2 === 0 ? 3 : 1);
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(gtin[13], 10);
  }

  /**
   * Validate expiration date is in the future
   */
  public isExpired(expirationDate: string | null): boolean {
    if (!expirationDate) return false;

    try {
      const expiry = new Date(expirationDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Compare dates only

      return expiry < today;
    } catch {
      return false;
    }
  }

  /**
   * Get expiration warning
   * Returns number of days until expiration (negative if expired)
   */
  public getDaysUntilExpiration(expirationDate: string | null): number | null {
    if (!expirationDate) return null;

    try {
      const expiry = new Date(expirationDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const diffMs = expiry.getTime() - today.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      return diffDays;
    } catch {
      return null;
    }
  }

  /**
   * Format QR data for display
   */
  public formatForDisplay(data: QrCodeData): string {
    const lines: string[] = [];

    if (data.gtin) {
      lines.push(`GTIN: ${data.gtin}`);
    }

    if (data.expirationDate) {
      const daysUntilExpiry = this.getDaysUntilExpiration(data.expirationDate);
      const expiryStatus = daysUntilExpiry !== null
        ? daysUntilExpiry < 0
          ? ` (EXPIRED ${Math.abs(daysUntilExpiry)} days ago)`
          : daysUntilExpiry < 30
          ? ` (Expires in ${daysUntilExpiry} days ⚠️)`
          : ` (Expires in ${daysUntilExpiry} days)`
        : '';
      lines.push(`Expiry: ${data.expirationDate}${expiryStatus}`);
    }

    if (data.batchNumber) {
      lines.push(`Batch: ${data.batchNumber}`);
    }

    if (data.serialNumber) {
      lines.push(`Serial: ${data.serialNumber}`);
    }

    if (data.quantity !== null) {
      lines.push(`Quantity: ${data.quantity}`);
    }

    if (data.price !== null) {
      lines.push(`Price: CHF ${data.price.toFixed(2)}`);
    }

    if (data.errors.length > 0) {
      lines.push('');
      lines.push('Warnings:');
      data.errors.forEach((error) => {
        lines.push(`- ${error}`);
      });
    }

    return lines.join('\n');
  }

  /**
   * Create empty result for invalid QR codes
   */
  private createEmptyResult(raw: string, errors: string[]): QrCodeData {
    return {
      gtin: null,
      expirationDate: null,
      batchNumber: null,
      serialNumber: null,
      quantity: null,
      price: null,
      raw,
      format: 'UNKNOWN',
      parsed: false,
      errors,
    };
  }
}

/**
 * Singleton instance
 */
export const qrParserService = new QrParserService();

/**
 * Example Usage:
 *
 * // Parse a GS1 QR code
 * const qrData = "(01)07680123456789(17)250630(10)BATCH123(21)SERIAL456";
 * const parsed = qrParserService.parseQrCode(qrData);
 *
 * console.log(parsed.gtin); // "07680123456789"
 * console.log(parsed.expirationDate); // "2025-06-30"
 * console.log(parsed.batchNumber); // "BATCH123"
 *
 * // Check if expired
 * const isExpired = qrParserService.isExpired(parsed.expirationDate);
 *
 * // Get Swiss pharma-specific data
 * const swissData = qrParserService.parseSwissPharmaCode(qrData);
 * console.log(swissData.isControlledSubstance); // true/false
 */
