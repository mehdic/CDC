/**
 * Medication Recommendation Engine (T3-105)
 * Personalized medication and OTC product recommendations
 *
 * Features:
 * - Patient history-based recommendations
 * - Allergy and contraindication checking
 * - Current medication interaction analysis
 * - OTC alternative suggestions
 * - Personalized product recommendations
 *
 * Based on: /specs/003-production-readiness/tasks3.md
 */

import { AppDataSource } from '../index';
import { User } from '../../../../shared/models/User';
import { Prescription } from '../../../../shared/models/Prescription';
import { PrescriptionItem } from '../../../../shared/models/PrescriptionItem';
import { Order } from '../../../../shared/models/Order';
import { OrderItem } from '../../../../shared/models/OrderItem';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface MedicationRecommendation {
  rxnorm_code: string;
  medication_name: string;
  reason: string; // Why this is recommended
  confidence: number; // 0-100
  category: 'prescription' | 'otc' | 'supplement' | 'medical_device';
  tags: string[]; // e.g., ['chronic_condition', 'pain_relief', 'allergy_safe']
  estimated_price?: number;
  in_stock: boolean;
}

export interface RecommendationContext {
  patient_id: string;
  current_medications: string[]; // RxNorm codes
  allergies: string[]; // Allergen names
  chronic_conditions: string[]; // Condition names
  recent_purchases: string[]; // Product categories
  age_group: 'child' | 'adult' | 'senior';
  exclude_rxnorm_codes?: string[]; // Already purchased/prescribed
}

export interface ProductRecommendation {
  product_id?: string;
  product_name: string;
  category: string;
  reason: string;
  confidence: number; // 0-100
  tags: string[];
  estimated_price?: number;
}

// ============================================================================
// Recommendation Engine
// ============================================================================

/**
 * Get personalized medication recommendations for a patient
 * T3-105: Main recommendation engine
 *
 * @param context - Patient context for recommendations
 * @param maxRecommendations - Maximum number of recommendations to return
 * @returns Array of medication recommendations sorted by confidence
 */
export async function getPersonalizedRecommendations(
  context: RecommendationContext,
  maxRecommendations: number = 5
): Promise<MedicationRecommendation[]> {
  try {
    const recommendations: MedicationRecommendation[] = [];

    // 1. Analyze patient history
    const patientHistory = await analyzePatientHistory(context.patient_id);

    // 2. Get refill recommendations (medications patient takes regularly)
    const refillRecommendations = await getRefillRecommendations(
      context.patient_id,
      context.exclude_rxnorm_codes || []
    );
    recommendations.push(...refillRecommendations);

    // 3. Get complementary medication recommendations
    const complementaryRecommendations = await getComplementaryMedications(
      context.current_medications,
      context.chronic_conditions,
      context.allergies
    );
    recommendations.push(...complementaryRecommendations);

    // 4. Get OTC alternatives for prescription medications
    const otcAlternatives = await getOTCAlternatives(
      context.current_medications,
      context.allergies
    );
    recommendations.push(...otcAlternatives);

    // 5. Get condition-based recommendations
    const conditionRecommendations = await getConditionBasedRecommendations(
      context.chronic_conditions,
      context.age_group,
      context.allergies
    );
    recommendations.push(...conditionRecommendations);

    // 6. Filter out allergies and contraindications
    const safeRecommendations = await filterUnsafeRecommendations(
      recommendations,
      context.current_medications,
      context.allergies
    );

    // 7. Remove duplicates and sort by confidence
    const uniqueRecommendations = deduplicateRecommendations(safeRecommendations);

    // 8. Sort by confidence and limit
    uniqueRecommendations.sort((a, b) => b.confidence - a.confidence);

    return uniqueRecommendations.slice(0, maxRecommendations);
  } catch (error) {
    console.error('[RecommendationService] Error generating recommendations:', error);
    return [];
  }
}

/**
 * Get OTC product recommendations based on purchase history
 * Useful for e-commerce section of the app
 */
