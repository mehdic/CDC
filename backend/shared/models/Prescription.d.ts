/**
 * Prescription Entity
 * Medication orders from patients (upload) or doctors (direct send) with AI-powered validation
 * Based on: /specs/002-metapharm-platform/data-model.md
 * User Story 1 (P1): Prescription Processing & Validation (FR-008 to FR-020)
 */
import { User } from './User';
import { Pharmacy } from './Pharmacy';
import { PrescriptionItem } from './PrescriptionItem';
import { TreatmentPlan } from './TreatmentPlan';
export declare enum PrescriptionSource {
    PATIENT_UPLOAD = "patient_upload",
    DOCTOR_DIRECT = "doctor_direct",
    TELECONSULTATION = "teleconsultation"
}
export declare enum PrescriptionStatus {
    PENDING = "pending",// Awaiting pharmacist review
    IN_REVIEW = "in_review",// Pharmacist reviewing
    CLARIFICATION_NEEDED = "clarification_needed",// Waiting for doctor response
    APPROVED = "approved",// Validated and approved
    REJECTED = "rejected",// Rejected with reason
    EXPIRED = "expired"
}
export declare class Prescription {
    id: string;
    pharmacy_id: string;
    pharmacy: Pharmacy;
    patient_id: string;
    patient: User;
    prescribing_doctor_id: string | null;
    prescribing_doctor: User | null;
    pharmacist_id: string | null;
    pharmacist: User | null;
    source: PrescriptionSource;
    image_url: string | null;
    ai_transcription_data: any;
    ai_confidence_score: number | null;
    status: PrescriptionStatus;
    rejection_reason: string | null;
    drug_interactions: any;
    allergy_warnings: any;
    contraindications: any;
    prescribed_date: Date | null;
    expiry_date: Date | null;
    treatment_plan_id: string | null;
    treatment_plan: TreatmentPlan | null;
    items: PrescriptionItem[];
    created_at: Date;
    updated_at: Date;
    approved_at: Date | null;
    approved_by_pharmacist_id: string | null;
    approved_by_pharmacist: User | null;
    /**
     * Check if prescription is pending
     */
    isPending(): boolean;
    /**
     * Check if prescription is in review
     */
    isInReview(): boolean;
    /**
     * Check if prescription is approved
     */
    isApproved(): boolean;
    /**
     * Check if prescription is rejected
     */
    isRejected(): boolean;
    /**
     * Check if prescription is expired
     */
    isExpired(): boolean;
    /**
     * Check if prescription can be edited (not in immutable state)
     * Immutable states: approved, rejected, expired
     */
    canBeEdited(): boolean;
    /**
     * Check if AI confidence is low (< 80%) requiring manual verification
     * FR-013a: Low-confidence fields must be highlighted with visual warnings
     */
    hasLowConfidence(): boolean;
    /**
     * Check if prescription has safety warnings
     */
    hasSafetyWarnings(): boolean;
    /**
     * Check if prescription requires clarification from doctor
     */
    needsClarification(): boolean;
    /**
     * Check if prescription is from doctor (not patient upload)
     */
    isFromDoctor(): boolean;
    /**
     * Check if prescription is from patient upload
     */
    isFromPatientUpload(): boolean;
    /**
     * Check if prescription validity has expired (based on expiry_date)
     */
    isPastExpiryDate(): boolean;
    /**
     * Mark prescription as approved
     */
    approve(pharmacistId: string): void;
    /**
     * Mark prescription as rejected
     */
    reject(reason: string): void;
    /**
     * Mark prescription as needing clarification
     */
    requestClarification(reason: string): void;
}
//# sourceMappingURL=Prescription.d.ts.map