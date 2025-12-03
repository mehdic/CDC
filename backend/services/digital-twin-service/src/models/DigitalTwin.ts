/**
 * Digital Twin Entity
 * Comprehensive patient health profile with AI-ready data structure
 *
 * Purpose: Create a holistic view of patient health for:
 * - Personalized recommendations
 * - Risk assessment
 * - Health trajectory tracking
 * - Predictive analytics
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum HealthRiskLevel {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum AdherenceLevel {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  UNKNOWN = 'unknown',
}

export interface MedicationEntry {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  prescribedAt: string;
  startDate: string;
  endDate?: string;
  active: boolean;
  adherenceScore?: number;
}

export interface AllergyEntry {
  id: string;
  allergen: string;
  type: 'medication' | 'food' | 'environmental' | 'other';
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  reactions: string[];
  diagnosedAt?: string;
  diagnosedBy?: string;
  notes?: string;
}

export interface ChronicCondition {
  id: string;
  condition: string;
  icd10Code?: string;
  diagnosedAt: string;
  diagnosedBy?: string;
  status: 'active' | 'in_remission' | 'resolved';
  severity: 'mild' | 'moderate' | 'severe';
  treatmentPlan?: string;
  lastReviewedAt?: string;
}

export interface VitalSignsEntry {
  timestamp: string;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  oxygenSaturation?: number;
  glucoseLevel?: number;
  source: 'manual' | 'device' | 'clinic' | 'teleconsultation';
}

export interface LabResult {
  id: string;
  testName: string;
  category: string;
  value: number | string;
  unit: string;
  referenceRange?: string;
  abnormalFlag?: boolean;
  performedAt: string;
  orderedBy?: string;
  labName?: string;
  notes?: string;
}

export interface FamilyHistoryEntry {
  id: string;
  relationship: 'parent' | 'sibling' | 'grandparent' | 'child' | 'other';
  condition: string;
  ageAtDiagnosis?: number;
  notes?: string;
}

export interface CareTeamMember {
  id: string;
  name: string;
  role: 'primary_doctor' | 'specialist' | 'pharmacist' | 'nurse' | 'therapist' | 'other';
  specialty?: string;
  contactInfo?: string;
  primaryContact: boolean;
  activeSince: string;
}

export interface HealthGoal {
  id: string;
  title: string;
  description: string;
  category: 'medication_adherence' | 'lifestyle' | 'preventive_care' | 'disease_management' | 'other';
  targetDate?: string;
  progress: number; // 0-100
  status: 'active' | 'completed' | 'abandoned';
  createdAt: string;
  updatedAt: string;
}

export interface RiskFactor {
  category: string;
  factor: string;
  riskLevel: HealthRiskLevel;
  description: string;
  recommendations: string[];
  identifiedAt: string;
  lastUpdatedAt: string;
}

export interface HealthTrajectoryPoint {
  timestamp: string;
  overallHealthScore: number; // 0-100
  riskLevel: HealthRiskLevel;
  adherenceLevel: AdherenceLevel;
  activeMedicationsCount: number;
  activeConditionsCount: number;
  recentHospitalizations: number;
  notes?: string;
}

@Entity('digital_twins')
@Index(['patientId'], { unique: true })
@Index(['lastUpdatedAt'])
@Index(['overallHealthScore'])
export class DigitalTwin {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  patientId!: string;

  // Patient Demographics (anonymized for privacy)
  @Column({ type: 'int', nullable: true })
  age?: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  gender?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ethnicity?: string;

  // Medical History
  @Column({ type: 'jsonb', default: [] })
  medications!: MedicationEntry[];

  @Column({ type: 'jsonb', default: [] })
  allergies!: AllergyEntry[];

  @Column({ type: 'jsonb', default: [] })
  chronicConditions!: ChronicCondition[];

  @Column({ type: 'jsonb', default: [] })
  labResults!: LabResult[];

  @Column({ type: 'jsonb', default: [] })
  vitalSigns!: VitalSignsEntry[];

  // Family & Care Team
  @Column({ type: 'jsonb', default: [] })
  familyHistory!: FamilyHistoryEntry[];

  @Column({ type: 'jsonb', default: [] })
  careTeam!: CareTeamMember[];

  // Health Metrics (AI-Calculated)
  @Column({ type: 'float', default: 50.0 })
  overallHealthScore!: number; // 0-100, higher is better

  @Column({
    type: 'enum',
    enum: HealthRiskLevel,
    default: HealthRiskLevel.MODERATE,
  })
  currentRiskLevel!: HealthRiskLevel;

  @Column({
    type: 'enum',
    enum: AdherenceLevel,
    default: AdherenceLevel.UNKNOWN,
  })
  medicationAdherence!: AdherenceLevel;

  @Column({ type: 'float', nullable: true })
  adherenceScore?: number; // 0-100

  // Risk Assessment
  @Column({ type: 'jsonb', default: [] })
  riskFactors!: RiskFactor[];

  @Column({ type: 'float', nullable: true })
  cardiovascularRisk?: number;

  @Column({ type: 'float', nullable: true })
  diabetesRisk?: number;

  @Column({ type: 'float', nullable: true })
  hospitalReadmissionRisk?: number;

  // Goals & Progress
  @Column({ type: 'jsonb', default: [] })
  healthGoals!: HealthGoal[];

  // Health Trajectory (temporal data)
  @Column({ type: 'jsonb', default: [] })
  healthTrajectory!: HealthTrajectoryPoint[];

  // AI Recommendations
  @Column({ type: 'jsonb', default: [] })
  recommendations!: Array<{
    id: string;
    type: 'medication' | 'lifestyle' | 'screening' | 'follow_up' | 'other';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    title: string;
    description: string;
    rationale: string;
    suggestedAction?: string;
    generatedAt: string;
    acknowledged: boolean;
  }>;

  // What-If Scenarios (for patient education)
  @Column({ type: 'jsonb', nullable: true })
  whatIfScenarios?: Array<{
    id: string;
    scenario: string;
    description: string;
    predictedOutcome: string;
    riskChange: number; // +/- percentage
    healthScoreChange: number; // +/- points
    generatedAt: string;
  }>;

  // Data Freshness & Quality
  @Column({ type: 'timestamp', nullable: true })
  lastMedicationUpdate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLabUpdate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastVitalSignsUpdate?: Date;

  @Column({ type: 'int', default: 0 })
  dataCompletenessScore!: number; // 0-100

  // Consent & Privacy
  @Column({ type: 'boolean', default: false })
  aiAnalysisConsent!: boolean;

  @Column({ type: 'boolean', default: false })
  dataSharingConsent!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  consentGivenAt?: Date;

  // Audit
  @Column({ type: 'varchar', length: 255, nullable: true })
  lastUpdatedBy?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastUpdatedAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
