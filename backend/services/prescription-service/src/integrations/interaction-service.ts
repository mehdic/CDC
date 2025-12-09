/**
 * Drug Interaction Service
 * High-level service for checking drug interactions with patient context
 * Supports allergy cross-reference, severity filtering, and interaction matrix
 * T3-006: Interaction service with patient allergy cross-reference
 */

import { FDBService, DrugInteraction, DrugInteractionResult, DrugInteractionSeverity } from './fdb';
import { CacheProvider, CacheFactory } from './cache';

export interface PatientAllergy {
  substance: string; // Allergen name (drug, ingredient, class)
  type: 'drug' | 'ingredient' | 'class'; // Type of allergy
  severity: 'mild' | 'moderate' | 'severe' | 'anaphylaxis';
  reaction?: string; // Description of allergic reaction
  dateRecorded: Date;
}

export interface PatientContext {
  patientId: string;
  allergies: PatientAllergy[];
  currentMedications?: string[]; // Existing medications for comprehensive check
}

export interface InteractionCheckResult extends DrugInteractionResult {
  allergyWarnings: AllergyWarning[];
  patientId?: string;
}

export interface AllergyWarning {
  medication: string;
  allergen: string;
  allergyType: 'drug' | 'ingredient' | 'class';
  allergySeverity: 'mild' | 'moderate' | 'severe' | 'anaphylaxis';
  recommendation: string;
}

export interface InteractionMatrix {
  medications: string[];
  matrix: InteractionMatrixCell[][];
  timestamp: Date;
}

export interface InteractionMatrixCell {
  drug1: string;
  drug2: string;
  severity: DrugInteractionSeverity | null;
  description?: string;
}

/**
 * Drug Interaction Service
 * Provides high-level drug interaction checking with patient context
 */
export class DrugInteractionService {
  private fdbService: FDBService;
  private cache: CacheProvider;
  private cacheEnabled: boolean;
  private cacheTTL: number;

  constructor(fdbService?: FDBService, cacheProvider?: CacheProvider) {
    this.fdbService = fdbService || new FDBService(cacheProvider);
    this.cache = cacheProvider || CacheFactory.createCache();
    this.cacheEnabled = process.env.DRUG_INTERACTION_CACHE_ENABLED !== 'false';
    // T8-001: Extended cache TTL to 24 hours (86400 seconds) as per requirements
    this.cacheTTL = parseInt(process.env.DRUG_INTERACTION_CACHE_TTL || '86400'); // 24 hours default

    if (this.cacheEnabled) {
      console.info(`[Interaction Service] Cache enabled with TTL: ${this.cacheTTL}s`);
    } else {
      console.info('[Interaction Service] Cache disabled');
    }
  }

  /**
   * Check drug interactions with patient allergy cross-reference
   * Comprehensive check including allergies and current medications
   * @param medications Medications to check
   * @param patientContext Patient allergies and current medications
   * @returns Interaction check result with allergy warnings
   */
  async checkWithPatientContext(
    medications: string[],
    patientContext: PatientContext
  ): Promise<InteractionCheckResult> {
    // Check for allergies first
    const allergyWarnings = this.checkAllergies(medications, patientContext.allergies);

    // Combine new medications with current medications for comprehensive check
    const allMedications = [
      ...medications,
      ...(patientContext.currentMedications || []),
    ];

    // Check drug interactions
    const interactionResult = await this.checkInteractions(allMedications);

    return {
      ...interactionResult,
      allergyWarnings,
      patientId: patientContext.patientId,
    };
  }

  /**
   * Check drug interactions with caching
   * @param medications Array of medication names
   * @returns Drug interaction result
   */
  async checkInteractions(medications: string[]): Promise<DrugInteractionResult> {
    // Generate cache key
    const cacheKey = this.generateCacheKey(medications);

    // Try cache first
    if (this.cacheEnabled) {
      const cached = await this.cache.get<DrugInteractionResult>(cacheKey);
      if (cached) {
        console.log(`[Interaction Service] Cache hit for: ${cacheKey}`);
        return cached;
      }
    }

    // Call FDB service
    const result = await this.fdbService.checkDrugInteractions(medications);

    // Cache result
    if (this.cacheEnabled) {
      await this.cache.set(cacheKey, result, this.cacheTTL);
      console.log(`[Interaction Service] Cached result for: ${cacheKey}`);
    }

    return result;
  }

  /**
   * Check patient allergies against medication list
   * @param medications Medications to check
   * @param allergies Patient allergies
   * @returns Array of allergy warnings
   */
  private checkAllergies(
    medications: string[],
    allergies: PatientAllergy[]
  ): AllergyWarning[] {
    const warnings: AllergyWarning[] = [];

    for (const medication of medications) {
      for (const allergy of allergies) {
        // Check for direct drug match
        if (
          allergy.type === 'drug' &&
          this.normalizeString(medication) === this.normalizeString(allergy.substance)
        ) {
          warnings.push({
            medication,
            allergen: allergy.substance,
            allergyType: 'drug',
            allergySeverity: allergy.severity,
            recommendation: this.getAllergyRecommendation(allergy.severity, 'drug'),
          });
        }

        // Check for drug class match (e.g., penicillin allergy)
        if (allergy.type === 'class') {
          if (this.isDrugInClass(medication, allergy.substance)) {
            warnings.push({
              medication,
              allergen: allergy.substance,
              allergyType: 'class',
              allergySeverity: allergy.severity,
              recommendation: this.getAllergyRecommendation(allergy.severity, 'class'),
            });
          }
        }
      }
    }

    return warnings;
  }

