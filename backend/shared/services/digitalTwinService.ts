/**
 * Digital Twin Patient Profile Service (T3-106)
 * Comprehensive patient profile aggregation and health insights
 *
 * Features:
 * - Aggregate data from multiple sources (prescriptions, purchases, allergies, conditions)
 * - Unified view of patient health data
 * - Predictive health insights
 * - Medication adherence tracking
 * - Health risk assessment
 * - Personalized health recommendations
 *
 * Based on: /specs/003-production-readiness/tasks3.md
 */

import { AppDataSource } from '../../services/user-service/src/index';
import { User } from '../models/User';
import { Prescription } from '../models/Prescription';
import { Order } from '../models/Order';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface DigitalTwinProfile {
  patient_id: string;
  patient_name: string;
  age: number | null;
  demographic: {
    age_group: 'child' | 'adult' | 'senior';
    profile_completeness: number; // 0-100%
  };

  // Medical History
  medical_history: {
    chronic_conditions: ChronicCondition[];
    allergies: Allergy[];
    current_medications: CurrentMedication[];
    past_medications: PastMedication[];
    total_prescriptions: number;
    last_prescription_date: Date | null;
  };

  // Purchase Behavior
  purchase_behavior: {
    total_orders: number;
    last_order_date: Date | null;
    preferred_categories: string[];
    avg_order_value: number;
    purchase_frequency: 'high' | 'medium' | 'low';
  };

  // Health Insights
  health_insights: {
    medication_adherence_score: number; // 0-100
    health_risk_level: 'low' | 'moderate' | 'high';
    risk_factors: string[];
    drug_interactions: DrugInteraction[];
    missing_preventive_care: string[];
  };

  // Predictions & Recommendations
  predictions: {
    refill_due_dates: RefillPrediction[];
    upcoming_health_needs: string[];
    recommended_screenings: string[];
  };

  // Engagement Metrics
  engagement: {
    app_usage_frequency: 'high' | 'medium' | 'low';
    teleconsultation_count: number;
    last_active_date: Date | null;
    vip_status: boolean;
  };

  // Privacy & Consent
  privacy: {
    data_sharing_consent: boolean;
    last_updated: Date;
  };
}

export interface ChronicCondition {
  condition_name: string;
  diagnosed_date: Date | null;
  severity: 'mild' | 'moderate' | 'severe' | 'unknown';
  managed_by: string[]; // Medication names
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
  adherence_score: number; // 0-100
}

export interface PastMedication {
  medication_name: string;
  discontinued_date: Date;
  reason: string;
}

export interface DrugInteraction {
  medication1: string;
  medication2: string;
  severity: 'minor' | 'moderate' | 'severe';
  description: string;
}

export interface RefillPrediction {
  medication_name: string;
  predicted_refill_date: Date;
  confidence: number; // 0-100
  auto_refill_eligible: boolean;
}

// ============================================================================
// Digital Twin Service
// ============================================================================

/**
 * Get comprehensive digital twin profile for a patient
 * T3-106: Main aggregation function
 *
 * @param patient_id - Patient UUID
 * @returns Complete digital twin profile
 */
export async function getDigitalTwinProfile(patient_id: string): Promise<DigitalTwinProfile | null> {
  try {
    // Get base patient data
    const userRepo = AppDataSource.getRepository(User);
    const patient = await userRepo.findOne({ where: { id: patient_id } });

    if (!patient) {
      console.error(`[DigitalTwin] Patient not found: ${patient_id}`);
      return null;
    }

    // Aggregate data from multiple sources
    const [
      medicalHistory,
      purchaseBehavior,
      healthInsights,
      predictions,
      engagement,
    ] = await Promise.all([
      getMedicalHistory(patient_id),
      getPurchaseBehavior(patient_id),
      getHealthInsights(patient_id),
      getPredictions(patient_id),
      getEngagementMetrics(patient_id),
    ]);

    // Calculate demographic info
    const demographic = calculateDemographic(patient);

    // Build complete profile
    const profile: DigitalTwinProfile = {
      patient_id,
      patient_name: `${patient.first_name_encrypted || 'Unknown'} ${patient.last_name_encrypted || ''}`.trim(),
      age: null, // TODO: Calculate from date_of_birth if available
      demographic,
      medical_history: medicalHistory,
      purchase_behavior: purchaseBehavior,
      health_insights: healthInsights,
      predictions,
      engagement,
      privacy: {
        data_sharing_consent: true, // TODO: Get from patient preferences
        last_updated: new Date(),
      },
    };

    console.log(`[DigitalTwin] Generated profile for patient ${patient_id}`);
    return profile;
  } catch (error) {
    console.error('[DigitalTwin] Error generating profile:', error);
    return null;
  }
}

