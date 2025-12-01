/**
 * Refill Frontend Types
 * Shared types for patient and pharmacist refill features
 */

export interface RefillRequestResponse {
  id: string;
  prescriptionId: string;
  patientId: string;
  pharmacyId: string;
  status: 'pending' | 'approved' | 'denied' | 'expired' | 'filled';
  quantityRequested: number;
  decisionType?: 'auto_approved' | 'manual_reviewed' | 'denied';
  approvedAt?: string;
  filledAt?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface RefillHistoryEntry {
  id: string;
  refillRequestId?: string;
  prescriptionId: string;
  patientId: string;
  action: 'requested' | 'approved' | 'denied' | 'filled' | 'expired';
  quantity?: number;
  createdAt: string;
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
