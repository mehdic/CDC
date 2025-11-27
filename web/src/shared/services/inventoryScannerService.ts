/**
 * Inventory Scanner Service
 * Handles QR code processing for inventory management
 * Integrates QR scanning with inventory API
 */

import { QRScanResult } from './qrScannerService';

export interface ScanResultData {
  id?: string;
  medication_name: string;
  medication_gtin: string;
  quantity: number;
  unit: string;
  batch_number?: string;
  expiry_date?: string;
  storage_location?: string;
  is_controlled?: boolean;
}

export interface InventoryScanResponse {
  success: boolean;
  data?: ScanResultData;
  error?: string;
  message?: string;
}

export class InventoryScannerService {
  private apiBaseUrl: string;
  private pharmacyId: string | null = null;
  private authToken: string | null = null;

  constructor(apiBaseUrl?: string) {
    this.apiBaseUrl = apiBaseUrl || import.meta.env?.VITE_API_BASE_URL || 'http://localhost:4000';
  }

  /**
   * Set authentication context
   */
  setAuth(pharmacyId: string, authToken?: string): void {
    this.pharmacyId = pharmacyId;
    if (authToken) {
      this.authToken = authToken;
    } else {
      this.authToken = localStorage.getItem('auth_token');
    }
  }

  /**
   * Process a QR scan result
   * Sends the code to the API for validation and lookup
   */
  async processScan(scanResult: QRScanResult): Promise<InventoryScanResponse> {
    if (!this.pharmacyId) {
      throw new Error('Pharmacy ID not set. Call setAuth() first.');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/inventory/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
        },
        body: JSON.stringify({
          code: scanResult.code,
          format: scanResult.format,
          pharmacy_id: this.pharmacyId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to process QR code',
          message: data.message,
        };
      }

      return {
        success: true,
        data: data,
        message: 'QR code processed successfully',
      };
    } catch (error) {
      console.error('Error processing scan:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Manual entry fallback - validate and add item without scanning
   */
  async addItemManually(itemData: Partial<ScanResultData>): Promise<InventoryScanResponse> {
    if (!this.pharmacyId) {
      throw new Error('Pharmacy ID not set. Call setAuth() first.');
    }

    // Validate required fields
    const requiredFields = ['medication_name', 'medication_gtin', 'quantity', 'unit'];
    const missingFields = requiredFields.filter((field) => !itemData[field as keyof ScanResultData]);

    if (missingFields.length > 0) {
      return {
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`,
      };
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/inventory/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
        },
        body: JSON.stringify({
          ...itemData,
          pharmacy_id: this.pharmacyId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to add item',
          message: data.message,
        };
      }

      return {
        success: true,
        data: data,
        message: 'Item added successfully',
      };
    } catch (error) {
      console.error('Error adding item:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate QR code format and structure
   */
  validateQRCode(code: string): {
    valid: boolean;
    format?: string;
    error?: string;
  } {
    if (!code || code.trim().length === 0) {
      return {
        valid: false,
        error: 'QR code cannot be empty',
      };
    }

    // Check if it looks like a valid code
    if (code.length < 5) {
      return {
        valid: false,
        error: 'QR code appears too short',
      };
    }

    // Detect format (basic detection)
    let format = 'UNKNOWN';
    if (/^\d{13}$/.test(code)) {
      format = 'EAN';
    } else if (/^\d{8,12}$/.test(code)) {
      format = 'CODE_128';
    } else if (/^\d{12,14}$/.test(code)) {
      format = 'UPC';
    } else {
      format = 'QR_CODE';
    }

    return {
      valid: true,
      format,
    };
  }

  /**
   * Batch process multiple codes (for bulk import)
   */
  async processBatchCodes(codes: string[]): Promise<InventoryScanResponse[]> {
    const results = await Promise.all(codes.map((code) => this.processScan({ code, format: 'UNKNOWN', timestamp: Date.now() })));
    return results;
  }
}
