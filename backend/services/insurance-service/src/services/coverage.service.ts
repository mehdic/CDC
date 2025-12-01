/**
 * CoverageService
 * Business logic for insurance coverage verification and management
 */

import { CoverageDetails } from '../entities/CoverageDetails';
import { PatientInsurance } from '../entities/PatientInsurance';
import { InsuranceService } from './insurance.service';
import { CoverageVerificationRequest, CoverageVerificationResponse } from '../types/insurance.types';
import { v4 as uuidv4 } from 'uuid';

export class CoverageService {
  /**
   * Verify coverage for a patient
   */
  static verifyCoverage(
    request: CoverageVerificationRequest,
    patientInsurance: PatientInsurance | null,
    amount: number = 0
  ): CoverageVerificationResponse {
    // If no patient insurance found, patient is not eligible
    if (!patientInsurance) {
      return {
        isEligible: false,
        patientId: request.patientId,
        insuranceProviderId: request.insuranceProviderId || 'unknown',
        franchiseLevel: 0 as any,
        currentFranchiseSpent: 0,
        remainingFranchise: 0,
        quotePartPercentage: 0,
        estimatedReimbursement: 0,
        message: 'No active insurance coverage found for this patient',
      };
    }

    // Check if insurance is still active
    const now = new Date();
    if (patientInsurance.endDate && patientInsurance.endDate < now) {
      return {
        isEligible: false,
        patientId: request.patientId,
        insuranceProviderId: patientInsurance.insuranceProviderId,
        franchiseLevel: patientInsurance.franchiseLevel as any,
        currentFranchiseSpent: Number(patientInsurance.currentFranchiseSpent),
        remainingFranchise: 0,
        quotePartPercentage: patientInsurance.quotePartPercentage,
        estimatedReimbursement: 0,
        message: 'Insurance coverage has expired',
      };
    }

    // Verify coverage
    return InsuranceService.verifyCoverage(patientInsurance, amount);
  }

  /**
   * Create coverage details for a patient insurance
   */
  static createCoverageDetails(
    patientInsuranceId: string,
    coverageType: string,
    isApproved: boolean = true,
    maxReimbursementPercentage: number = 100
  ): CoverageDetails {
    const coverage = new CoverageDetails();
    coverage.id = uuidv4();
    coverage.patientInsuranceId = patientInsuranceId;
    coverage.coverageType = coverageType;
    coverage.isApproved = isApproved;
    coverage.maxReimbursementPercentage = maxReimbursementPercentage;
    coverage.currentYearSpent = 0;

    // Set year boundaries
    const now = new Date();
    coverage.yearStart = new Date(now.getFullYear(), 0, 1); // Jan 1
    coverage.yearEnd = new Date(now.getFullYear(), 11, 31); // Dec 31

    return coverage;
  }

  /**
   * Update coverage after claim is paid
   */
  static updateCoverageAfterClaim(
    coverage: CoverageDetails,
    amountSpent: number
  ): CoverageDetails {
    coverage.currentYearSpent = Number(coverage.currentYearSpent) + amountSpent;
    coverage.updatedAt = new Date();
    return coverage;
  }

  /**
   * Check if annual limit is exceeded
   */
  static isAnnualLimitExceeded(coverage: CoverageDetails): boolean {
    if (!coverage.annualLimit) {
      return false; // No limit set
    }

    return Number(coverage.currentYearSpent) >= Number(coverage.annualLimit);
  }

  /**
   * Get remaining annual coverage amount
   */
  static getRemainingAnnualLimit(coverage: CoverageDetails): number {
    if (!coverage.annualLimit) {
      return Infinity; // No limit
    }

    const spent = Number(coverage.currentYearSpent) || 0;
    const limit = Number(coverage.annualLimit) || 0;
    return Math.max(0, limit - spent);
  }

  /**
   * Check if franchise year has reset
   */
  static needsFranchiseReset(patientInsurance: PatientInsurance): boolean {
    const now = new Date();
    const yearEnd = patientInsurance.franchiseYearEnd;

    if (!yearEnd) {
      return true; // No year set, needs reset
    }

    return now > yearEnd;
  }

  /**
   * Reset franchise for new year
   */
  static resetFranchiseForNewYear(patientInsurance: PatientInsurance): PatientInsurance {
    const now = new Date();
    const currentYear = now.getFullYear();

    patientInsurance.currentFranchiseSpent = 0;
    patientInsurance.franchiseYearStart = new Date(currentYear, 0, 1);
    patientInsurance.franchiseYearEnd = new Date(currentYear, 11, 31);
    patientInsurance.updatedAt = new Date();

    return patientInsurance;
  }

  /**
   * Get coverage summary for a patient's insurance
   */
  static getCoverageSummary(
    patientInsurance: PatientInsurance,
    coverageList: CoverageDetails[]
  ): {
    insuranceProvider: string;
    policyNumber: string;
    franchiseLevel: number;
    remainingFranchise: number;
    quotePartPercentage: number;
    activeCoverageTypes: string[];
    totalAnnualLimit: number;
    totalYearlySpent: number;
  } {
    const remainingFranchise = Math.max(
      0,
      patientInsurance.franchiseLevel - Number(patientInsurance.currentFranchiseSpent)
    );

    const activeCoverageTypes = coverageList
      .filter((c) => c.isApproved)
      .map((c) => c.coverageType);

    const totalAnnualLimit = coverageList.reduce((sum, c) => sum + (Number(c.annualLimit) || 0), 0);
    const totalYearlySpent = coverageList.reduce(
      (sum, c) => sum + (Number(c.currentYearSpent) || 0),
      0
    );

    return {
      insuranceProvider: patientInsurance.insuranceProviderId,
      policyNumber: patientInsurance.policyNumber,
      franchiseLevel: patientInsurance.franchiseLevel,
      remainingFranchise,
      quotePartPercentage: patientInsurance.quotePartPercentage,
      activeCoverageTypes,
      totalAnnualLimit,
      totalYearlySpent,
    };
  }

  /**
   * Validate coverage details
   */
  static validateCoverageDetails(coverage: CoverageDetails): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!coverage.patientInsuranceId) {
      errors.push('Patient insurance ID is required');
    }

    if (!coverage.coverageType) {
      errors.push('Coverage type is required');
    }

    if (!InsuranceService.isValidCoverageType(coverage.coverageType)) {
      errors.push('Invalid coverage type');
    }

    if (coverage.maxReimbursementPercentage < 0 || coverage.maxReimbursementPercentage > 100) {
      errors.push('Reimbursement percentage must be between 0 and 100');
    }

    if (coverage.currentYearSpent < 0) {
      errors.push('Year spent amount cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate coverage percentage for amount
   */
  static calculateCoveragePercentage(
    coverage: CoverageDetails,
    amount: number
  ): {
    coveredPercentage: number;
    coveredAmount: number;
    patientResponsibility: number;
  } {
    const coveredPercentage = coverage.maxReimbursementPercentage;
    const coveredAmount = (amount * coveredPercentage) / 100;
    const patientResponsibility = amount - coveredAmount;

    return {
      coveredPercentage,
      coveredAmount: Math.round(coveredAmount * 100) / 100,
      patientResponsibility: Math.round(patientResponsibility * 100) / 100,
    };
  }
}