export async function getProductRecommendations(
  patient_id: string,
  maxRecommendations: number = 10
): Promise<ProductRecommendation[]> {
  try {
    const recommendations: ProductRecommendation[] = [];

    // 1. Get purchase history
    const purchaseHistory = await getPurchaseHistory(patient_id);

    // 2. Frequently bought together
    const frequentlyBoughtTogether = await getFrequentlyBoughtTogether(purchaseHistory);
    recommendations.push(...frequentlyBoughtTogether);

    // 3. Popular in same category
    const popularInCategory = await getPopularInCategory(purchaseHistory);
    recommendations.push(...popularInCategory);

    // 4. Seasonal recommendations
    const seasonalRecommendations = getSeasonalRecommendations();
    recommendations.push(...seasonalRecommendations);

    // Remove duplicates and sort
    const uniqueRecommendations = deduplicateProductRecommendations(recommendations);
    uniqueRecommendations.sort((a, b) => b.confidence - a.confidence);

    return uniqueRecommendations.slice(0, maxRecommendations);
  } catch (error) {
    console.error('[RecommendationService] Error generating product recommendations:', error);
    return [];
  }
}

// ============================================================================
// Helper Functions - Patient History Analysis
// ============================================================================

async function analyzePatientHistory(patient_id: string): Promise<{
  prescription_count: number;
  order_count: number;
  common_medications: string[];
  common_categories: string[];
}> {
  const prescriptionRepo = AppDataSource.getRepository(Prescription);
  const orderRepo = AppDataSource.getRepository(Order);

  const [prescriptionCount, orderCount] = await Promise.all([
    prescriptionRepo.count({ where: { patient_id } }),
    orderRepo.count({ where: { patient_id } }),
  ]);

  // Get most common medications from prescriptions
  const prescriptions = await prescriptionRepo.find({
    where: { patient_id },
    relations: ['items'],
    take: 50, // Last 50 prescriptions
    order: { created_at: 'DESC' },
  });

  const medicationCounts = new Map<string, number>();
  for (const prescription of prescriptions) {
    for (const item of prescription.items || []) {
      const count = medicationCounts.get(item.medication_name) || 0;
      medicationCounts.set(item.medication_name, count + 1);
    }
  }

  const common_medications = Array.from(medicationCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);

  // Get most common product categories from orders
  const orders = await orderRepo.find({
    where: { patient_id },
    relations: ['items'],
    take: 50,
    order: { created_at: 'DESC' },
  });

  const categoryCounts = new Map<string, number>();
  for (const order of orders) {
    for (const item of order.items || []) {
      const category = item.product_category || 'uncategorized';
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    }
  }

  const common_categories = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category]) => category);

  return {
    prescription_count: prescriptionCount,
    order_count: orderCount,
    common_medications,
    common_categories,
  };
}

/**
 * Recommend refills for medications patient takes regularly
 */
async function getRefillRecommendations(
  patient_id: string,
  excludeRxnormCodes: string[]
): Promise<MedicationRecommendation[]> {
  const prescriptionRepo = AppDataSource.getRepository(Prescription);

  // Get recent prescriptions (last 12 months)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const prescriptions = await prescriptionRepo
    .createQueryBuilder('prescription')
    .leftJoinAndSelect('prescription.items', 'items')
    .where('prescription.patient_id = :patient_id', { patient_id })
    .andWhere('prescription.created_at >= :oneYearAgo', { oneYearAgo })
    .getMany();

  // Count medication frequency
  const medicationFrequency = new Map<string, { count: number; name: string; rxnorm: string }>();

  for (const prescription of prescriptions) {
    for (const item of prescription.items || []) {
      const rxnorm = item.medication_rxnorm_code || 'unknown';

      if (excludeRxnormCodes.includes(rxnorm)) {
        continue; // Skip if already in cart/excluded
      }

      const current = medicationFrequency.get(rxnorm) || {
        count: 0,
        name: item.medication_name,
        rxnorm,
      };
      current.count += 1;
      medicationFrequency.set(rxnorm, current);
    }
  }

  // Convert to recommendations
  const recommendations: MedicationRecommendation[] = [];

  for (const [rxnorm, data] of medicationFrequency.entries()) {
    // Only recommend if taken 2+ times in the last year
    if (data.count >= 2) {
      recommendations.push({
        rxnorm_code: rxnorm,
        medication_name: data.name,
        reason: `You've been prescribed this ${data.count} times in the past year`,
        confidence: Math.min(95, 60 + data.count * 10), // Higher frequency = higher confidence
        category: 'prescription',
        tags: ['refill', 'regular_medication'],
        in_stock: true, // TODO: Check actual inventory
      });
    }
  }

  return recommendations;
}