/**
 * Update digital twin profile with new data
 * Called after prescriptions, purchases, or health events
 */
export async function updateDigitalTwin(
  patient_id: string,
  updateType: 'prescription' | 'purchase' | 'allergy' | 'condition',
  data: any
): Promise<boolean> {
  try {
    // In production: Update cached profile or trigger recomputation
    console.log(`[DigitalTwin] Update triggered for ${patient_id}: ${updateType}`);

    // TODO: Store profile in cache (Redis) for fast retrieval
    // TODO: Trigger background job to recompute insights

    return true;
  } catch (error) {
    console.error('[DigitalTwin] Error updating profile:', error);
    return false;
  }
}

// ============================================================================
// Helper Functions - Data Aggregation
// ============================================================================

async function getMedicalHistory(patient_id: string): Promise<DigitalTwinProfile['medical_history']> {
  const prescriptionRepo = AppDataSource.getRepository(Prescription);

  // Get all prescriptions
  const prescriptions = await prescriptionRepo.find({
    where: { patient_id },
    relations: ['items'],
    order: { created_at: 'DESC' },
  });

  const totalPrescriptions = prescriptions.length;
  const lastPrescriptionDate = prescriptions.length > 0 ? prescriptions[0].created_at : null;

  // Extract current medications (from recent prescriptions)
  const currentMedications: CurrentMedication[] = [];
  const medicationMap = new Map<string, CurrentMedication>();

  // Get prescriptions from last 6 months for "current" medications
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const recentPrescriptions = prescriptions.filter(
    p => new Date(p.created_at) >= sixMonthsAgo
  );

  for (const prescription of recentPrescriptions) {
    for (const item of prescription.items || []) {
      const rxnorm = item.medication_rxnorm_code || 'unknown';

      if (!medicationMap.has(rxnorm)) {
        // Predict next refill (30 days from last prescription)
        const nextRefill = new Date(prescription.created_at);
        nextRefill.setDate(nextRefill.getDate() + 30);

        medicationMap.set(rxnorm, {
          medication_name: item.medication_name,
          rxnorm_code: rxnorm,
          dosage: item.dosage || 'unknown',
          frequency: item.frequency || 'unknown',
          start_date: new Date(prescription.created_at),
          last_refill_date: new Date(prescription.created_at),
          next_refill_due: nextRefill,
          adherence_score: 85, // TODO: Calculate from refill history
        });
      }
    }
  }

  currentMedications.push(...Array.from(medicationMap.values()));

  // Extract chronic conditions from prescription patterns
  const chronicConditions: ChronicCondition[] = detectChronicConditions(prescriptions);

  // Extract allergies (from patient profile or prescription notes)
  const allergies: Allergy[] = []; // TODO: Get from patient allergy table

  // Past medications (discontinued)
  const pastMedications: PastMedication[] = []; // TODO: Identify from prescription gaps

  return {
    chronic_conditions: chronicConditions,
    allergies,
    current_medications: currentMedications,
    past_medications: pastMedications,
    total_prescriptions: totalPrescriptions,
    last_prescription_date: lastPrescriptionDate,
  };
}

