/**
 * TreatmentPlan Entity
 * Generated medication schedule from approved prescription with adherence tracking
 * Based on: /specs/002-metapharm-platform/data-model.md
 * User Story 1 (P1): Prescription Processing & Validation (FR-017, FR-077)
 */
import { Prescription } from './Prescription';
import { User } from './User';
export declare enum TreatmentPlanStatus {
    ACTIVE = "active",// Ongoing treatment
    COMPLETED = "completed",// Finished as prescribed
    DISCONTINUED = "discontinued"
}
export declare class TreatmentPlan {
    id: string;
    prescription_id: string;
    prescription: Prescription;
    patient_id: string;
    patient: User;
    medication_schedule: any;
    start_date: Date;
    end_date: Date | null;
    total_doses: number | null;
    doses_taken: number;
    adherence_rate: number | null;
    refill_due_date: Date | null;
    refill_reminder_sent: boolean;
    status: TreatmentPlanStatus;
    created_at: Date;
    updated_at: Date;
    /**
     * Check if treatment plan is active
     */
    isActive(): boolean;
    /**
     * Check if treatment plan is completed
     */
    isCompleted(): boolean;
    /**
     * Check if treatment plan was discontinued
     */
    isDiscontinued(): boolean;
    /**
     * Calculate and update adherence rate
     * FR-077: Track medication adherence (doses taken vs. missed)
     */
    calculateAdherenceRate(): number;
    /**
     * Record a dose taken
     * Updates doses_taken and recalculates adherence rate
     */
    recordDoseTaken(): void;
    /**
     * Check if adherence is good (>= 80%)
     * FR-077: Threshold for "good adherence" commonly set at 80% in healthcare
     */
    hasGoodAdherence(): boolean;
    /**
     * Check if adherence is poor (< 50%)
     */
    hasPoorAdherence(): boolean;
    /**
     * Check if refill is due soon (within 7 days)
     */
    isRefillDueSoon(): boolean;
    /**
     * Check if refill is overdue
     */
    isRefillOverdue(): boolean;
    /**
     * Check if refill reminder should be sent
     * Send reminder if due within 7 days and not already sent
     */
    shouldSendRefillReminder(): boolean;
    /**
     * Mark refill reminder as sent
     */
    markRefillReminderSent(): void;
    /**
     * Complete treatment plan
     * Set status to completed and end date to today
     */
    complete(): void;
    /**
     * Discontinue treatment plan
     * Set status to discontinued and end date to today
     */
    discontinue(): void;
    /**
     * Get days remaining in treatment
     * Returns null if no end_date set
     */
    getDaysRemaining(): number | null;
    /**
     * Get days elapsed in treatment
     */
    getDaysElapsed(): number;
}
//# sourceMappingURL=TreatmentPlan.d.ts.map