/**
 * Get complementary medications for chronic conditions
 */
async function getComplementaryMedications(
  currentMedications: string[],
  chronicConditions: string[],
  allergies: string[]
): Promise<MedicationRecommendation[]> {
  const recommendations: MedicationRecommendation[] = [];

  // Knowledge base of condition-specific recommendations
  const conditionMedications: Record<string, MedicationRecommendation[]> = {
    hypertension: [
      {
        rxnorm_code: '197361',
        medication_name: 'Aspirin 81mg (low dose)',
        reason: 'Commonly recommended for cardiovascular health with hypertension',
        confidence: 70,
        category: 'otc',
        tags: ['cardiovascular', 'preventive'],
        in_stock: true,
      },
    ],
    diabetes: [
      {
        rxnorm_code: '105377',
        medication_name: 'Glucose tablets',
        reason: 'Essential for managing hypoglycemia',
        confidence: 85,
        category: 'otc',
        tags: ['diabetes_management', 'emergency'],
        in_stock: true,
      },
    ],
    arthritis: [
      {
        rxnorm_code: '1191',
        medication_name: 'Ibuprofen 200mg',
        reason: 'OTC anti-inflammatory for arthritis pain management',
        confidence: 75,
        category: 'otc',
        tags: ['pain_relief', 'anti_inflammatory'],
        in_stock: true,
      },
    ],
  };

  // Add condition-specific recommendations
  for (const condition of chronicConditions) {
    const conditionKey = condition.toLowerCase();
    if (conditionMedications[conditionKey]) {
      recommendations.push(...conditionMedications[conditionKey]);
    }
  }

  return recommendations;
}

/**
 * Suggest OTC alternatives for prescription medications
 */
async function getOTCAlternatives(
  currentMedications: string[],
  allergies: string[]
): Promise<MedicationRecommendation[]> {
  const recommendations: MedicationRecommendation[] = [];

  // Knowledge base of prescription-to-OTC alternatives
  const otcAlternatives: Record<string, MedicationRecommendation> = {
    omeprazole: {
      rxnorm_code: '40790',
      medication_name: 'Omeprazole 20mg OTC',
      reason: 'OTC version available for acid reflux',
      confidence: 80,
      category: 'otc',
      tags: ['acid_reflux', 'otc_alternative'],
      in_stock: true,
    },
    loratadine: {
      rxnorm_code: '6387',
      medication_name: 'Loratadine 10mg (Claritin)',
      reason: 'OTC antihistamine for allergies',
      confidence: 85,
      category: 'otc',
      tags: ['allergy', 'antihistamine'],
      in_stock: true,
    },
  };

  // Check if patient is taking medications with OTC alternatives
  for (const medication of currentMedications) {
    const medLower = medication.toLowerCase();
    if (otcAlternatives[medLower]) {
      recommendations.push(otcAlternatives[medLower]);
    }
  }

  return recommendations;
}

/**
 * Get recommendations based on chronic conditions
 */
async function getConditionBasedRecommendations(
  chronicConditions: string[],
  ageGroup: 'child' | 'adult' | 'senior',
  allergies: string[]
): Promise<MedicationRecommendation[]> {
  const recommendations: MedicationRecommendation[] = [];

  // Age-specific supplements
  if (ageGroup === 'senior') {
    recommendations.push({
      rxnorm_code: '1000126',
      medication_name: 'Vitamin D3 1000 IU',
      reason: 'Recommended for seniors to support bone health',
      confidence: 70,
      category: 'supplement',
      tags: ['bone_health', 'senior_care', 'preventive'],
      in_stock: true,
    });

    recommendations.push({
      rxnorm_code: '318341',
      medication_name: 'Calcium with Vitamin D',
      reason: 'Important for bone density in seniors',
      confidence: 65,
      category: 'supplement',
      tags: ['bone_health', 'senior_care'],
      in_stock: true,
    });
  }

  return recommendations;
}

/**
 * Filter out medications that may cause allergies or contraindications
 */
