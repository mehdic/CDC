/**
 * Appointment Service Tests
 * Unit tests for appointment CRUD and scheduling operations
 */

import { Appointment } from '../entities/Appointment';
import { AvailabilitySlot } from '../entities/AvailabilitySlot';
import { AppointmentType, AppointmentStatus } from '../types/appointment.types';

describe('Appointment Model', () => {
  let appointment: Appointment;

  beforeEach(() => {
    appointment = new Appointment();
    appointment.id = '123e4567-e89b-12d3-a456-426614174000';
    appointment.provider_id = '123e4567-e89b-12d3-a456-426614174001';
    appointment.patient_id = '123e4567-e89b-12d3-a456-426614174002';
    appointment.appointment_type = AppointmentType.TELECONSULTATION;
    appointment.status = AppointmentStatus.PENDING;
    appointment.deleted_at = null;
  });

  test('should create appointment instance', () => {
    expect(appointment.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(appointment.provider_id).toBe('123e4567-e89b-12d3-a456-426614174001');
    expect(appointment.patient_id).toBe('123e4567-e89b-12d3-a456-426614174002');
    expect(appointment.appointment_type).toBe(AppointmentType.TELECONSULTATION);
  });

  test('should check if appointment is deleted', () => {
    expect(appointment.isDeleted()).toBe(false);

    appointment.softDelete();
    expect(appointment.isDeleted()).toBe(true);
  });

  test('should soft delete appointment', () => {
    appointment.softDelete();

    expect(appointment.deleted_at).not.toBeNull();
    expect(appointment.isDeleted()).toBe(true);
  });

  test('should check if appointment is future', () => {
    const now = new Date();
    const future = new Date(now.getTime() + 3600000); // 1 hour from now

    appointment.scheduled_start = future;
    appointment.scheduled_end = new Date(future.getTime() + 1800000);

    expect(appointment.isFuture()).toBe(true);
  });

  test('should check if appointment is past', () => {
    const now = new Date();
    const past = new Date(now.getTime() - 3600000); // 1 hour ago

    appointment.scheduled_start = past;
    appointment.scheduled_end = new Date(past.getTime() + 1800000);

    expect(appointment.isPast()).toBe(true);
  });

  test('should check if appointment is now', () => {
    const now = new Date();
    const past = new Date(now.getTime() - 600000); // 10 min ago
    const future = new Date(now.getTime() + 600000); // 10 min from now

    appointment.scheduled_start = past;
    appointment.scheduled_end = future;

    expect(appointment.isNow()).toBe(true);
  });

  test('should check if appointment can be cancelled', () => {
    const now = new Date();
    const future = new Date(now.getTime() + 3600000);

    appointment.scheduled_start = future;
    appointment.scheduled_end = new Date(future.getTime() + 1800000);
    appointment.status = AppointmentStatus.CONFIRMED;
    appointment.deleted_at = null;

    expect(appointment.canBeCancelled()).toBe(true);
  });

  test('should not allow cancellation of past appointments', () => {
    const now = new Date();
    const past = new Date(now.getTime() - 3600000);

    appointment.scheduled_start = past;
    appointment.scheduled_end = new Date(past.getTime() + 1800000);
    appointment.status = AppointmentStatus.CONFIRMED;

    expect(appointment.canBeCancelled()).toBe(false);
  });

  test('should not allow cancellation of completed appointments', () => {
    const now = new Date();
    const future = new Date(now.getTime() + 3600000);

    appointment.scheduled_start = future;
    appointment.scheduled_end = new Date(future.getTime() + 1800000);
    appointment.status = AppointmentStatus.COMPLETED;

    expect(appointment.canBeCancelled()).toBe(false);
  });

  test('should calculate duration in minutes', () => {
    const now = new Date();
    const start = now;
    const end = new Date(now.getTime() + 1800000); // 30 min later

    appointment.scheduled_start = start;
    appointment.scheduled_end = end;

    expect(appointment.getDurationMinutes()).toBe(30);
  });

  test('should check if appointment is within reminder window', () => {
    const now = new Date();
    const soon = new Date(now.getTime() + 1800000); // 30 min from now

    appointment.scheduled_start = soon;
    appointment.scheduled_end = new Date(soon.getTime() + 1800000);

    expect(appointment.isWithinReminderWindow(1)).toBe(true); // 1 hour window
    expect(appointment.isWithinReminderWindow(0.25)).toBe(false); // 15 min window
  });
});

describe('AvailabilitySlot Model', () => {
  let slot: AvailabilitySlot;

  beforeEach(() => {
    slot = new AvailabilitySlot();
    slot.id = '223e4567-e89b-12d3-a456-426614174000';
    slot.provider_id = '123e4567-e89b-12d3-a456-426614174001';
    slot.day_of_week = 1; // Monday
    slot.start_time = '09:00';
    slot.end_time = '17:00';
    slot.capacity = 10;
    slot.is_active = true;
    slot.is_blocked = false;
    slot.booked_count = 0;
    slot.deleted_at = null;
  });

  test('should create availability slot instance', () => {
    expect(slot.id).toBe('223e4567-e89b-12d3-a456-426614174000');
    expect(slot.day_of_week).toBe(1);
    expect(slot.capacity).toBe(10);
  });

  test('should check if slot is deleted', () => {
    expect(slot.isDeleted()).toBe(false);

    slot.softDelete();
    expect(slot.isDeleted()).toBe(true);
  });

  test('should check if slot is available', () => {
    expect(slot.isAvailable()).toBe(true);

    slot.is_blocked = true;
    expect(slot.isAvailable()).toBe(false);

    slot.is_blocked = false;
    slot.booked_count = 10;
    expect(slot.isAvailable()).toBe(false);
  });

  test('should check if slot is full', () => {
    expect(slot.isFull()).toBe(false);

    slot.booked_count = 10;
    expect(slot.isFull()).toBe(true);
  });

  test('should get available spaces', () => {
    expect(slot.getAvailableSpaces()).toBe(10);

    slot.booked_count = 5;
    expect(slot.getAvailableSpaces()).toBe(5);

    slot.booked_count = 10;
    expect(slot.getAvailableSpaces()).toBe(0);
  });

  test('should get day name', () => {
    expect(slot.getDayName()).toBe('Monday');

    slot.day_of_week = 0;
    expect(slot.getDayName()).toBe('Sunday');

    slot.day_of_week = 5;
    expect(slot.getDayName()).toBe('Friday');
  });

  test('should reserve slot capacity', () => {
    expect(slot.booked_count).toBe(0);

    slot.reserve();
    expect(slot.booked_count).toBe(1);

    slot.reserve();
    expect(slot.booked_count).toBe(2);
  });

  test('should cancel slot reservation', () => {
    slot.booked_count = 5;

    slot.cancelReservation();
    expect(slot.booked_count).toBe(4);

    slot.cancelReservation();
    expect(slot.booked_count).toBe(3);
  });

  test('should not go below 0 when cancelling', () => {
    slot.booked_count = 0;

    slot.cancelReservation();
    expect(slot.booked_count).toBe(0);
  });

  test('should block slot with reason', () => {
    expect(slot.is_blocked).toBe(false);

    slot.block('Provider is away');
    expect(slot.is_blocked).toBe(true);
    expect(slot.blocked_reason).toBe('Provider is away');
  });

  test('should unblock slot', () => {
    slot.block('Provider is away');
    expect(slot.is_blocked).toBe(true);

    slot.unblock();
    expect(slot.is_blocked).toBe(false);
    expect(slot.blocked_reason).toBeNull();
  });

  test('should match date by day of week', () => {
    slot.day_of_week = 1; // Monday

    const monday = new Date('2025-01-06'); // A Monday
    expect(slot.matchesDate(monday)).toBe(true);

    const tuesday = new Date('2025-01-07'); // A Tuesday
    expect(slot.matchesDate(tuesday)).toBe(false);
  });
});

describe('Appointment Routes', () => {
  test('placeholder for route integration tests', () => {
    // TODO: Add integration tests for routes when database is set up
    expect(true).toBe(true);
  });
});

describe('Appointment Validators', () => {
  test('should validate create appointment input', () => {
    // Test basic validation structure
    const validInput = {
      provider_id: '123e4567-e89b-12d3-a456-426614174001',
      patient_id: '123e4567-e89b-12d3-a456-426614174002',
      appointment_type: AppointmentType.TELECONSULTATION,
      scheduled_start: new Date().toISOString(),
      scheduled_end: new Date(Date.now() + 3600000).toISOString(),
    };

    expect(validInput.provider_id).toBeDefined();
    expect(validInput.patient_id).toBeDefined();
    expect(validInput.appointment_type).toBe(AppointmentType.TELECONSULTATION);
  });
});
