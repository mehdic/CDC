/**
 * Prescription State Machine
 * Manages prescription status transitions and enforces business rules
 * T093 - User Story 1: Prescription Processing & Validation
 * Based on: /specs/002-metapharm-platform/data-model.md (State Machines section)
 */

import { Prescription, PrescriptionStatus } from '../../../../shared/models/Prescription';

/**
 * State transition configuration
 * Defines allowed transitions from each state
 */
const STATE_TRANSITIONS: Record<PrescriptionStatus, PrescriptionStatus[]> = {
  [PrescriptionStatus.PENDING]: [
    PrescriptionStatus.IN_REVIEW,
  ],
  [PrescriptionStatus.IN_REVIEW]: [
    PrescriptionStatus.APPROVED,
    PrescriptionStatus.REJECTED,
    PrescriptionStatus.CLARIFICATION_NEEDED,
  ],
  [PrescriptionStatus.CLARIFICATION_NEEDED]: [
    PrescriptionStatus.IN_REVIEW,  // Doctor responds, pharmacist re-reviews
  ],
  [PrescriptionStatus.APPROVED]: [
    PrescriptionStatus.EXPIRED,  // Prescription validity period elapsed
  ],
  [PrescriptionStatus.REJECTED]: [],  // Immutable - cannot transition
  [PrescriptionStatus.EXPIRED]: [],   // Immutable - cannot transition
};

/**
 * Immutable states that cannot be changed once set
 */
const IMMUTABLE_STATES = [
  PrescriptionStatus.APPROVED,
  PrescriptionStatus.REJECTED,
  PrescriptionStatus.EXPIRED,
];

export class PrescriptionStateMachine {
  /**
   * Check if a state transition is valid
   * @param currentStatus Current prescription status
   * @param newStatus Desired new status
   * @returns True if transition is allowed, false otherwise
   */
  static canTransition(currentStatus: PrescriptionStatus, newStatus: PrescriptionStatus): boolean {
    const allowedTransitions = STATE_TRANSITIONS[currentStatus];
    return allowedTransitions.includes(newStatus);
  }

  /**
   * Validate state transition and throw error if invalid
   * @param currentStatus Current prescription status
   * @param newStatus Desired new status
   * @throws Error if transition is not allowed
   */
  static validateTransition(currentStatus: PrescriptionStatus, newStatus: PrescriptionStatus): void {
    // Check if trying to modify immutable state
    if (IMMUTABLE_STATES.includes(currentStatus) && currentStatus !== newStatus) {
      throw new Error(
        `Cannot transition from immutable state '${currentStatus}'. ` +
        `Prescription is in final state and cannot be changed.`
      );
    }

    // Check if transition is allowed
    if (!this.canTransition(currentStatus, newStatus)) {
      throw new Error(
        `Invalid state transition from '${currentStatus}' to '${newStatus}'. ` +
        `Allowed transitions: ${STATE_TRANSITIONS[currentStatus].join(', ') || 'none'}`
      );
    }
  }

  /**
   * Transition prescription to "in_review" state
   * Called when pharmacist claims a prescription
   * @param prescription Prescription entity
   * @param pharmacistId ID of pharmacist claiming the prescription
   */
  static transitionToInReview(prescription: Prescription, pharmacistId: string): void {
    this.validateTransition(prescription.status, PrescriptionStatus.IN_REVIEW);

    prescription.status = PrescriptionStatus.IN_REVIEW;
    prescription.pharmacist_id = pharmacistId;
  }

  /**
   * Transition prescription to "approved" state
   * Called when pharmacist approves a prescription
   * @param prescription Prescription entity
   * @param pharmacistId ID of pharmacist approving the prescription
   */
  static transitionToApproved(prescription: Prescription, pharmacistId: string): void {
    this.validateTransition(prescription.status, PrescriptionStatus.APPROVED);

    // Use the existing approve() helper method from Prescription entity
    prescription.approve(pharmacistId);
  }

