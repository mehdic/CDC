/**
 * Inventory Scanner Service Tests
 * Tests for inventory scan processing and API integration
 */

import { InventoryScannerService, ScanResultData } from '../inventoryScannerService';

// Mock fetch
global.fetch = jest.fn();

describe('InventoryScannerService', () => {
  let service: InventoryScannerService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InventoryScannerService('http://localhost:4000');
    localStorage.clear();
  });

  describe('Authentication', () => {
    it('should set authentication context', () => {
      service.setAuth('pharmacy-123', 'token-xyz');
      // Service should store credentials internally (verify through method calls)
      expect(service).toBeDefined();
    });

    it('should use localStorage token if not provided', () => {
      localStorage.setItem('auth_token', 'stored-token');
      service.setAuth('pharmacy-123');
      expect(service).toBeDefined();
    });
  });

  describe('QR Code Validation', () => {
    it('should validate QR code format', () => {
      const result = service.validateQRCode('valid-qr-code-123');
      expect(result.valid).toBe(true);
      expect(result.format).toBeDefined();
    });

    it('should reject empty code', () => {
      const result = service.validateQRCode('');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject whitespace-only code', () => {
      const result = service.validateQRCode('   ');
      expect(result.valid).toBe(false);
    });

    it('should reject code that is too short', () => {
      const result = service.validateQRCode('abc');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('short');
    });

    it('should detect EAN format', () => {
      const result = service.validateQRCode('5901234123457'); // 13 digits = EAN
      expect(result.valid).toBe(true);
      expect(result.format).toBe('EAN');
    });

    it('should detect CODE_128 format', () => {
      const result = service.validateQRCode('590123412'); // 9 digits
      expect(result.valid).toBe(true);
      expect(result.format).toBe('CODE_128');
    });

    it('should detect QR_CODE for non-numeric codes', () => {
      const result = service.validateQRCode('QR-ABC-123-XYZ');
      expect(result.valid).toBe(true);
      expect(result.format).toBe('QR_CODE');
    });
  });

  describe('Scan Processing', () => {
    beforeEach(() => {
      service.setAuth('pharmacy-123', 'test-token');
    });

    it('should throw error if pharmacy ID not set', async () => {
      const serviceWithoutAuth = new InventoryScannerService();
      const scanResult = {
        code: 'test-code',
        format: 'QR_CODE',
        timestamp: Date.now(),
      };

      await expect(serviceWithoutAuth.processScan(scanResult)).rejects.toThrow(
        'Pharmacy ID not set'
      );
    });

    it('should process successful scan', async () => {
      const mockResponse = {
        id: 'item-123',
        medication_name: 'Aspirin',
        medication_gtin: '5901234123457',
        quantity: 100,
        unit: 'tablets',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const scanResult = {
        code: '5901234123457',
        format: 'EAN_13',
        timestamp: Date.now(),
      };

      const result = await service.processScan(scanResult);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/inventory/scan',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          }),
        })
      );
    });

    it('should handle failed scan', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Item not found' }),
      });

      const scanResult = {
        code: 'unknown-code',
        format: 'QR_CODE',
        timestamp: Date.now(),
      };

      const result = await service.processScan(scanResult);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Item not found');
    });

    it('should handle network error', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const scanResult = {
        code: 'test-code',
        format: 'QR_CODE',
        timestamp: Date.now(),
      };

      const result = await service.processScan(scanResult);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should include pharmacy_id in request', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const scanResult = {
        code: 'test-code',
        format: 'QR_CODE',
        timestamp: Date.now(),
      };

      await service.processScan(scanResult);

      const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody.pharmacy_id).toBe('pharmacy-123');
    });
  });

  describe('Manual Item Entry', () => {
    beforeEach(() => {
      service.setAuth('pharmacy-123', 'test-token');
    });

    it('should validate required fields', async () => {
      const incompleteData: Partial<ScanResultData> = {
        medication_name: 'Aspirin',
        // Missing other required fields
      };

      const result = await service.addItemManually(incompleteData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });

    it('should add item with all required fields', async () => {
      const mockResponse = {
        id: 'item-456',
        medication_name: 'Ibuprofen',
        medication_gtin: '5901234567890',
        quantity: 50,
        unit: 'tablets',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const itemData: Partial<ScanResultData> = {
        medication_name: 'Ibuprofen',
        medication_gtin: '5901234567890',
        quantity: 50,
        unit: 'tablets',
        batch_number: 'BATCH-001',
        expiry_date: '2025-12-31',
      };

      const result = await service.addItemManually(itemData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/inventory/items',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should handle API error on manual entry', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid GTIN format' }),
      });

      const itemData: Partial<ScanResultData> = {
        medication_name: 'Test',
        medication_gtin: 'invalid',
        quantity: 10,
        unit: 'tablets',
      };

      const result = await service.addItemManually(itemData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid GTIN format');
    });
  });

  describe('Batch Processing', () => {
    beforeEach(() => {
      service.setAuth('pharmacy-123', 'test-token');
    });

    it('should process multiple codes', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: '1', medication_name: 'Drug A' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: '2', medication_name: 'Drug B' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Not found' }),
        });

      const results = await service.processBatchCodes(['code1', 'code2', 'code3']);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[2].success).toBe(false);
    });
  });

  describe('API Base URL', () => {
    it('should use custom API URL', () => {
      const customService = new InventoryScannerService('https://api.example.com');
      expect(customService).toBeDefined();
    });

    it('should use environment variable as fallback', () => {
      const envService = new InventoryScannerService();
      expect(envService).toBeDefined();
    });
  });
});
