/**
 * Digital Twin Service Unit Tests
 */

import { DataSource, Repository } from 'typeorm';
import { DigitalTwinService } from '../services/DigitalTwinService';
import { DigitalTwin, HealthRiskLevel, AdherenceLevel } from '../models/DigitalTwin';

// Mock TypeORM
jest.mock('typeorm', () => {
  const actual = jest.requireActual('typeorm');
  return {
    ...actual,
    DataSource: jest.fn(),
    Repository: jest.fn(),
  };
});

describe('DigitalTwinService', () => {
  let service: DigitalTwinService;
  let mockRepository: jest.Mocked<Repository<DigitalTwin>>;
  let mockDataSource: jest.Mocked<DataSource>;

  beforeEach(() => {
    // Create mock repository
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
    } as any;

    // Create mock data source
    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepository),
    } as any;

    // Create service with mock data source
    service = new DigitalTwinService(mockDataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDigitalTwin', () => {
    it('should create a new digital twin successfully', async () => {
      const dto = {
        patientId: 'patient-123',
        age: 45,
        gender: 'male',
        ethnicity: 'caucasian',
        aiAnalysisConsent: true,
        dataSharingConsent: false,
      };

      const mockTwin: Partial<DigitalTwin> = {
        id: 'twin-123',
        patientId: dto.patientId,
        age: dto.age,
        gender: dto.gender,
        ethnicity: dto.ethnicity,
        aiAnalysisConsent: dto.aiAnalysisConsent,
        dataSharingConsent: dto.dataSharingConsent,
        medications: [],
        allergies: [],
        chronicConditions: [],
        labResults: [],
        vitalSigns: [],
        familyHistory: [],
        careTeam: [],
        healthGoals: [],
        riskFactors: [],
        recommendations: [],
        healthTrajectory: [],
        overallHealthScore: 50.0,
        currentRiskLevel: HealthRiskLevel.MODERATE,
        medicationAdherence: AdherenceLevel.UNKNOWN,
        dataCompletenessScore: 0,
      };

      mockRepository.findOne.mockResolvedValueOnce(null); // No existing twin
      mockRepository.create.mockReturnValueOnce(mockTwin as DigitalTwin);
      mockRepository.save
        .mockResolvedValueOnce(mockTwin as DigitalTwin) // Save from create
        .mockResolvedValueOnce(mockTwin as DigitalTwin); // Save from recalculate
      mockRepository.findOneOrFail
        .mockResolvedValueOnce(mockTwin as DigitalTwin) // findOneOrFail in recalculate
        .mockResolvedValueOnce(mockTwin as DigitalTwin); // findOneOrFail at end of create

      const result = await service.createDigitalTwin(dto);

      expect(result).toBeDefined();
      expect(result.patientId).toBe(dto.patientId);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { patientId: dto.patientId },
      });
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw error if digital twin already exists', async () => {
      const dto = {
        patientId: 'patient-123',
      };

      const existingTwin: Partial<DigitalTwin> = {
        id: 'twin-123',
        patientId: dto.patientId,
      };

      mockRepository.findOne.mockResolvedValueOnce(existingTwin as DigitalTwin);

      await expect(service.createDigitalTwin(dto)).rejects.toThrow(
        'Digital twin already exists for patient patient-123'
      );
    });
  });

  describe('getByPatientId', () => {
    it('should return digital twin for valid patient ID', async () => {
      const patientId = 'patient-123';
      const mockTwin: Partial<DigitalTwin> = {
        id: 'twin-123',
        patientId,
      };

      mockRepository.findOne.mockResolvedValueOnce(mockTwin as DigitalTwin);

      const result = await service.getByPatientId(patientId);

      expect(result).toBeDefined();
      expect(result?.patientId).toBe(patientId);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { patientId } });
    });

    it('should return null for non-existent patient', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);

      const result = await service.getByPatientId('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateDigitalTwin', () => {
    it('should update digital twin successfully', async () => {
      const patientId = 'patient-123';
      const updateDto = {
        medications: [
          {
            id: 'med-1',
            name: 'Aspirin',
            dosage: '81mg',
            frequency: 'daily',
            active: true,
            prescribedBy: 'Dr. Smith',
            prescribedAt: '2024-01-01',
            startDate: '2024-01-01',
            adherenceScore: 95,
          },
        ],
      };

      const mockTwin: Partial<DigitalTwin> = {
        id: 'twin-123',
        patientId,
        medications: [],
        allergies: [],
        chronicConditions: [],
        labResults: [],
        vitalSigns: [],
        familyHistory: [],
        careTeam: [],
        healthGoals: [],
        riskFactors: [],
        recommendations: [],
        healthTrajectory: [],
        overallHealthScore: 50,
        currentRiskLevel: HealthRiskLevel.MODERATE,
        medicationAdherence: AdherenceLevel.UNKNOWN,
        dataCompletenessScore: 0,
      };

      mockRepository.findOne
        .mockResolvedValueOnce(mockTwin as DigitalTwin) // First call in updateDigitalTwin
        .mockResolvedValueOnce({ ...mockTwin, medications: updateDto.medications } as DigitalTwin); // Call in recalculateHealthScores

      mockRepository.save.mockResolvedValue({ ...mockTwin, medications: updateDto.medications } as DigitalTwin);
      mockRepository.findOneOrFail.mockResolvedValue({
        ...mockTwin,
        medications: updateDto.medications,
      } as DigitalTwin);

      const result = await service.updateDigitalTwin(patientId, updateDto, 'doctor-1');

      expect(result.medications).toHaveLength(1);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw error if digital twin not found', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        service.updateDigitalTwin('non-existent', {}, 'doctor-1')
      ).rejects.toThrow('Digital twin not found for patient non-existent');
    });
  });

  describe('recalculateHealthScores', () => {
    it('should calculate health scores correctly for healthy patient', async () => {
      const mockTwin: Partial<DigitalTwin> = {
        id: 'twin-123',
        patientId: 'patient-123',
        age: 30,
        gender: 'male',
        medications: [
          {
            id: 'med-1',
            name: 'Vitamin D',
            dosage: '1000IU',
            frequency: 'daily',
            active: true,
            prescribedBy: 'Dr. Smith',
            prescribedAt: '2024-01-01',
            startDate: '2024-01-01',
            adherenceScore: 95,
          },
        ],
        allergies: [],
        chronicConditions: [],
        labResults: [],
        vitalSigns: [
          {
            timestamp: '2024-12-01',
            bloodPressureSystolic: 120,
            bloodPressureDiastolic: 80,
            heartRate: 70,
            weight: 70,
            height: 175,
            bmi: 22.9,
            source: 'manual',
          },
        ],
        familyHistory: [],
        careTeam: [],
        healthGoals: [],
        riskFactors: [],
        recommendations: [],
        healthTrajectory: [],
        overallHealthScore: 50,
        currentRiskLevel: HealthRiskLevel.MODERATE,
        medicationAdherence: AdherenceLevel.UNKNOWN,
        dataCompletenessScore: 0,
      };

      mockRepository.findOneOrFail.mockResolvedValue(mockTwin as DigitalTwin);
      mockRepository.save.mockResolvedValue(mockTwin as DigitalTwin);

      const result = await service.recalculateHealthScores('twin-123');

      expect(result).toBeDefined();
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.adherenceScore).toBe(95);
      expect(result.dataCompletenessScore).toBeGreaterThan(0);
      expect(result.cardiovascularRisk).toBeLessThan(50); // Young, healthy
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should calculate higher cardiovascular risk for older patient with hypertension', async () => {
      const mockTwin: Partial<DigitalTwin> = {
        id: 'twin-456',
        patientId: 'patient-456',
        age: 70,
        medications: [],
        allergies: [],
        chronicConditions: [
          {
            id: 'cond-1',
            condition: 'Hypertension',
            diagnosedAt: '2020-01-01',
            status: 'active',
            severity: 'moderate',
          },
          {
            id: 'cond-2',
            condition: 'High Cholesterol',
            diagnosedAt: '2020-06-01',
            status: 'active',
            severity: 'moderate',
          },
        ],
        labResults: [],
        vitalSigns: [
          {
            timestamp: '2024-12-01',
            bloodPressureSystolic: 150,
            bloodPressureDiastolic: 95,
            heartRate: 80,
            bmi: 32,
            source: 'clinic',
          },
        ],
        familyHistory: [],
        careTeam: [],
        healthGoals: [],
        riskFactors: [],
        recommendations: [],
        healthTrajectory: [],
        overallHealthScore: 50,
        currentRiskLevel: HealthRiskLevel.MODERATE,
        medicationAdherence: AdherenceLevel.UNKNOWN,
        dataCompletenessScore: 0,
      };

      mockRepository.findOneOrFail.mockResolvedValue(mockTwin as DigitalTwin);
      mockRepository.save.mockResolvedValue(mockTwin as DigitalTwin);

      const result = await service.recalculateHealthScores('twin-456');

      expect(result.cardiovascularRisk).toBeGreaterThan(50);
      expect(result.riskLevel).not.toBe(HealthRiskLevel.LOW);
    });
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations for poor medication adherence', async () => {
      const mockTwin: Partial<DigitalTwin> = {
        id: 'twin-123',
        patientId: 'patient-123',
        age: 55,
        medications: [
          {
            id: 'med-1',
            name: 'Blood Pressure Med',
            dosage: '10mg',
            frequency: 'daily',
            active: true,
            prescribedBy: 'Dr. Smith',
            prescribedAt: '2024-01-01',
            startDate: '2024-01-01',
            adherenceScore: 45,
          },
        ],
        allergies: [],
        chronicConditions: [],
        labResults: [],
        vitalSigns: [],
        familyHistory: [],
        careTeam: [],
        healthGoals: [],
        riskFactors: [],
        recommendations: [],
        healthTrajectory: [],
        adherenceScore: 45,
        overallHealthScore: 50,
        currentRiskLevel: HealthRiskLevel.MODERATE,
        medicationAdherence: AdherenceLevel.POOR,
        dataCompletenessScore: 0,
      };

      mockRepository.findOne.mockResolvedValue(mockTwin as DigitalTwin);
      mockRepository.save.mockResolvedValue({
        ...mockTwin,
        recommendations: [{ type: 'medication', priority: 'high' }],
      } as any);

      const result = await service.generateRecommendations('patient-123');

      expect(result.recommendations.length).toBeGreaterThan(0);
      const adherenceRec = result.recommendations.find((r: any) =>
        r.title.includes('Medication Adherence')
      );
      expect(adherenceRec).toBeDefined();
      expect(adherenceRec?.priority).toBe('high');
    });

    it('should recommend screening for older patient', async () => {
      const mockTwin: Partial<DigitalTwin> = {
        id: 'twin-789',
        patientId: 'patient-789',
        age: 55,
        medications: [],
        allergies: [],
        chronicConditions: [],
        labResults: [],
        vitalSigns: [],
        familyHistory: [],
        careTeam: [],
        healthGoals: [],
        riskFactors: [],
        recommendations: [],
        healthTrajectory: [],
        adherenceScore: 95,
        overallHealthScore: 80,
        currentRiskLevel: HealthRiskLevel.LOW,
        medicationAdherence: AdherenceLevel.EXCELLENT,
        dataCompletenessScore: 0,
      };

      mockRepository.findOne.mockResolvedValue(mockTwin as DigitalTwin);
      mockRepository.save.mockResolvedValue({ ...mockTwin, recommendations: [] } as any);

      const result = await service.generateRecommendations('patient-789');

      const screeningRec = result.recommendations.find((r: any) => r.type === 'screening');
      expect(screeningRec).toBeDefined();
    });
  });

  describe('createWhatIfScenario', () => {
    it('should create what-if scenario for improved medication adherence', async () => {
      const mockTwin: Partial<DigitalTwin> = {
        id: 'twin-123',
        patientId: 'patient-123',
        medications: [],
        allergies: [],
        chronicConditions: [],
        labResults: [],
        vitalSigns: [],
        familyHistory: [],
        careTeam: [],
        healthGoals: [],
        riskFactors: [],
        recommendations: [],
        healthTrajectory: [],
        whatIfScenarios: [],
        overallHealthScore: 50,
        currentRiskLevel: HealthRiskLevel.MODERATE,
        medicationAdherence: AdherenceLevel.UNKNOWN,
        dataCompletenessScore: 0,
      };

      mockRepository.findOne.mockResolvedValue(mockTwin as DigitalTwin);
      mockRepository.save.mockResolvedValue(mockTwin as DigitalTwin);

      const result = await service.createWhatIfScenario(
        'patient-123',
        'Improve medication adherence to 95%',
        'What if I take my medications every day?'
      );

      expect(result).toBeDefined();
      expect(result.scenario).toContain('medication adherence');
      expect(result.riskChange).toBeLessThan(0); // Risk should decrease
      expect(result.healthScoreChange).toBeGreaterThan(0); // Health should improve
    });

    it('should create what-if scenario for exercise', async () => {
      const mockTwin: Partial<DigitalTwin> = {
        id: 'twin-456',
        patientId: 'patient-456',
        medications: [],
        allergies: [],
        chronicConditions: [],
        labResults: [],
        vitalSigns: [],
        familyHistory: [],
        careTeam: [],
        healthGoals: [],
        riskFactors: [],
        recommendations: [],
        healthTrajectory: [],
        whatIfScenarios: [],
        overallHealthScore: 50,
        currentRiskLevel: HealthRiskLevel.MODERATE,
        medicationAdherence: AdherenceLevel.UNKNOWN,
        dataCompletenessScore: 0,
      };

      mockRepository.findOne.mockResolvedValue(mockTwin as DigitalTwin);
      mockRepository.save.mockResolvedValue(mockTwin as DigitalTwin);

      const result = await service.createWhatIfScenario(
        'patient-456',
        'Start regular exercise routine',
        'What if I exercise 30 minutes, 5 days a week?'
      );

      expect(result.predictedOutcome).toContain('exercise');
      expect(result.riskChange).toBe(-20);
      expect(result.healthScoreChange).toBe(15);
    });
  });
});
