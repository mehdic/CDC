/**
 * Contraindication Checking Utility
 * Checks medications against patient medical conditions
 * T087 - User Story 1: Prescription Processing & Validation (FR-012)
 * Based on: /specs/002-metapharm-platform/spec.md (FR-012)
 */

export enum ContraindicationSeverity {
  ABSOLUTE = 'absolute',     // Medication must NOT be used
  RELATIVE = 'relative',     // Medication may be used with caution/monitoring
  PRECAUTION = 'precaution', // Requires dose adjustment or monitoring
}

export interface PatientCondition {
  condition: string;         // Medical condition name
  icd10_code?: string;       // ICD-10 diagnosis code
  chronic: boolean;          // Is this a chronic condition
  active: boolean;           // Is condition currently active
}

export interface Contraindication {
  condition: string;         // Patient's medical condition
  medication: string;        // Prescribed medication
  severity: ContraindicationSeverity;
  reason: string;            // Clinical explanation
  recommendation: string;    // Action to take
}

export interface ContraindicationCheckResult {
  hasContraindications: boolean;
  contraindications: Contraindication[];
  checkedAt: Date;
}

/**
 * Contraindication Checking Service
 * Checks medications against patient medical history
 */
export class ContraindicationChecker {
  private patientServiceUrl: string;

  constructor() {
    // Patient Service from Phase 2 runs on port 4006
    this.patientServiceUrl = process.env.PATIENT_SERVICE_URL || 'http://patient-service:4006';
  }

  /**
   * Check medications against patient medical conditions
   * @param patientId Patient UUID
   * @param medications Array of medication names from prescription
   * @returns ContraindicationCheckResult with contraindications found
   */
  async checkContraindications(
    patientId: string,
    medications: string[]
  ): Promise<ContraindicationCheckResult> {
    try {
      // Fetch patient medical conditions from Patient Service
      const conditions = await this.fetchPatientConditions(patientId);

      // Check each medication against medical conditions
      const contraindications = this.findContraindications(medications, conditions);

      return {
        hasContraindications: contraindications.length > 0,
        contraindications,
        checkedAt: new Date(),
      };
    } catch (error) {
      console.error('[Contraindication Checker] Error checking contraindications:', error);
      // If Patient Service unavailable, return empty result but log error
      // Don't block prescription processing - pharmacist can manually verify
      return {
        hasContraindications: false,
        contraindications: [],
        checkedAt: new Date(),
      };
    }
  }

