import { Prescription } from './Prescription';
import { User } from './User';
export declare enum TreatmentPlanStatus {
    ACTIVE = "active",
    COMPLETED = "completed",
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
    isActive(): boolean;
    isCompleted(): boolean;
    isDiscontinued(): boolean;
    calculateAdherenceRate(): number;
    recordDoseTaken(): void;
    hasGoodAdherence(): boolean;
    hasPoorAdherence(): boolean;
    isRefillDueSoon(): boolean;
    isRefillOverdue(): boolean;
    shouldSendRefillReminder(): boolean;
    markRefillReminderSent(): void;
    complete(): void;
    discontinue(): void;
    getDaysRemaining(): number | null;
    getDaysElapsed(): number;
}
//# sourceMappingURL=TreatmentPlan.d.ts.map