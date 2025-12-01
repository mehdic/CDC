/**
 * ClaimsService
 * Business logic for insurance claim management
 */

import { InsuranceClaim } from '../entities/InsuranceClaim';
import { PatientInsurance } from '../entities/PatientInsurance';
import { InsuranceService } from './insurance.service';
import { SubmitClaimRequest, ClaimStatusResponse } from '../types/insurance.types';
import { v4 as uuidv4 } from 'uuid';

export class ClaimsService {
  /**
   * Create a new insurance claim from a request
   */
  static createClaimFromRequest(
    request: SubmitClaimRequest,
    patientId: string,
    patientInsurance: PatientInsurance
  ): InsuranceClaim {
    // Calculate amounts
    const { franchiseDeduction, quotePartAmount, reimbursableAmount } =
      InsuranceService.calculateClaimAmounts(request.amount, patientInsurance);

    const claim = new InsuranceClaim();
    claim.id = uuidv4();
    claim.patientId = patientId;
    claim.patientInsuranceId = request.patientInsuranceId;
    claim.prescriptionId = request.prescriptionId || '';
    claim.amount = request.amount;
    claim.franchiseDeduction = franchiseDeduction;
    claim.quotePartAmount = quotePartAmount;
    claim.reimbursableAmount = reimbursableAmount;
    claim.status = 'draft';
    claim.claimDate = new Date();
    claim.notes = request.description || '';
    claim.attachments = request.attachments || [];
    claim.metadata = {
      createdBy: 'pharmacist',
      description: request.description,
    };

    return claim;
  }

  /**
   * Prepare claim for submission
   */
  static prepareClaim(claim: InsuranceClaim): InsuranceClaim {
    claim.status = 'submitted';
    claim.submissionDate = new Date();
    claim.reference = this.generateClaimReference(claim.id);
    return claim;
  }

  /**
   * Generate a unique claim reference number
   */
  static generateClaimReference(claimId: string): string {
    const timestamp = Date.now().toString().slice(-6);
    const shortId = claimId.split('-')[0].toUpperCase();
    return `CLAIM-${timestamp}-${shortId}`;
  }

  /**
   * Process claim rejection with reason
   */
  static rejectClaim(claim: InsuranceClaim, reason: string): InsuranceClaim {
    claim.status = 'rejected';
    claim.responseDate = new Date();
    claim.notes = (claim.notes || '') + `\n\nREJECTION REASON: ${reason}`;
    return claim;
  }

  /**
   * Process claim approval
   */
  static approveClaim(claim: InsuranceClaim): InsuranceClaim {
    claim.status = 'approved';
    claim.responseDate = new Date();
    return claim;
  }

  /**
   * Mark claim as paid
   */
  static markClaimAsPaid(claim: InsuranceClaim, transactionId?: string): InsuranceClaim {
    claim.status = 'paid';
    claim.responseDate = new Date();
    if (transactionId) {
      claim.metadata = claim.metadata || {};
      claim.metadata.transactionId = transactionId;
    }
    return claim;
  }

  /**
   * Get claim status details
   */
  static getClaimStatus(claim: InsuranceClaim): ClaimStatusResponse {
    return {
      claimId: claim.id,
      status: claim.status as any,
      amount: claim.amount,
      reimbursableAmount: claim.reimbursableAmount,
      lastUpdate: claim.updatedAt,
      message: InsuranceService.getClaimStatusMessage(claim.status),
    };
  }

  /**
   * Estimate processing time based on status
   */
  static estimateProcessingTime(status: string): number {
    const estimations: Record<string, number> = {
      draft: 0,
      submitted: 7,
      processing: 5,
      approved: 0,
      rejected: 1,
      paid: 0,
    };

    return estimations[status] || 7;
  }

  /**
   * Validate claim before submission
   */
  static validateClaimForSubmission(claim: InsuranceClaim): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!claim.patientId) {
      errors.push('Patient ID is required');
    }

    if (!claim.patientInsuranceId) {
      errors.push('Patient insurance ID is required');
    }

    if (claim.amount <= 0) {
      errors.push('Claim amount must be greater than 0');
    }

    if (!claim.claimDate) {
      errors.push('Claim date is required');
    }

    if (claim.status !== 'draft') {
      errors.push('Only draft claims can be submitted');
    }

    if (claim.reimbursableAmount < 0) {
      errors.push('Reimbursable amount cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Update franchise spent amount after claim approval
   */
  static updatePatientFranchiseSpent(
    patientInsurance: PatientInsurance,
    franchiseDeduction: number
  ): PatientInsurance {
    const newSpent = Number(patientInsurance.currentFranchiseSpent) + franchiseDeduction;
    patientInsurance.currentFranchiseSpent = Math.min(newSpent, patientInsurance.franchiseLevel);
    patientInsurance.updatedAt = new Date();
    return patientInsurance;
  }

  /**
   * Get bulk claims summary
   */
  static getSummary(claims: InsuranceClaim[]): {
    total: number;
    submitted: number;
    processing: number;
    approved: number;
    rejected: number;
    paid: number;
    totalAmount: number;
    totalReimbursed: number;
    totalFranchise: number;
    totalQuotePart: number;
  } {
    return {
      total: claims.length,
      submitted: claims.filter((c) => c.status === 'submitted').length,
      processing: claims.filter((c) => c.status === 'processing').length,
      approved: claims.filter((c) => c.status === 'approved').length,
      rejected: claims.filter((c) => c.status === 'rejected').length,
      paid: claims.filter((c) => c.status === 'paid').length,
      totalAmount: claims.reduce((sum, c) => sum + Number(c.amount), 0),
      totalReimbursed: claims
        .filter((c) => c.status === 'paid')
        .reduce((sum, c) => sum + Number(c.reimbursableAmount), 0),
      totalFranchise: claims.reduce((sum, c) => sum + Number(c.franchiseDeduction), 0),
      totalQuotePart: claims.reduce((sum, c) => sum + Number(c.quotePartAmount), 0),
    };
  }
}
