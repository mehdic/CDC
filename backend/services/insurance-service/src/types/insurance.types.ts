/**
 * Insurance Types
 * Swiss insurance and third-party payment types
 */

// ============================================================================
// Insurance Provider Types
// ============================================================================

export interface InsuranceProviderData {
  id: string;
  name: string;
  code: string;
  country: string;
  insuranceType: InsuranceType;
  coverageTypes: CoverageType[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type InsuranceType = 'LAMal' | 'LCA' | 'PRIVATE';
export type CoverageType = 'basic' | 'complementary' | 'dental' | 'accident';

// ============================================================================
// Patient Insurance Types
// ============================================================================

export interface PatientInsuranceData {
  id: string;
  patientId: string;
  insuranceProviderId: string;
  policyNumber: string;
  franchiseLevel: FranchiseLevel;
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type FranchiseLevel = 300 | 500 | 1000 | 1500 | 2000 | 2500;

// ============================================================================
// Coverage Details Types
// ============================================================================

export interface CoverageDetailsData {
  id: string;
  patientInsuranceId: string;
  coverageType: CoverageType;
  isApproved: boolean;
  maxReimbursementPercentage: number;
  annualLimit?: number;
  currentYearSpent?: number;
  updatedAt: Date;
}

export interface CoverageVerificationRequest {
  patientId: string;
  insuranceProviderId?: string;
  medicationCode?: string;
  amount?: number;
}

export interface CoverageVerificationResponse {
  isEligible: boolean;
  patientId: string;
  insuranceProviderId: string;
  franchiseLevel: FranchiseLevel;
  currentFranchiseSpent: number;
  remainingFranchise: number;
  quotePartPercentage: number; // Default 10% after franchise
  estimatedReimbursement: number;
  message: string;
}

// ============================================================================
// Insurance Claim Types
// ============================================================================

export interface InsuranceClaimData {
  id: string;
  patientId: string;
  patientInsuranceId: string;
  prescriptionId?: string;
  amount: number;
  franchiseDeduction: number;
  quotePartAmount: number; // 10% co-pay
  reimbursableAmount: number;
  status: ClaimStatus;
  claimDate: Date;
  submissionDate?: Date;
  responseDate?: Date;
  reference?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ClaimStatus = 'draft' | 'submitted' | 'processing' | 'approved' | 'rejected' | 'paid';

export interface SubmitClaimRequest {
  patientInsuranceId: string;
  prescriptionId?: string;
  amount: number;
  description?: string;
  attachments?: string[]; // File paths or URLs
}

export interface ClaimStatusResponse {
  claimId: string;
  status: ClaimStatus;
  amount: number;
  reimbursableAmount: number;
  lastUpdate: Date;
  message: string;
}

// ============================================================================
// Third-Party Payment Types
// ============================================================================

export type PaymentModel = 'tiers_garant' | 'tiers_payant' | 'mixed';

export interface ThirdPartyPaymentData {
  id: string;
  claimId: string;
  paymentModel: PaymentModel;
  insuranceResponsibility: number;
  patientResponsibility: number;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

// ============================================================================
// Swiss Insurance Configuration Types
// ============================================================================

export interface SwissInsuranceConfig {
  defaultQuotePartPercentage: number; // Usually 10%
  minFranchise: FranchiseLevel;
  maxFranchise: FranchiseLevel;
  insuranceProviders: InsuranceProviderData[];
}

export interface InsuranceStatistics {
  totalPatients: number;
  activeClaims: number;
  approvedClaims: number;
  rejectedClaims: number;
  totalReimbursed: number;
  avgClaimAmount: number;
  avgProcessingTime: number; // in days
}