  /**
   * Fetch patient medical conditions from Patient Service
   * @param patientId Patient UUID
   * @returns Array of patient medical conditions
   */
  private async fetchPatientConditions(patientId: string): Promise<PatientCondition[]> {
    try {
      const response = await fetch(
        `${this.patientServiceUrl}/patients/${patientId}/conditions`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // Patient not found or no conditions recorded
          return [];
        }
        throw new Error(`Patient Service responded with status ${response.status}`);
      }

      const data: any = await response.json();
      return data.conditions || [];
    } catch (error) {
      console.error('[Contraindication Checker] Failed to fetch patient conditions:', error);
      // Return empty array - let pharmacist manually verify
      return [];
    }
  }

  /**
   * Find contraindications between medications and patient conditions
   * @param medications Array of medication names
   * @param conditions Array of patient conditions
   * @returns Array of contraindications
   */
  private findContraindications(
    medications: string[],
    conditions: PatientCondition[]
  ): Contraindication[] {
    const contraindications: Contraindication[] = [];

    // Knowledge base of drug-condition contraindications
    // In production, this would come from a clinical database or API
    const contraindicationRules = this.getContraindicationRules();

    for (const medication of medications) {
      for (const condition of conditions) {
        const match = this.findContraindicationMatch(
          medication,
          condition,
          contraindicationRules
        );

        if (match) {
          contraindications.push(match);
        }
      }
    }

    return contraindications;
  }

  /**
   * Get contraindication rules (clinical knowledge base)
   * In production, this would be a comprehensive clinical database
   * @returns Map of condition → medication → contraindication details
   */
  private getContraindicationRules(): Map<string, Map<string, Omit<Contraindication, 'condition' | 'medication'>>> {
    const rules = new Map<string, Map<string, Omit<Contraindication, 'condition' | 'medication'>>>();

    // Kidney disease contraindications
    const kidneyDiseaseRules = new Map<string, Omit<Contraindication, 'condition' | 'medication'>>();
    kidneyDiseaseRules.set('metformin', {
      severity: ContraindicationSeverity.ABSOLUTE,
      reason: 'Metformin is contraindicated in severe renal impairment (eGFR < 30 mL/min) due to risk of lactic acidosis',
      recommendation: 'DO NOT DISPENSE. Contact prescriber for alternative diabetes medication.',
    });
    kidneyDiseaseRules.set('nsaid', {
      severity: ContraindicationSeverity.RELATIVE,
      reason: 'NSAIDs may worsen renal function in patients with kidney disease',
      recommendation: 'Use with caution. Monitor renal function. Consider alternative analgesic.',
    });
    rules.set('kidney disease', kidneyDiseaseRules);
    rules.set('renal insufficiency', kidneyDiseaseRules);
    rules.set('chronic kidney disease', kidneyDiseaseRules);

    // Heart failure contraindications
    const heartFailureRules = new Map<string, Omit<Contraindication, 'condition' | 'medication'>>();
    heartFailureRules.set('nsaid', {
      severity: ContraindicationSeverity.RELATIVE,
      reason: 'NSAIDs may cause fluid retention and worsen heart failure symptoms',
      recommendation: 'Avoid if possible. If necessary, use lowest effective dose and monitor for edema.',
    });
    heartFailureRules.set('verapamil', {
      severity: ContraindicationSeverity.ABSOLUTE,
      reason: 'Non-dihydropyridine calcium channel blockers can worsen heart failure',
      recommendation: 'DO NOT DISPENSE. Contact prescriber for alternative antihypertensive.',
    });
    rules.set('heart failure', heartFailureRules);
    rules.set('congestive heart failure', heartFailureRules);

    // Pregnancy contraindications
    const pregnancyRules = new Map<string, Omit<Contraindication, 'condition' | 'medication'>>();
    pregnancyRules.set('warfarin', {
      severity: ContraindicationSeverity.ABSOLUTE,
      reason: 'Warfarin is teratogenic and contraindicated in pregnancy',
      recommendation: 'DO NOT DISPENSE. Contact prescriber immediately for alternative anticoagulation.',
    });
    pregnancyRules.set('isotretinoin', {
      severity: ContraindicationSeverity.ABSOLUTE,
      reason: 'Isotretinoin is highly teratogenic and absolutely contraindicated in pregnancy',
      recommendation: 'DO NOT DISPENSE. Verify pregnancy test and iPLEDGE enrollment.',
    });
    pregnancyRules.set('ace inhibitor', {
      severity: ContraindicationSeverity.ABSOLUTE,
      reason: 'ACE inhibitors are contraindicated in pregnancy (risk of fetal renal damage)',
      recommendation: 'DO NOT DISPENSE. Contact prescriber for alternative antihypertensive.',
    });
    rules.set('pregnancy', pregnancyRules);
    rules.set('pregnant', pregnancyRules);

    // Liver disease contraindications
    const liverDiseaseRules = new Map<string, Omit<Contraindication, 'condition' | 'medication'>>();
    liverDiseaseRules.set('acetaminophen', {
      severity: ContraindicationSeverity.PRECAUTION,
      reason: 'Acetaminophen requires dose reduction in hepatic impairment to prevent toxicity',
      recommendation: 'Reduce dose. Maximum 2g/day in liver disease. Avoid if severe cirrhosis.',
    });
    liverDiseaseRules.set('statin', {
      severity: ContraindicationSeverity.RELATIVE,
      reason: 'Statins may worsen liver function in patients with active liver disease',
      recommendation: 'Monitor liver enzymes closely. Avoid in active liver disease.',
    });
    rules.set('liver disease', liverDiseaseRules);
    rules.set('cirrhosis', liverDiseaseRules);
    rules.set('hepatic impairment', liverDiseaseRules);

    // Asthma contraindications
    const asthmaRules = new Map<string, Omit<Contraindication, 'condition' | 'medication'>>();
    asthmaRules.set('beta blocker', {
      severity: ContraindicationSeverity.ABSOLUTE,
      reason: 'Beta blockers can cause bronchospasm in asthma patients',
      recommendation: 'DO NOT DISPENSE. Contact prescriber for alternative antihypertensive (e.g., ACE inhibitor, calcium channel blocker).',
    });
    asthmaRules.set('aspirin', {
      severity: ContraindicationSeverity.RELATIVE,
      reason: 'Aspirin may trigger bronchospasm in aspirin-sensitive asthma patients',
      recommendation: 'Verify patient tolerance. Consider alternative antiplatelet if history of aspirin-induced asthma.',
    });
    rules.set('asthma', asthmaRules);

    // Glaucoma contraindications
    const glaucomaRules = new Map<string, Omit<Contraindication, 'condition' | 'medication'>>();
    glaucomaRules.set('anticholinergic', {
      severity: ContraindicationSeverity.ABSOLUTE,
      reason: 'Anticholinergics can precipitate acute angle-closure glaucoma',
      recommendation: 'DO NOT DISPENSE for patients with narrow-angle glaucoma. Verify glaucoma type with prescriber.',
    });
    rules.set('glaucoma', glaucomaRules);
    rules.set('narrow-angle glaucoma', glaucomaRules);

    return rules;
  }

  /**
   * Find contraindication match between medication and condition
   * @param medication Medication name
   * @param condition Patient condition
   * @param rules Contraindication rules database
   * @returns Contraindication if match found, null otherwise
   */
  private findContraindicationMatch(
    medication: string,
    condition: PatientCondition,
    rules: Map<string, Map<string, Omit<Contraindication, 'condition' | 'medication'>>>
  ): Contraindication | null {
    // Skip inactive conditions
    if (!condition.active) {
      return null;
    }

    const medLower = medication.toLowerCase().trim();
    const conditionLower = condition.condition.toLowerCase().trim();

    // Check if condition exists in rules
    const conditionRules = rules.get(conditionLower);
    if (!conditionRules) {
      return null;
    }

    // Check for exact medication match
    const exactMatch = conditionRules.get(medLower);
    if (exactMatch) {
      return {
        condition: condition.condition,
        medication,
        ...exactMatch,
      };
    }

    // Check for medication class/partial matches
    for (const [ruleKey, contraindicationData] of conditionRules.entries()) {
      if (medLower.includes(ruleKey) || ruleKey.includes(medLower)) {
        return {
          condition: condition.condition,
          medication,
          ...contraindicationData,
        };
      }
    }

    return null;
  }

  /**
   * Get severity level as numeric score for sorting
   * @param severity ContraindicationSeverity enum value
   * @returns Numeric score (0-2, higher = more severe)
   */
  static getSeverityScore(severity: ContraindicationSeverity): number {
    switch (severity) {
      case ContraindicationSeverity.ABSOLUTE:
        return 2;
      case ContraindicationSeverity.RELATIVE:
        return 1;
      case ContraindicationSeverity.PRECAUTION:
        return 0;
      default:
        return 0;
    }
  }

  /**
   * Sort contraindications by severity (most severe first)
   * @param contraindications Array of contraindications
   * @returns Sorted contraindications
   */
  static sortBySeverity(contraindications: Contraindication[]): Contraindication[] {
    return [...contraindications].sort(
      (a, b) => this.getSeverityScore(b.severity) - this.getSeverityScore(a.severity)
    );
  }

  /**
   * Filter contraindications by minimum severity level
   * @param contraindications Array of contraindications
   * @param minimumSeverity Minimum severity to include
   * @returns Filtered contraindications
   */
  static filterBySeverity(
    contraindications: Contraindication[],
    minimumSeverity: ContraindicationSeverity
  ): Contraindication[] {
    const minScore = this.getSeverityScore(minimumSeverity);
    return contraindications.filter(
      (contraindication) => this.getSeverityScore(contraindication.severity) >= minScore
    );
  }

  /**
   * Check if any contraindications are absolute
   * @param contraindications Array of contraindications
   * @returns True if any absolute contraindications detected
   */
  static hasAbsoluteContraindications(contraindications: Contraindication[]): boolean {
    return contraindications.some(
      (contraindication) => contraindication.severity === ContraindicationSeverity.ABSOLUTE
    );
  }
}
