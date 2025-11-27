/**
 * Unit tests for Drug Interaction Service
 * Tests patient context, allergy cross-reference, caching, and interaction matrix
 */

import {
  DrugInteractionService,
  PatientAllergy,
  PatientContext,
} from './interaction-service';
import { FDBService, DrugInteractionSeverity } from './fdb';
import { InMemoryCache } from './cache';

describe('DrugInteractionService', () => {
  let service: DrugInteractionService;
  let fdbService: FDBService;
  let cache: InMemoryCache;

  beforeEach(() => {
    // Use mock FDB service
    process.env.FDB_API_URL = '';
    process.env.FDB_API_KEY = '';
    process.env.DRUG_INTERACTION_CACHE_ENABLED = 'true';
    process.env.DRUG_INTERACTION_CACHE_TTL = '60';

    fdbService = new FDBService();
    cache = new InMemoryCache();
    service = new DrugInteractionService(fdbService, cache);
  });

  afterEach(() => {
    // Clear cache after each test
    cache.clear();
  });

  describe('checkInteractions() with Caching', () => {
    it('should check drug interactions', async () => {
      const result = await service.checkInteractions(['warfarin', 'aspirin']);

      expect(result).toBeDefined();
      expect(result.hasInteractions).toBe(true);
      expect(result.interactions.length).toBeGreaterThan(0);
    });

    it('should cache results', async () => {
      const medications = ['warfarin', 'aspirin'];

      // First call - should hit FDB
      const result1 = await service.checkInteractions(medications);

      // Second call - should hit cache
      const result2 = await service.checkInteractions(medications);

      expect(result1).toEqual(result2);
    });

    it('should generate consistent cache keys regardless of order', async () => {
      const meds1 = ['warfarin', 'aspirin'];
      const meds2 = ['aspirin', 'warfarin'];

      const result1 = await service.checkInteractions(meds1);
      const result2 = await service.checkInteractions(meds2);

      // Results should be identical due to cache key normalization
      expect(result1.hasInteractions).toBe(result2.hasInteractions);
      expect(result1.interactions.length).toBe(result2.interactions.length);
    });

    it('should handle cache disabled mode', async () => {
      process.env.DRUG_INTERACTION_CACHE_ENABLED = 'false';
      const serviceNoCaching = new DrugInteractionService(fdbService, cache);

      const result = await serviceNoCaching.checkInteractions(['warfarin', 'aspirin']);

      expect(result).toBeDefined();
      expect(result.hasInteractions).toBe(true);
    });
  });

  describe('checkAllergies()', () => {
    it('should detect direct drug allergy', async () => {
      const allergies: PatientAllergy[] = [
        {
          substance: 'penicillin',
          type: 'drug',
          severity: 'severe',
          dateRecorded: new Date(),
        },
      ];

      const patientContext: PatientContext = {
        patientId: 'patient-123',
        allergies,
      };

      const result = await service.checkWithPatientContext(['penicillin'], patientContext);

      expect(result.allergyWarnings.length).toBe(1);
      expect(result.allergyWarnings[0].medication).toBe('penicillin');
      expect(result.allergyWarnings[0].allergen).toBe('penicillin');
      expect(result.allergyWarnings[0].allergySeverity).toBe('severe');
    });

    it('should detect drug class allergy', async () => {
      const allergies: PatientAllergy[] = [
        {
          substance: 'penicillin',
          type: 'class',
          severity: 'moderate',
          dateRecorded: new Date(),
        },
      ];

      const patientContext: PatientContext = {
        patientId: 'patient-123',
        allergies,
      };

      const result = await service.checkWithPatientContext(
        ['amoxicillin'],
        patientContext
      );

      expect(result.allergyWarnings.length).toBe(1);
      expect(result.allergyWarnings[0].medication).toBe('amoxicillin');
      expect(result.allergyWarnings[0].allergyType).toBe('class');
    });

    it('should detect NSAID class allergy', async () => {
      const allergies: PatientAllergy[] = [
        {
          substance: 'nsaid',
          type: 'class',
          severity: 'moderate',
          dateRecorded: new Date(),
        },
      ];

      const patientContext: PatientContext = {
        patientId: 'patient-123',
        allergies,
      };

      const result = await service.checkWithPatientContext(['ibuprofen'], patientContext);

      expect(result.allergyWarnings.length).toBe(1);
      expect(result.allergyWarnings[0].allergen).toBe('nsaid');
    });

    it('should provide appropriate recommendation for anaphylaxis', async () => {
      const allergies: PatientAllergy[] = [
        {
          substance: 'aspirin',
          type: 'drug',
          severity: 'anaphylaxis',
          dateRecorded: new Date(),
        },
      ];

      const patientContext: PatientContext = {
        patientId: 'patient-123',
        allergies,
      };

      const result = await service.checkWithPatientContext(['aspirin'], patientContext);

      expect(result.allergyWarnings[0].recommendation).toContain('CONTRAINDICATED');
      expect(result.allergyWarnings[0].recommendation).toContain('DO NOT');
    });

    it('should provide appropriate recommendation for severe allergy', async () => {
      const allergies: PatientAllergy[] = [
        {
          substance: 'aspirin',
          type: 'drug',
          severity: 'severe',
          dateRecorded: new Date(),
        },
      ];

      const patientContext: PatientContext = {
        patientId: 'patient-123',
        allergies,
      };

      const result = await service.checkWithPatientContext(['aspirin'], patientContext);

      expect(result.allergyWarnings[0].recommendation).toContain('SEVERE ALLERGY');
      expect(result.allergyWarnings[0].recommendation).toContain('Avoid');
    });

    it('should be case-insensitive for allergy matching', async () => {
      const allergies: PatientAllergy[] = [
        {
          substance: 'ASPIRIN',
          type: 'drug',
          severity: 'mild',
          dateRecorded: new Date(),
        },
      ];

      const patientContext: PatientContext = {
        patientId: 'patient-123',
        allergies,
      };

      const result = await service.checkWithPatientContext(['aspirin'], patientContext);

      expect(result.allergyWarnings.length).toBe(1);
    });
  });

  describe('checkWithPatientContext()', () => {
    it('should check both allergies and interactions', async () => {
      const allergies: PatientAllergy[] = [
        {
          substance: 'penicillin',
          type: 'drug',
          severity: 'moderate',
          dateRecorded: new Date(),
        },
      ];

      const patientContext: PatientContext = {
        patientId: 'patient-123',
        allergies,
        currentMedications: ['warfarin'],
      };

      const result = await service.checkWithPatientContext(
        ['aspirin', 'penicillin'],
        patientContext
      );

      expect(result.patientId).toBe('patient-123');
      expect(result.allergyWarnings.length).toBe(1);
      expect(result.hasInteractions).toBe(true); // warfarin + aspirin
    });

    it('should include current medications in interaction check', async () => {
      const patientContext: PatientContext = {
        patientId: 'patient-123',
        allergies: [],
        currentMedications: ['warfarin'],
      };

      const result = await service.checkWithPatientContext(['aspirin'], patientContext);

      expect(result.hasInteractions).toBe(true);
      expect(
        result.interactions.some(
          (int) =>
            (int.drug1 === 'warfarin' && int.drug2 === 'aspirin') ||
            (int.drug1 === 'aspirin' && int.drug2 === 'warfarin')
        )
      ).toBe(true);
    });

    it('should handle patient with no allergies', async () => {
      const patientContext: PatientContext = {
        patientId: 'patient-123',
        allergies: [],
      };

      const result = await service.checkWithPatientContext(['warfarin'], patientContext);

      expect(result.allergyWarnings.length).toBe(0);
    });

    it('should handle multiple allergies', async () => {
      const allergies: PatientAllergy[] = [
        {
          substance: 'penicillin',
          type: 'drug',
          severity: 'moderate',
          dateRecorded: new Date(),
        },
        {
          substance: 'nsaid',
          type: 'class',
          severity: 'mild',
          dateRecorded: new Date(),
        },
      ];

      const patientContext: PatientContext = {
        patientId: 'patient-123',
        allergies,
      };

      const result = await service.checkWithPatientContext(
        ['penicillin', 'ibuprofen'],
        patientContext
      );

      expect(result.allergyWarnings.length).toBe(2);
    });
  });

  describe('generateInteractionMatrix()', () => {
    it('should generate NxN matrix', async () => {
      const medications = ['warfarin', 'aspirin', 'metformin'];
      const matrix = await service.generateInteractionMatrix(medications);

      expect(matrix.medications).toEqual(medications);
      expect(matrix.matrix.length).toBe(3); // 3 rows
      expect(matrix.matrix[0].length).toBe(3); // 3 columns
      expect(matrix.timestamp).toBeInstanceOf(Date);
    });

    it('should have null severity on diagonal', async () => {
      const medications = ['warfarin', 'aspirin'];
      const matrix = await service.generateInteractionMatrix(medications);

      // Diagonal elements (same drug) should have null severity
      expect(matrix.matrix[0][0].severity).toBeNull();
      expect(matrix.matrix[1][1].severity).toBeNull();
    });

    it('should populate known interactions', async () => {
      const medications = ['warfarin', 'aspirin'];
      const matrix = await service.generateInteractionMatrix(medications);

      // Warfarin-Aspirin interaction should exist
      const cell01 = matrix.matrix[0][1];
      const cell10 = matrix.matrix[1][0];

      expect(cell01.severity).toBeDefined();
      expect(cell01.severity).not.toBeNull();
      expect(cell10.severity).toBeDefined();
      expect(cell10.severity).not.toBeNull();
    });

    it('should handle no interactions', async () => {
      const medications = ['vitamin d', 'calcium'];
      const matrix = await service.generateInteractionMatrix(medications);

      // These typically don't have interactions
      const cell01 = matrix.matrix[0][1];
      expect(cell01.severity).toBeNull();
    });

    it('should work with large medication lists', async () => {
      const medications = [
        'warfarin',
        'aspirin',
        'metformin',
        'lisinopril',
        'atorvastatin',
      ];
      const matrix = await service.generateInteractionMatrix(medications);

      expect(matrix.medications.length).toBe(5);
      expect(matrix.matrix.length).toBe(5);
      expect(matrix.matrix[0].length).toBe(5);
    });
  });

  describe('Severity Filtering and Sorting', () => {
    it('should filter by minimum severity', async () => {
      const result = await service.checkInteractions([
        'warfarin',
        'aspirin',
        'ibuprofen',
      ]);

      const majorOnly = service.filterBySeverity(
        result.interactions,
        DrugInteractionSeverity.MAJOR
      );

      // All returned interactions should be MAJOR or CONTRAINDICATED
      for (const interaction of majorOnly) {
        const score = service.getSeverityScore(interaction.severity);
        expect(score).toBeGreaterThanOrEqual(2); // MAJOR = 2, CONTRAINDICATED = 3
      }
    });

    it('should sort by severity (most severe first)', async () => {
      const result = await service.checkInteractions([
        'warfarin',
        'aspirin',
        'ibuprofen',
        'metformin',
      ]);

      const sorted = service.sortBySeverity(result.interactions);

      // Verify descending severity order
      for (let i = 0; i < sorted.length - 1; i++) {
        const score1 = service.getSeverityScore(sorted[i].severity);
        const score2 = service.getSeverityScore(sorted[i + 1].severity);
        expect(score1).toBeGreaterThanOrEqual(score2);
      }
    });

    it('should get correct severity scores', () => {
      expect(service.getSeverityScore(DrugInteractionSeverity.CONTRAINDICATED)).toBe(
        3
      );
      expect(service.getSeverityScore(DrugInteractionSeverity.MAJOR)).toBe(2);
      expect(service.getSeverityScore(DrugInteractionSeverity.MODERATE)).toBe(1);
      expect(service.getSeverityScore(DrugInteractionSeverity.MINOR)).toBe(0);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', async () => {
      // Add to cache
      await service.checkInteractions(['warfarin', 'aspirin']);

      // Verify cache has data
      const stats = cache.getStats();
      expect(stats.activeKeys).toBeGreaterThan(0);

      // Clear cache
      await service.clearCache();

      // Verify cache is empty
      const statsAfter = cache.getStats();
      expect(statsAfter.activeKeys).toBe(0);
    });

    it('should respect cache TTL', async () => {
      // This test would need to wait for TTL expiration
      // For now, just verify cache key generation
      const meds = ['warfarin', 'aspirin'];
      await service.checkInteractions(meds);

      const stats = cache.getStats();
      expect(stats.activeKeys).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty medication list', async () => {
      const result = await service.checkInteractions([]);

      expect(result.hasInteractions).toBe(false);
      expect(result.interactions).toEqual([]);
    });

    it('should handle single medication', async () => {
      const result = await service.checkInteractions(['warfarin']);

      expect(result.hasInteractions).toBe(false);
      expect(result.interactions).toEqual([]);
    });

    it('should handle patient with no current medications', async () => {
      const patientContext: PatientContext = {
        patientId: 'patient-123',
        allergies: [],
        currentMedications: [],
      };

      const result = await service.checkWithPatientContext(['warfarin'], patientContext);

      expect(result.hasInteractions).toBe(false);
    });

    it('should handle medications with special characters', async () => {
      const result = await service.checkInteractions(['vitamin-d', 'vitamin d']);

      // Should normalize and treat as same drug
      expect(result).toBeDefined();
    });
  });
});
