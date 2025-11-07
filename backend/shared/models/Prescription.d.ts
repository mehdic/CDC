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
    PENDING = "pending",
    IN_REVIEW = "in_review",
    CLARIFICATION_NEEDED = "clarification_needed",
    APPROVED = "approved",
    REJECTED = "rejected",
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
    isPending(): boolean;
    isInReview(): boolean;
    isApproved(): boolean;
    isRejected(): boolean;
    isExpired(): boolean;
    canBeEdited(): boolean;
    hasLowConfidence(): boolean;
    hasSafetyWarnings(): boolean;
    needsClarification(): boolean;
    isFromDoctor(): boolean;
    isFromPatientUpload(): boolean;
    isPastExpiryDate(): boolean;
    approve(pharmacistId: string): void;
    reject(reason: string): void;
    requestClarification(reason: string): void;
}
//# sourceMappingURL=Prescription.d.ts.map