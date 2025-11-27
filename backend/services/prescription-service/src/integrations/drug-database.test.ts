/**
 * Unit tests for Drug Database
 * Tests comprehensive drug database structure and interaction data
 */

import {
  DRUG_DATABASE,
  INTERACTION_DATABASE,
  DrugInfo,
  DrugInteractionData,
} from './drug-database';
import { DrugInteractionSeverity } from './fdb';

describe('Drug Database', () => {
  describe('DRUG_DATABASE Structure', () => {
    it('should contain at least 100 drugs', () => {
      const drugCount = Object.keys(DRUG_DATABASE).length;
      expect(drugCount).toBeGreaterThanOrEqual(100);
    });

    it('should have valid drug info structure for all drugs', () => {
      for (const [key, drug] of Object.entries(DRUG_DATABASE)) {
        // Required fields
        expect(drug.name).toBeDefined();
        expect(typeof drug.name).toBe('string');
        expect(drug.category).toBeDefined();
        expect(drug.commonUses).toBeDefined();

        // Optional but common fields
        if (drug.ndcCode) {
          expect(typeof drug.ndcCode).toBe('string');
        }
        if (drug.rxcui) {
          expect(typeof drug.rxcui).toBe('string');
        }
        if (drug.atcCode) {
          expect(typeof drug.atcCode).toBe('string');
        }
        if (drug.brandNames) {
          expect(Array.isArray(drug.brandNames)).toBe(true);
        }
      }
    });

    it('should include common medications like warfarin, metformin, aspirin', () => {
      expect(DRUG_DATABASE.warfarin).toBeDefined();
      expect(DRUG_DATABASE.metformin).toBeDefined();
      expect(DRUG_DATABASE.aspirin).toBeDefined();
      expect(DRUG_DATABASE.lisinopril).toBeDefined();
      expect(DRUG_DATABASE.simvastatin).toBeDefined();
    });

    it('should include antibiotics category', () => {
      const antibiotics = Object.values(DRUG_DATABASE).filter(
        (drug) =>
          drug.category.includes('Antibiotic') || drug.category.includes('antibiotic')
      );
      expect(antibiotics.length).toBeGreaterThan(5);
    });

    it('should include cardiovascular medications', () => {
      const cardiovascular = Object.values(DRUG_DATABASE).filter(
        (drug) =>
          drug.category.includes('ACE Inhibitor') ||
          drug.category.includes('Beta Blocker') ||
          drug.category.includes('Statin') ||
          drug.category.includes('Anticoagulant')
      );
      expect(cardiovascular.length).toBeGreaterThanOrEqual(10);
    });

    it('should include psychiatric medications', () => {
      const psychiatric = Object.values(DRUG_DATABASE).filter(
        (drug) =>
          drug.category.includes('Antidepressant') ||
          drug.category.includes('Benzodiazepine') ||
          drug.category.includes('Antipsychotic')
      );
      expect(psychiatric.length).toBeGreaterThan(8);
    });
  });

  describe('INTERACTION_DATABASE Structure', () => {
    it('should contain at least 100 interactions', () => {
      expect(INTERACTION_DATABASE.length).toBeGreaterThanOrEqual(100);
    });

    it('should have valid interaction structure for all entries', () => {
      for (const interaction of INTERACTION_DATABASE) {
        expect(interaction.drug1).toBeDefined();
        expect(interaction.drug2).toBeDefined();
        expect(interaction.severity).toBeDefined();
        expect(interaction.description).toBeDefined();
        expect(interaction.recommendation).toBeDefined();

        // Severity should be valid enum value
        expect(Object.values(DrugInteractionSeverity)).toContain(
          interaction.severity
        );
      }
    });

    it('should include warfarin interactions', () => {
      const warfarinInteractions = INTERACTION_DATABASE.filter(
        (int) =>
          int.drug1.toLowerCase() === 'warfarin' ||
          int.drug2.toLowerCase() === 'warfarin'
      );
      expect(warfarinInteractions.length).toBeGreaterThan(5);
    });

    it('should include contraindicated interactions', () => {
      const contraindicated = INTERACTION_DATABASE.filter(
        (int) => int.severity === DrugInteractionSeverity.CONTRAINDICATED
      );
      expect(contraindicated.length).toBeGreaterThan(0);
    });

    it('should include major severity interactions', () => {
      const major = INTERACTION_DATABASE.filter(
        (int) => int.severity === DrugInteractionSeverity.MAJOR
      );
      expect(major.length).toBeGreaterThan(20);
    });

    it('should include moderate severity interactions', () => {
      const moderate = INTERACTION_DATABASE.filter(
        (int) => int.severity === DrugInteractionSeverity.MODERATE
      );
      expect(moderate.length).toBeGreaterThan(20);
    });

    it('should have meaningful descriptions', () => {
      for (const interaction of INTERACTION_DATABASE) {
        expect(interaction.description.length).toBeGreaterThan(20);
        expect(interaction.recommendation.length).toBeGreaterThan(15);
      }
    });
  });

  describe('Drug Database Coverage', () => {
    it('should cover common drug classes', () => {
      const expectedClasses = [
        'Antibiotic',
        'Anticoagulant',
        'Antiplatelet',
        'Statin',
        'NSAID',
        'SSRI',
        'Benzodiazepine',
        'ACE Inhibitor',
        'Beta Blocker',
        'Diuretic',
      ];

      for (const drugClass of expectedClasses) {
        const drugsInClass = Object.values(DRUG_DATABASE).filter((drug) =>
          drug.category.includes(drugClass)
        );
        expect(drugsInClass.length).toBeGreaterThan(0);
      }
    });

    it('should include drugs with NDC codes', () => {
      const drugsWithNDC = Object.values(DRUG_DATABASE).filter(
        (drug) => drug.ndcCode
      );
      expect(drugsWithNDC.length).toBeGreaterThan(50);
    });

    it('should include drugs with RxCUI codes', () => {
      const drugsWithRxCUI = Object.values(DRUG_DATABASE).filter(
        (drug) => drug.rxcui
      );
      expect(drugsWithRxCUI.length).toBeGreaterThan(50);
    });

    it('should include drugs with ATC codes', () => {
      const drugsWithATC = Object.values(DRUG_DATABASE).filter(
        (drug) => drug.atcCode
      );
      expect(drugsWithATC.length).toBeGreaterThan(50);
    });
  });

  describe('Interaction Data Quality', () => {
    it('should have all interaction drugs present in database', () => {
      const drugKeys = Object.keys(DRUG_DATABASE).map((k) => k.toLowerCase().replace(/[^a-z0-9]/g, ''));

      for (const interaction of INTERACTION_DATABASE) {
        const drug1Key = interaction.drug1.toLowerCase().replace(/[^a-z0-9]/g, '');
        const drug2Key = interaction.drug2.toLowerCase().replace(/[^a-z0-9]/g, '');

        const drug1Found = drugKeys.some((key) => key.includes(drug1Key) || drug1Key.includes(key));
        const drug2Found = drugKeys.some((key) => key.includes(drug2Key) || drug2Key.includes(key));

        expect(drug1Found).toBe(true);
        expect(drug2Found).toBe(true);
      }
    });

    it('should have specific known interactions', () => {
      // Warfarin + Aspirin (MAJOR)
      const warfarinAspirin = INTERACTION_DATABASE.find(
        (int) =>
          (int.drug1 === 'warfarin' && int.drug2 === 'aspirin') ||
          (int.drug1 === 'aspirin' && int.drug2 === 'warfarin')
      );
      expect(warfarinAspirin).toBeDefined();
      expect(warfarinAspirin?.severity).toBe(DrugInteractionSeverity.MAJOR);

      // Simvastatin + Clarithromycin (CONTRAINDICATED)
      const simvastatinClarithromycin = INTERACTION_DATABASE.find(
        (int) =>
          (int.drug1 === 'simvastatin' && int.drug2 === 'clarithromycin') ||
          (int.drug1 === 'clarithromycin' && int.drug2 === 'simvastatin')
      );
      expect(simvastatinClarithromycin).toBeDefined();
      expect(simvastatinClarithromycin?.severity).toBe(
        DrugInteractionSeverity.CONTRAINDICATED
      );

      // Metformin + Contrast (MAJOR)
      const metforminContrast = INTERACTION_DATABASE.find(
        (int) =>
          (int.drug1 === 'metformin' && int.drug2 === 'contrast') ||
          (int.drug1 === 'contrast' && int.drug2 === 'metformin')
      );
      expect(metforminContrast).toBeDefined();
      expect(metforminContrast?.severity).toBe(DrugInteractionSeverity.MAJOR);
    });
  });
});
