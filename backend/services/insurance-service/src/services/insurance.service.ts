/**
 * InsuranceService
 * Core business logic for insurance operations
 */

import { InsuranceProvider } from '../entities/InsuranceProvider';
import { PatientInsurance } from '../entities/PatientInsurance';
import { InsuranceClaim } from '../entities/InsuranceClaim';
import {
  CoverageVerificationResponse,
  SwissInsuranceConfig,
  InsuranceStatistics,
} from '../types/insurance.types';

export class InsuranceService {
  // ============================================================================
  // Insurance Provider Management
  // ============================================================================

  /**
   * Initialize default Swiss insurance providers
   */
  static getDefaultProviders(): any[] {
    return [
      {
        id: 'provider-css',
        code: 'CSS',
        name: 'CSS Versicherung',
        country: 'CH',
        insuranceType: 'LAMal',
        coverageTypes: ['basic', 'complementary', 'dental'],
        contactEmail: 'claims@css.ch',
        contactPhone: '+41 44 408 21 11',
        website: 'https://www.css.ch',
        isActive: true,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'provider-helsana',
        code: 'HELSANA',
        name: 'Helsana Krankenversicherung',
        country: 'CH',
        insuranceType: 'LAMal',
        coverageTypes: ['basic', 'complementary'],
        contactEmail: 'claims@helsana.ch',
        contactPhone: '+41 844 835 835',
        website: 'https://www.helsana.ch',
        isActive: true,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'provider-swica',
        code: 'SWICA',
        name: 'SWICA Krankenversicherung',
        country: 'CH',
        insuranceType: 'LAMal',
        coverageTypes: ['basic', 'complementary', 'accident'],
        contactEmail: 'claims@swica.ch',
        contactPhone: '+41 44 466 80 80',
        website: 'https://www.swica.ch',
        isActive: true,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'provider-axa',
        code: 'AXA',
        name: 'AXA Versicherungen',
        country: 'CH',
        insuranceType: 'LAMal',
        coverageTypes: ['basic', 'complementary'],
        contactEmail: 'claims@axa.ch',
        contactPhone: '+41 44 456 86 86',
        website: 'https://www.axa.ch',
        isActive: true,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  /**
   * Get Swiss insurance configuration
   */
  static getSwissConfig(): SwissInsuranceConfig {
    return {
      defaultQuotePartPercentage: 10,
      minFranchise: 300,
      maxFranchise: 2500,
      insuranceProviders: this.getDefaultProviders(),
    };
  }

  // ============================================================================
  // Coverage Verification
  // ============================================================================

  /**
   * Verify patient coverage eligibility
   */
  static verifyCoverage(
    patientInsurance: PatientInsurance,
    amount: number
  ): CoverageVerificationResponse {
    // Calculate franchise and quote-part
    const franchiseLevel = patientInsurance.franchiseLevel;
    const currentFranchiseSpent = Number(patientInsurance.currentFranchiseSpent) || 0;
    const remainingFranchise = Math.max(0, franchiseLevel - currentFranchiseSpent);

    // Determine if patient is still in franchise period
    const franchiseDeduction = Math.min(amount, remainingFranchise);
    const amountAfterFranchise = amount - franchiseDeduction;

    // Calculate quote-part (patient co-pay, typically 10% after franchise)
    const quotePartPercentage = patientInsurance.quotePartPercentage || 10;
    const quotePartAmount = (amountAfterFranchise * quotePartPercentage) / 100;

    // Calculate reimbursable amount
    const reimbursableAmount = amountAfterFranchise - quotePartAmount;

    const isEligible = franchiseDeduction + quotePartAmount + reimbursableAmount === amount;

    return {
      isEligible,
      patientId: patientInsurance.patientId,
      insuranceProviderId: patientInsurance.insuranceProviderId,
      franchiseLevel: franchiseLevel as any,
      currentFranchiseSpent: currentFranchiseSpent,
      remainingFranchise: remainingFranchise,
      quotePartPercentage: quotePartPercentage,
      estimatedReimbursement: reimbursableAmount,
      message: isEligible
        ? `Eligible for coverage. Franchise: CHF${franchiseDeduction.toFixed(2)}, Quote-part: CHF${quotePartAmount.toFixed(2)}, Reimbursement: CHF${reimbursableAmount.toFixed(2)}`
        : 'Not eligible for coverage',
    };
  }

  // ============================================================================
  // Claim Calculation
  // ============================================================================

  /**
   * Calculate claim amounts (franchise, quote-part, reimbursable)
   */
  static calculateClaimAmounts(
    amount: number,
    patientInsurance: PatientInsurance
  ): { franchiseDeduction: number; quotePartAmount: number; reimbursableAmount: number } {
    const currentFranchiseSpent = Number(patientInsurance.currentFranchiseSpent) || 0;
    const franchiseLevel = patientInsurance.franchiseLevel;
    const remainingFranchise = Math.max(0, franchiseLevel - currentFranchiseSpent);

    // Franchise deduction
    const franchiseDeduction = Math.min(amount, remainingFranchise);

    // Amount remaining after franchise
    const amountAfterFranchise = amount - franchiseDeduction;

    // Quote-part calculation (typically 10%)
    const quotePartPercentage = patientInsurance.quotePartPercentage || 10;
    const quotePartAmount = (amountAfterFranchise * quotePartPercentage) / 100;

    // Reimbursable amount (insurance pays this)
    const reimbursableAmount = amountAfterFranchise - quotePartAmount;

    return {
      franchiseDeduction,
      quotePartAmount,
      reimbursableAmount,
    };
  }

  // ============================================================================
  // Claim Status Management
  // ============================================================================

  /**
   * Get claim status message based on status type
   */
  static getClaimStatusMessage(status: string): string {
    const messages: Record<string, string> = {
      draft: 'Claim is being prepared',
      submitted: 'Claim has been submitted to insurance',
      processing: 'Insurance company is reviewing the claim',
      approved: 'Claim has been approved for reimbursement',
      rejected: 'Claim has been rejected',
      paid: 'Reimbursement has been paid',
    };

    return messages[status] || 'Unknown status';
  }

  /**
   * Calculate average claim processing time (mock implementation)
   */
  static getAverageProcessingTime(): number {
    // In production, this would be calculated from historical data
    // Returns average processing time in days
    return 7; // Average 7 days for Swiss insurance claims
  }

  // ============================================================================
  // Third-Party Payment Models
  // ============================================================================

  /**
   * Determine payment model responsibilities
   */
  static calculatePaymentResponsibilities(
    claimAmount: number,
    franchiseDeduction: number,
    quotePartAmount: number,
    paymentModel: 'tiers_garant' | 'tiers_payant' | 'mixed' = 'tiers_garant'
  ): { insuranceResponsibility: number; patientResponsibility: number } {
    // Patient responsibility = franchise + quote-part
    const patientResponsibility = franchiseDeduction + quotePartAmount;

    // Insurance responsibility = amount - patient responsibility
    const insuranceResponsibility = claimAmount - patientResponsibility;

    return {
      insuranceResponsibility: Math.round(insuranceResponsibility * 100) / 100,
      patientResponsibility: Math.round(patientResponsibility * 100) / 100,
    };
  }

  /**
   * Get payment model description
   */
  static getPaymentModelDescription(model: 'tiers_garant' | 'tiers_payant' | 'mixed'): string {
    const descriptions: Record<string, string> = {
      tiers_garant:
        'Patient pays directly at pharmacy, then submits claim for reimbursement from insurance',
      tiers_payant: 'Pharmacy bills insurance directly; patient only pays franchise and quote-part',
      mixed: 'Combination of both tiers_garant and tiers_payant models',
    };

    return descriptions[model] || 'Unknown payment model';
  }

  // ============================================================================
  // Insurance Statistics
  // ============================================================================

  /**
   * Calculate insurance statistics (mock implementation)
   */
  static calculateStatistics(claims: InsuranceClaim[]): InsuranceStatistics {
    const totalPatients = new Set(claims.map((c) => c.patientId)).size;
    const activeClaims = claims.filter((c) => c.status === 'submitted' || c.status === 'processing')
      .length;
    const approvedClaims = claims.filter((c) => c.status === 'approved').length;
    const rejectedClaims = claims.filter((c) => c.status === 'rejected').length;
    const totalReimbursed = claims
      .filter((c) => c.status === 'paid')
      .reduce((sum, c) => sum + Number(c.reimbursableAmount), 0);

    const avgClaimAmount =
      claims.length > 0 ? claims.reduce((sum, c) => sum + Number(c.amount), 0) / claims.length : 0;

    return {
      totalPatients,
      activeClaims,
      approvedClaims,
      rejectedClaims,
      totalReimbursed,
      avgClaimAmount,
      avgProcessingTime: this.getAverageProcessingTime(),
    };
  }

  // ============================================================================
  // Validation Helpers
  // ============================================================================

  /**
   * Validate franchise level
   */
  static isValidFranchiseLevel(level: number): boolean {
    const validLevels = [300, 500, 1000, 1500, 2000, 2500];
    return validLevels.includes(level);
  }

  /**
   * Validate insurance type
   */
  static isValidInsuranceType(type: string): boolean {
    return ['LAMal', 'LCA', 'PRIVATE'].includes(type);
  }

  /**
   * Validate coverage type
   */
  static isValidCoverageType(type: string): boolean {
    return ['basic', 'complementary', 'dental', 'accident'].includes(type);
  }

  /**
   * Validate claim status
   */
  static isValidClaimStatus(status: string): boolean {
    return ['draft', 'submitted', 'processing', 'approved', 'rejected', 'paid'].includes(status);
  }
}
