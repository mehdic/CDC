/**
 * Unit tests for FDB Service - Drug Lookup Functionality
 * Tests lookupDrug() and searchDrugs() methods
 */

import { FDBService } from './fdb';

describe('FDBService - Drug Lookup', () => {
  let fdbService: FDBService;

  beforeEach(() => {
    // Use mock mode (no API credentials)
    process.env.FDB_API_URL = '';
    process.env.FDB_API_KEY = '';
    fdbService = new FDBService();
  });

  describe('lookupDrug() - Name Search', () => {
    it('should find drug by exact generic name', async () => {
      const result = await fdbService.lookupDrug('warfarin', 'name');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('warfarin');
      expect(result?.category).toBe('Anticoagulant');
      expect(result?.matchedBy).toBe('name');
    });

    it('should find drug by brand name', async () => {
      const result = await fdbService.lookupDrug('Coumadin', 'name');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('warfarin');
      expect(result?.brandNames).toContain('Coumadin');
      expect(result?.matchedBy).toBe('name');
    });

    it('should be case-insensitive', async () => {
      const result1 = await fdbService.lookupDrug('WARFARIN', 'name');
      const result2 = await fdbService.lookupDrug('warfarin', 'name');
      const result3 = await fdbService.lookupDrug('Warfarin', 'name');

      expect(result1).not.toBeNull();
      expect(result2).not.toBeNull();
      expect(result3).not.toBeNull();
      expect(result1?.name).toBe(result2?.name);
      expect(result2?.name).toBe(result3?.name);
    });

    it('should return null for non-existent drug', async () => {
      const result = await fdbService.lookupDrug('nonexistent-drug-12345', 'name');

      expect(result).toBeNull();
    });

    it('should find multiple common drugs', async () => {
      const drugNames = ['aspirin', 'metformin', 'lisinopril', 'atorvastatin'];

      for (const drugName of drugNames) {
        const result = await fdbService.lookupDrug(drugName, 'name');
        expect(result).not.toBeNull();
        expect(result?.name).toBe(drugName);
      }
    });
  });

  describe('lookupDrug() - NDC Search', () => {
    it('should find drug by NDC code', async () => {
      // Warfarin NDC code
      const result = await fdbService.lookupDrug('00056-0169', 'ndc');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('warfarin');
      expect(result?.ndcCode).toBe('00056-0169');
      expect(result?.matchedBy).toBe('ndc');
    });

    it('should return null for non-existent NDC', async () => {
      const result = await fdbService.lookupDrug('99999-9999', 'ndc');

      expect(result).toBeNull();
    });

    it('should find multiple drugs by NDC', async () => {
      const ndcCodes = [
        '00056-0169', // warfarin
        '00904-2009', // aspirin
        '00093-7214', // metformin
      ];

      for (const ndc of ndcCodes) {
        const result = await fdbService.lookupDrug(ndc, 'ndc');
        expect(result).not.toBeNull();
        expect(result?.ndcCode).toBe(ndc);
      }
    });
  });

  describe('lookupDrug() - RxCUI Search', () => {
    it('should find drug by RxCUI code', async () => {
      // Warfarin RxCUI
      const result = await fdbService.lookupDrug('11289', 'rxcui');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('warfarin');
      expect(result?.rxcui).toBe('11289');
      expect(result?.matchedBy).toBe('rxcui');
    });

    it('should return null for non-existent RxCUI', async () => {
      const result = await fdbService.lookupDrug('9999999', 'rxcui');

      expect(result).toBeNull();
    });

    it('should find multiple drugs by RxCUI', async () => {
      const rxcuiCodes = [
        '11289', // warfarin
        '1191',  // aspirin
        '6809',  // metformin
      ];

      for (const rxcui of rxcuiCodes) {
        const result = await fdbService.lookupDrug(rxcui, 'rxcui');
        expect(result).not.toBeNull();
        expect(result?.rxcui).toBe(rxcui);
      }
    });
  });

  describe('lookupDrug() - ATC Search', () => {
    it('should find drug by ATC code', async () => {
      // Warfarin ATC code
      const result = await fdbService.lookupDrug('B01AA03', 'atc');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('warfarin');
      expect(result?.atcCode).toBe('B01AA03');
      expect(result?.matchedBy).toBe('atc');
    });

    it('should be case-insensitive for ATC codes', async () => {
      const result1 = await fdbService.lookupDrug('B01AA03', 'atc');
      const result2 = await fdbService.lookupDrug('b01aa03', 'atc');

      expect(result1).not.toBeNull();
      expect(result2).not.toBeNull();
      expect(result1?.name).toBe(result2?.name);
    });

    it('should return null for non-existent ATC', async () => {
      const result = await fdbService.lookupDrug('Z99ZZ99', 'atc');

      expect(result).toBeNull();
    });
  });

  describe('lookupDrug() - Auto-detect', () => {
    it('should auto-detect name search', async () => {
      const result = await fdbService.lookupDrug('warfarin', 'auto');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('warfarin');
    });

    it('should auto-detect NDC code format', async () => {
      const result = await fdbService.lookupDrug('00056-0169', 'auto');

      expect(result).not.toBeNull();
      expect(result?.ndcCode).toBe('00056-0169');
    });

    it('should auto-detect RxCUI format', async () => {
      const result = await fdbService.lookupDrug('11289', 'auto');

      expect(result).not.toBeNull();
      expect(result?.rxcui).toBe('11289');
    });

    it('should auto-detect ATC code format', async () => {
      const result = await fdbService.lookupDrug('B01AA03', 'auto');

      expect(result).not.toBeNull();
      expect(result?.atcCode).toBe('B01AA03');
    });
  });

  describe('searchDrugs() - Partial Search', () => {
    it('should find drugs matching partial query', async () => {
      const results = await fdbService.searchDrugs('metop', 10);

      expect(results.length).toBeGreaterThan(0);
      expect(
        results.some((drug) => drug.name.toLowerCase().includes('metop'))
      ).toBe(true);
    });

    it('should limit results to specified limit', async () => {
      const results = await fdbService.searchDrugs('a', 5);

      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('should return empty array for non-matching query', async () => {
      const results = await fdbService.searchDrugs('zzzzzznonexistent', 10);

      expect(results).toEqual([]);
    });

    it('should match partial brand names', async () => {
      const results = await fdbService.searchDrugs('Coum', 10);

      expect(results.length).toBeGreaterThan(0);
      expect(
        results.some((drug) => drug.brandNames?.some((brand: string) => brand.includes('Coum')))
      ).toBe(true);
    });

    it('should prioritize exact matches', async () => {
      const results = await fdbService.searchDrugs('warfarin', 10);

      expect(results.length).toBeGreaterThan(0);
      // First result should be exact match
      expect(results[0].name).toBe('warfarin');
    });

    it('should be case-insensitive', async () => {
      const results1 = await fdbService.searchDrugs('ASPIRIN', 5);
      const results2 = await fdbService.searchDrugs('aspirin', 5);

      expect(results1.length).toBe(results2.length);
      expect(results1[0].name).toBe(results2[0].name);
    });

    it('should handle single character search', async () => {
      const results = await fdbService.searchDrugs('a', 10);

      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(10);
    });

    it('should return drugs in relevance order', async () => {
      const results = await fdbService.searchDrugs('stat', 10);

      // Results should include statins
      expect(results.length).toBeGreaterThan(0);

      // Check that exact prefix matches come before partial matches
      const prefixMatches = results.filter((drug) =>
        drug.name.toLowerCase().startsWith('stat')
      );
      const partialMatches = results.filter((drug) =>
        drug.name.toLowerCase().includes('stat') &&
        !drug.name.toLowerCase().startsWith('stat')
      );

      // If both types exist, prefix matches should come first
      if (prefixMatches.length > 0 && partialMatches.length > 0) {
        const firstPrefixIndex = results.findIndex((drug) =>
          drug.name.toLowerCase().startsWith('stat')
        );
        const firstPartialIndex = results.findIndex(
          (drug) =>
            drug.name.toLowerCase().includes('stat') &&
            !drug.name.toLowerCase().startsWith('stat')
        );

        expect(firstPrefixIndex).toBeLessThan(firstPartialIndex);
      }
    });
  });

  describe('Integration - Lookup with Expanded Database', () => {
    it('should find cardiovascular medications', async () => {
      const cardiovascularDrugs = [
        'warfarin',
        'aspirin',
        'lisinopril',
        'amlodipine',
        'atenolol',
        'metoprolol',
        'atorvastatin',
        'simvastatin',
        'digoxin',
        'furosemide',
      ];

      for (const drug of cardiovascularDrugs) {
        const result = await fdbService.lookupDrug(drug);
        expect(result).not.toBeNull();
        expect(result?.name).toBe(drug);
      }
    });

    it('should find diabetes medications', async () => {
      const diabetesDrugs = ['metformin', 'insulin', 'glipizide', 'sitagliptin'];

      for (const drug of diabetesDrugs) {
        const result = await fdbService.lookupDrug(drug);
        expect(result).not.toBeNull();
        expect(result?.name).toBe(drug);
      }
    });

    it('should find antibiotics', async () => {
      const antibiotics = [
        'amoxicillin',
        'azithromycin',
        'ciprofloxacin',
        'doxycycline',
        'clarithromycin',
      ];

      for (const drug of antibiotics) {
        const result = await fdbService.lookupDrug(drug);
        expect(result).not.toBeNull();
        expect(result?.name).toBe(drug);
      }
    });

    it('should find psychiatric medications', async () => {
      const psychiatricDrugs = [
        'sertraline',
        'fluoxetine',
        'escitalopram',
        'alprazolam',
        'lorazepam',
      ];

      for (const drug of psychiatricDrugs) {
        const result = await fdbService.lookupDrug(drug);
        expect(result).not.toBeNull();
        expect(result?.name).toBe(drug);
      }
    });

    it('should have complete drug information', async () => {
      const result = await fdbService.lookupDrug('warfarin');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('warfarin');
      expect(result?.genericName).toBe('warfarin');
      expect(result?.brandNames).toContain('Coumadin');
      expect(result?.ndcCode).toBeDefined();
      expect(result?.rxcui).toBeDefined();
      expect(result?.atcCode).toBeDefined();
      expect(result?.category).toBe('Anticoagulant');
      expect(result?.commonUses).toContain('Blood clot');
    });
  });
});
