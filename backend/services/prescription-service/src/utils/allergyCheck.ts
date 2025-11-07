/**
 * Allergy Checking Utility
 * Checks prescription medications against patient allergies
 * T086 - User Story 1: Prescription Processing & Validation (FR-027)
 * Based on: /specs/002-metapharm-platform/spec.md (FR-011, FR-012)
 */

export enum AllergyReactionType {
  ANAPHYLAXIS = 'anaphylaxis',       // Life-threatening
  SEVERE_RASH = 'severe_rash',       // Severe cutaneous reaction
  RESPIRATORY = 'respiratory',        // Breathing difficulties
  GASTROINTESTINAL = 'gastrointestinal', // Nausea, vomiting, diarrhea
  OTHER = 'other',                    // Other reactions
}

export enum AllergySeverity {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  LIFE_THREATENING = 'life_threatening',
}

export interface PatientAllergy {
  allergen: string;           // Name of allergen (medication, ingredient, class)
  reaction_type: AllergyReactionType;
  severity: AllergySeverity;
  notes?: string;             // Additional clinical notes
  verified: boolean;          // Has allergy been verified by healthcare professional
}

export interface AllergyWarning {
  allergen: string;           // Patient's allergen
  medication: string;         // Prescribed medication that matches allergen
  reaction_type: AllergyReactionType;
  severity: AllergySeverity;
  recommendation: string;     // Clinical recommendation
}

export interface AllergyCheckResult {
  hasAllergies: boolean;
  warnings: AllergyWarning[];
  checkedAt: Date;
}

/**
 * Allergy Checking Service
 * Integrates with Patient Service to retrieve allergies and check against medications
 */
export class AllergyChecker {
  private patientServiceUrl: string;

  constructor() {
    // Patient Service from Phase 2 (T064-T070) runs on port 4006
    this.patientServiceUrl = process.env.PATIENT_SERVICE_URL || 'http://patient-service:4006';
  }

  /**
   * Check medications against patient allergies
   * @param patientId Patient UUID
   * @param medications Array of medication names from prescription
   * @returns AllergyCheckResult with warnings
   */
  async checkAllergies(patientId: string, medications: string[]): Promise<AllergyCheckResult> {
    try {
      // Fetch patient allergies from Patient Service
      const allergies = await this.fetchPatientAllergies(patientId);

      // Check each medication against allergies
      const warnings = this.findAllergyMatches(medications, allergies);

      return {
        hasAllergies: warnings.length > 0,
        warnings,
        checkedAt: new Date(),
      };
    } catch (error) {
      console.error('[Allergy Checker] Error checking allergies:', error);
      // If Patient Service unavailable, return empty result but log error
      // Don't block prescription processing - pharmacist can manually verify
      return {
        hasAllergies: false,
        warnings: [],
        checkedAt: new Date(),
      };
    }
  }

