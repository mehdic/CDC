/**
 * Unit tests for FDB MedKnowledge API Integration
 * Tests API integration, retry logic, fallback behavior, and health checks
 */

import { FDBService, DrugInteractionSeverity, DrugInteraction, DrugInteractionResult } from './fdb';

// Mock fetch globally
global.fetch = jest.fn();

describe('FDBService', () => {
  let fdbService: FDBService;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };

    // Reset mocks
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with mock data when credentials are not configured', () => {
      process.env.FDB_API_URL = '';
      process.env.FDB_API_KEY = '';

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const service = new FDBService();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('FDB API credentials not configured')
      );

      consoleWarnSpy.mockRestore();
    });

    it('should initialize with production mode when credentials are configured', () => {
      process.env.FDB_API_URL = 'https://api.fdb.com';
      process.env.FDB_API_KEY = 'test-api-key';

      const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
      const service = new FDBService();

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Initialized with FDB API credentials')
      );

      consoleInfoSpy.mockRestore();
    });
  });

  describe('checkDrugInteractions - Input Validation', () => {
    beforeEach(() => {
      process.env.FDB_API_URL = '';
      process.env.FDB_API_KEY = '';
      fdbService = new FDBService();
    });

    it('should return no interactions for empty medication array', async () => {
      const result = await fdbService.checkDrugInteractions([]);

      expect(result).toEqual({
        hasInteractions: false,
        interactions: [],
        checkedAt: expect.any(Date),
      });
    });

    it('should return no interactions for single medication', async () => {
      const result = await fdbService.checkDrugInteractions(['aspirin']);

      expect(result).toEqual({
        hasInteractions: false,
        interactions: [],
        checkedAt: expect.any(Date),
      });
    });
  });

  describe('checkDrugInteractions - Mock Data Mode', () => {
    beforeEach(() => {
      process.env.FDB_API_URL = '';
      process.env.FDB_API_KEY = '';
      fdbService = new FDBService();
    });

    it('should detect major interaction between warfarin and aspirin', async () => {
      const result = await fdbService.checkDrugInteractions(['warfarin', 'aspirin']);

      expect(result.hasInteractions).toBe(true);
      expect(result.interactions).toHaveLength(1);
      expect(result.interactions[0]).toMatchObject({
        drug1: 'warfarin',
        drug2: 'aspirin',
        severity: DrugInteractionSeverity.MAJOR,
      });
      expect(result.interactions[0].description).toContain('bleeding');
      expect(result.interactions[0].recommendation).toContain('Monitor');
    });

    it('should detect contraindicated interaction between simvastatin and clarithromycin', async () => {
      const result = await fdbService.checkDrugInteractions(['simvastatin', 'clarithromycin']);

      expect(result.hasInteractions).toBe(true);
      expect(result.interactions[0].severity).toBe(DrugInteractionSeverity.CONTRAINDICATED);
      expect(result.interactions[0].recommendation).toContain('Do NOT use together');
    });

    it('should return no interactions for medications without known interactions', async () => {
      const result = await fdbService.checkDrugInteractions(['vitamin-c', 'calcium']);

      expect(result.hasInteractions).toBe(false);
      expect(result.interactions).toHaveLength(0);
    });

    it('should detect multiple interactions in a medication list', async () => {
      const result = await fdbService.checkDrugInteractions([
        'warfarin',
        'aspirin',
        'ibuprofen',
      ]);

      expect(result.hasInteractions).toBe(true);
      expect(result.interactions.length).toBeGreaterThanOrEqual(2);
      // Should find warfarin-aspirin AND warfarin-ibuprofen
    });
  });

  describe('checkDrugInteractions - Production Mode with API', () => {
    beforeEach(() => {
      process.env.FDB_API_URL = 'https://api.fdb.com';
      process.env.FDB_API_KEY = 'test-api-key';
      fdbService = new FDBService();
    });

    it('should call FDB API and parse response successfully', async () => {
      const mockApiResponse = {
        interactions: [
          {
            drug1: { name: 'warfarin' },
            drug2: { name: 'aspirin' },
            severity: 'major',
            description: 'Increased bleeding risk',
            recommendation: 'Monitor INR closely',
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const result = await fdbService.checkDrugInteractions(['warfarin', 'aspirin']);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.fdb.com/api/v1/druginteractions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result.hasInteractions).toBe(true);
      expect(result.interactions).toHaveLength(1);
      expect(result.interactions[0].severity).toBe(DrugInteractionSeverity.MAJOR);
    });

    it('should fallback to mock data on API failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await fdbService.checkDrugInteractions(['warfarin', 'aspirin']);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Falling back to MOCK data')
      );

      // Should still return mock results
      expect(result.hasInteractions).toBe(true);
      expect(result.interactions.length).toBeGreaterThan(0);

      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should retry on transient errors (500)', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: async () => 'Server error',
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: async () => 'Server error',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ interactions: [] }),
        });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await fdbService.checkDrugInteractions(['medication1', 'medication2']);

      expect(global.fetch).toHaveBeenCalledTimes(3); // 2 failures + 1 success
      expect(result.hasInteractions).toBe(false);

      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('should handle rate limiting (429) and retry', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          headers: {
            get: (header: string) => (header === 'Retry-After' ? '2' : null),
          },
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ interactions: [] }),
        });

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await fdbService.checkDrugInteractions(['medication1', 'medication2']);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Rate limited')
      );
      expect(global.fetch).toHaveBeenCalledTimes(2);

      consoleWarnSpy.mockRestore();
    });

    it('should not retry on authentication errors (401)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid API key',
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await fdbService.checkDrugInteractions(['medication1', 'medication2']);

      // Should only try once, then fallback to mock
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Falling back to MOCK data')
      );

      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Response Parsing', () => {
    beforeEach(() => {
      process.env.FDB_API_URL = 'https://api.fdb.com';
      process.env.FDB_API_KEY = 'test-api-key';
      fdbService = new FDBService();
    });

    it('should parse FDB response with all severity levels', async () => {
      const mockApiResponse = {
        interactions: [
          {
            drug1: { name: 'drug1' },
            drug2: { name: 'drug2' },
            severity: 'contraindicated',
            description: 'Test contraindication',
            recommendation: 'Do not use',
          },
          {
            drug1: { name: 'drug3' },
            drug2: { name: 'drug4' },
            severity: 'major',
            description: 'Test major',
            recommendation: 'Monitor',
          },
          {
            drug1: { name: 'drug5' },
            drug2: { name: 'drug6' },
            severity: 'moderate',
            description: 'Test moderate',
            recommendation: 'Caution',
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const result = await fdbService.checkDrugInteractions(['drug1', 'drug2', 'drug3']);

      expect(result.interactions).toHaveLength(3);
      expect(result.interactions[0].severity).toBe(DrugInteractionSeverity.CONTRAINDICATED);
      expect(result.interactions[1].severity).toBe(DrugInteractionSeverity.MAJOR);
      expect(result.interactions[2].severity).toBe(DrugInteractionSeverity.MODERATE);
    });

    it('should handle empty API response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ interactions: [] }),
      });

      const result = await fdbService.checkDrugInteractions(['medication1', 'medication2']);

      expect(result.hasInteractions).toBe(false);
      expect(result.interactions).toHaveLength(0);
    });

    it('should handle malformed API response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}), // Missing 'interactions' field
      });

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await fdbService.checkDrugInteractions(['medication1', 'medication2']);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Empty or invalid API response structure')
      );
      expect(result.hasInteractions).toBe(false);

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Health Check', () => {
    it('should report unconfigured when credentials are missing', async () => {
      process.env.FDB_API_URL = '';
      process.env.FDB_API_KEY = '';
      fdbService = new FDBService();

      const health = await fdbService.getHealthStatus();

      expect(health.status).toBe('unconfigured');
      expect(health.usingMockData).toBe(true);
      expect(health.message).toContain('not configured');
    });

    it('should report healthy when API is accessible', async () => {
      process.env.FDB_API_URL = 'https://api.fdb.com';
      process.env.FDB_API_KEY = 'test-api-key';
      fdbService = new FDBService();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      const health = await fdbService.getHealthStatus();

      expect(health.status).toBe('healthy');
      expect(health.usingMockData).toBe(false);
      expect(health.consecutiveFailures).toBe(0);
    });

    it('should report degraded after failures', async () => {
      process.env.FDB_API_URL = 'https://api.fdb.com';
      process.env.FDB_API_KEY = 'test-api-key';
      fdbService = new FDBService();

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Cause failure
      await fdbService.checkDrugInteractions(['med1', 'med2']);

      const health = await fdbService.getHealthStatus();

      expect(health.status).toBe('degraded');
      expect(health.consecutiveFailures).toBeGreaterThan(0);

      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Utility Methods', () => {
    it('should correctly score severity levels', () => {
      expect(FDBService.getSeverityScore(DrugInteractionSeverity.CONTRAINDICATED)).toBe(3);
      expect(FDBService.getSeverityScore(DrugInteractionSeverity.MAJOR)).toBe(2);
      expect(FDBService.getSeverityScore(DrugInteractionSeverity.MODERATE)).toBe(1);
      expect(FDBService.getSeverityScore(DrugInteractionSeverity.MINOR)).toBe(0);
    });

    it('should filter interactions by minimum severity', () => {
      const interactions: DrugInteraction[] = [
        {
          drug1: 'a',
          drug2: 'b',
          severity: DrugInteractionSeverity.MINOR,
          description: 'minor',
          recommendation: 'ok',
        },
        {
          drug1: 'c',
          drug2: 'd',
          severity: DrugInteractionSeverity.MAJOR,
          description: 'major',
          recommendation: 'monitor',
        },
        {
          drug1: 'e',
          drug2: 'f',
          severity: DrugInteractionSeverity.CONTRAINDICATED,
          description: 'contraindicated',
          recommendation: 'avoid',
        },
      ];

      const filtered = FDBService.filterBySeverity(interactions, DrugInteractionSeverity.MAJOR);

      expect(filtered).toHaveLength(2);
      expect(filtered[0].severity).toBe(DrugInteractionSeverity.MAJOR);
      expect(filtered[1].severity).toBe(DrugInteractionSeverity.CONTRAINDICATED);
    });

    it('should sort interactions by severity (most severe first)', () => {
      const interactions: DrugInteraction[] = [
        {
          drug1: 'a',
          drug2: 'b',
          severity: DrugInteractionSeverity.MINOR,
          description: 'minor',
          recommendation: 'ok',
        },
        {
          drug1: 'e',
          drug2: 'f',
          severity: DrugInteractionSeverity.CONTRAINDICATED,
          description: 'contraindicated',
          recommendation: 'avoid',
        },
        {
          drug1: 'c',
          drug2: 'd',
          severity: DrugInteractionSeverity.MAJOR,
          description: 'major',
          recommendation: 'monitor',
        },
      ];

      const sorted = FDBService.sortBySeverity(interactions);

      expect(sorted[0].severity).toBe(DrugInteractionSeverity.CONTRAINDICATED);
      expect(sorted[1].severity).toBe(DrugInteractionSeverity.MAJOR);
      expect(sorted[2].severity).toBe(DrugInteractionSeverity.MINOR);
    });
  });
});
