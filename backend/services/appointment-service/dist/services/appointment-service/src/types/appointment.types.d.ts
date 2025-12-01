/**
 * Appointment Types
 * Type definitions for appointment scheduling system
 */
export declare enum AppointmentType {
    TELECONSULTATION = "teleconsultation",
    IN_PERSON = "in_person",
    HOME_VISIT = "home_visit"
}
export declare enum AppointmentStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    NO_SHOW = "no_show"
}
export declare enum ReminderType {
    EMAIL = "email",
    SMS = "sms",
    IN_APP = "in_app",
    NOTIFICATION = "notification"
}
export declare enum ReminderStatus {
    PENDING = "pending",
    SENT = "sent",
    FAILED = "failed"
}
export interface AppointmentCreateRequest {
    provider_id: string;
    patient_id: string;
    appointment_type: AppointmentType;
    scheduled_start: Date;
    scheduled_end: Date;
    reason?: string;
    notes?: string;
    location?: string;
}
export interface AppointmentUpdateRequest {
    appointment_type?: AppointmentType;
    scheduled_start?: Date;
    scheduled_end?: Date;
    reason?: string;
    notes?: string;
    location?: string;
    status?: AppointmentStatus;
}
export interface AvailabilitySlotCreateRequest {
    provider_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    capacity: number;
    is_recurring: boolean;
    end_date?: Date;
}
export interface AvailabilitySlotUpdateRequest {
    day_of_week?: number;
    start_time?: string;
    end_time?: string;
    capacity?: number;
    is_active?: boolean;
    end_date?: Date;
}
export interface AppointmentConflictCheckRequest {
    provider_id: string;
    scheduled_start: Date;
    scheduled_end: Date;
    exclude_appointment_id?: string;
}
export interface AppointmentListFilters {
    provider_id?: string;
    patient_id?: string;
    status?: AppointmentStatus;
    appointment_type?: AppointmentType;
    start_date?: Date;
    end_date?: Date;
    page?: number;
    limit?: number;
}
export interface AvailabilityListFilters {
    provider_id?: string;
    day_of_week?: number;
    is_active?: boolean;
    page?: number;
    limit?: number;
}
export interface PaginationResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}
export interface AppointmentResponse {
    id: string;
    provider_id: string;
    patient_id: string;
    appointment_type: AppointmentType;
    status: AppointmentStatus;
    scheduled_start: Date;
    scheduled_end: Date;
    reason?: string;
    notes?: string;
    location?: string;
    created_at: Date;
    updated_at: Date;
}
export interface AvailabilitySlotResponse {
    id: string;
    provider_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    capacity: number;
    is_recurring: boolean;
    is_active: boolean;
    end_date?: Date;
    created_at: Date;
    updated_at: Date;
}
export interface AppointmentReminderResponse {
    id: string;
    appointment_id: string;
    recipient_id: string;
    reminder_type: ReminderType;
    status: ReminderStatus;
    scheduled_at: Date;
    sent_at?: Date;
    failed_reason?: string;
    created_at: Date;
    updated_at: Date;
}
//# sourceMappingURL=appointment.types.d.ts.map