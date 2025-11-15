import { User } from './User';
import { Pharmacy } from './Pharmacy';
import { Prescription } from './Prescription';
import { ConsultationNote } from './ConsultationNote';
export declare enum TeleconsultationStatus {
    SCHEDULED = "scheduled",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    NO_SHOW = "no_show"
}
export declare class Teleconsultation {
    id: string;
    pharmacy_id: string;
    pharmacy: Pharmacy;
    patient_id: string;
    patient: User;
    pharmacist_id: string;
    pharmacist: User;
    scheduled_at: Date;
    duration_minutes: number;
    status: TeleconsultationStatus;
    twilio_room_sid: string | null;
    started_at: Date | null;
    ended_at: Date | null;
    actual_duration_minutes: number | null;
    recording_consent: boolean;
    recording_url: string | null;
    prescription_created: boolean;
    prescription_id: string | null;
    prescription: Prescription | null;
    consultation_note: ConsultationNote | null;
    created_at: Date;
    updated_at: Date;
    cancelled_at: Date | null;
    cancellation_reason: string | null;
}
export declare class TeleconsultationScheduleIndex {
}
//# sourceMappingURL=Teleconsultation.d.ts.map