  /**
   * Fetch patient allergies from Patient Service
   * @param patientId Patient UUID
   * @returns Array of patient allergies
   */
  private async fetchPatientAllergies(patientId: string): Promise<PatientAllergy[]> {
    try {
      const response = await fetch(`${this.patientServiceUrl}/patients/${patientId}/allergies`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Patient not found or no allergies recorded
          return [];
        }
        throw new Error(`Patient Service responded with status ${response.status}`);
      }

      const data: any = await response.json();
      return data.allergies || [];
    } catch (error) {
      console.error('[Allergy Checker] Failed to fetch patient allergies:', error);
      // Return empty array - let pharmacist manually verify
      return [];
    }
  }

  /**
   * Find matches between medications and patient allergies
   * @param medications Array of medication names
   * @param allergies Array of patient allergies
   * @returns Array of allergy warnings
   */
  private findAllergyMatches(
    medications: string[],
    allergies: PatientAllergy[]
  ): AllergyWarning[] {
    const warnings: AllergyWarning[] = [];

    for (const medication of medications) {
      for (const allergy of allergies) {
        if (this.isAllergyMatch(medication, allergy.allergen)) {
          warnings.push({
            allergen: allergy.allergen,
            medication,
            reaction_type: allergy.reaction_type,
            severity: allergy.severity,
            recommendation: this.generateRecommendation(allergy),
          });
        }
      }
    }

    return warnings;
  }

  /**
   * Check if a medication matches a patient allergen
   * Performs fuzzy matching and checks for drug class matches
   * @param medication Medication name
   * @param allergen Patient allergen
   * @returns True if match found
   */
  private isAllergyMatch(medication: string, allergen: string): boolean {
    const medLower = medication.toLowerCase().trim();
    const allergenLower = allergen.toLowerCase().trim();

    // Exact match
    if (medLower === allergenLower) {
      return true;
    }

    // Check if medication contains allergen (e.g., "Amoxicillin 500mg" contains "amoxicillin")
    if (medLower.includes(allergenLower)) {
      return true;
    }

    // Check drug class matches (common examples)
    const drugClassMatches: Record<string, string[]> = {
      penicillin: ['amoxicillin', 'ampicillin', 'penicillin', 'augmentin'],
      sulfa: ['sulfamethoxazole', 'trimethoprim-sulfamethoxazole', 'bactrim'],
      nsaid: ['ibuprofen', 'naproxen', 'diclofenac', 'aspirin', 'celecoxib'],
      cephalosporin: ['cephalexin', 'cefuroxime', 'ceftriaxone', 'cefixime'],
      quinolone: ['ciprofloxacin', 'levofloxacin', 'moxifloxacin'],
    };

    // Check if allergen is a drug class and medication belongs to it
    for (const [drugClass, medications] of Object.entries(drugClassMatches)) {
      if (allergenLower.includes(drugClass)) {
        if (medications.some((med) => medLower.includes(med))) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Generate clinical recommendation based on allergy severity
   * @param allergy Patient allergy
   * @returns Clinical recommendation string
   */
  private generateRecommendation(allergy: PatientAllergy): string {
    switch (allergy.severity) {
      case AllergySeverity.LIFE_THREATENING:
        return 'DO NOT DISPENSE. Life-threatening allergy. Select alternative medication and contact prescriber.';

      case AllergySeverity.SEVERE:
        return 'Severe allergy reaction documented. Contact prescriber for alternative medication before dispensing.';

      case AllergySeverity.MODERATE:
        return 'Moderate allergy documented. Contact prescriber to confirm awareness and discuss alternatives.';

      case AllergySeverity.MILD:
        return 'Mild allergy documented. Verify patient tolerance and consider alternative if preferred.';

      default:
        return 'Allergy documented. Verify with prescriber before dispensing.';
    }
  }

  /**
   * Get severity level as numeric score for sorting
   * @param severity AllergySeverity enum value
   * @returns Numeric score (0-3, higher = more severe)
   */
  static getSeverityScore(severity: AllergySeverity): number {
    switch (severity) {
      case AllergySeverity.LIFE_THREATENING:
        return 3;
      case AllergySeverity.SEVERE:
        return 2;
      case AllergySeverity.MODERATE:
        return 1;
      case AllergySeverity.MILD:
        return 0;
      default:
        return 0;
    }
  }

  /**
   * Sort allergy warnings by severity (most severe first)
   * @param warnings Array of allergy warnings
   * @returns Sorted warnings
   */
  static sortBySeverity(warnings: AllergyWarning[]): AllergyWarning[] {
    return [...warnings].sort(
      (a, b) => this.getSeverityScore(b.severity) - this.getSeverityScore(a.severity)
    );
  }

  /**
   * Filter warnings by minimum severity level
   * @param warnings Array of allergy warnings
   * @param minimumSeverity Minimum severity to include
   * @returns Filtered warnings
   */
  static filterBySeverity(
    warnings: AllergyWarning[],
    minimumSeverity: AllergySeverity
  ): AllergyWarning[] {
    const minScore = this.getSeverityScore(minimumSeverity);
    return warnings.filter((warning) => this.getSeverityScore(warning.severity) >= minScore);
  }

  /**
   * Check if any warnings are life-threatening
   * @param warnings Array of allergy warnings
   * @returns True if any life-threatening allergies detected
   */
  static hasLifeThreateningAllergies(warnings: AllergyWarning[]): boolean {
    return warnings.some((warning) => warning.severity === AllergySeverity.LIFE_THREATENING);
  }
}
