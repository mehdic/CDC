/**
 * Risk Scoring Service Tests
 */

import { RiskScoringService } from '../services/risk-scoring.service';
import type { PatientData, Medication, ChronicCondition } from '../types/risk.types';

describe('RiskScoringService', () => {
  let service: RiskScoringService;

  beforeEach(() => {
    service = new RiskScoringService();
  });

  describe('assessRisk', () => {
    it('should return low risk for healthy young patient', () => {
      const patientData: PatientData = {
        patientId: 'P001',
        age: 35,
        medications: [],
        chronicConditions: [],
        allergies: [],
      };

      const result = service.assessRisk(patientData);

      expect(result.overall).toBeLessThan(40);
      expect(result.level).toBe('low');
      expect(result.factors).toHaveLength(0);
    });

    it('should detect medication interaction risk', () => {
      const medications: Medication[] = [
        {
          id: 'M001',
          name: 'Warfarin',
          activeIngredient: 'warfarin',
          dosage: '5mg',
          frequency: 'daily',
          startDate: new Date('2024-01-01'),
        },
        {
          id: 'M002',
          name: 'Aspirin',
          activeIngredient: 'aspirin',
          dosage: '81mg',
          frequency: 'daily',
          startDate: new Date('2024-01-01'),
        },
      ];

      const patientData: PatientData = {
        patientId: 'P002',
        age: 45,
        medications,
        chronicConditions: [],
        allergies: [],
      };

      const result = service.assessRisk(patientData);

      expect(result.factors.some((f) => f.category === 'medication_interaction')).toBe(true);
      const interactionFactor = result.factors.find(
        (f) => f.category === 'medication_interaction'
      );
      expect(interactionFactor?.severity).toBeGreaterThan(70);
    });

    it('should detect polypharmacy risk', () => {
      const medications: Medication[] = Array.from({ length: 7 }, (_, i) => ({
        id: `M${i}`,
        name: `Medication ${i}`,
        activeIngredient: `ingredient${i}`,
        dosage: '10mg',
        frequency: 'daily',
        startDate: new Date('2024-01-01'),
      }));

      const patientData: PatientData = {
        patientId: 'P003',
        age: 50,
        medications,
        chronicConditions: [],
        allergies: [],
      };

      const result = service.assessRisk(patientData);

      expect(result.factors.some((f) => f.category === 'polypharmacy')).toBe(true);
    });

    it('should detect chronic disease progression risk', () => {
      const conditions: ChronicCondition[] = [
        {
          id: 'C001',
          name: 'Diabetes Type 2',
          diagnosedDate: new Date('2020-01-01'),
          severity: 'moderate',
          controlStatus: 'uncontrolled',
        },
      ];

      const patientData: PatientData = {
        patientId: 'P004',
        age: 55,
        medications: [],
        chronicConditions: conditions,
        allergies: [],
      };

      const result = service.assessRisk(patientData);

      expect(
        result.factors.some((f) => f.category === 'chronic_disease_progression')
      ).toBe(true);
    });

    it('should detect age-related risk for elderly patients', () => {
      const patientData: PatientData = {
        patientId: 'P005',
        age: 78,
        medications: [],
        chronicConditions: [],
        allergies: [],
      };

      const result = service.assessRisk(patientData);

      expect(result.factors.some((f) => f.category === 'age_related')).toBe(true);
    });

    it('should detect comorbidity risk', () => {
      const conditions: ChronicCondition[] = [
        {
          id: 'C001',
          name: 'Diabetes',
          diagnosedDate: new Date('2020-01-01'),
          severity: 'moderate',
          controlStatus: 'well-controlled',
        },
        {
          id: 'C002',
          name: 'Hypertension',
          diagnosedDate: new Date('2019-01-01'),
          severity: 'mild',
          controlStatus: 'well-controlled',
        },
        {
          id: 'C003',
          name: 'COPD',
          diagnosedDate: new Date('2021-01-01'),
          severity: 'moderate',
          controlStatus: 'partially-controlled',
        },
      ];

      const patientData: PatientData = {
        patientId: 'P006',
        age: 70,
        medications: [],
        chronicConditions: conditions,
        allergies: [],
      };

      const result = service.assessRisk(patientData);

      expect(result.factors.some((f) => f.category === 'comorbidity')).toBe(true);
    });

    it('should calculate high overall risk for complex patient', () => {
      const medications: Medication[] = [
        {
          id: 'M001',
          name: 'Warfarin',
          activeIngredient: 'warfarin',
          dosage: '5mg',
          frequency: 'daily',
          startDate: new Date('2024-01-01'),
        },
        {
          id: 'M002',
          name: 'Aspirin',
          activeIngredient: 'aspirin',
          dosage: '81mg',
          frequency: 'daily',
          startDate: new Date('2024-01-01'),
        },
        {
          id: 'M003',
          name: 'Metformin',
          activeIngredient: 'metformin',
          dosage: '500mg',
          frequency: 'twice daily',
          startDate: new Date('2024-01-01'),
        },
        {
          id: 'M004',
          name: 'Insulin',
          activeIngredient: 'insulin',
          dosage: '10 units',
          frequency: 'daily',
          startDate: new Date('2024-01-01'),
        },
      ];

      const conditions: ChronicCondition[] = [
        {
          id: 'C001',
          name: 'Diabetes',
          diagnosedDate: new Date('2020-01-01'),
          severity: 'severe',
          controlStatus: 'uncontrolled',
        },
        {
          id: 'C002',
          name: 'Heart Disease',
          diagnosedDate: new Date('2019-01-01'),
          severity: 'moderate',
          controlStatus: 'partially-controlled',
        },
      ];

      const patientData: PatientData = {
        patientId: 'P007',
        age: 75,
        medications,
        chronicConditions: conditions,
        allergies: ['penicillin'],
      };

      const result = service.assessRisk(patientData);

      expect(result.overall).toBeGreaterThan(60);
      expect(result.level).toMatch(/high|critical/);
      expect(result.factors.length).toBeGreaterThan(3);
    });

    it('should calculate confidence based on data completeness', () => {
      const completeData: PatientData = {
        patientId: 'P008',
        age: 60,
        medications: [
          {
            id: 'M001',
            name: 'Test Med',
            activeIngredient: 'test',
            dosage: '10mg',
            frequency: 'daily',
            startDate: new Date(),
          },
        ],
        chronicConditions: [
          {
            id: 'C001',
            name: 'Test Condition',
            diagnosedDate: new Date(),
            severity: 'mild',
            controlStatus: 'well-controlled',
          },
        ],
        allergies: ['test'],
        recentLabs: [
          {
            testName: 'HbA1c',
            value: 7.5,
            unit: '%',
            date: new Date(),
            normalRange: { min: 4.0, max: 5.6 },
          },
        ],
      };

      const result = service.assessRisk(completeData);

      expect(result.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('projectRisk', () => {
    it('should project future risk based on trends', () => {
      const historicalScores = [50, 55, 60];
      const currentScore = 65;

      const projection = service.projectRisk(currentScore, historicalScores);

      expect(projection).toBeGreaterThan(currentScore);
      expect(projection).toBeLessThanOrEqual(100);
    });

    it('should return current score if insufficient history', () => {
      const historicalScores = [50];
      const currentScore = 60;

      const projection = service.projectRisk(currentScore, historicalScores);

      expect(projection).toBe(currentScore);
    });

    it('should cap projection at 0 and 100', () => {
      const historicalScores = [95, 98, 99];
      const currentScore = 100;

      const projection = service.projectRisk(currentScore, historicalScores);

      expect(projection).toBeLessThanOrEqual(100);
      expect(projection).toBeGreaterThanOrEqual(0);
    });
  });
});