  /**
   * Check if drug belongs to an allergic drug class
   * Simplified implementation - in production would use drug database
   * @param medication Medication name
   * @param drugClass Drug class name
   * @returns True if medication is in the drug class
   */
  private isDrugInClass(medication: string, drugClass: string): boolean {
    const medLower = this.normalizeString(medication);
    const classLower = this.normalizeString(drugClass);

    // Common drug class patterns
    const classPatterns: Record<string, string[]> = {
      penicillin: ['amoxicillin', 'ampicillin', 'penicillin'],
      cephalosporin: ['cephalexin', 'cefazolin', 'ceftriaxone'],
      sulfa: ['sulfamethoxazole', 'trimethoprim'],
      nsaid: ['ibuprofen', 'naproxen', 'aspirin', 'diclofenac'],
      statin: ['atorvastatin', 'simvastatin', 'rosuvastatin'],
      'beta blocker': ['metoprolol', 'atenolol', 'propranolol'],
      'ace inhibitor': ['lisinopril', 'enalapril', 'ramipril'],
    };

    const drugsInClass = classPatterns[classLower];
    if (!drugsInClass) {
      return false;
    }

    return drugsInClass.some(drug => medLower.includes(drug));
  }

  /**
   * Get recommendation text for allergy warning
   * @param severity Allergy severity
   * @param type Allergy type
   * @returns Recommendation text
   */
  private getAllergyRecommendation(
    severity: 'mild' | 'moderate' | 'severe' | 'anaphylaxis',
    type: 'drug' | 'ingredient' | 'class'
  ): string {
    if (severity === 'anaphylaxis') {
      return 'CONTRAINDICATED: Patient has history of anaphylaxis. DO NOT prescribe. Select alternative medication.';
    }

    if (severity === 'severe') {
      return 'SEVERE ALLERGY: Avoid this medication. Consult with patient and consider alternative therapy.';
    }

    if (severity === 'moderate') {
      if (type === 'class') {
        return 'MODERATE ALLERGY: Cross-reactivity possible. Consider alternative medication class or proceed with caution under supervision.';
      }
      return 'MODERATE ALLERGY: Avoid if possible. If medically necessary, consider premedication and close monitoring.';
    }

    // Mild
    return 'MILD ALLERGY: Document patient allergy. Monitor for adverse reactions. Consider alternatives if available.';
  }

  /**
   * Generate interaction matrix for multiple medications
   * Creates a NxN matrix showing all pairwise interactions
   * @param medications Array of medication names
   * @returns Interaction matrix
   */
  async generateInteractionMatrix(medications: string[]): Promise<InteractionMatrix> {
    const matrix: InteractionMatrixCell[][] = [];

    // Check interactions for all pairs
    const interactions = await this.checkInteractions(medications);
    const interactionMap = new Map<string, DrugInteraction>();

    // Build interaction lookup map
    for (const interaction of interactions.interactions) {
      const key1 = `${this.normalizeString(interaction.drug1)}-${this.normalizeString(interaction.drug2)}`;
      const key2 = `${this.normalizeString(interaction.drug2)}-${this.normalizeString(interaction.drug1)}`;
      interactionMap.set(key1, interaction);
      interactionMap.set(key2, interaction);
    }

    // Build matrix
    for (let i = 0; i < medications.length; i++) {
      const row: InteractionMatrixCell[] = [];

      for (let j = 0; j < medications.length; j++) {
        if (i === j) {
          // Diagonal - same drug
          row.push({
            drug1: medications[i],
            drug2: medications[j],
            severity: null,
          });
        } else {
          // Check for interaction
          const key = `${this.normalizeString(medications[i])}-${this.normalizeString(medications[j])}`;
          const interaction = interactionMap.get(key);

          row.push({
            drug1: medications[i],
            drug2: medications[j],
            severity: interaction?.severity || null,
            description: interaction?.description,
          });
        }
      }

      matrix.push(row);
    }

    return {
      medications,
      matrix,
      timestamp: new Date(),
    };
  }

  /**
   * Filter interactions by minimum severity
   * @param interactions Array of drug interactions
   * @param minimumSeverity Minimum severity to include
   * @returns Filtered interactions
   */
  filterBySeverity(
    interactions: DrugInteraction[],
    minimumSeverity: DrugInteractionSeverity
  ): DrugInteraction[] {
    return FDBService.filterBySeverity(interactions, minimumSeverity);
  }

  /**
   * Sort interactions by severity (most severe first)
   * @param interactions Array of drug interactions
   * @returns Sorted interactions
   */
  sortBySeverity(interactions: DrugInteraction[]): DrugInteraction[] {
    return FDBService.sortBySeverity(interactions);
  }

  /**
   * Get severity level as numeric score
   * @param severity DrugInteractionSeverity enum value
   * @returns Numeric score (0-3, higher = more severe)
   */
  getSeverityScore(severity: DrugInteractionSeverity): number {
    return FDBService.getSeverityScore(severity);
  }

  /**
   * Generate cache key from medications
   * @param medications Array of medication names
   * @returns Cache key string
   */
  private generateCacheKey(medications: string[]): string {
    // Sort medications to ensure consistent cache keys
    const sorted = medications
      .map(med => this.normalizeString(med))
      .sort()
      .join('|');

    return `drug-interactions:${sorted}`;
  }

  /**
   * Normalize string for comparison
   * @param str String to normalize
   * @returns Normalized string
   */
  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '');
  }

  /**
   * Clear cache (for testing or maintenance)
   */
  async clearCache(): Promise<void> {
    await this.cache.clear();
    console.info('[Interaction Service] Cache cleared');
  }
}