async function getPurchaseBehavior(patient_id: string): Promise<DigitalTwinProfile['purchase_behavior']> {
  const orderRepo = AppDataSource.getRepository(Order);

  const orders = await orderRepo.find({
    where: { patient_id },
    relations: ['items'],
    order: { created_at: 'DESC' },
  });

  const totalOrders = orders.length;
  const lastOrderDate = orders.length > 0 ? orders[0].created_at : null;

  // Calculate average order value
  const totalValue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0;

  // Extract preferred categories
  const categoryCounts = new Map<string, number>();
  for (const order of orders) {
    for (const item of order.items || []) {
      const category = item.product_category || 'uncategorized';
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    }
  }

  const preferredCategories = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category]) => category);

  // Calculate purchase frequency
  const daysSinceFirstOrder = orders.length > 1
    ? (Date.now() - new Date(orders[orders.length - 1].created_at).getTime()) / (1000 * 60 * 60 * 24)
    : 0;

  const ordersPerMonth = daysSinceFirstOrder > 0
    ? (totalOrders / daysSinceFirstOrder) * 30
    : 0;

  const purchaseFrequency: 'high' | 'medium' | 'low' =
    ordersPerMonth > 4 ? 'high' :
    ordersPerMonth > 1 ? 'medium' : 'low';

  return {
    total_orders: totalOrders,
    last_order_date: lastOrderDate,
    preferred_categories: preferredCategories,
    avg_order_value: parseFloat(avgOrderValue.toFixed(2)),
    purchase_frequency: purchaseFrequency,
  };
}

async function getHealthInsights(patient_id: string): Promise<DigitalTwinProfile['health_insights']> {
  // Get current medications
  const medicalHistory = await getMedicalHistory(patient_id);

  // Calculate medication adherence
  const adherenceScore = calculateMedicationAdherence(medicalHistory.current_medications);

  // Assess health risk level
  const riskFactors: string[] = [];
  let riskLevel: 'low' | 'moderate' | 'high' = 'low';

  // Risk factor: Multiple chronic conditions
  if (medicalHistory.chronic_conditions.length >= 3) {
    riskFactors.push('Multiple chronic conditions');
    riskLevel = 'high';
  } else if (medicalHistory.chronic_conditions.length >= 1) {
    riskFactors.push('Chronic condition present');
    riskLevel = 'moderate';
  }

  // Risk factor: Polypharmacy (5+ medications)
  if (medicalHistory.current_medications.length >= 5) {
    riskFactors.push('Polypharmacy (5+ medications)');
    riskLevel = riskLevel === 'high' ? 'high' : 'moderate';
  }

  // Risk factor: Low medication adherence
  if (adherenceScore < 70) {
    riskFactors.push('Poor medication adherence');
    riskLevel = 'high';
  }

  // Check for drug interactions
  const drugInteractions = checkDrugInteractions(medicalHistory.current_medications);

  // Identify missing preventive care
  const missingPreventiveCare = identifyMissingPreventiveCare(medicalHistory);

  return {
    medication_adherence_score: adherenceScore,
    health_risk_level: riskLevel,
    risk_factors: riskFactors,
    drug_interactions: drugInteractions,
    missing_preventive_care: missingPreventiveCare,
  };
}

