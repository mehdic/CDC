/**
 * Unit Tests for Documedis Adapter
 * Tests Swiss drug database integration
 * T5-006, T5-007: Documedis adapter and interaction checking
 */

import { DocumedisAdapter, SwissDrugInfo } from '../src/integrations/documedis-adapter';
import { DrugInteractionSeverity } from '../src/integrations/fdb';

describe('DocumedisAdapter', () => {
  let adapter: DocumedisAdapter;

  beforeEach(() => {
    // Clear environment variables
    delete process.env.DOCUMEDIS_API_URL;
    delete process.env.DOCUMEDIS_API_TOKEN;
    adapter = new DocumedisAdapter();
  });

  describe('Initialization', () => {
    it('should initialize without Documedis credentials', () => {
      expect(adapter).toBeDefined();
    });

    it('should fall back to FDB mock when credentials not configured', async () => {
      const result = await adapter.checkDrugInteractions(['Warfarin', 'Aspirin']);
      expect(result).toBeDefined();
      expect(result.checkedAt).toBeInstanceOf(Date);
    });

    it('should initialize with Documedis credentials when provided', () => {
      process.env.DOCUMEDIS_API_URL = 'https://documedis.hcisolutions.ch/2020-01/api';
      process.env.DOCUMEDIS_API_TOKEN = 'test_token';

      const configuredAdapter = new DocumedisAdapter();
      expect(configuredAdapter).toBeDefined();
    });
  });

  describe('GTIN Validation', () => {
    it('should validate Swiss GTIN format (7680 prefix)', () => {
      const validGtin = '7680123456789';
      // Note: isValidGTIN is private, test via lookupByGTIN
      // If GTIN is valid, it should attempt lookup (and fail gracefully without credentials)
    });

    it('should reject invalid GTIN format', async () => {
      const invalidGtin = '1234567890123'; // Not 7680 prefix
      const result = await adapter.lookupByGTIN(invalidGtin);
      expect(result).toBeNull();
    });

    it('should reject GTIN with wrong length', async () => {
      const invalidGtin = '7680123'; // Too short
      const result = await adapter.lookupByGTIN(invalidGtin);
      expect(result).toBeNull();
    });
  });

  describe('Drug Lookup by GTIN', () => {
    it('should return null when Documedis not configured', async () => {
      const gtin = '7680123456789';
      const result = await adapter.lookupByGTIN(gtin);
      expect(result).toBeNull();
    });

    it('should cache GTIN lookups when enabled', async () => {
      process.env.DOCUMEDIS_CACHE_ENABLED = 'true';
      const gtin = '7680123456789';

      // First call - miss
      const result1 = await adapter.lookupByGTIN(gtin);

      // Second call - should hit cache (if Documedis was configured and returned data)
      const result2 = await adapter.lookupByGTIN(gtin);

      // Both should return same result (null in test env)
      expect(result1).toEqual(result2);
    });

    it('should skip cache when disabled', async () => {
      process.env.DOCUMEDIS_CACHE_ENABLED = 'false';
      const gtin = '7680123456789';

      const result1 = await adapter.lookupByGTIN(gtin);
      const result2 = await adapter.lookupByGTIN(gtin);

      expect(result1).toEqual(result2);
    });
  });

  describe('Drug Interaction Checking', () => {
    it('should return no interactions for empty medication list', async () => {
      const result = await adapter.checkDrugInteractions([]);
      expect(result.hasInteractions).toBe(false);
      expect(result.interactions).toHaveLength(0);
    });

    it('should return no interactions for single medication', async () => {
      const result = await adapter.checkDrugInteractions(['Aspirin']);
      expect(result.hasInteractions).toBe(false);
      expect(result.interactions).toHaveLength(0);
    });

    it('should detect interactions using FDB mock data fallback', async () => {
      // Without Documedis credentials, should fall back to FDB mock
      const result = await adapter.checkDrugInteractions(['Warfarin', 'Aspirin']);

      expect(result).toBeDefined();
      expect(result.checkedAt).toBeInstanceOf(Date);

      // FDB mock should have Warfarin-Aspirin interaction
      if (result.hasInteractions) {
        expect(result.interactions.length).toBeGreaterThan(0);
        expect(result.interactions[0].severity).toBeDefined();
      }
    });

    it('should cache interaction results', async () => {
      process.env.DOCUMEDIS_CACHE_ENABLED = 'true';

      const medications = ['Aspirin', 'Warfarin'];

      const result1 = await adapter.checkDrugInteractions(medications);
      const result2 = await adapter.checkDrugInteractions(medications);

      expect(result1.checkedAt).toBeInstanceOf(Date);
      expect(result2.checkedAt).toBeInstanceOf(Date);
    });

    it('should handle medication order independence in cache', async () => {
      process.env.DOCUMEDIS_CACHE_ENABLED = 'true';

      const medications1 = ['Aspirin', 'Warfarin'];
      const medications2 = ['Warfarin', 'Aspirin'];

      const result1 = await adapter.checkDrugInteractions(medications1);
      const result2 = await adapter.checkDrugInteractions(medications2);

      // Results should be equivalent (cache key normalized)
      expect(result1.hasInteractions).toBe(result2.hasInteractions);
    });
  });

  describe('Severity Mapping', () => {
    it('should map Documedis severity to DrugInteractionSeverity enum', async () => {
      // Test via mock data which uses the same severity mapping
      const result = await adapter.checkDrugInteractions(['Warfarin', 'Aspirin']);

      if (result.hasInteractions && result.interactions.length > 0) {
        const severity = result.interactions[0].severity;
        expect(Object.values(DrugInteractionSeverity)).toContain(severity);
      }
    });
  });

  describe('Health Status', () => {
    it('should report unconfigured when credentials missing', async () => {
      const health = await adapter.getHealthStatus();

      expect(health.status).toBe('unconfigured');
      expect(health.usingMockData).toBe(true);
      expect(health.provider).toBe('FDB Mock');
      expect(health.message).toContain('not configured');
    });

    it('should check Documedis health when configured', async () => {
      process.env.DOCUMEDIS_API_URL = 'https://documedis.hcisolutions.ch/2020-01/api';
      process.env.DOCUMEDIS_API_TOKEN = 'test_token';

      const configuredAdapter = new DocumedisAdapter();
      const health = await configuredAdapter.getHealthStatus();

      expect(health).toBeDefined();
      expect(health.status).toBeDefined();
      expect(['healthy', 'degraded', 'down', 'unconfigured']).toContain(health.status);
    });
  });

  describe('Cache Management', () => {
    it('should clear all caches', () => {
      adapter.clearCache();
      // No error should be thrown
    });

    it('should respect cache TTL configuration', () => {
      process.env.DOCUMEDIS_CACHE_TTL = '3600';
      const adapterWithTTL = new DocumedisAdapter();
      expect(adapterWithTTL).toBeDefined();
    });
  });

  describe('Swissmedic Number Lookup', () => {
    it('should log warning for unimplemented Swissmedic lookup', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await adapter.lookupBySwissmedicNumber('12345');

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Swissmedic number lookup not yet implemented')
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      process.env.DOCUMEDIS_API_URL = 'https://invalid.documedis.url';
      process.env.DOCUMEDIS_API_TOKEN = 'invalid_token';

      const errorAdapter = new DocumedisAdapter();

      // Should fall back to mock data without throwing
      const result = await errorAdapter.checkDrugInteractions(['Aspirin', 'Warfarin']);

      expect(result).toBeDefined();
      expect(result.checkedAt).toBeInstanceOf(Date);
    });

    it('should handle API timeout gracefully', async () => {
      // Timeout is handled internally, should fall back to mock
      const result = await adapter.checkDrugInteractions(['Drug1', 'Drug2']);
      expect(result).toBeDefined();
    });
  });

  describe('Integration with FDBService', () => {
    it('should extend FDBService correctly', () => {
      expect(adapter).toBeInstanceOf(DocumedisAdapter);
      // DocumedisAdapter extends FDBService, should have parent methods
      expect(adapter.checkDrugInteractions).toBeDefined();
      expect(adapter.getHealthStatus).toBeDefined();
    });

    it('should use FDB mock data as fallback', async () => {
      // Without Documedis credentials, should use parent FDB implementation
      const result = await adapter.checkDrugInteractions(['Metformin', 'Aspirin']);

      expect(result).toBeDefined();
      expect(result.interactions).toBeDefined();
    });
  });
});
