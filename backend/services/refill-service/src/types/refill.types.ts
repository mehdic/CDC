/**
 * Refill Service Type Definitions
 * DTOs and interfaces for refill requests and responses
 */

// ============================================================================
// DTOs - Data Transfer Objects
// ============================================================================

export interface CreateRefillRequestDTO {
  prescriptionId: string;
  patientId: string;
  pharmacyId: string;
  quantityRequested?: number;
}

export interface ApproveRefillRequestDTO {
  refillRequestId: string;
  pharmacistId: string;
  notes?: string;
}

export interface DenyRefillRequestDTO {
  refillRequestId: string;
  pharmacistId: string;
  denialReason: string;
}

export interface FillRefillRequestDTO {
  refillRequestId: string;
  pharmacistId: string;
  quantityFilled: number;
  filledAt?: Date;
}

// ============================================================================
// Response Types
// ============================================================================

export interface RefillRequestResponse {
  id: string;
  prescriptionId: string;
  patientId: string;
  pharmacyId: string;
  status: string;
  quantityRequested: number;
  decisionType?: string;
  approvedAt?: Date;
  filledAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefillHistoryResponse {
  id: string;
  refillRequestId?: string;
  prescriptionId: string;
  patientId: string;
  action: string;
  quantity?: number;
  createdAt: Date;
}

// ============================================================================
// Eligibility Check Types
// ============================================================================

export interface EligibilityCheckRequest {
  prescriptionId: string;
  patientId: string;
}

export interface EligibilityCheckResult {
  isEligible: boolean;
  remainingRefills: number;
  daysUntilNextRefill: number;
  controlledSubstance: boolean;
  requiresManualApproval: boolean;
  checkReason?: string;
  errors?: string[];
}

// ============================================================================
// Prescription Data (from prescription service)
// ============================================================================

export interface PrescriptionData {
  id: string;
  patientId: string;
  pharmacyId: string;
  doctorId: string;
  medications: Array<{
    drugName: string;
    dosage: string;
    quantity: number;
    isControlledSubstance?: boolean;
  }>;
  status: string;
  issuedAt: Date;
  expiresAt: Date;
  refillsAllowed: number;
  refillsUsed: number;
  lastRefillDate?: Date;
}

// ============================================================================
// Refill Rules Configuration
// ============================================================================

export interface RefillRuleConfiguration {
  maxRefillsDefault: number;
  minDaysBetweenRefills: number;
  refillRequestValidityDays: number;
  controlledSubstanceRules: {
    maxRefills: number;
    minDaysBetweenRefills: number;
    requiresManualApproval: boolean;
  };
  autoApproveCategories: string[];
  manualApproveCategories: string[];
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface RefillAnalytics {
  patientId: string;
  prescriptionId: string;
  totalRefillsRequested: number;
  totalRefillsApproved: number;
  totalRefillsDenied: number;
  averageApprovalTime: number;
  lastRefillDate: Date;
  nextEligibleRefillDate: Date;
}

export interface PharmacyRefillAnalytics {
  pharmacyId: string;
  totalRefillRequests: number;
  approvedRefills: number;
  deniedRefills: number;
  autoApprovedCount: number;
  manualReviewedCount: number;
  averageReviewTime: number;
  approvalRate: number;
}