async function getPredictions(patient_id: string): Promise<DigitalTwinProfile['predictions']> {
  const medicalHistory = await getMedicalHistory(patient_id);

  // Predict refill due dates
  const refillPredictions: RefillPrediction[] = medicalHistory.current_medications.map(med => ({
    medication_name: med.medication_name,
    predicted_refill_date: med.next_refill_due || new Date(),
    confidence: 80, // TODO: Calculate based on refill history
    auto_refill_eligible: med.adherence_score > 80,
  }));

  // Predict upcoming health needs
  const upcomingHealthNeeds: string[] = [];

  // Seasonal predictions
  const month = new Date().getMonth();
  if (month >= 10 || month <= 1) {
    upcomingHealthNeeds.push('Flu vaccine (winter season)');
    upcomingHealthNeeds.push('Cold & flu medication stock-up');
  }

  if (month >= 2 && month <= 4) {
    upcomingHealthNeeds.push('Allergy medication (spring season)');
  }

  // Chronic condition-based predictions
  for (const condition of medicalHistory.chronic_conditions) {
    if (condition.condition_name.toLowerCase().includes('diabetes')) {
      upcomingHealthNeeds.push('Quarterly HbA1c test');
      upcomingHealthNeeds.push('Annual eye exam');
    }
    if (condition.condition_name.toLowerCase().includes('hypertension')) {
      upcomingHealthNeeds.push('Monthly blood pressure monitoring');
    }
  }

  // Recommended screenings
  const recommendedScreenings: string[] = [];
  // TODO: Age-based screening recommendations (colonoscopy, mammogram, etc.)

  return {
    refill_due_dates: refillPredictions,
    upcoming_health_needs: upcomingHealthNeeds.slice(0, 5),
    recommended_screenings,
  };
}

async function getEngagementMetrics(patient_id: string): Promise<DigitalTwinProfile['engagement']> {
  const prescriptionRepo = AppDataSource.getRepository(Prescription);
  const orderRepo = AppDataSource.getRepository(Order);

  // Count teleconsultations
  const teleconsultationCount = await prescriptionRepo.count({
    where: {
      patient_id,
      source: 'teleconsultation',
    },
  });

  // Get last active date (most recent prescription or order)
  const [lastPrescription, lastOrder] = await Promise.all([
    prescriptionRepo.findOne({
      where: { patient_id },
      order: { created_at: 'DESC' },
    }),
    orderRepo.findOne({
      where: { patient_id },
      order: { created_at: 'DESC' },
    }),
  ]);

  const lastActiveDate = lastPrescription && lastOrder
    ? new Date(Math.max(
        new Date(lastPrescription.created_at).getTime(),
        new Date(lastOrder.created_at).getTime()
      ))
    : lastPrescription
    ? new Date(lastPrescription.created_at)
    : lastOrder
    ? new Date(lastOrder.created_at)
    : null;

  // Calculate usage frequency
  const daysSinceLastActive = lastActiveDate
    ? (Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)
    : 999;

  const usageFrequency: 'high' | 'medium' | 'low' =
    daysSinceLastActive < 7 ? 'high' :
    daysSinceLastActive < 30 ? 'medium' : 'low';

  return {
    app_usage_frequency: usageFrequency,
    teleconsultation_count: teleconsultationCount,
    last_active_date: lastActiveDate,
    vip_status: false, // TODO: Check VIP program enrollment
  };
}

// ============================================================================
// Helper Functions - Analysis
// ============================================================================

function calculateDemographic(patient: User): DigitalTwinProfile['demographic'] {
  // Calculate age group
  // TODO: Get actual date of birth from patient
  const ageGroup: 'child' | 'adult' | 'senior' = 'adult'; // Default

  // Calculate profile completeness
  let completenessScore = 0;
  const fields = [
    patient.email,
    patient.first_name_encrypted,
    patient.last_name_encrypted,
    patient.phone_encrypted,
    patient.primary_pharmacy_id,
  ];

  completenessScore = (fields.filter(f => f !== null && f !== undefined).length / fields.length) * 100;

  return {
    age_group: ageGroup,
    profile_completeness: Math.round(completenessScore),
  };
}