  /**
   * Transition prescription to "rejected" state
   * Called when pharmacist rejects a prescription
   * @param prescription Prescription entity
   * @param reason Mandatory reason for rejection (FR-029)
   */
  static transitionToRejected(prescription: Prescription, reason: string): void {
    this.validateTransition(prescription.status, PrescriptionStatus.REJECTED);

    if (!reason || reason.trim().length === 0) {
      throw new Error('Rejection reason is mandatory (FR-029)');
    }

    // Use the existing reject() helper method from Prescription entity
    prescription.reject(reason);
  }

  /**
   * Transition prescription to "clarification_needed" state
   * Called when pharmacist requests clarification from doctor
   * @param prescription Prescription entity
   * @param clarificationNotes Notes explaining what needs clarification
   */
  static transitionToClarificationNeeded(
    prescription: Prescription,
    clarificationNotes: string
  ): void {
    this.validateTransition(prescription.status, PrescriptionStatus.CLARIFICATION_NEEDED);

    if (!clarificationNotes || clarificationNotes.trim().length === 0) {
      throw new Error('Clarification notes are required');
    }

    // Use the existing requestClarification() helper method from Prescription entity
    prescription.requestClarification(clarificationNotes);
  }

  /**
   * Transition prescription to "expired" state
   * Called when prescription validity period has elapsed
   * @param prescription Prescription entity
   */
  static transitionToExpired(prescription: Prescription): void {
    this.validateTransition(prescription.status, PrescriptionStatus.EXPIRED);

    prescription.status = PrescriptionStatus.EXPIRED;
  }

  /**
   * Check if prescription can be approved
   * Verifies all business rules for approval
   * @param prescription Prescription entity
   * @returns Object with canApprove flag and optional error message
   */
  static canApprove(prescription: Prescription): { canApprove: boolean; reason?: string } {
    // Must be in correct state
    if (prescription.status !== PrescriptionStatus.IN_REVIEW) {
      return {
        canApprove: false,
        reason: `Prescription must be in 'in_review' state. Current state: ${prescription.status}`,
      };
    }

    // Check if prescription has expired (based on expiry_date)
    if (prescription.isPastExpiryDate()) {
      return {
        canApprove: false,
        reason: 'Prescription has expired. Cannot approve.',
      };
    }

    // All checks passed
    return { canApprove: true };
  }

  /**
   * Check if prescription can be rejected
   * @param prescription Prescription entity
   * @returns Object with canReject flag and optional error message
   */
  static canReject(prescription: Prescription): { canReject: boolean; reason?: string } {
    // Must be in correct state
    if (prescription.status !== PrescriptionStatus.IN_REVIEW) {
      return {
        canReject: false,
        reason: `Prescription must be in 'in_review' state. Current state: ${prescription.status}`,
      };
    }

    return { canReject: true };
  }

  /**
   * Check if clarification can be requested
   * @param prescription Prescription entity
   * @returns Object with can flag and optional error message
   */
  static canRequestClarification(prescription: Prescription): { can: boolean; reason?: string } {
    // Must be in correct state
    if (prescription.status !== PrescriptionStatus.IN_REVIEW) {
      return {
        can: false,
        reason: `Prescription must be in 'in_review' state. Current state: ${prescription.status}`,
      };
    }

    // Must have a prescribing doctor
    if (!prescription.prescribing_doctor_id) {
      return {
        can: false,
        reason: 'Prescription has no prescribing doctor to contact',
      };
    }

    return { can: true };
  }

  /**
   * Check if prescription can be edited
   * Only editable in non-immutable states
   * @param prescription Prescription entity
   * @returns True if prescription can be edited
   */
  static canEdit(prescription: Prescription): boolean {
    return prescription.canBeEdited();
  }

  /**
   * Get next possible states for a prescription
   * @param currentStatus Current prescription status
   * @returns Array of possible next states
   */
  static getNextPossibleStates(currentStatus: PrescriptionStatus): PrescriptionStatus[] {
    return STATE_TRANSITIONS[currentStatus] || [];
  }

  /**
   * Check if state is immutable (final state)
   * @param status Prescription status
   * @returns True if state is immutable
   */
  static isImmutableState(status: PrescriptionStatus): boolean {
    return IMMUTABLE_STATES.includes(status);
  }
}
