/**
 * Digital Twin Types
 * Frontend types matching backend API response
 */

export interface Demographic {
  age_group: 'child' | 'adult' | 'senior';
  profile_completeness: number;
}

export interface ChronicCondition {
  condition_name: string;
  diagnosed_date: Date | null;
  severity: 'mild' | 'moderate' | 'severe' | 'unknown';
  managed_by: string[];
  notes?: string;
}

export interface Allergy {
  allergen: string;
  reaction_type: 'mild' | 'moderate' | 'severe';
  verified_date: Date | null;
}

export interface CurrentMedication {
  medication_name: string;
  rxnorm_code: string;
  dosage: string;
  frequency: string;
  start_date: Date;
  last_refill_date: Date | null;
  next_refill_due: Date | null;
  adherence_score: number;
}

export interface PastMedication {
  medication_name: string;
  discontinued_date: Date;
  reason: string;
}

export interface MedicalHistory {
  chronic_conditions: ChronicCondition[];
  allergies: Allergy[];
  current_medications: CurrentMedication[];
  past_medications: PastMedication[];
  total_prescriptions: number;
  last_prescription_date: Date | null;
}

export interface PurchaseBehavior {
  total_orders: number;
  last_order_date: Date | null;
  preferred_categories: string[];
  avg_order_value: number;
  purchase_frequency: 'high' | 'medium' | 'low';
}

export interface DrugInteraction {
  medication1: string;
  medication2: string;
  severity: 'minor' | 'moderate' | 'severe';
  description: string;
}

export interface HealthInsights {
  medication_adherence_score: number;
  health_risk_level: 'low' | 'moderate' | 'high';
  risk_factors: string[];
  drug_interactions: DrugInteraction[];
  missing_preventive_care: string[];
}

export interface RefillPrediction {
  medication_name: string;
  predicted_refill_date: Date;
  confidence: number;
  auto_refill_eligible: boolean;
}

export interface Predictions {
  refill_due_dates: RefillPrediction[];
  upcoming_health_needs: string[];
  recommended_screenings: string[];
}

export interface Engagement {
  app_usage_frequency: 'high' | 'medium' | 'low';
  teleconsultation_count: number;
  last_active_date: Date | null;
  vip_status: boolean;
}

export interface Privacy {
  data_sharing_consent: boolean;
  last_updated: Date;
}

export interface DigitalTwinProfile {
  patient_id: string;
  patient_name: string;
  age: number | null;
  demographic: Demographic;
  medical_history: MedicalHistory;
  purchase_behavior: PurchaseBehavior;
  health_insights: HealthInsights;
  predictions: Predictions;
  engagement: Engagement;
  privacy: Privacy;
  cached?: boolean;
  computed_at?: Date;
}