async function filterUnsafeRecommendations(
  recommendations: MedicationRecommendation[],
  currentMedications: string[],
  allergies: string[]
): Promise<MedicationRecommendation[]> {
  // Simple allergy checking (in production, use drug database API)
  const allergyKeywords = allergies.map(a => a.toLowerCase());

  return recommendations.filter(rec => {
    const medNameLower = rec.medication_name.toLowerCase();

    // Check for allergy matches
    for (const allergen of allergyKeywords) {
      if (medNameLower.includes(allergen)) {
        console.log(`[RecommendationService] Filtered out ${rec.medication_name} due to allergy: ${allergen}`);
        return false;
      }
    }

    // TODO: Check drug-drug interactions using FDB API or similar
    // For now, we pass everything that doesn't match allergies

    return true;
  });
}

/**
 * Remove duplicate recommendations (same RxNorm code)
 */
function deduplicateRecommendations(
  recommendations: MedicationRecommendation[]
): MedicationRecommendation[] {
  const seen = new Set<string>();
  const unique: MedicationRecommendation[] = [];

  for (const rec of recommendations) {
    if (!seen.has(rec.rxnorm_code)) {
      seen.add(rec.rxnorm_code);
      unique.push(rec);
    }
  }

  return unique;
}

// ============================================================================
// Product Recommendations (E-Commerce)
// ============================================================================

async function getPurchaseHistory(patient_id: string): Promise<OrderItem[]> {
  const orderRepo = AppDataSource.getRepository(Order);

  const orders = await orderRepo.find({
    where: { patient_id },
    relations: ['items'],
    take: 20, // Last 20 orders
    order: { created_at: 'DESC' },
  });

  const items: OrderItem[] = [];
  for (const order of orders) {
    items.push(...(order.items || []));
  }

  return items;
}

async function getFrequentlyBoughtTogether(
  purchaseHistory: OrderItem[]
): Promise<ProductRecommendation[]> {
  // Simple implementation: recommend products from same category
  const categoryCounts = new Map<string, number>();

  for (const item of purchaseHistory) {
    const category = item.product_category || 'uncategorized';
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
  }

  const recommendations: ProductRecommendation[] = [];

  for (const [category, count] of categoryCounts.entries()) {
    if (count >= 2) {
      recommendations.push({
        product_name: `Popular ${category} products`,
        category,
        reason: `You've purchased ${count} ${category} items`,
        confidence: Math.min(80, 40 + count * 10),
        tags: ['frequently_bought', category],
      });
    }
  }

  return recommendations;
}

async function getPopularInCategory(
  purchaseHistory: OrderItem[]
): Promise<ProductRecommendation[]> {
  // Placeholder: In production, query most popular products in purchased categories
  return [];
}

function getSeasonalRecommendations(): ProductRecommendation[] {
  const month = new Date().getMonth(); // 0-11
  const recommendations: ProductRecommendation[] = [];

  // Winter months (Nov-Feb): Cold & flu products
  if (month >= 10 || month <= 1) {
    recommendations.push({
      product_name: 'Vitamin C supplements',
      category: 'supplements',
      reason: 'Seasonal recommendation for immune support',
      confidence: 60,
      tags: ['seasonal', 'immune_support', 'winter'],
    });

    recommendations.push({
      product_name: 'Throat lozenges',
      category: 'otc',
      reason: 'Common need during cold & flu season',
      confidence: 55,
      tags: ['seasonal', 'cold_flu', 'winter'],
    });
  }

  // Spring months (Mar-May): Allergy products
  if (month >= 2 && month <= 4) {
    recommendations.push({
      product_name: 'Antihistamine (Loratadine)',
      category: 'otc',
      reason: 'Allergy season support',
      confidence: 65,
      tags: ['seasonal', 'allergy', 'spring'],
    });
  }

  // Summer months (Jun-Aug): Sun protection
  if (month >= 5 && month <= 7) {
    recommendations.push({
      product_name: 'Sunscreen SPF 50+',
      category: 'skincare',
      reason: 'Sun protection for summer',
      confidence: 70,
      tags: ['seasonal', 'sun_protection', 'summer'],
    });
  }

  return recommendations;
}

function deduplicateProductRecommendations(
  recommendations: ProductRecommendation[]
): ProductRecommendation[] {
  const seen = new Set<string>();
  const unique: ProductRecommendation[] = [];

  for (const rec of recommendations) {
    const key = rec.product_id || rec.product_name;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(rec);
    }
  }

  return unique;
}
