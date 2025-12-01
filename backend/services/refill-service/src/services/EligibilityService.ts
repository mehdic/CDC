/**
 * Eligibility Service
 * Determines if a prescription is eligible for refill based on business rules
 * Task: T2-102
 */

import { EligibilityCheckRequest, EligibilityCheckResult, PrescriptionData, RefillRuleConfiguration } from '../types/refill.types';

// Default refill rules (can be overridden per pharmacy/region)
const DEFAULT_RULES: RefillRuleConfiguration = {
  maxRefillsDefault: 11,
  minDaysBetweenRefills: 7,
  refillRequestValidityDays: 30,
  controlledSubstanceRules: {
    maxRefills: 5,
    minDaysBetweenRefills: 30,
    requiresManualApproval: true,
  },
  autoApproveCategories: [
    'chronic_condition',
    'maintenance_medication',
    'non_controlled',
  ],
  manualApproveCategories: [
    'controlled_substance',
    'high_risk_medication',
    'antibiotic',
  ],
};

export class EligibilityService {
  private rules: RefillRuleConfiguration;

  constructor(rules?: Partial<RefillRuleConfiguration>) {
    this.rules = {
      ...DEFAULT_RULES,
      ...rules,
    };
  }

  /**
   * Check if a prescription is eligible for refill
   * Task: T2-102
   */
  async checkEligibility(
    prescription: PrescriptionData,
    currentDate: Date = new Date()
  ): Promise<EligibilityCheckResult> {
    const errors: string[] = [];
    let remainingRefills = 0;
    let daysUntilNextRefill = 0;
    let controlledSubstance = false;
    let requiresManualApproval = false;

    // Check 1: Prescription exists and is active
    if (!prescription) {
      errors.push('Prescription not found');
      return this.createFailureResult(errors, 0, 0, false, false);
    }

    // Check 2: Prescription has not expired
    const prescriptionExpiredDate = new Date(prescription.expiresAt);
    if (currentDate > prescriptionExpiredDate) {
      errors.push(
        `Prescription expired on ${prescriptionExpiredDate.toISOString()}`
      );
      return this.createFailureResult(errors, 0, 0, false, false);
    }

    // Check 3: Remaining refills available
    remainingRefills =
      prescription.refillsAllowed - (prescription.refillsUsed || 0);
    if (remainingRefills <= 0) {
      errors.push('No refills remaining for this prescription');
      return this.createFailureResult(errors, 0, 0, controlledSubstance, false);
    }

    // Check 4: Minimum days between refills
    const minDaysBetweenRefills = this.getMinDaysBetweenRefills(prescription);
    if (prescription.lastRefillDate) {
      const daysSinceLastRefill = Math.floor(
        (currentDate.getTime() - new Date(prescription.lastRefillDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      daysUntilNextRefill = Math.max(0, minDaysBetweenRefills - daysSinceLastRefill);

      if (daysSinceLastRefill < minDaysBetweenRefills) {
        errors.push(
          `Prescription can be refilled in ${daysUntilNextRefill} days`
        );
        return this.createFailureResult(
          errors,
          remainingRefills,
          daysUntilNextRefill,
          controlledSubstance,
          requiresManualApproval
        );
      }
    }

    // Check 5: Determine if controlled substance
    controlledSubstance = this.isControlledSubstance(prescription);

    // Check 6: Determine if manual approval is required
    requiresManualApproval = this.requiresManualApproval(prescription);

    return {
      isEligible: true,
      remainingRefills,
      daysUntilNextRefill: 0,
      controlledSubstance,
      requiresManualApproval,
      checkReason: 'Prescription is eligible for refill',
    };
  }

  /**
   * Get minimum days between refills for a prescription
   * Controlled substances have stricter requirements
   */
  private getMinDaysBetweenRefills(prescription: PrescriptionData): number {
    if (this.isControlledSubstance(prescription)) {
      return this.rules.controlledSubstanceRules.minDaysBetweenRefills;
    }
    return this.rules.minDaysBetweenRefills;
  }

  /**
   * Check if prescription contains controlled substances
   */
  private isControlledSubstance(prescription: PrescriptionData): boolean {
    if (!prescription.medications) {
      return false;
    }

    return prescription.medications.some((med) => med.isControlledSubstance === true);
  }

  /**
   * Determine if prescription requires manual approval
   * based on medication categories or pharmacy rules
   */
  private requiresManualApproval(prescription: PrescriptionData): boolean {
    // Controlled substances always require manual approval
    if (this.isControlledSubstance(prescription)) {
      return true;
    }

    // Check if medication is in manual approval categories
    if (!prescription.medications) {
      return false;
    }

    // For now, we'll use a simple check - in production,
    // this would integrate with a drug database
    return prescription.medications.some((med) => {
      const drugName = med.drugName.toLowerCase();

      // Antibiotics require manual review
      // Check for common antibiotic suffixes and names
      if (this.isAntibiotic(drugName)) {
        return true;
      }

      // High-risk medications
      if (this.isHighRiskMedication(drugName)) {
        return true;
      }

      return false;
    });
  }

  /**
   * Check if medication is an antibiotic
   */
  private isAntibiotic(drugName: string): boolean {
    const antibioticPatterns = [
      'antibiotic',
      'cillin',  // Penicillin, Amoxicillin, etc.
      'mycin',   // Erythromycin, Azithromycin, etc.
      'tetracycline',
      'cephalosporin',
      'fluoroquinolone',
      'sulfonamide',
    ];

    return antibioticPatterns.some((pattern) => drugName.includes(pattern));
  }

  /**
   * Check if medication is considered high-risk
   */
  private isHighRiskMedication(drugName: string): boolean {
    const highRiskPatterns = [
      'warfarin',
      'methotrexate',
      'lithium',
      'digoxin',
      'theophylline',
      'insulin',
    ];

    const lowerDrugName = drugName.toLowerCase();
    return highRiskPatterns.some((pattern) =>
      lowerDrugName.includes(pattern)
    );
  }

  /**
   * Helper method to create failure result
   */
  private createFailureResult(
    errors: string[],
    remainingRefills: number,
    daysUntilNextRefill: number,
    controlledSubstance: boolean,
    requiresManualApproval: boolean
  ): EligibilityCheckResult {
    return {
      isEligible: false,
      remainingRefills,
      daysUntilNextRefill,
      controlledSubstance,
      requiresManualApproval,
      errors,
    };
  }

  /**
   * Update rules dynamically
   */
  updateRules(newRules: Partial<RefillRuleConfiguration>): void {
    this.rules = {
      ...this.rules,
      ...newRules,
    };
  }

  /**
   * Get current rules configuration
   */
  getRules(): RefillRuleConfiguration {
    return { ...this.rules };
  }
}
