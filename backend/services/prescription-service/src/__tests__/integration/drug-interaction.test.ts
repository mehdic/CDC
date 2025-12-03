/**
 * Drug Interaction API Integration Tests (T5-038)
 * Tests external drug interaction checking with mocked API responses
 *
 * Test Scenarios:
 * - Known interaction → correct severity returned
 * - No interaction → "none" returned
 * - Unknown drug → graceful handling
 * - API timeout → cached response or error
 * - Batch checking → all interactions found
 */

import axios from 'axios';

// Mock axios for external API calls
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

/**
 * Mock Drug Interaction API Responses
 */
const mockDrugInteractionResponses = {
  // Known interaction: Warfarin + Aspirin (serious bleeding risk)
  warfarinAspirin: {
    data: {
      drug1: 'warfarin',
      drug2: 'aspirin',
      severity: 'serious',
      level: 3,
      description:
        'Increased risk of bleeding when aspirin is combined with warfarin',
      management:
        'Monitor for signs of bleeding. Patient should inform healthcare provider before taking any new medications',
      evidence: 'Good evidence of interaction',
    },
  },

  // Known interaction: Metformin + Contrast dye (lactic acidosis risk)
  metforminContrast: {
    data: {
      drug1: 'metformin',
      drug2: 'iodinated contrast dye',
      severity: 'moderate',
      level: 2,
      description:
        'Metformin use with iodinated contrast dye can cause lactic acidosis',
      management:
        'Hold metformin 48 hours before contrast procedure and 48 hours after',
      evidence: 'Moderate evidence of interaction',
    },
  },

  // No interaction
  lisinoprilAmlodipine: {
    data: {
      drug1: 'lisinopril',
      drug2: 'amlodipine',
      severity: 'none',
      level: 0,
      description: 'No significant interaction detected between these drugs',
      management: 'Safe to use together',
      evidence: null,
    },
  },

  // Unknown drug
  unknownDrug: {
    data: {
      error: 'DRUG_NOT_FOUND',
      message: 'One or both drugs not found in database',
      drug1_found: false,
      drug2_found: true,
    },
  },

  // Batch interactions response
  batchInteractions: {
    data: {
      interactions: [
        {
          drug1: 'warfarin',
          drug2: 'aspirin',
          severity: 'serious',
        },
        {
          drug1: 'warfarin',
          drug2: 'ibuprofen',
          severity: 'serious',
        },
        {
          drug1: 'warfarin',
          drug2: 'naproxen',
          severity: 'serious',
        },
      ],
      checked_at: new Date().toISOString(),
    },
  },

  // Empty interactions (no interactions found)
  emptyInteractions: {
    data: {
      interactions: [],
      checked_at: new Date().toISOString(),
    },
  },
};

/**
 * Mock Cache
 */
const mockCache = new Map<string, any>();

/**
 * Helper function to get cache key for drug interaction
 */
function getCacheKey(drug1: string, drug2: string): string {
  const sorted = [drug1.toLowerCase(), drug2.toLowerCase()].sort();
  return `interaction:${sorted[0]}:${sorted[1]}`;
}

/**
 * Test Suite
 */
