/**
 * Appointment Validators
 * Input validation schemas using Zod
 */
import { z } from 'zod';
import { AppointmentType, AppointmentStatus, ReminderType } from '../types/appointment.types';
export declare const CreateAppointmentSchema: z.ZodObject<{
    provider_id: z.ZodString;
    patient_id: z.ZodString;
    appointment_type: z.ZodEnum<[AppointmentType.TELECONSULTATION, AppointmentType.IN_PERSON, AppointmentType.HOME_VISIT]>;
    scheduled_start: z.ZodEffects<z.ZodString, Date, string>;
    scheduled_end: z.ZodEffects<z.ZodString, Date, string>;
    reason: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    provider_id: string;
    patient_id: string;
    scheduled_start: Date;
    appointment_type: AppointmentType;
    scheduled_end: Date;
    reason?: string | undefined;
    notes?: string | undefined;
    location?: string | undefined;
}, {
    provider_id: string;
    patient_id: string;
    scheduled_start: string;
    appointment_type: AppointmentType;
    scheduled_end: string;
    reason?: string | undefined;
    notes?: string | undefined;
    location?: string | undefined;
}>;
export declare const UpdateAppointmentSchema: z.ZodObject<{
    appointment_type: z.ZodOptional<z.ZodEnum<[AppointmentType.TELECONSULTATION, AppointmentType.IN_PERSON, AppointmentType.HOME_VISIT]>>;
    scheduled_start: z.ZodOptional<z.ZodEffects<z.ZodString, Date, string>>;
    scheduled_end: z.ZodOptional<z.ZodEffects<z.ZodString, Date, string>>;
    reason: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<[AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS, AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW]>>;
}, "strip", z.ZodTypeAny, {
    status?: AppointmentStatus | undefined;
    scheduled_start?: Date | undefined;
    appointment_type?: AppointmentType | undefined;
    scheduled_end?: Date | undefined;
    reason?: string | undefined;
    notes?: string | undefined;
    location?: string | undefined;
}, {
    status?: AppointmentStatus | undefined;
    scheduled_start?: string | undefined;
    appointment_type?: AppointmentType | undefined;
    scheduled_end?: string | undefined;
    reason?: string | undefined;
    notes?: string | undefined;
    location?: string | undefined;
}>;
export declare const CancelAppointmentSchema: z.ZodObject<{
    cancellation_reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    cancellation_reason: string;
}, {
    cancellation_reason: string;
}>;
export declare const ListAppointmentsSchema: z.ZodObject<{
    provider_id: z.ZodOptional<z.ZodString>;
    patient_id: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<[AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS, AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW]>>;
    appointment_type: z.ZodOptional<z.ZodEnum<[AppointmentType.TELECONSULTATION, AppointmentType.IN_PERSON, AppointmentType.HOME_VISIT]>>;
    start_date: z.ZodOptional<z.ZodEffects<z.ZodString, Date, string>>;
    end_date: z.ZodOptional<z.ZodEffects<z.ZodString, Date, string>>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    status?: AppointmentStatus | undefined;
    provider_id?: string | undefined;
    patient_id?: string | undefined;
    appointment_type?: AppointmentType | undefined;
    end_date?: Date | undefined;
    start_date?: Date | undefined;
}, {
    status?: AppointmentStatus | undefined;
    provider_id?: string | undefined;
    patient_id?: string | undefined;
    appointment_type?: AppointmentType | undefined;
    end_date?: string | undefined;
    start_date?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}>;
export declare const CreateAvailabilitySlotSchema: z.ZodEffects<z.ZodObject<{
    provider_id: z.ZodString;
    day_of_week: z.ZodNumber;
    start_time: z.ZodString;
    end_time: z.ZodString;
    capacity: z.ZodNumber;
    is_recurring: z.ZodDefault<z.ZodBoolean>;
    end_date: z.ZodOptional<z.ZodEffects<z.ZodString, Date, string>>;
}, "strip", z.ZodTypeAny, {
    provider_id: string;
    is_recurring: boolean;
    day_of_week: number;
    start_time: string;
    end_time: string;
    capacity: number;
    end_date?: Date | undefined;
}, {
    provider_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    capacity: number;
    is_recurring?: boolean | undefined;
    end_date?: string | undefined;
}>, {
    provider_id: string;
    is_recurring: boolean;
    day_of_week: number;
    start_time: string;
    end_time: string;
    capacity: number;
    end_date?: Date | undefined;
}, {
    provider_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    capacity: number;
    is_recurring?: boolean | undefined;
    end_date?: string | undefined;
}>;
export declare const UpdateAvailabilitySlotSchema: z.ZodEffects<z.ZodObject<{
    day_of_week: z.ZodOptional<z.ZodNumber>;
    start_time: z.ZodOptional<z.ZodString>;
    end_time: z.ZodOptional<z.ZodString>;
    capacity: z.ZodOptional<z.ZodNumber>;
    is_active: z.ZodOptional<z.ZodBoolean>;
    end_date: z.ZodOptional<z.ZodEffects<z.ZodString, Date, string>>;
}, "strip", z.ZodTypeAny, {
    day_of_week?: number | undefined;
    is_active?: boolean | undefined;
    start_time?: string | undefined;
    end_time?: string | undefined;
    capacity?: number | undefined;
    end_date?: Date | undefined;
}, {
    day_of_week?: number | undefined;
    is_active?: boolean | undefined;
    start_time?: string | undefined;
    end_time?: string | undefined;
    capacity?: number | undefined;
    end_date?: string | undefined;
}>, {
    day_of_week?: number | undefined;
    is_active?: boolean | undefined;
    start_time?: string | undefined;
    end_time?: string | undefined;
    capacity?: number | undefined;
    end_date?: Date | undefined;
}, {
    day_of_week?: number | undefined;
    is_active?: boolean | undefined;
    start_time?: string | undefined;
    end_time?: string | undefined;
    capacity?: number | undefined;
    end_date?: string | undefined;
}>;
export declare const ListAvailabilitySlotsSchema: z.ZodObject<{
    provider_id: z.ZodOptional<z.ZodString>;
    day_of_week: z.ZodOptional<z.ZodNumber>;
    is_active: z.ZodOptional<z.ZodBoolean>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    provider_id?: string | undefined;
    day_of_week?: number | undefined;
    is_active?: boolean | undefined;
}, {
    provider_id?: string | undefined;
    day_of_week?: number | undefined;
    is_active?: boolean | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}>;
export declare const CreateReminderSchema: z.ZodObject<{
    appointment_id: z.ZodString;
    reminder_type: z.ZodEnum<[ReminderType.EMAIL, ReminderType.SMS, ReminderType.IN_APP, ReminderType.NOTIFICATION]>;
    hours_before_start: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    appointment_id: string;
    reminder_type: ReminderType;
    hours_before_start: number;
}, {
    appointment_id: string;
    reminder_type: ReminderType;
    hours_before_start: number;
}>;
export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof UpdateAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof CancelAppointmentSchema>;
export type ListAppointmentsInput = z.infer<typeof ListAppointmentsSchema>;
export type CreateAvailabilitySlotInput = z.infer<typeof CreateAvailabilitySlotSchema>;
export type UpdateAvailabilitySlotInput = z.infer<typeof UpdateAvailabilitySlotSchema>;
export type ListAvailabilitySlotsInput = z.infer<typeof ListAvailabilitySlotsSchema>;
export type CreateReminderInput = z.infer<typeof CreateReminderSchema>;
//# sourceMappingURL=appointment.validators.d.ts.map