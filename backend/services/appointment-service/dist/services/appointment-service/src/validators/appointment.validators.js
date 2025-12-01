"use strict";
/**
 * Appointment Validators
 * Input validation schemas using Zod
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateReminderSchema = exports.ListAvailabilitySlotsSchema = exports.UpdateAvailabilitySlotSchema = exports.CreateAvailabilitySlotSchema = exports.ListAppointmentsSchema = exports.CancelAppointmentSchema = exports.UpdateAppointmentSchema = exports.CreateAppointmentSchema = void 0;
const zod_1 = require("zod");
const appointment_types_1 = require("../types/appointment.types");
// ============================================================================
// Appointment Validators
// ============================================================================
exports.CreateAppointmentSchema = zod_1.z.object({
    provider_id: zod_1.z.string().uuid('Invalid provider ID'),
    patient_id: zod_1.z.string().uuid('Invalid patient ID'),
    appointment_type: zod_1.z.enum([
        appointment_types_1.AppointmentType.TELECONSULTATION,
        appointment_types_1.AppointmentType.IN_PERSON,
        appointment_types_1.AppointmentType.HOME_VISIT,
    ]),
    scheduled_start: zod_1.z.string().datetime().transform((str) => new Date(str)),
    scheduled_end: zod_1.z.string().datetime().transform((str) => new Date(str)),
    reason: zod_1.z.string().max(500).optional(),
    notes: zod_1.z.string().optional(),
    location: zod_1.z.string().max(500).optional(),
});
exports.UpdateAppointmentSchema = zod_1.z.object({
    appointment_type: zod_1.z
        .enum([
        appointment_types_1.AppointmentType.TELECONSULTATION,
        appointment_types_1.AppointmentType.IN_PERSON,
        appointment_types_1.AppointmentType.HOME_VISIT,
    ])
        .optional(),
    scheduled_start: zod_1.z
        .string()
        .datetime()
        .transform((str) => new Date(str))
        .optional(),
    scheduled_end: zod_1.z
        .string()
        .datetime()
        .transform((str) => new Date(str))
        .optional(),
    reason: zod_1.z.string().max(500).optional(),
    notes: zod_1.z.string().optional(),
    location: zod_1.z.string().max(500).optional(),
    status: zod_1.z
        .enum([
        appointment_types_1.AppointmentStatus.PENDING,
        appointment_types_1.AppointmentStatus.CONFIRMED,
        appointment_types_1.AppointmentStatus.IN_PROGRESS,
        appointment_types_1.AppointmentStatus.COMPLETED,
        appointment_types_1.AppointmentStatus.CANCELLED,
        appointment_types_1.AppointmentStatus.NO_SHOW,
    ])
        .optional(),
});
exports.CancelAppointmentSchema = zod_1.z.object({
    cancellation_reason: zod_1.z.string().max(500),
});
exports.ListAppointmentsSchema = zod_1.z.object({
    provider_id: zod_1.z.string().uuid().optional(),
    patient_id: zod_1.z.string().uuid().optional(),
    status: zod_1.z
        .enum([
        appointment_types_1.AppointmentStatus.PENDING,
        appointment_types_1.AppointmentStatus.CONFIRMED,
        appointment_types_1.AppointmentStatus.IN_PROGRESS,
        appointment_types_1.AppointmentStatus.COMPLETED,
        appointment_types_1.AppointmentStatus.CANCELLED,
        appointment_types_1.AppointmentStatus.NO_SHOW,
    ])
        .optional(),
    appointment_type: zod_1.z
        .enum([
        appointment_types_1.AppointmentType.TELECONSULTATION,
        appointment_types_1.AppointmentType.IN_PERSON,
        appointment_types_1.AppointmentType.HOME_VISIT,
    ])
        .optional(),
    start_date: zod_1.z
        .string()
        .datetime()
        .transform((str) => new Date(str))
        .optional(),
    end_date: zod_1.z
        .string()
        .datetime()
        .transform((str) => new Date(str))
        .optional(),
    page: zod_1.z.number().int().positive().default(1),
    limit: zod_1.z.number().int().positive().max(100).default(20),
});
// ============================================================================
// Availability Slot Validators
// ============================================================================
exports.CreateAvailabilitySlotSchema = zod_1.z
    .object({
    provider_id: zod_1.z.string().uuid('Invalid provider ID'),
    day_of_week: zod_1.z.number().int().min(0).max(6),
    start_time: zod_1.z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
    end_time: zod_1.z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
    capacity: zod_1.z.number().int().positive(),
    is_recurring: zod_1.z.boolean().default(true),
    end_date: zod_1.z
        .string()
        .date()
        .transform((str) => new Date(str))
        .optional(),
})
    .refine((data) => {
    // Ensure end_time is after start_time
    const [startHour, startMin] = data.start_time.split(':').map(Number);
    const [endHour, endMin] = data.end_time.split(':').map(Number);
    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;
    return endTotalMin > startTotalMin;
}, {
    message: 'End time must be after start time',
    path: ['end_time'],
});
exports.UpdateAvailabilitySlotSchema = zod_1.z
    .object({
    day_of_week: zod_1.z.number().int().min(0).max(6).optional(),
    start_time: zod_1.z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)')
        .optional(),
    end_time: zod_1.z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)')
        .optional(),
    capacity: zod_1.z.number().int().positive().optional(),
    is_active: zod_1.z.boolean().optional(),
    end_date: zod_1.z
        .string()
        .date()
        .transform((str) => new Date(str))
        .optional(),
})
    .refine((data) => {
    // If both times provided, ensure end_time is after start_time
    if (!data.start_time || !data.end_time) {
        return true;
    }
    const [startHour, startMin] = data.start_time.split(':').map(Number);
    const [endHour, endMin] = data.end_time.split(':').map(Number);
    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;
    return endTotalMin > startTotalMin;
}, {
    message: 'End time must be after start time',
    path: ['end_time'],
});
exports.ListAvailabilitySlotsSchema = zod_1.z.object({
    provider_id: zod_1.z.string().uuid().optional(),
    day_of_week: zod_1.z.number().int().min(0).max(6).optional(),
    is_active: zod_1.z.boolean().optional(),
    page: zod_1.z.number().int().positive().default(1),
    limit: zod_1.z.number().int().positive().max(100).default(20),
});
// ============================================================================
// Reminder Validators
// ============================================================================
exports.CreateReminderSchema = zod_1.z.object({
    appointment_id: zod_1.z.string().uuid('Invalid appointment ID'),
    reminder_type: zod_1.z.enum([
        appointment_types_1.ReminderType.EMAIL,
        appointment_types_1.ReminderType.SMS,
        appointment_types_1.ReminderType.IN_APP,
        appointment_types_1.ReminderType.NOTIFICATION,
    ]),
    hours_before_start: zod_1.z.number().int().positive().max(720), // Max 30 days
});
//# sourceMappingURL=appointment.validators.js.map