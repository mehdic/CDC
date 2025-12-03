/**
 * Digital Twin Service
 * Business logic for managing patient digital twin profiles
 *
 * Features:
 * - Create/update comprehensive patient profiles
 * - Calculate health risk scores
 * - Generate personalized recommendations
 * - Track health trajectory over time
 * - Support what-if scenarios
 */

import { Repository, DataSource } from 'typeorm';
import {
  DigitalTwin,
  HealthRiskLevel,
  AdherenceLevel,
  HealthTrajectoryPoint,
  RiskFactor,
} from '../models/DigitalTwin';

export interface CreateDigitalTwinDto {
  patientId: string;
  age?: number;
  gender?: string;
  ethnicity?: string;
  aiAnalysisConsent?: boolean;
  dataSharingConsent?: boolean;
}

export interface UpdateDigitalTwinDto {
  medications?: any[];
  allergies?: any[];
  chronicConditions?: any[];
  labResults?: any[];
  vitalSigns?: any[];
  familyHistory?: any[];
  careTeam?: any[];
  healthGoals?: any[];
}

export interface HealthScoreCalculation {
  overallScore: number;
  riskLevel: HealthRiskLevel;
  adherenceLevel: AdherenceLevel;
  adherenceScore: number;
  cardiovascularRisk: number;
  diabetesRisk: number;
  hospitalReadmissionRisk: number;
  dataCompletenessScore: number;
}

export interface RecommendationInput {
  type: 'medication' | 'lifestyle' | 'screening' | 'follow_up' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  rationale: string;
  suggestedAction?: string;
}