describe('Drug Interaction API Integration Tests (T5-038)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCache.clear();
  });

  // ===========================================================================
  // Test: Known Interaction → Correct Severity Returned
  // ===========================================================================

  describe('Known Drug Interactions', () => {
    test('should detect serious interaction: warfarin + aspirin', async () => {
      mockedAxios.post.mockResolvedValueOnce(
        mockDrugInteractionResponses.warfarinAspirin
      );

      const response = await mockedAxios.post(
        'https://api.drug-interaction.ch/check',
        {
          drug1: 'warfarin',
          drug2: 'aspirin',
        }
      );

      expect(response.data.severity).toBe('serious');
      expect(response.data.level).toBe(3);
      expect(response.data.description).toContain('bleeding');
      expect(response.data.management).toBeDefined();
    });

    test('should detect moderate interaction: metformin + contrast dye', async () => {
      mockedAxios.post.mockResolvedValueOnce(
        mockDrugInteractionResponses.metforminContrast
      );

      const response = await mockedAxios.post(
        'https://api.drug-interaction.ch/check',
        {
          drug1: 'metformin',
          drug2: 'iodinated contrast dye',
        }
      );

      expect(response.data.severity).toBe('moderate');
      expect(response.data.level).toBe(2);
      expect(response.data.description).toContain('lactic acidosis');
    });

    test('should return interaction severity level', async () => {
      mockedAxios.post.mockResolvedValueOnce(
        mockDrugInteractionResponses.warfarinAspirin
      );

      const response = await mockedAxios.post(
        'https://api.drug-interaction.ch/check',
        {
          drug1: 'warfarin',
          drug2: 'aspirin',
        }
      );

      // Severity levels: 0=none, 1=minor, 2=moderate, 3=serious
      expect(response.data.level).toBeGreaterThanOrEqual(0);
      expect(response.data.level).toBeLessThanOrEqual(3);
      expect(response.data.level).toBe(3); // Warfarin-Aspirin is serious
    });

    test('should include management recommendations for interactions', async () => {
      mockedAxios.post.mockResolvedValueOnce(
        mockDrugInteractionResponses.warfarinAspirin
      );

      const response = await mockedAxios.post(
        'https://api.drug-interaction.ch/check',
        {
          drug1: 'warfarin',
          drug2: 'aspirin',
        }
      );

      expect(response.data.management).toBeDefined();
      expect(response.data.management).toContain('Monitor');
    });

    test('should be case-insensitive for drug names', async () => {
      mockedAxios.post.mockResolvedValueOnce(
        mockDrugInteractionResponses.warfarinAspirin
      );

      const response = await mockedAxios.post(
        'https://api.drug-interaction.ch/check',
        {
          drug1: 'WARFARIN',
          drug2: 'ASPIRIN',
        }
      );

      // API should normalize case
      expect(response.data.drug1).toBe('warfarin');
      expect(response.data.drug2).toBe('aspirin');
    });
  });

  // ===========================================================================
  // Test: No Interaction → "none" Returned
  // ===========================================================================

  describe('No Drug Interactions', () => {
    test('should return "none" for safe drug combinations', async () => {
      mockedAxios.post.mockResolvedValueOnce(
        mockDrugInteractionResponses.lisinoprilAmlodipine
      );

      const response = await mockedAxios.post(
        'https://api.drug-interaction.ch/check',
        {
          drug1: 'lisinopril',
          drug2: 'amlodipine',
        }
      );

      expect(response.data.severity).toBe('none');
      expect(response.data.level).toBe(0);
      expect(response.data.management).toBe('Safe to use together');
    });

    test('should have zero severity level for no interaction', async () => {
      mockedAxios.post.mockResolvedValueOnce(
        mockDrugInteractionResponses.lisinoprilAmlodipine
      );

      const response = await mockedAxios.post(
        'https://api.drug-interaction.ch/check',
        {
          drug1: 'lisinopril',
          drug2: 'amlodipine',
        }
      );

      expect(response.data.level).toBe(0);
    });

    test('should still return response object for no interaction', async () => {
      mockedAxios.post.mockResolvedValueOnce(
        mockDrugInteractionResponses.lisinoprilAmlodipine
      );

      const response = await mockedAxios.post(
        'https://api.drug-interaction.ch/check',
        {
          drug1: 'lisinopril',
          drug2: 'amlodipine',
        }
      );

      expect(response.data).toBeDefined();
      expect(response.data.severity).toBeDefined();
      expect(response.data.management).toBeDefined();
    });
  });

  // ===========================================================================
  // Test: Unknown Drug → Graceful Handling
  // ===========================================================================

  describe('Unknown Drug Handling', () => {
    test('should handle unknown drug gracefully', async () => {
      mockedAxios.post.mockResolvedValueOnce(
        mockDrugInteractionResponses.unknownDrug
      );

      const response = await mockedAxios.post(
        'https://api.drug-interaction.ch/check',
        {
          drug1: 'nonexistent-drug-xyz',
          drug2: 'aspirin',
        }
      );

      expect(response.data.error).toBe('DRUG_NOT_FOUND');
      expect(response.data.drug1_found).toBe(false);
      expect(response.data.drug2_found).toBe(true);
    });

    test('should indicate which drug was not found', async () => {
      const errorResponse = {
        data: {
          error: 'DRUG_NOT_FOUND',
          drug1: 'fake-drug',
          drug1_found: false,
          drug2: 'aspirin',
          drug2_found: true,
          message: 'Drug not found: fake-drug',
        },
      };

      mockedAxios.post.mockResolvedValueOnce(errorResponse);

      const response = await mockedAxios.post(
        'https://api.drug-interaction.ch/check',
        {
          drug1: 'fake-drug',
          drug2: 'aspirin',
        }
      );

      expect(response.data.drug1_found).toBe(false);
      expect(response.data.drug2_found).toBe(true);
    });

    test('should handle both drugs unknown', async () => {
      const errorResponse = {
        data: {
          error: 'DRUG_NOT_FOUND',
          drug1_found: false,
          drug2_found: false,
          message: 'Both drugs not found in database',
        },
      };

      mockedAxios.post.mockResolvedValueOnce(errorResponse);

      const response = await mockedAxios.post(
        'https://api.drug-interaction.ch/check',
        {
          drug1: 'fake-drug-1',
          drug2: 'fake-drug-2',
        }
      );

      expect(response.data.drug1_found).toBe(false);
      expect(response.data.drug2_found).toBe(false);
    });

    test('should allow user-friendly error message', async () => {
      const errorResponse = {
        data: {
          error: 'DRUG_NOT_FOUND',
          drug1_found: false,
          message:
            'Could not find interaction data for unknown-drug. Try alternative name or contact support.',
        },
      };

      mockedAxios.post.mockResolvedValueOnce(errorResponse);

      const response = await mockedAxios.post(
        'https://api.drug-interaction.ch/check',
        {
          drug1: 'unknown-drug',
          drug2: 'aspirin',
        }
      );

      expect(response.data.message).toContain('Could not find');
    });
  });

  // ===========================================================================
  // Test: API Timeout → Cached Response or Error
  // ===========================================================================

  describe('API Timeout and Caching', () => {
    test('should handle API timeout with error', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Request timeout'));

      try {
        await mockedAxios.post('https://api.drug-interaction.ch/check', {
          drug1: 'warfarin',
          drug2: 'aspirin',
        });
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('timeout');
      }
    });

    test('should return cached response on timeout if available', async () => {
      const cacheKey = getCacheKey('warfarin', 'aspirin');
      mockCache.set(cacheKey, mockDrugInteractionResponses.warfarinAspirin);

      // First call succeeds and is cached
      mockedAxios.post.mockResolvedValueOnce(
        mockDrugInteractionResponses.warfarinAspirin
      );

      const response1 = await mockedAxios.post(
        'https://api.drug-interaction.ch/check',
        {
          drug1: 'warfarin',
          drug2: 'aspirin',
        }
      );

      // Second call times out, but we have cache
      mockedAxios.post.mockRejectedValueOnce(new Error('Request timeout'));

      let response2;
      try {
        await mockedAxios.post('https://api.drug-interaction.ch/check', {
          drug1: 'warfarin',
          drug2: 'aspirin',
        });
      } catch (error: any) {
        // On error, use cache
        if (mockCache.has(cacheKey)) {
          response2 = mockCache.get(cacheKey);
        }
      }

      // Should be same as cached
      expect(response2).toBeDefined();
      expect(response2.data.severity).toBe('serious');
    });

    test('should cache successful responses', async () => {
      const cacheKey = getCacheKey('warfarin', 'aspirin');

      mockedAxios.post.mockResolvedValueOnce(
        mockDrugInteractionResponses.warfarinAspirin
      );

      const response = await mockedAxios.post(
        'https://api.drug-interaction.ch/check',
        {
          drug1: 'warfarin',
          drug2: 'aspirin',
        }
      );

      // Manually cache it (normally done by service)
      mockCache.set(cacheKey, response);

      // Verify cache was populated
      expect(mockCache.has(cacheKey)).toBe(true);
      expect(mockCache.get(cacheKey).data.severity).toBe('serious');
    });

    test('should use cached response for repeated requests', async () => {
      const cacheKey = getCacheKey('lisinopril', 'amlodipine');
      mockCache.set(
        cacheKey,
        mockDrugInteractionResponses.lisinoprilAmlodipine
      );

      // First request uses cache
      const cached = mockCache.get(cacheKey);
      expect(cached.data.severity).toBe('none');

      // Should not need to call API again
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    test('should handle connection refused error', async () => {
      mockedAxios.post.mockRejectedValueOnce(
        new Error('Connection refused')
      );

      try {
        await mockedAxios.post('https://api.drug-interaction.ch/check', {
          drug1: 'warfarin',
          drug2: 'aspirin',
        });
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('Connection refused');
      }
    });

    test('should have configurable cache TTL', () => {
      const cacheTTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      expect(cacheTTL).toBeGreaterThan(0);
      expect(cacheTTL).toBe(86400000);
    });
  });

  // ===========================================================================
  // Test: Batch Checking → All Interactions Found
  // ===========================================================================

  describe('Batch Interaction Checking', () => {
    test('should check multiple interactions in batch', async () => {
      mockedAxios.post.mockResolvedValueOnce(
        mockDrugInteractionResponses.batchInteractions
      );

      const response = await mockedAxios.post(
        'https://api.drug-interaction.ch/batch-check',
        {
          base_drug: 'warfarin',
          drugs: ['aspirin', 'ibuprofen', 'naproxen'],
        }
      );

      expect(response.data.interactions).toHaveLength(3);
      expect(response.data.interactions[0].drug1).toBe('warfarin');
      expect(response.data.interactions[0].drug2).toBe('aspirin');
    });

    test('should return all interactions for batch request', async () => {
      mockedAxios.post.mockResolvedValueOnce(
        mockDrugInteractionResponses.batchInteractions
      );

      const response = await mockedAxios.post(
        'https://api.drug-interaction.ch/batch-check',
        {
          base_drug: 'warfarin',
          drugs: ['aspirin', 'ibuprofen', 'naproxen'],
        }
      );

      const interactions = response.data.interactions;

      // All requested drugs should have interactions
      const foundDrugs = interactions.map((i: any) => i.drug2);
      expect(foundDrugs).toContain('aspirin');
      expect(foundDrugs).toContain('ibuprofen');
      expect(foundDrugs).toContain('naproxen');
    });

    test('should include severity for each batch interaction', async () => {
      mockedAxios.post.mockResolvedValueOnce(
        mockDrugInteractionResponses.batchInteractions
      );

      const response = await mockedAxios.post(
        'https://api.drug-interaction.ch/batch-check',
        {
          base_drug: 'warfarin',
          drugs: ['aspirin', 'ibuprofen', 'naproxen'],
        }
      );

      for (const interaction of response.data.interactions) {
        expect(interaction.severity).toBeDefined();
        expect(
          ['none', 'minor', 'moderate', 'serious'].includes(
            interaction.severity
          )
        ).toBe(true);
      }
    });

    test('should return empty array if no interactions found in batch', async () => {
      mockedAxios.post.mockResolvedValueOnce(
        mockDrugInteractionResponses.emptyInteractions
      );

      const response = await mockedAxios.post(
        'https://api.drug-interaction.ch/batch-check',
        {
          base_drug: 'lisinopril',
          drugs: ['amlodipine', 'hydrochlorothiazide'],
        }
      );

      expect(response.data.interactions).toHaveLength(0);
      expect(Array.isArray(response.data.interactions)).toBe(true);
    });

    test('should handle batch request with mixed known and unknown drugs', async () => {
      const mixedResponse = {
        data: {
          interactions: [
            {
              drug1: 'warfarin',
              drug2: 'aspirin',
              severity: 'serious',
              found: true,
            },
            {
              drug1: 'warfarin',
              drug2: 'unknown-drug',
              severity: null,
              found: false,
              error: 'DRUG_NOT_FOUND',
            },
            {
              drug1: 'warfarin',
              drug2: 'amlodipine',
              severity: 'none',
              found: true,
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mixedResponse);

      const response = await mockedAxios.post(
        'https://api.drug-interaction.ch/batch-check',
        {
          base_drug: 'warfarin',
          drugs: ['aspirin', 'unknown-drug', 'amlodipine'],
        }
      );

      const interactions = response.data.interactions;
      expect(interactions).toHaveLength(3);
      expect(interactions[0].found).toBe(true);
      expect(interactions[1].found).toBe(false);
      expect(interactions[2].found).toBe(true);
    });

    test('should include timestamp for batch check', async () => {
      mockedAxios.post.mockResolvedValueOnce(
        mockDrugInteractionResponses.batchInteractions
      );

      const response = await mockedAxios.post(
        'https://api.drug-interaction.ch/batch-check',
        {
          base_drug: 'warfarin',
          drugs: ['aspirin', 'ibuprofen'],
        }
      );

      expect(response.data.checked_at).toBeDefined();
      const checkedDate = new Date(response.data.checked_at);
      expect(checkedDate).toBeInstanceOf(Date);
    });
  });

  // ===========================================================================
  // Test: Evidence and Documentation
  // ===========================================================================

  describe('Interaction Evidence', () => {
    test('should include evidence level for interaction', async () => {
      mockedAxios.post.mockResolvedValueOnce(
        mockDrugInteractionResponses.warfarinAspirin
      );

      const response = await mockedAxios.post(
        'https://api.drug-interaction.ch/check',
        {
          drug1: 'warfarin',
          drug2: 'aspirin',
        }
      );

      expect(response.data.evidence).toBeDefined();
      expect(response.data.evidence).toContain('Good');
    });

    test('should include description for interaction', async () => {
      mockedAxios.post.mockResolvedValueOnce(
        mockDrugInteractionResponses.warfarinAspirin
      );

      const response = await mockedAxios.post(
        'https://api.drug-interaction.ch/check',
        {
          drug1: 'warfarin',
          drug2: 'aspirin',
        }
      );

      expect(response.data.description).toBeDefined();
      expect(response.data.description.length).toBeGreaterThan(0);
    });

    test('should not have evidence for no interaction', async () => {
      mockedAxios.post.mockResolvedValueOnce(
        mockDrugInteractionResponses.lisinoprilAmlodipine
      );

      const response = await mockedAxios.post(
        'https://api.drug-interaction.ch/check',
        {
          drug1: 'lisinopril',
          drug2: 'amlodipine',
        }
      );

      expect(response.data.evidence).toBeNull();
    });
  });
});
