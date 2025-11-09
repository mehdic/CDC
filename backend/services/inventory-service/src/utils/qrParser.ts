/**
 * QR Code Parser
 * Parses GS1 DataMatrix format QR codes for pharmaceutical products
 *
 * GS1 Application Identifiers (AIs):
 * - (01): GTIN (Global Trade Item Number) - 14 digits
 * - (17): Expiration date (YYMMDD format)
 * - (10): Batch/Lot number - variable length
 * - (21): Serial number - variable length
 *
 * Example QR code:
 * (01)08901234567890(17)250630(10)ABC123(21)XYZ789
 *
 * Parses to:
 * {
 *   gtin: "08901234567890",
 *   expiryDate: Date(2025-06-30),
 *   batchNumber: "ABC123",
 *   serialNumber: "XYZ789"
 * }
 */

export interface ParsedQRCode {
  gtin: string | null;
  expiryDate: Date | null;
  batchNumber: string | null;
  serialNumber: string | null;
  raw: string;
}

/**
 * Parse GS1 DataMatrix QR code
 */
export function parseGS1QRCode(qrCodeData: string): ParsedQRCode {
  const result: ParsedQRCode = {
    gtin: null,
    expiryDate: null,
    batchNumber: null,
    serialNumber: null,
    raw: qrCodeData,
  };

  try {
    // GS1 AIs are in format (XX)VALUE where XX is the AI code
    const aiRegex = /\((\d{2})\)([^\(]+)/g;
    let match;

    while ((match = aiRegex.exec(qrCodeData)) !== null) {
      const ai = match[1];
      const value = match[2].trim();

      switch (ai) {
        case '01':
          // GTIN (14 digits)
          result.gtin = value.substring(0, 14);
          break;

        case '17':
          // Expiration date (YYMMDD)
          result.expiryDate = parseGS1Date(value);
          break;

        case '10':
          // Batch number
          result.batchNumber = value;
          break;

        case '21':
          // Serial number
          result.serialNumber = value;
          break;

        default:
          // Ignore unknown AIs
          console.warn(`Unknown GS1 AI: ${ai}`);
      }
    }

    // Validation: GTIN is required
    if (!result.gtin) {
      throw new Error('QR code missing GTIN (AI 01)');
    }
  } catch (error) {
    console.error('Failed to parse QR code:', error);
    throw new Error(`Invalid QR code format: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Parse GS1 date format (YYMMDD) to JavaScript Date
 */
function parseGS1Date(dateStr: string): Date | null {
  if (dateStr.length !== 6) {
    console.warn(`Invalid GS1 date format: ${dateStr} (expected YYMMDD)`);
    return null;
  }

  const year = parseInt(dateStr.substring(0, 2), 10);
  const month = parseInt(dateStr.substring(2, 4), 10) - 1; // JS months are 0-indexed
  const day = parseInt(dateStr.substring(4, 6), 10);

  // Determine century (assume 2000s for years 00-49, 1900s for 50-99)
  const fullYear = year < 50 ? 2000 + year : 1900 + year;

  try {
    const date = new Date(fullYear, month, day);

    // Validate the date is real (e.g., not February 31st)
    if (
      date.getFullYear() !== fullYear ||
      date.getMonth() !== month ||
      date.getDate() !== day
    ) {
      console.warn(`Invalid date: ${dateStr}`);
      return null;
    }

    return date;
  } catch (error) {
    console.error('Failed to parse date:', error);
    return null;
  }
}

/**
 * Validate QR code format before parsing
 */
export function isValidGS1QRCode(qrCodeData: string): boolean {
  if (!qrCodeData || qrCodeData.trim().length === 0) {
    return false;
  }

  // Must contain at least GTIN (AI 01)
  return /\(01\)/.test(qrCodeData);
}

/**
 * Extract GTIN only (for quick lookups without full parsing)
 */
export function extractGTIN(qrCodeData: string): string | null {
  const match = qrCodeData.match(/\(01\)(\d{14})/);
  return match ? match[1] : null;
}
