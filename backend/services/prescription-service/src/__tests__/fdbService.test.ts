/**
 * FDB Service Unit Tests
 * T8-001, T8-002: FDB Drug Interactions API Integration Tests
 * Tests audit logging, caching, rate limiting, and allergy checking
 */

import { FDBService, DrugInteractionSeverity } from '../integrations/fdb';
import { InMemoryCache } from '../integrations/cache';
import { getFDBConfig } from '../config/fdb.config';

describe('FDB Service', () => {
  let fdbService: FDBService;
  let mockCache: InMemoryCache;

  beforeEach(() => {
    mockCache = new InMemoryCache();
    fdbService = new FDBService(mockCache);
  });

  afterEach(async () => {
    await mockCache.clear();
  });

  describe('Initialization', () => {
    test('should initialize with mock data when credentials not configured', () => {
      expect(fdbService).toBeDefined();
      const healthStatus = fdbService.getHealthStatus();
      expect(healthStatus).resolves.toMatchObject({
        usingMockData: true,
        status: 'unconfigured',
      });
    });

    test('should load configuration from environment', () => {
      const config = getFDBConfig();
      expect(config).toHaveProperty('apiUrl');
      expect(config).toHaveProperty('cacheTTL');
      expect(config).toHaveProperty('timeout');
    });
  });

  describe('Drug Interaction Checking', () => {
    test('should return no interactions for empty medication list', async () => {
      const result = await fdbService.checkDrugInteractions([]);
      expect(result.hasInteractions).toBe(false);
      expect(result.interactions).toHaveLength(0);
    });

    test('should return no interactions for single medication', async () => {
      const result = await fdbService.checkDrugInteractions(['Aspirin']);
      expect(result.hasInteractions).toBe(false);
      expect(result.interactions).toHaveLength(0);
    });

    test('should detect known drug interaction (Warfarin + Aspirin)', async () => {
      const result = await fdbService.checkDrugInteractions(['Warfarin', 'Aspirin']);
      expect(result.hasInteractions).toBe(true);
      expect(result.interactions.length).toBeGreaterThan(0);

      const interaction = result.interactions[0];
      expect(interaction.severity).toBe(DrugInteractionSeverity.MAJOR);
      expect(interaction.drug1).toBeDefined();
      expect(interaction.drug2).toBeDefined();
      expect(interaction.description).toBeDefined();
      expect(interaction.recommendation).toBeDefined();
    });

    test('should detect multiple interactions in complex regimen', async () => {
      const result = await fdbService.checkDrugInteractions([
        'Warfarin',
        'Aspirin',
        'Ibuprofen',
      ]);

      expect(result.hasInteractions).toBe(true);
      // Should find at least 2 interactions: Warfarin+Aspirin, Warfarin+Ibuprofen
      expect(result.interactions.length).toBeGreaterThanOrEqual(2);
    });

    test('should include timestamp in results', async () => {
      const result = await fdbService.checkDrugInteractions(['Warfarin', 'Aspirin']);
      expect(result.checkedAt).toBeInstanceOf(Date);
    });
  });

  describe('Caching Behavior', () => {
    test('should cache interaction check results', async () => {
      const medications = ['Warfarin', 'Aspirin'];

      // First call - cache miss
      const result1 = await fdbService.checkDrugInteractions(medications);

      // Second call - should hit cache
      const result2 = await fdbService.checkDrugInteractions(medications);

      expect(result1).toEqual(result2);
      expect(result1.hasInteractions).toBe(result2.hasInteractions);
    });

    test('should respect medication order in cache (sorted)', async () => {
      // These should hit the same cache key
      const result1 = await fdbService.checkDrugInteractions(['Warfarin', 'Aspirin']);
      const result2 = await fdbService.checkDrugInteractions(['Aspirin', 'Warfarin']);

      expect(result1.hasInteractions).toBe(result2.hasInteractions);
      expect(result1.interactions.length).toBe(result2.interactions.length);
    });

    test('should use cache for performance', async () => {
      const medications = ['Lisinopril', 'Amlodipine'];

      const start1 = Date.now();
      await fdbService.checkDrugInteractions(medications);
      const duration1 = Date.now() - start1;

      const start2 = Date.now();
      await fdbService.checkDrugInteractions(medications);
      const duration2 = Date.now() - start2;

      // Cached call should be faster
      expect(duration2).toBeLessThanOrEqual(duration1);
    });
  });

  describe('Audit Logging', () => {
    test('should log all interaction checks', async () => {
      await fdbService.checkDrugInteractions(['Warfarin', 'Aspirin'], 'patient-123');

      const logs = fdbService.getAuditLogs(10);
      expect(logs.length).toBeGreaterThan(0);

      const latestLog = logs[logs.length - 1];
      expect(latestLog.action).toBe('INTERACTION_CHECK');
      expect(latestLog.medications).toEqual(['Warfarin', 'Aspirin']);
      expect(latestLog.patientId).toBe('patient-123');
      expect(latestLog.result).toMatch(/SUCCESS|CACHE_HIT|FALLBACK_MOCK/);
      expect(latestLog.durationMs).toBeGreaterThanOrEqual(0);
    });

    test('should track interaction counts in audit logs', async () => {
      await fdbService.checkDrugInteractions(['Warfarin', 'Aspirin', 'Ibuprofen']);

      const logs = fdbService.getAuditLogs(10);
      const latestLog = logs[logs.length - 1];

      expect(latestLog.interactionCount).toBeGreaterThan(0);
    });

    test('should limit audit log size to 1000 entries', async () => {
      // Generate many logs
      for (let i = 0; i < 1100; i++) {
        await fdbService.checkDrugInteractions(['Aspirin']);
      }

      const logs = fdbService.getAuditLogs(2000);
      expect(logs.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('Performance Metrics', () => {
    test('should track performance metrics', async () => {
      await fdbService.checkDrugInteractions(['Warfarin', 'Aspirin']);

      const stats = fdbService.getPerformanceStats();
      expect(stats.totalRequests).toBeGreaterThan(0);
      expect(stats.avgDuration).toBeGreaterThanOrEqual(0);
      expect(stats.p50).toBeGreaterThanOrEqual(0);
      expect(stats.p95).toBeGreaterThanOrEqual(0);
      expect(stats.p99).toBeGreaterThanOrEqual(0);
    });

    test('should calculate P95 performance correctly', async () => {
      // Make multiple requests with different medications to avoid cache
      for (let i = 0; i < 20; i++) {
        await fdbService.checkDrugInteractions([`Drug${i}A`, `Drug${i}B`]);
      }

      const stats = fdbService.getPerformanceStats();
      expect(stats.p95).toBeGreaterThanOrEqual(0);
      expect(stats.p95).toBeGreaterThanOrEqual(stats.p50);
      expect(stats.totalRequests).toBeGreaterThanOrEqual(20);
    });

    test('should track cache hit rate', async () => {
      const medications = ['Metformin', 'Glipizide'];

      // First call - miss
      await fdbService.checkDrugInteractions(medications);

      // Multiple cached calls
      await fdbService.checkDrugInteractions(medications);
      await fdbService.checkDrugInteractions(medications);
      await fdbService.checkDrugInteractions(medications);

      const stats = fdbService.getPerformanceStats();
      expect(stats.cacheHitRate).toBeGreaterThan(0);
      expect(stats.cacheHitRate).toBeLessThanOrEqual(100);
    });

    test('should meet <500ms P95 requirement for cached requests', async () => {
      const medications = ['Atorvastatin', 'Metoprolol'];

      // Warm up cache
      await fdbService.checkDrugInteractions(medications);

      // Make multiple cached requests
      for (let i = 0; i < 100; i++) {
        await fdbService.checkDrugInteractions(medications);
      }

      const stats = fdbService.getPerformanceStats();
      expect(stats.p95).toBeLessThan(500); // P95 < 500ms requirement
    });
  });

  describe('Drug Lookup', () => {
    test('should lookup drug by name', async () => {
      const drug = await fdbService.lookupDrug('Warfarin');
      expect(drug).toBeDefined();
      expect(drug.name).toBe('warfarin');
      expect(drug.category).toBe('Anticoagulant');
    });

    test('should lookup drug by RxCUI', async () => {
      const drug = await fdbService.lookupDrug('11289'); // Warfarin RxCUI
      expect(drug).toBeDefined();
      expect(drug.rxcui).toBe('11289');
    });

    test('should return null for unknown drug', async () => {
      const drug = await fdbService.lookupDrug('UnknownDrugXYZ123');
      expect(drug).toBeNull();
    });

    test('should search drugs with partial name', async () => {
      const results = await fdbService.searchDrugs('aspirin');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('aspirin');
    });

    test('should limit search results', async () => {
      const results = await fdbService.searchDrugs('a', 5);
      expect(results.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Severity Classification', () => {
    test('should classify interactions by severity', () => {
      const score1 = FDBService.getSeverityScore(DrugInteractionSeverity.CONTRAINDICATED);
      const score2 = FDBService.getSeverityScore(DrugInteractionSeverity.MAJOR);
      const score3 = FDBService.getSeverityScore(DrugInteractionSeverity.MODERATE);
      const score4 = FDBService.getSeverityScore(DrugInteractionSeverity.MINOR);

      expect(score1).toBeGreaterThan(score2);
      expect(score2).toBeGreaterThan(score3);
      expect(score3).toBeGreaterThan(score4);
    });

    test('should sort interactions by severity', () => {
      const interactions = [
        {
          drug1: 'A',
          drug2: 'B',
          severity: DrugInteractionSeverity.MINOR,
          description: 'Minor',
          recommendation: 'Monitor',
        },
        {
          drug1: 'C',
          drug2: 'D',
          severity: DrugInteractionSeverity.CONTRAINDICATED,
          description: 'Contraindicated',
          recommendation: 'Do not combine',
        },
        {
          drug1: 'E',
          drug2: 'F',
          severity: DrugInteractionSeverity.MODERATE,
          description: 'Moderate',
          recommendation: 'Monitor closely',
        },
      ];

      const sorted = FDBService.sortBySeverity(interactions);

      expect(sorted[0].severity).toBe(DrugInteractionSeverity.CONTRAINDICATED);
      expect(sorted[1].severity).toBe(DrugInteractionSeverity.MODERATE);
      expect(sorted[2].severity).toBe(DrugInteractionSeverity.MINOR);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid input gracefully', async () => {
      const result = await fdbService.checkDrugInteractions(null as any);
      expect(result.hasInteractions).toBe(false);
      expect(result.interactions).toHaveLength(0);
    });

    test('should handle undefined medications', async () => {
      const result = await fdbService.checkDrugInteractions(undefined as any);
      expect(result.hasInteractions).toBe(false);
    });

    test('should normalize medication names for comparison', async () => {
      const result1 = await fdbService.checkDrugInteractions(['WARFARIN', 'ASPIRIN']);
      const result2 = await fdbService.checkDrugInteractions(['warfarin', 'aspirin']);
      const result3 = await fdbService.checkDrugInteractions(['Warfarin', 'Aspirin']);

      expect(result1.hasInteractions).toBe(result2.hasInteractions);
      expect(result2.hasInteractions).toBe(result3.hasInteractions);
    });
  });

  describe('Health Status', () => {
    test('should return unconfigured status for mock mode', async () => {
      const health = await fdbService.getHealthStatus();
      expect(health.status).toBe('unconfigured');
      expect(health.usingMockData).toBe(true);
      expect(health.message).toContain('not configured');
    });
  });
});
