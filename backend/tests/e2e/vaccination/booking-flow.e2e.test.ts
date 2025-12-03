/**
 * E2E Tests for Vaccination Booking Workflow (T6-013)
 * Tests: Complete end-to-end booking flow from template creation to vaccination completion
 */

import request from 'supertest';
import { DataSource } from 'typeorm';
import { VaccinationSlotTemplate } from '../../../services/vaccination-service/src/entities/VaccinationSlotTemplate';
import { VaccinationSlot } from '../../../services/vaccination-service/src/entities/VaccinationSlot';
import { VaccinationBooking } from '../../../services/vaccination-service/src/entities/VaccinationBooking';
import { VaccineType } from '../../../services/vaccination-service/src/types/vaccination.types';

describe('Vaccination Booking - E2E Tests', () => {
  let dataSource: DataSource;
  let app: any;
  const baseUrl = '/api/v1';
  const pharmacyId = '00000000-0000-0000-0000-000000000001';
  const patientId = '00000000-0000-0000-0000-000000000100';
  let pharmacistToken: string;
  let patientToken: string;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USER || 'metapharm',
      password: process.env.DATABASE_PASSWORD || 'metapharm_dev_password',
      database: process.env.DATABASE_NAME || 'metapharm_test',
      entities: [VaccinationSlotTemplate, VaccinationSlot, VaccinationBooking],
      synchronize: false,
    });

    await dataSource.initialize();

    pharmacistToken = 'mock_pharmacist_token';
    patientToken = 'mock_patient_token';
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await dataSource.query('DELETE FROM vaccination_bookings');
    await dataSource.query('DELETE FROM vaccination_slots');
    await dataSource.query('DELETE FROM vaccination_slot_templates');
  });

  describe('Complete Booking Flow', () => {
    it('should complete full vaccination booking workflow', async () => {
      // Step 1: Pharmacist creates slot template
      const templateResponse = await request(app)
        .post(`${baseUrl}/pharmacies/${pharmacyId}/vaccination-slots/templates`)
        .set('Authorization', `Bearer ${pharmacistToken}`)
        .send({
          vaccine_type: VaccineType.COVID19,
          duration_minutes: 15,
          capacity: 2,
          day_of_week: 1, // Monday
          start_time: '09:00',
          end_time: '17:00',
          is_active: true,
        });

      expect(templateResponse.status).toBe(201);
      const templateId = templateResponse.body.data.id;

      // Step 2: Pharmacist generates slots for next week
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      const twoWeeksLater = new Date(nextWeek);
      twoWeeksLater.setDate(twoWeeksLater.getDate() + 7);

      const generateResponse = await request(app)
        .post(`${baseUrl}/vaccination-slots/templates/${templateId}/generate`)
        .set('Authorization', `Bearer ${pharmacistToken}`)
        .send({
          start_date: nextWeek.toISOString(),
          end_date: twoWeeksLater.toISOString(),
        });

      expect(generateResponse.status).toBe(201);
      expect(generateResponse.body.count).toBeGreaterThan(0);

      // Step 3: Patient checks availability
      const availabilityResponse = await request(app)
        .get(`${baseUrl}/pharmacies/${pharmacyId}/vaccination-slots/availability`)
        .query({
          start_date: nextWeek.toISOString(),
          end_date: twoWeeksLater.toISOString(),
          vaccine_type: VaccineType.COVID19,
          only_available: 'true',
        })
        .set('Authorization', `Bearer ${patientToken}`);

      expect(availabilityResponse.status).toBe(200);
      expect(availabilityResponse.body.data.length).toBeGreaterThan(0);

      const availableSlot = availabilityResponse.body.data[0];
      expect(availableSlot.available_spots).toBeGreaterThan(0);

      // Step 4: Patient books slot
      const bookingResponse = await request(app)
        .post(`${baseUrl}/vaccination-slots/${availableSlot.slot_id}/book`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          patient_id: patientId,
          vaccine_type: VaccineType.COVID19,
          notes: 'First dose - no allergies',
        });

      expect(bookingResponse.status).toBe(201);
      expect(bookingResponse.body.data.status).toBe('confirmed');
      const bookingId = bookingResponse.body.data.id;

      // Step 5: Patient views their bookings
      const myBookingsResponse = await request(app)
        .get(`${baseUrl}/vaccination-bookings`)
        .query({ patient_id: patientId })
        .set('Authorization', `Bearer ${patientToken}`);

      expect(myBookingsResponse.status).toBe(200);
      expect(myBookingsResponse.body.data.length).toBe(1);
      expect(myBookingsResponse.body.data[0].id).toBe(bookingId);

      // Step 6: Pharmacist checks in patient on appointment day
      const checkInResponse = await request(app)
        .post(`${baseUrl}/vaccination-bookings/${bookingId}/check-in`)
        .set('Authorization', `Bearer ${pharmacistToken}`);

      expect(checkInResponse.status).toBe(200);
      expect(checkInResponse.body.data.status).toBe('checked_in');
      expect(checkInResponse.body.data.checked_in_at).toBeDefined();

      // Step 7: Pharmacist marks vaccination as completed
      const completeResponse = await request(app)
        .post(`${baseUrl}/vaccination-bookings/${bookingId}/complete`)
        .set('Authorization', `Bearer ${pharmacistToken}`);

      expect(completeResponse.status).toBe(200);
      expect(completeResponse.body.data.status).toBe('completed');
      expect(completeResponse.body.data.completed_at).toBeDefined();

      // Step 8: Verify final state
      const finalBookingResponse = await request(app)
        .get(`${baseUrl}/vaccination-bookings/${bookingId}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(finalBookingResponse.status).toBe(200);
      expect(finalBookingResponse.body.data.status).toBe('completed');
    });
  });

  describe('Booking Cancellation Flow', () => {
    it('should handle booking cancellation workflow', async () => {
      // Create template
      const templateResponse = await request(app)
        .post(`${baseUrl}/pharmacies/${pharmacyId}/vaccination-slots/templates`)
        .set('Authorization', `Bearer ${pharmacistToken}`)
        .send({
          vaccine_type: VaccineType.INFLUENZA,
          duration_minutes: 20,
          capacity: 1,
          day_of_week: 2, // Tuesday
          start_time: '10:00',
          end_time: '16:00',
        });

      const templateId = templateResponse.body.data.id;

      // Generate slots
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const twoWeeksLater = new Date(nextWeek);
      twoWeeksLater.setDate(twoWeeksLater.getDate() + 7);

      await request(app)
        .post(`${baseUrl}/vaccination-slots/templates/${templateId}/generate`)
        .set('Authorization', `Bearer ${pharmacistToken}`)
        .send({
          start_date: nextWeek.toISOString(),
          end_date: twoWeeksLater.toISOString(),
        });

      // Check availability
      const availabilityResponse = await request(app)
        .get(`${baseUrl}/pharmacies/${pharmacyId}/vaccination-slots/availability`)
        .query({
          start_date: nextWeek.toISOString(),
          end_date: twoWeeksLater.toISOString(),
          only_available: 'true',
        })
        .set('Authorization', `Bearer ${patientToken}`);

      const slot = availabilityResponse.body.data[0];

      // Book slot
      const bookingResponse = await request(app)
        .post(`${baseUrl}/vaccination-slots/${slot.slot_id}/book`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          patient_id: patientId,
          vaccine_type: VaccineType.INFLUENZA,
        });

      const bookingId = bookingResponse.body.data.id;

      // Verify slot capacity decreased
      const slotBeforeCancellation = await request(app)
        .get(`${baseUrl}/vaccination-slots/${slot.slot_id}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(slotBeforeCancellation.body.data.booked_count).toBe(1);

      // Patient cancels booking
      const cancellationResponse = await request(app)
        .delete(`${baseUrl}/vaccination-bookings/${bookingId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          cancellation_reason: 'Unable to attend - rescheduling needed',
        });

      expect(cancellationResponse.status).toBe(200);
      expect(cancellationResponse.body.data.status).toBe('cancelled');
      expect(cancellationResponse.body.data.cancellation_reason).toBeDefined();

      // Verify slot capacity restored
      const slotAfterCancellation = await request(app)
        .get(`${baseUrl}/vaccination-slots/${slot.slot_id}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(slotAfterCancellation.body.data.booked_count).toBe(0);
      expect(slotAfterCancellation.body.data.available_spots).toBe(1);
    });
  });

  describe('Booking Rescheduling Flow', () => {
    it('should handle booking rescheduling workflow', async () => {
      // Create template
      const templateResponse = await request(app)
        .post(`${baseUrl}/pharmacies/${pharmacyId}/vaccination-slots/templates`)
        .set('Authorization', `Bearer ${pharmacistToken}`)
        .send({
          vaccine_type: VaccineType.HPV,
          duration_minutes: 30,
          capacity: 1,
          day_of_week: 3, // Wednesday
          start_time: '09:00',
          end_time: '17:00',
        });

      const templateId = templateResponse.body.data.id;

      // Generate slots
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const twoWeeksLater = new Date(nextWeek);
      twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);

      await request(app)
        .post(`${baseUrl}/vaccination-slots/templates/${templateId}/generate`)
        .set('Authorization', `Bearer ${pharmacistToken}`)
        .send({
          start_date: nextWeek.toISOString(),
          end_date: twoWeeksLater.toISOString(),
        });

      // Get available slots
      const availabilityResponse = await request(app)
        .get(`${baseUrl}/pharmacies/${pharmacyId}/vaccination-slots/availability`)
        .query({
          start_date: nextWeek.toISOString(),
          end_date: twoWeeksLater.toISOString(),
          only_available: 'true',
        })
        .set('Authorization', `Bearer ${patientToken}`);

      expect(availabilityResponse.body.data.length).toBeGreaterThanOrEqual(2);
      const firstSlot = availabilityResponse.body.data[0];
      const secondSlot = availabilityResponse.body.data[1];

      // Book first slot
      const bookingResponse = await request(app)
        .post(`${baseUrl}/vaccination-slots/${firstSlot.slot_id}/book`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          patient_id: patientId,
          vaccine_type: VaccineType.HPV,
        });

      const bookingId = bookingResponse.body.data.id;

      // Reschedule to second slot
      const rescheduleResponse = await request(app)
        .put(`${baseUrl}/vaccination-bookings/${bookingId}/reschedule`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          new_slot_id: secondSlot.slot_id,
        });

      expect(rescheduleResponse.status).toBe(200);
      expect(rescheduleResponse.body.data.slot_id).toBe(secondSlot.slot_id);

      // Verify old slot capacity restored
      const oldSlotResponse = await request(app)
        .get(`${baseUrl}/vaccination-slots/${firstSlot.slot_id}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(oldSlotResponse.body.data.booked_count).toBe(0);

      // Verify new slot capacity decreased
      const newSlotResponse = await request(app)
        .get(`${baseUrl}/vaccination-slots/${secondSlot.slot_id}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(newSlotResponse.body.data.booked_count).toBe(1);
    });
  });

  describe('Calendar and Analytics Flow', () => {
    it('should provide calendar view and statistics', async () => {
      // Create multiple templates for different vaccines
      const vaccines = [VaccineType.COVID19, VaccineType.INFLUENZA, VaccineType.HEPATITIS_B];

      for (const vaccine of vaccines) {
        await request(app)
          .post(`${baseUrl}/pharmacies/${pharmacyId}/vaccination-slots/templates`)
          .set('Authorization', `Bearer ${pharmacistToken}`)
          .send({
            vaccine_type: vaccine,
            duration_minutes: 15,
            capacity: 2,
            day_of_week: 1,
            start_time: '09:00',
            end_time: '17:00',
          });
      }

      // Generate slots for next month
      const startDate = new Date();
      startDate.setDate(1); // First of month
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);

      // Get calendar view
      const calendarResponse = await request(app)
        .get(`${baseUrl}/pharmacies/${pharmacyId}/vaccination-slots/calendar`)
        .query({
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        })
        .set('Authorization', `Bearer ${pharmacistToken}`);

      expect(calendarResponse.status).toBe(200);
      expect(calendarResponse.body.data).toBeInstanceOf(Array);
      expect(calendarResponse.body.data.length).toBeGreaterThan(0);

      // Each day should have structure
      const day = calendarResponse.body.data[0];
      expect(day).toMatchObject({
        date: expect.any(String),
        slots: expect.any(Array),
        total_slots: expect.any(Number),
        total_bookings: expect.any(Number),
      });

      // Get pharmacy statistics
      const statsResponse = await request(app)
        .get(`${baseUrl}/pharmacies/${pharmacyId}/vaccination-stats`)
        .set('Authorization', `Bearer ${pharmacistToken}`);

      expect(statsResponse.status).toBe(200);
      expect(statsResponse.body.data).toMatchObject({
        total_slots_this_month: expect.any(Number),
        total_bookings_this_month: expect.any(Number),
        completion_rate: expect.any(Number),
        no_show_rate: expect.any(Number),
        vaccine_type_breakdown: expect.any(Array),
      });
    });
  });

  describe('Error Scenarios', () => {
    it('should prevent overbooking', async () => {
      // Create template with capacity 1
      const templateResponse = await request(app)
        .post(`${baseUrl}/pharmacies/${pharmacyId}/vaccination-slots/templates`)
        .set('Authorization', `Bearer ${pharmacistToken}`)
        .send({
          vaccine_type: VaccineType.TETANUS,
          duration_minutes: 15,
          capacity: 1, // Only 1 spot
          day_of_week: 4,
          start_time: '10:00',
          end_time: '12:00',
        });

      // Generate slots
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const twoWeeksLater = new Date(nextWeek);
      twoWeeksLater.setDate(twoWeeksLater.getDate() + 7);

      await request(app)
        .post(`${baseUrl}/vaccination-slots/templates/${templateResponse.body.data.id}/generate`)
        .set('Authorization', `Bearer ${pharmacistToken}`)
        .send({
          start_date: nextWeek.toISOString(),
          end_date: twoWeeksLater.toISOString(),
        });

      // Get first available slot
      const availabilityResponse = await request(app)
        .get(`${baseUrl}/pharmacies/${pharmacyId}/vaccination-slots/availability`)
        .query({
          start_date: nextWeek.toISOString(),
          end_date: twoWeeksLater.toISOString(),
          only_available: 'true',
        })
        .set('Authorization', `Bearer ${patientToken}`);

      const slot = availabilityResponse.body.data[0];

      // First patient books successfully
      await request(app)
        .post(`${baseUrl}/vaccination-slots/${slot.slot_id}/book`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          patient_id: '00000000-0000-0000-0000-000000000201',
          vaccine_type: VaccineType.TETANUS,
        });

      // Second patient attempts to book same slot (should fail)
      const overbookingAttempt = await request(app)
        .post(`${baseUrl}/vaccination-slots/${slot.slot_id}/book`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          patient_id: '00000000-0000-0000-0000-000000000202',
          vaccine_type: VaccineType.TETANUS,
        });

      expect(overbookingAttempt.status).toBe(400);
      expect(overbookingAttempt.body.error).toContain('fully booked');
    });

    it('should prevent duplicate bookings by same patient', async () => {
      // Setup
      const templateResponse = await request(app)
        .post(`${baseUrl}/pharmacies/${pharmacyId}/vaccination-slots/templates`)
        .set('Authorization', `Bearer ${pharmacistToken}`)
        .send({
          vaccine_type: VaccineType.VARICELLA,
          duration_minutes: 15,
          capacity: 5,
          day_of_week: 5,
          start_time: '09:00',
          end_time: '17:00',
        });

      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const twoWeeksLater = new Date(nextWeek);
      twoWeeksLater.setDate(twoWeeksLater.getDate() + 7);

      await request(app)
        .post(`${baseUrl}/vaccination-slots/templates/${templateResponse.body.data.id}/generate`)
        .set('Authorization', `Bearer ${pharmacistToken}`)
        .send({
          start_date: nextWeek.toISOString(),
          end_date: twoWeeksLater.toISOString(),
        });

      const availabilityResponse = await request(app)
        .get(`${baseUrl}/pharmacies/${pharmacyId}/vaccination-slots/availability`)
        .query({
          start_date: nextWeek.toISOString(),
          end_date: twoWeeksLater.toISOString(),
          only_available: 'true',
        })
        .set('Authorization', `Bearer ${patientToken}`);

      const slot = availabilityResponse.body.data[0];

      // First booking succeeds
      await request(app)
        .post(`${baseUrl}/vaccination-slots/${slot.slot_id}/book`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          patient_id: patientId,
          vaccine_type: VaccineType.VARICELLA,
        });

      // Duplicate booking attempt fails
      const duplicateAttempt = await request(app)
        .post(`${baseUrl}/vaccination-slots/${slot.slot_id}/book`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          patient_id: patientId,
          vaccine_type: VaccineType.VARICELLA,
        });

      expect(duplicateAttempt.status).toBe(400);
      expect(duplicateAttempt.body.error).toContain('already has a booking');
    });
  });
});