export class DigitalTwinService {
  private repository: Repository<DigitalTwin>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(DigitalTwin);
  }

  /**
   * Create a new digital twin profile
   */
  async createDigitalTwin(dto: CreateDigitalTwinDto): Promise<DigitalTwin> {
    // Check if twin already exists
    const existing = await this.repository.findOne({
      where: { patientId: dto.patientId },
    });

    if (existing) {
      throw new Error(`Digital twin already exists for patient ${dto.patientId}`);
    }

    const twin = this.repository.create({
      patientId: dto.patientId,
      age: dto.age,
      gender: dto.gender,
      ethnicity: dto.ethnicity,
      aiAnalysisConsent: dto.aiAnalysisConsent || false,
      dataSharingConsent: dto.dataSharingConsent || false,
      consentGivenAt: dto.aiAnalysisConsent ? new Date() : undefined,
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
    });

    const saved = await this.repository.save(twin);

    // Calculate initial scores
    await this.recalculateHealthScores(saved.id);

    return this.repository.findOneOrFail({ where: { id: saved.id } });
  }

  /**
   * Get digital twin by patient ID
   */
  async getByPatientId(patientId: string): Promise<DigitalTwin | null> {
    return this.repository.findOne({ where: { patientId } });
  }

  /**
   * Get digital twin by ID
   */
  async getById(id: string): Promise<DigitalTwin | null> {
    return this.repository.findOne({ where: { id } });
  }

  /**
   * Update digital twin data
   */
  async updateDigitalTwin(
    patientId: string,
    dto: UpdateDigitalTwinDto,
    updatedBy?: string
  ): Promise<DigitalTwin> {
    const twin = await this.repository.findOne({ where: { patientId } });

    if (!twin) {
      throw new Error(`Digital twin not found for patient ${patientId}`);
    }

    // Update fields if provided
    if (dto.medications !== undefined) {
      twin.medications = dto.medications;
      twin.lastMedicationUpdate = new Date();
    }

    if (dto.allergies !== undefined) {
      twin.allergies = dto.allergies;
    }

    if (dto.chronicConditions !== undefined) {
      twin.chronicConditions = dto.chronicConditions;
    }

    if (dto.labResults !== undefined) {
      twin.labResults = dto.labResults;
      twin.lastLabUpdate = new Date();
    }

    if (dto.vitalSigns !== undefined) {
      twin.vitalSigns = dto.vitalSigns;
      twin.lastVitalSignsUpdate = new Date();
    }

    if (dto.familyHistory !== undefined) {
      twin.familyHistory = dto.familyHistory;
    }

    if (dto.careTeam !== undefined) {
      twin.careTeam = dto.careTeam;
    }

    if (dto.healthGoals !== undefined) {
      twin.healthGoals = dto.healthGoals;
    }

    twin.lastUpdatedBy = updatedBy;
    twin.lastUpdatedAt = new Date();

    await this.repository.save(twin);

    // Recalculate health scores after update
    await this.recalculateHealthScores(twin.id);

    return this.repository.findOneOrFail({ where: { id: twin.id } });
  }

  /**
   * Calculate comprehensive health scores
   */
  async recalculateHealthScores(twinId: string): Promise<HealthScoreCalculation> {
    const twin = await this.repository.findOneOrFail({ where: { id: twinId } });

    // Calculate data completeness (0-100)
    const dataCompletenessScore = this.calculateDataCompleteness(twin);

    // Calculate medication adherence (0-100)
    const adherenceScore = this.calculateAdherenceScore(twin);
    const adherenceLevel = this.determineAdherenceLevel(adherenceScore);

    // Calculate risk scores (0-100, higher = more risk)
    const cardiovascularRisk = this.calculateCardiovascularRisk(twin);
    const diabetesRisk = this.calculateDiabetesRisk(twin);
    const hospitalReadmissionRisk = this.calculateHospitalReadmissionRisk(twin);

    // Calculate overall health score (0-100, higher = better health)
    const overallScore = this.calculateOverallHealthScore(twin, {
      adherenceScore,
      cardiovascularRisk,
      diabetesRisk,
      hospitalReadmissionRisk,
      dataCompletenessScore,
    });

    // Determine risk level
    const riskLevel = this.determineRiskLevel(overallScore, {
      cardiovascularRisk,
      diabetesRisk,
      hospitalReadmissionRisk,
    });

    // Update twin with calculated scores
    twin.overallHealthScore = overallScore;
    twin.currentRiskLevel = riskLevel;
    twin.medicationAdherence = adherenceLevel;
    twin.adherenceScore = adherenceScore;
    twin.cardiovascularRisk = cardiovascularRisk;
    twin.diabetesRisk = diabetesRisk;
    twin.hospitalReadmissionRisk = hospitalReadmissionRisk;
    twin.dataCompletenessScore = dataCompletenessScore;

    // Identify risk factors
    twin.riskFactors = this.identifyRiskFactors(twin);

    // Add trajectory point
    const trajectoryPoint: HealthTrajectoryPoint = {
      timestamp: new Date().toISOString(),
      overallHealthScore: overallScore,
      riskLevel,
      adherenceLevel,
      activeMedicationsCount: twin.medications.filter((m) => m.active).length,
      activeConditionsCount: twin.chronicConditions.filter((c) => c.status === 'active').length,
      recentHospitalizations: 0, // Would need hospitalization data
    };

    twin.healthTrajectory = [...twin.healthTrajectory, trajectoryPoint].slice(-100); // Keep last 100 points

    await this.repository.save(twin);

    return {
      overallScore,
      riskLevel,
      adherenceLevel,
      adherenceScore,
      cardiovascularRisk,
      diabetesRisk,
      hospitalReadmissionRisk,
      dataCompletenessScore,
    };
  }

  /**
   * Generate personalized recommendations
   */
  async generateRecommendations(patientId: string): Promise<DigitalTwin> {
    const twin = await this.repository.findOne({ where: { patientId } });

    if (!twin) {
      throw new Error(`Digital twin not found for patient ${patientId}`);
    }

    const recommendations: any[] = [];

    // Medication adherence recommendations
    if (twin.adherenceScore !== undefined && twin.adherenceScore < 80) {
      recommendations.push({
        id: this.generateId(),
        type: 'medication',
        priority: twin.adherenceScore < 50 ? 'high' : 'medium',
        title: 'Improve Medication Adherence',
        description: `Your current adherence score is ${twin.adherenceScore.toFixed(1)}%. Consider setting up reminders or using a pill organizer.`,
        rationale: 'Good medication adherence is crucial for managing your health conditions effectively.',
        suggestedAction: 'Enable push notifications for medication reminders',
        generatedAt: new Date().toISOString(),
        acknowledged: false,
      });
    }

    // Screening recommendations based on age
    if (twin.age && twin.age >= 50 && !this.hasRecentScreening(twin, 'colonoscopy')) {
      recommendations.push({
        id: this.generateId(),
        type: 'screening',
        priority: 'medium',
        title: 'Schedule Colorectal Cancer Screening',
        description: 'You are due for a colorectal cancer screening (colonoscopy).',
        rationale: 'Regular screenings can detect cancer early when it is most treatable.',
        suggestedAction: 'Book an appointment with a gastroenterologist',
        generatedAt: new Date().toISOString(),
        acknowledged: false,
      });
    }

    // Cardiovascular risk recommendations
    if (twin.cardiovascularRisk && twin.cardiovascularRisk > 30) {
      recommendations.push({
        id: this.generateId(),
        type: 'lifestyle',
        priority: twin.cardiovascularRisk > 50 ? 'high' : 'medium',
        title: 'Reduce Cardiovascular Risk',
        description: `Your cardiovascular risk is ${twin.cardiovascularRisk.toFixed(1)}%. Consider lifestyle modifications.`,
        rationale: 'Regular exercise, healthy diet, and stress management can significantly reduce heart disease risk.',
        suggestedAction: 'Consult with your doctor about a personalized cardiac health plan',
        generatedAt: new Date().toISOString(),
        acknowledged: false,
      });
    }

    // Diabetes risk recommendations
    if (twin.diabetesRisk && twin.diabetesRisk > 30) {
      const latestGlucose = this.getLatestGlucoseLevel(twin);
      recommendations.push({
        id: this.generateId(),
        type: 'lifestyle',
        priority: twin.diabetesRisk > 50 ? 'high' : 'medium',
        title: 'Diabetes Prevention',
        description: `Your diabetes risk is ${twin.diabetesRisk.toFixed(1)}%${latestGlucose ? ` (latest glucose: ${latestGlucose} mg/dL)` : ''}.`,
        rationale: 'Weight management, regular exercise, and dietary changes can prevent or delay type 2 diabetes.',
        suggestedAction: 'Schedule a nutrition consultation',
        generatedAt: new Date().toISOString(),
        acknowledged: false,
      });
    }

    // Allergy interactions with medications
    if (this.hasAllergyMedicationConflicts(twin)) {
      recommendations.push({
        id: this.generateId(),
        type: 'medication',
        priority: 'urgent',
        title: 'Potential Allergy-Medication Conflict',
        description: 'One or more of your medications may conflict with your known allergies.',
        rationale: 'This could lead to serious allergic reactions.',
        suggestedAction: 'Contact your pharmacist or doctor immediately',
        generatedAt: new Date().toISOString(),
        acknowledged: false,
      });
    }

    // Follow-up recommendations for chronic conditions
    twin.chronicConditions
      .filter((c) => c.status === 'active' && this.needsFollowUp(c))
      .forEach((condition) => {
        recommendations.push({
          id: this.generateId(),
          type: 'follow_up',
          priority: 'medium',
          title: `Follow-up for ${condition.condition}`,
          description: `It's been a while since your last review for ${condition.condition}.`,
          rationale: 'Regular monitoring helps manage chronic conditions effectively.',
          suggestedAction: 'Schedule a follow-up appointment with your specialist',
          generatedAt: new Date().toISOString(),
          acknowledged: false,
        });
      });

    twin.recommendations = recommendations;
    await this.repository.save(twin);

    return twin;
  }

  /**
   * Create what-if scenario
   */
  async createWhatIfScenario(
    patientId: string,
    scenario: string,
    description: string
  ): Promise<any> {
    const twin = await this.repository.findOne({ where: { patientId } });

    if (!twin) {
      throw new Error(`Digital twin not found for patient ${patientId}`);
    }

    // Simulate outcome based on scenario
    let riskChange = 0;
    let healthScoreChange = 0;
    let predictedOutcome = '';

    if (scenario.toLowerCase().includes('medication adherence')) {
      riskChange = -15; // Reduced risk
      healthScoreChange = +10; // Improved health
      predictedOutcome =
        'Improved medication adherence could reduce your health risks by 15% and increase your overall health score by 10 points.';
    } else if (scenario.toLowerCase().includes('exercise')) {
      riskChange = -20;
      healthScoreChange = +15;
      predictedOutcome =
        'Regular exercise (30 minutes, 5 days/week) could reduce cardiovascular risk by 20% and improve overall health significantly.';
    } else if (scenario.toLowerCase().includes('diet')) {
      riskChange = -10;
      healthScoreChange = +8;
      predictedOutcome =
        'A balanced diet low in sodium and saturated fats could lower diabetes risk and improve metabolic health.';
    } else {
      predictedOutcome = 'Based on your health profile, this change could have a positive impact on your health.';
    }

    const whatIfScenario = {
      id: this.generateId(),
      scenario,
      description,
      predictedOutcome,
      riskChange,
      healthScoreChange,
      generatedAt: new Date().toISOString(),
    };

    twin.whatIfScenarios = [...(twin.whatIfScenarios || []), whatIfScenario];
    await this.repository.save(twin);

    return whatIfScenario;
  }

  // ===== PRIVATE HELPER METHODS =====

  private calculateDataCompleteness(twin: DigitalTwin): number {
    let score = 0;
    const weights = {
      demographics: 10,
      medications: 20,
      allergies: 15,
      conditions: 20,
      labResults: 15,
      vitalSigns: 10,
      familyHistory: 5,
      careTeam: 5,
    };

    if (twin.age && twin.gender) score += weights.demographics;
    if (twin.medications.length > 0) score += weights.medications;
    if (twin.allergies.length >= 0) score += weights.allergies; // Even empty is data
    if (twin.chronicConditions.length > 0) score += weights.conditions;
    if (twin.labResults.length > 0) score += weights.labResults;
    if (twin.vitalSigns.length > 0) score += weights.vitalSigns;
    if (twin.familyHistory.length > 0) score += weights.familyHistory;
    if (twin.careTeam.length > 0) score += weights.careTeam;

    return Math.min(score, 100);
  }

  private calculateAdherenceScore(twin: DigitalTwin): number {
    const activeMeds = twin.medications.filter((m) => m.active);

    if (activeMeds.length === 0) return 100; // No meds = perfect adherence

    const totalAdherence = activeMeds.reduce((sum, med) => {
      return sum + (med.adherenceScore || 70); // Default 70% if not tracked
    }, 0);

    return totalAdherence / activeMeds.length;
  }

  private determineAdherenceLevel(score: number): AdherenceLevel {
    if (score >= 90) return AdherenceLevel.EXCELLENT;
    if (score >= 75) return AdherenceLevel.GOOD;
    if (score >= 50) return AdherenceLevel.FAIR;
    return AdherenceLevel.POOR;
  }

  private calculateCardiovascularRisk(twin: DigitalTwin): number {
    let risk = 0;

    // Age factor
    if (twin.age) {
      if (twin.age > 65) risk += 30;
      else if (twin.age > 50) risk += 20;
      else if (twin.age > 40) risk += 10;
    }

    // Chronic conditions
    const hasHypertension = twin.chronicConditions.some((c) =>
      c.condition.toLowerCase().includes('hypertension')
    );
    const hasHighCholesterol = twin.chronicConditions.some((c) =>
      c.condition.toLowerCase().includes('cholesterol')
    );
    const hasDiabetes = twin.chronicConditions.some((c) =>
      c.condition.toLowerCase().includes('diabetes')
    );

    if (hasHypertension) risk += 25;
    if (hasHighCholesterol) risk += 20;
    if (hasDiabetes) risk += 15;

    // Vital signs
    const latestVitals = twin.vitalSigns[twin.vitalSigns.length - 1];
    if (latestVitals) {
      if (latestVitals.bloodPressureSystolic && latestVitals.bloodPressureSystolic > 140) {
        risk += 15;
      }
      if (latestVitals.bmi && latestVitals.bmi > 30) {
        risk += 10;
      }
    }

    return Math.min(risk, 100);
  }

  private calculateDiabetesRisk(twin: DigitalTwin): number {
    let risk = 0;

    // Age and BMI
    if (twin.age && twin.age > 45) risk += 15;

    const latestVitals = twin.vitalSigns[twin.vitalSigns.length - 1];
    if (latestVitals?.bmi) {
      if (latestVitals.bmi > 30) risk += 30;
      else if (latestVitals.bmi > 25) risk += 15;
    }

    // Family history
    const familyDiabetes = twin.familyHistory.some((f) =>
      f.condition.toLowerCase().includes('diabetes')
    );
    if (familyDiabetes) risk += 20;

    // Glucose levels
    const latestGlucose = this.getLatestGlucoseLevel(twin);
    if (latestGlucose) {
      if (latestGlucose >= 126) risk += 40; // Diabetic range
      else if (latestGlucose >= 100) risk += 25; // Pre-diabetic range
    }

    return Math.min(risk, 100);
  }

  private calculateHospitalReadmissionRisk(twin: DigitalTwin): number {
    let risk = 0;

    // Poor adherence increases readmission risk
    if (twin.adherenceScore !== undefined && twin.adherenceScore < 50) {
      risk += 40;
    } else if (twin.adherenceScore !== undefined && twin.adherenceScore < 75) {
      risk += 20;
    }

    // Multiple chronic conditions
    const activeConditions = twin.chronicConditions.filter((c) => c.status === 'active');
    if (activeConditions.length >= 3) risk += 30;
    else if (activeConditions.length >= 2) risk += 15;

    // Age
    if (twin.age && twin.age > 65) risk += 15;

    return Math.min(risk, 100);
  }

  private calculateOverallHealthScore(
    twin: DigitalTwin,
    metrics: {
      adherenceScore: number;
      cardiovascularRisk: number;
      diabetesRisk: number;
      hospitalReadmissionRisk: number;
      dataCompletenessScore: number;
    }
  ): number {
    // Start with base score of 100
    let score = 100;

    // Deduct for poor adherence
    score -= (100 - metrics.adherenceScore) * 0.3;

    // Deduct for health risks
    score -= metrics.cardiovascularRisk * 0.25;
    score -= metrics.diabetesRisk * 0.2;
    score -= metrics.hospitalReadmissionRisk * 0.15;

    // Bonus for active health management (having data)
    score += metrics.dataCompletenessScore * 0.1;

    // Bonus for health goals
    const activeGoals = twin.healthGoals.filter((g) => g.status === 'active').length;
    score += Math.min(activeGoals * 2, 10);

    return Math.max(0, Math.min(score, 100));
  }

  private determineRiskLevel(
    overallScore: number,
    risks: { cardiovascularRisk: number; diabetesRisk: number; hospitalReadmissionRisk: number }
  ): HealthRiskLevel {
    const maxRisk = Math.max(risks.cardiovascularRisk, risks.diabetesRisk, risks.hospitalReadmissionRisk);

    if (maxRisk > 70 || overallScore < 30) return HealthRiskLevel.CRITICAL;
    if (maxRisk > 50 || overallScore < 50) return HealthRiskLevel.HIGH;
    if (maxRisk > 30 || overallScore < 70) return HealthRiskLevel.MODERATE;
    return HealthRiskLevel.LOW;
  }

  private identifyRiskFactors(twin: DigitalTwin): RiskFactor[] {
    const factors: RiskFactor[] = [];
    const now = new Date().toISOString();

    // Poor adherence
    if (twin.adherenceScore !== undefined && twin.adherenceScore < 75) {
      factors.push({
        category: 'medication_adherence',
        factor: 'Poor Medication Adherence',
        riskLevel: twin.adherenceScore < 50 ? HealthRiskLevel.HIGH : HealthRiskLevel.MODERATE,
        description: `Current adherence score: ${twin.adherenceScore.toFixed(1)}%`,
        recommendations: [
          'Set up daily medication reminders',
          'Use a pill organizer',
          'Consider pharmacy auto-refill services',
        ],
        identifiedAt: now,
        lastUpdatedAt: now,
      });
    }

    // Multiple chronic conditions
    const activeConditions = twin.chronicConditions.filter((c) => c.status === 'active');
    if (activeConditions.length >= 3) {
      factors.push({
        category: 'chronic_disease',
        factor: 'Multiple Chronic Conditions',
        riskLevel: HealthRiskLevel.HIGH,
        description: `Managing ${activeConditions.length} active chronic conditions`,
        recommendations: [
          'Regular monitoring with primary care physician',
          'Coordinate care among specialists',
          'Consider disease management programs',
        ],
        identifiedAt: now,
        lastUpdatedAt: now,
      });
    }

    // High cardiovascular risk
    if (twin.cardiovascularRisk && twin.cardiovascularRisk > 50) {
      factors.push({
        category: 'cardiovascular',
        factor: 'Elevated Cardiovascular Risk',
        riskLevel: HealthRiskLevel.HIGH,
        description: `Cardiovascular risk score: ${twin.cardiovascularRisk.toFixed(1)}%`,
        recommendations: [
          'Monitor blood pressure regularly',
          'Maintain healthy weight through diet and exercise',
          'Consult cardiologist for risk reduction strategies',
        ],
        identifiedAt: now,
        lastUpdatedAt: now,
      });
    }

    return factors;
  }

  private hasRecentScreening(_twin: DigitalTwin, _screeningType: string): boolean {
    // Would check labResults for recent screening
    // Placeholder logic
    return false;
  }

  private getLatestGlucoseLevel(twin: DigitalTwin): number | null {
    const latestVitals = twin.vitalSigns[twin.vitalSigns.length - 1];
    return latestVitals?.glucoseLevel || null;
  }

  private hasAllergyMedicationConflicts(_twin: DigitalTwin): boolean {
    // Would check for known allergy-medication interactions
    // Placeholder logic
    return false;
  }

  private needsFollowUp(condition: any): boolean {
    if (!condition.lastReviewedAt) return true;

    const lastReview = new Date(condition.lastReviewedAt);
    const now = new Date();
    const monthsSinceReview = (now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24 * 30);

    // Need follow-up if > 6 months for chronic conditions
    return monthsSinceReview > 6;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