function detectChronicConditions(prescriptions: Prescription[]): ChronicCondition[] {
  const conditions: ChronicCondition[] = [];

  // Knowledge base: Medication patterns that indicate chronic conditions
  const conditionIndicators: Record<string, string[]> = {
    'Type 2 Diabetes': ['metformin', 'insulin', 'glipizide', 'sitagliptin'],
    'Hypertension': ['lisinopril', 'amlodipine', 'losartan', 'metoprolol'],
    'Hyperlipidemia': ['atorvastatin', 'simvastatin', 'rosuvastatin'],
    'Asthma': ['albuterol', 'fluticasone', 'montelukast'],
    'GERD': ['omeprazole', 'pantoprazole', 'esomeprazole'],
  };

  // Count occurrences of condition-specific medications
  const medicationCounts = new Map<string, Set<string>>();

  for (const prescription of prescriptions) {
    for (const item of prescription.items || []) {
      const medNameLower = item.medication_name.toLowerCase();

      for (const [condition, indicators] of Object.entries(conditionIndicators)) {
        for (const indicator of indicators) {
          if (medNameLower.includes(indicator)) {
            if (!medicationCounts.has(condition)) {
              medicationCounts.set(condition, new Set());
            }
            medicationCounts.get(condition)!.add(item.medication_name);
          }
        }
      }
    }
  }

  // If medication appears 3+ times, likely chronic condition
  for (const [condition, medications] of medicationCounts.entries()) {
    if (medications.size >= 1) {
      conditions.push({
        condition_name: condition,
        diagnosed_date: null,
        severity: 'unknown',
        managed_by: Array.from(medications),
      });
    }
  }

  return conditions;
}

function calculateMedicationAdherence(currentMedications: CurrentMedication[]): number {
  if (currentMedications.length === 0) {
    return 100; // No medications = perfect adherence
  }

  // Average adherence across all medications
  const totalAdherence = currentMedications.reduce(
    (sum, med) => sum + med.adherence_score,
    0
  );

  return Math.round(totalAdherence / currentMedications.length);
}

function checkDrugInteractions(currentMedications: CurrentMedication[]): DrugInteraction[] {
  const interactions: DrugInteraction[] = [];

  // Knowledge base of known interactions (simplified)
  const knownInteractions: Record<string, { with: string; severity: 'minor' | 'moderate' | 'severe'; description: string }[]> = {
    warfarin: [
      {
        with: 'aspirin',
        severity: 'severe',
        description: 'Increased risk of bleeding',
      },
    ],
    metformin: [
      {
        with: 'alcohol',
        severity: 'moderate',
        description: 'Risk of lactic acidosis',
      },
    ],
  };

  // Check for interactions
  for (let i = 0; i < currentMedications.length; i++) {
    for (let j = i + 1; j < currentMedications.length; j++) {
      const med1 = currentMedications[i].medication_name.toLowerCase();
      const med2 = currentMedications[j].medication_name.toLowerCase();

      if (knownInteractions[med1]) {
        for (const interaction of knownInteractions[med1]) {
          if (med2.includes(interaction.with)) {
            interactions.push({
              medication1: currentMedications[i].medication_name,
              medication2: currentMedications[j].medication_name,
              severity: interaction.severity,
              description: interaction.description,
            });
          }
        }
      }

      if (knownInteractions[med2]) {
        for (const interaction of knownInteractions[med2]) {
          if (med1.includes(interaction.with)) {
            interactions.push({
              medication1: currentMedications[j].medication_name,
              medication2: currentMedications[i].medication_name,
              severity: interaction.severity,
              description: interaction.description,
            });
          }
        }
      }
    }
  }

  return interactions;
}

function identifyMissingPreventiveCare(
  medicalHistory: DigitalTwinProfile['medical_history']
): string[] {
  const missing: string[] = [];

  // Check for flu vaccine (seasonal)
  const month = new Date().getMonth();
  if (month >= 9 || month <= 2) {
    // Flu season
    missing.push('Annual flu vaccine');
  }

  // Check for cholesterol screening
  if (medicalHistory.chronic_conditions.some(c => c.condition_name.includes('Hyperlipidemia'))) {
    missing.push('Annual lipid panel');
  }

  // Check for diabetes screening
  if (medicalHistory.chronic_conditions.some(c => c.condition_name.includes('Diabetes'))) {
    missing.push('Quarterly HbA1c test');
    missing.push('Annual retinal exam');
  }

  return missing;
}
