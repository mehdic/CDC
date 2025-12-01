/**
 * Appointment Validators
 * Input validation schemas using Zod
 */

import { z } from 'zod';
import { AppointmentType, AppointmentStatus, ReminderType } from '../types/appointment.types';

// ============================================================================
// Appointment Validators
// ============================================================================

export const CreateAppointmentSchema = z.object({
  provider_id: z.string().uuid('Invalid provider ID'),
  patient_id: z.string().uuid('Invalid patient ID'),
  appointment_type: z.enum([
    AppointmentType.TELECONSULTATION,
    AppointmentType.IN_PERSON,
    AppointmentType.HOME_VISIT,
  ]),
  scheduled_start: z.string().datetime().transform((str) => new Date(str)),
  scheduled_end: z.string().datetime().transform((str) => new Date(str)),
  reason: z.string().max(500).optional(),
  notes: z.string().optional(),
  location: z.string().max(500).optional(),
});

export const UpdateAppointmentSchema = z.object({
  appointment_type: z
    .enum([
      AppointmentType.TELECONSULTATION,
      AppointmentType.IN_PERSON,
      AppointmentType.HOME_VISIT,
    ])
    .optional(),
  scheduled_start: z
    .string()
    .datetime()
    .transform((str) => new Date(str))
    .optional(),
  scheduled_end: z
    .string()
    .datetime()
    .transform((str) => new Date(str))
    .optional(),
  reason: z.string().max(500).optional(),
  notes: z.string().optional(),
  location: z.string().max(500).optional(),
  status: z
    .enum([
      AppointmentStatus.PENDING,
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.IN_PROGRESS,
      AppointmentStatus.COMPLETED,
      AppointmentStatus.CANCELLED,
      AppointmentStatus.NO_SHOW,
    ])
    .optional(),
});

export const CancelAppointmentSchema = z.object({
  cancellation_reason: z.string().max(500),
});

export const ListAppointmentsSchema = z.object({
  provider_id: z.string().uuid().optional(),
  patient_id: z.string().uuid().optional(),
  status: z
    .enum([
      AppointmentStatus.PENDING,
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.IN_PROGRESS,
      AppointmentStatus.COMPLETED,
      AppointmentStatus.CANCELLED,
      AppointmentStatus.NO_SHOW,
    ])
    .optional(),
  appointment_type: z
    .enum([
      AppointmentType.TELECONSULTATION,
      AppointmentType.IN_PERSON,
      AppointmentType.HOME_VISIT,
    ])
    .optional(),
  start_date: z
    .string()
    .datetime()
    .transform((str) => new Date(str))
    .optional(),
  end_date: z
    .string()
    .datetime()
    .transform((str) => new Date(str))
    .optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

// ============================================================================
// Availability Slot Validators
// ============================================================================

export const CreateAvailabilitySlotSchema = z
  .object({
    provider_id: z.string().uuid('Invalid provider ID'),
    day_of_week: z.number().int().min(0).max(6),
    start_time: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
    end_time: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
    capacity: z.number().int().positive(),
    is_recurring: z.boolean().default(true),
    end_date: z
      .string()
      .date()
      .transform((str) => new Date(str))
      .optional(),
  })
  .refine(
    (data) => {
      // Ensure end_time is after start_time
      const [startHour, startMin] = data.start_time.split(':').map(Number);
      const [endHour, endMin] = data.end_time.split(':').map(Number);
      const startTotalMin = startHour * 60 + startMin;
      const endTotalMin = endHour * 60 + endMin;
      return endTotalMin > startTotalMin;
    },
    {
      message: 'End time must be after start time',
      path: ['end_time'],
    }
  );

export const UpdateAvailabilitySlotSchema = z
  .object({
    day_of_week: z.number().int().min(0).max(6).optional(),
    start_time: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)')
      .optional(),
    end_time: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)')
      .optional(),
    capacity: z.number().int().positive().optional(),
    is_active: z.boolean().optional(),
    end_date: z
      .string()
      .date()
      .transform((str) => new Date(str))
      .optional(),
  })
  .refine(
    (data) => {
      // If both times provided, ensure end_time is after start_time
      if (!data.start_time || !data.end_time) {
        return true;
      }
      const [startHour, startMin] = data.start_time.split(':').map(Number);
      const [endHour, endMin] = data.end_time.split(':').map(Number);
      const startTotalMin = startHour * 60 + startMin;
      const endTotalMin = endHour * 60 + endMin;
      return endTotalMin > startTotalMin;
    },
    {
      message: 'End time must be after start time',
      path: ['end_time'],
    }
  );

export const ListAvailabilitySlotsSchema = z.object({
  provider_id: z.string().uuid().optional(),
  day_of_week: z.number().int().min(0).max(6).optional(),
  is_active: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

// ============================================================================
// Reminder Validators
// ============================================================================

export const CreateReminderSchema = z.object({
  appointment_id: z.string().uuid('Invalid appointment ID'),
  reminder_type: z.enum([
    ReminderType.EMAIL,
    ReminderType.SMS,
    ReminderType.IN_APP,
    ReminderType.NOTIFICATION,
  ]),
  hours_before_start: z.number().int().positive().max(720), // Max 30 days
});

// ============================================================================
// Export Types
// ============================================================================

export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof UpdateAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof CancelAppointmentSchema>;
export type ListAppointmentsInput = z.infer<typeof ListAppointmentsSchema>;
export type CreateAvailabilitySlotInput = z.infer<
  typeof CreateAvailabilitySlotSchema
>;
export type UpdateAvailabilitySlotInput = z.infer<
  typeof UpdateAvailabilitySlotSchema
>;
export type ListAvailabilitySlotsInput = z.infer<
  typeof ListAvailabilitySlotsSchema
>;
export type CreateReminderInput = z.infer<typeof CreateReminderSchema>;
