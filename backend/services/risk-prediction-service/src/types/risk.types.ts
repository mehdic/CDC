/**
 * Risk Prediction Types
 * Type definitions for health risk prediction system
 */

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export type RiskCategory =
  | 'medication_interaction'
  | 'chronic_disease_progression'
  | 'adverse_drug_reaction'
  | 'polypharmacy'
  | 'age_related'
  | 'comorbidity';

export interface Medication {
  readonly id: string;
  readonly name: string;
  readonly activeIngredient: string;
  readonly dosage: string;
  readonly frequency: string;
  readonly startDate: Date;
  readonly endDate?: Date;
}

export interface ChronicCondition {
  readonly id: string;
  readonly name: string;
  readonly diagnosedDate: Date;
  readonly severity: 'mild' | 'moderate' | 'severe';
  readonly controlStatus: 'well-controlled' | 'partially-controlled' | 'uncontrolled';
}

export interface PatientData {
  readonly patientId: string;
  readonly age: number;
  readonly medications: ReadonlyArray<Medication>;
  readonly chronicConditions: ReadonlyArray<ChronicCondition>;
  readonly allergies: ReadonlyArray<string>;
  readonly recentLabs?: ReadonlyArray<LabResult>;
}

export interface LabResult {
  readonly testName: string;
  readonly value: number;
  readonly unit: string;
  readonly date: Date;
  readonly normalRange: {
    readonly min: number;
    readonly max: number;
  };
}

export interface RiskFactor {
  readonly category: RiskCategory;
  readonly description: string;
  readonly severity: number; // 0-100
  readonly details: string;
  readonly recommendations: ReadonlyArray<string>;
}

export interface RiskScore {
  readonly overall: number; // 0-100
  readonly level: RiskLevel;
  readonly factors: ReadonlyArray<RiskFactor>;
  readonly confidence: number; // 0-1
}

export interface RiskAssessment {
  readonly assessmentId: string;
  readonly patientId: string;
  readonly timestamp: Date;
  readonly riskScore: RiskScore;
  readonly assessedBy: 'system' | 'pharmacist' | 'doctor';
  readonly notes?: string;
}

export interface RiskAlert {
  readonly alertId: string;
  readonly patientId: string;
  readonly patientName: string;
  readonly riskLevel: RiskLevel;
  readonly priority: 'low' | 'medium' | 'high' | 'urgent';
  readonly message: string;
  readonly createdAt: Date;
  readonly acknowledged: boolean;
  readonly acknowledgedBy?: string;
  readonly acknowledgedAt?: Date;
}

export interface TrendDataPoint {
  readonly date: Date;
  readonly score: number;
  readonly level: RiskLevel;
}

export interface RiskTrend {
  readonly patientId: string;
  readonly category: RiskCategory;
  readonly dataPoints: ReadonlyArray<TrendDataPoint>;
  readonly trend: 'improving' | 'stable' | 'worsening';
  readonly projectedScore?: number; // 30-day projection
}

export interface AssessRiskRequest {
  readonly patientId: string;
  readonly includeProjection?: boolean;
}

export interface AssessRiskResponse {
  readonly assessment: RiskAssessment;
  readonly alerts: ReadonlyArray<RiskAlert>;
  readonly trends?: ReadonlyArray<RiskTrend>;
}
