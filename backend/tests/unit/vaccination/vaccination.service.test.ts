/**
 * Unit Tests for Vaccination Service (T6-013)
 * Tests: Slot template CRUD, slot generation, booking logic, capacity tracking
 */

import { DataSource, Repository } from 'typeorm';
import { VaccinationService } from '../../../services/vaccination-service/src/services/vaccination.service';
import { VaccinationSlotTemplate } from '../../../services/vaccination-service/src/entities/VaccinationSlotTemplate';
import { VaccinationSlot } from '../../../services/vaccination-service/src/entities/VaccinationSlot';
import { VaccinationBooking } from '../../../services/vaccination-service/src/entities/VaccinationBooking';
import {
  VaccineType,
  VaccinationSlotStatus,
  BookingStatus,
} from '../../../services/vaccination-service/src/types/vaccination.types';

describe('VaccinationService - Unit Tests', () => {
  let dataSource: DataSource;
  let service: VaccinationService;
  let templateRepo: Repository<VaccinationSlotTemplate>;
  let slotRepo: Repository<VaccinationSlot>;
  let bookingRepo: Repository<VaccinationBooking>;

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

    templateRepo = dataSource.getRepository(VaccinationSlotTemplate);
    slotRepo = dataSource.getRepository(VaccinationSlot);
    bookingRepo = dataSource.getRepository(VaccinationBooking);

    service = new VaccinationService(templateRepo, slotRepo, bookingRepo);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    // Clean up tables
    await bookingRepo.query('DELETE FROM vaccination_bookings');
    await slotRepo.query('DELETE FROM vaccination_slots');
    await templateRepo.query('DELETE FROM vaccination_slot_templates');
  });

  describe('Slot Template Creation', () => {
    it('should create a vaccination slot template successfully', async () => {
      const input = {
        pharmacy_id: '00000000-0000-0000-0000-000000000001',
        vaccine_type: VaccineType.COVID19,
        duration_minutes: 15,
        capacity: 2,
        day_of_week: 1, // Monday
        start_time: '09:00',
        end_time: '17:00',
        is_active: true,
      };

      const template = await service.createSlotTemplate(input);

      expect(template).toBeDefined();
      expect(template.id).toBeDefined();
      expect(template.vaccine_type).toBe(VaccineType.COVID19);
      expect(template.duration_minutes).toBe(15);
      expect(template.capacity).toBe(2);
      expect(template.day_of_week).toBe(1);
      expect(template.is_active).toBe(true);
    });

    it('should reject invalid time range (end before start)', async () => {
      const input = {
        pharmacy_id: '00000000-0000-0000-0000-000000000001',
        vaccine_type: VaccineType.INFLUENZA,
        duration_minutes: 15,
        capacity: 1,
        day_of_week: 2,
        start_time: '17:00',
        end_time: '09:00', // Invalid: end before start
      };

      await expect(service.createSlotTemplate(input)).rejects.toThrow(
        'End time must be after start time'
      );
    });

    it('should reject invalid day of week', async () => {
      const input = {
        pharmacy_id: '00000000-0000-0000-0000-000000000001',
        vaccine_type: VaccineType.HEPATITIS_B,
        duration_minutes: 20,
        capacity: 1,
        day_of_week: 7, // Invalid: must be 0-6
        start_time: '09:00',
        end_time: '17:00',
      };

      await expect(service.createSlotTemplate(input)).rejects.toThrow(
        'Day of week must be between 0'
      );
    });

    it('should reject invalid duration', async () => {
      const input = {
        pharmacy_id: '00000000-0000-0000-0000-000000000001',
        vaccine_type: VaccineType.HPV,
        duration_minutes: 200, // Invalid: too long
        capacity: 1,
        day_of_week: 3,
        start_time: '09:00',
        end_time: '17:00',
      };

      await expect(service.createSlotTemplate(input)).rejects.toThrow(
        'Duration must be between'
      );
    });

    it('should reject invalid capacity', async () => {
      const input = {
        pharmacy_id: '00000000-0000-0000-0000-000000000001',
        vaccine_type: VaccineType.PNEUMOCOCCAL,
        duration_minutes: 15,
        capacity: 15, // Invalid: too high
        day_of_week: 4,
        start_time: '09:00',
        end_time: '17:00',
      };

      await expect(service.createSlotTemplate(input)).rejects.toThrow(
        'Capacity must be between'
      );
    });
  });

  describe('Slot Template Retrieval', () => {
    let template: VaccinationSlotTemplate;

    beforeEach(async () => {
      template = await service.createSlotTemplate({
        pharmacy_id: '00000000-0000-0000-0000-000000000001',
        vaccine_type: VaccineType.COVID19,
        duration_minutes: 15,
        capacity: 2,
        day_of_week: 1,
        start_time: '09:00',
        end_time: '17:00',
      });
    });

    it('should retrieve template by ID', async () => {
      const retrieved = await service.getSlotTemplate(template.id);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(template.id);
      expect(retrieved.vaccine_type).toBe(VaccineType.COVID19);
    });

    it('should retrieve all templates for a pharmacy', async () => {
      // Create another template
      await service.createSlotTemplate({
        pharmacy_id: '00000000-0000-0000-0000-000000000001',
        vaccine_type: VaccineType.INFLUENZA,
        duration_minutes: 20,
        capacity: 1,
        day_of_week: 2,
        start_time: '10:00',
        end_time: '16:00',
      });

      const templates = await service.getPharmacySlotTemplates(
        '00000000-0000-0000-0000-000000000001'
      );

      expect(templates.length).toBe(2);
      expect(templates.map((t) => t.vaccine_type).sort()).toEqual([
        VaccineType.COVID19,
        VaccineType.INFLUENZA,
      ]);
    });

    it('should throw error for non-existent template', async () => {
      await expect(
        service.getSlotTemplate('00000000-0000-0000-0000-999999999999')
      ).rejects.toThrow('not found');
    });
  });

  describe('Slot Template Update', () => {
    let template: VaccinationSlotTemplate;

    beforeEach(async () => {
      template = await service.createSlotTemplate({
        pharmacy_id: '00000000-0000-0000-0000-000000000001',
        vaccine_type: VaccineType.COVID19,
        duration_minutes: 15,
        capacity: 2,
        day_of_week: 1,
        start_time: '09:00',
        end_time: '17:00',
      });
    });

    it('should update template duration', async () => {
      const updated = await service.updateSlotTemplate(template.id, {
        duration_minutes: 30,
      });

      expect(updated.duration_minutes).toBe(30);
    });

    it('should update template capacity', async () => {
      const updated = await service.updateSlotTemplate(template.id, {
        capacity: 4,
      });

      expect(updated.capacity).toBe(4);
    });

    it('should update template time range', async () => {
      const updated = await service.updateSlotTemplate(template.id, {
        start_time: '10:00',
        end_time: '18:00',
      });

      expect(updated.start_time).toBe('10:00');
      expect(updated.end_time).toBe('18:00');
    });

    it('should deactivate template', async () => {
      const updated = await service.updateSlotTemplate(template.id, {
        is_active: false,
      });

      expect(updated.is_active).toBe(false);
    });
  });

  describe('Slot Template Deletion', () => {
    it('should soft delete template without future slots', async () => {
      const template = await service.createSlotTemplate({
        pharmacy_id: '00000000-0000-0000-0000-000000000001',
        vaccine_type: VaccineType.COVID19,
        duration_minutes: 15,
        capacity: 2,
        day_of_week: 1,
        start_time: '09:00',
        end_time: '17:00',
      });

      await service.deleteSlotTemplate(template.id);

      await expect(service.getSlotTemplate(template.id)).rejects.toThrow(
        'not found'
      );
    });
  });

  describe('Booking Creation', () => {
    let slot: VaccinationSlot;

    beforeEach(async () => {
      // Create template
      const template = await service.createSlotTemplate({
        pharmacy_id: '00000000-0000-0000-0000-000000000001',
        vaccine_type: VaccineType.COVID19,
        duration_minutes: 15,
        capacity: 2,
        day_of_week: 1,
        start_time: '09:00',
        end_time: '17:00',
      });

      // Create slot manually for testing
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const slotEnd = new Date(tomorrow);
      slotEnd.setMinutes(slotEnd.getMinutes() + 15);

      slot = slotRepo.create({
        template_id: template.id,
        pharmacy_id: template.pharmacy_id,
        slot_date: tomorrow,
        start_time: tomorrow,
        end_time: slotEnd,
        capacity: 2,
        booked_count: 0,
        status: VaccinationSlotStatus.AVAILABLE,
      });

      await slotRepo.save(slot);
    });

    it('should create booking successfully', async () => {
      const bookingData = {
        slot_id: slot.id,
        patient_id: '00000000-0000-0000-0000-000000000010',
        vaccine_type: VaccineType.COVID19,
        notes: 'First dose',
      };

      const booking = await service.createBooking(bookingData);

      expect(booking).toBeDefined();
      expect(booking.id).toBeDefined();
      expect(booking.slot_id).toBe(slot.id);
      expect(booking.patient_id).toBe(bookingData.patient_id);
      expect(booking.status).toBe(BookingStatus.CONFIRMED);
    });

    it('should increment slot booked count after booking', async () => {
      const bookingData = {
        slot_id: slot.id,
        patient_id: '00000000-0000-0000-0000-000000000010',
        vaccine_type: VaccineType.COVID19,
      };

      await service.createBooking(bookingData);

      const updatedSlot = await slotRepo.findOne({ where: { id: slot.id } });
      expect(updatedSlot!.booked_count).toBe(1);
    });

    it('should reject booking when slot is fully booked', async () => {
      // Fill capacity (2)
      await service.createBooking({
        slot_id: slot.id,
        patient_id: '00000000-0000-0000-0000-000000000010',
        vaccine_type: VaccineType.COVID19,
      });

      await service.createBooking({
        slot_id: slot.id,
        patient_id: '00000000-0000-0000-0000-000000000011',
        vaccine_type: VaccineType.COVID19,
      });

      // Try to book third (should fail)
      await expect(
        service.createBooking({
          slot_id: slot.id,
          patient_id: '00000000-0000-0000-0000-000000000012',
          vaccine_type: VaccineType.COVID19,
        })
      ).rejects.toThrow('fully booked');
    });

    it('should reject duplicate booking for same patient', async () => {
      const patientId = '00000000-0000-0000-0000-000000000010';

      await service.createBooking({
        slot_id: slot.id,
        patient_id: patientId,
        vaccine_type: VaccineType.COVID19,
      });

      await expect(
        service.createBooking({
          slot_id: slot.id,
          patient_id: patientId,
          vaccine_type: VaccineType.COVID19,
        })
      ).rejects.toThrow('already has a booking');
    });
  });

  describe('Booking Cancellation', () => {
    let slot: VaccinationSlot;
    let booking: VaccinationBooking;

    beforeEach(async () => {
      // Create template and slot
      const template = await service.createSlotTemplate({
        pharmacy_id: '00000000-0000-0000-0000-000000000001',
        vaccine_type: VaccineType.INFLUENZA,
        duration_minutes: 20,
        capacity: 1,
        day_of_week: 2,
        start_time: '10:00',
        end_time: '16:00',
      });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(11, 0, 0, 0);

      const slotEnd = new Date(tomorrow);
      slotEnd.setMinutes(slotEnd.getMinutes() + 20);

      slot = slotRepo.create({
        template_id: template.id,
        pharmacy_id: template.pharmacy_id,
        slot_date: tomorrow,
        start_time: tomorrow,
        end_time: slotEnd,
        capacity: 1,
        booked_count: 0,
        status: VaccinationSlotStatus.AVAILABLE,
      });

      await slotRepo.save(slot);

      booking = await service.createBooking({
        slot_id: slot.id,
        patient_id: '00000000-0000-0000-0000-000000000020',
        vaccine_type: VaccineType.INFLUENZA,
      });
    });

    it('should cancel booking successfully', async () => {
      const cancelled = await service.cancelBooking(booking.id, {
        cancellation_reason: 'Patient request',
      });

      expect(cancelled.status).toBe(BookingStatus.CANCELLED);
      expect(cancelled.cancellation_reason).toBe('Patient request');
      expect(cancelled.cancelled_at).toBeDefined();
    });

    it('should release slot capacity after cancellation', async () => {
      await service.cancelBooking(booking.id, {
        cancellation_reason: 'Test',
      });

      const updatedSlot = await slotRepo.findOne({ where: { id: slot.id } });
      expect(updatedSlot!.booked_count).toBe(0);
    });
  });

  describe('Booking Rescheduling', () => {
    let slot1: VaccinationSlot;
    let slot2: VaccinationSlot;
    let booking: VaccinationBooking;

    beforeEach(async () => {
      // Create template
      const template = await service.createSlotTemplate({
        pharmacy_id: '00000000-0000-0000-0000-000000000001',
        vaccine_type: VaccineType.HPV,
        duration_minutes: 30,
        capacity: 1,
        day_of_week: 3,
        start_time: '09:00',
        end_time: '17:00',
      });

      // Create two slots
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      slot1 = slotRepo.create({
        template_id: template.id,
        pharmacy_id: template.pharmacy_id,
        slot_date: tomorrow,
        start_time: new Date(tomorrow),
        end_time: new Date(tomorrow.getTime() + 30 * 60000),
        capacity: 1,
        booked_count: 0,
        status: VaccinationSlotStatus.AVAILABLE,
      });

      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      slot2 = slotRepo.create({
        template_id: template.id,
        pharmacy_id: template.pharmacy_id,
        slot_date: dayAfter,
        start_time: new Date(dayAfter),
        end_time: new Date(dayAfter.getTime() + 30 * 60000),
        capacity: 1,
        booked_count: 0,
        status: VaccinationSlotStatus.AVAILABLE,
      });

      await slotRepo.save([slot1, slot2]);

      // Create booking in slot1
      booking = await service.createBooking({
        slot_id: slot1.id,
        patient_id: '00000000-0000-0000-0000-000000000030',
        vaccine_type: VaccineType.HPV,
      });
    });

    it('should reschedule booking to new slot', async () => {
      const rescheduled = await service.rescheduleBooking(booking.id, {
        new_slot_id: slot2.id,
      });

      expect(rescheduled.slot_id).toBe(slot2.id);
    });

    it('should update both slot capacities after rescheduling', async () => {
      await service.rescheduleBooking(booking.id, {
        new_slot_id: slot2.id,
      });

      const updatedSlot1 = await slotRepo.findOne({ where: { id: slot1.id } });
      const updatedSlot2 = await slotRepo.findOne({ where: { id: slot2.id } });

      expect(updatedSlot1!.booked_count).toBe(0); // Released
      expect(updatedSlot2!.booked_count).toBe(1); // Booked
    });

    it('should reject rescheduling to fully booked slot', async () => {
      // Book slot2 fully
      await service.createBooking({
        slot_id: slot2.id,
        patient_id: '00000000-0000-0000-0000-000000000031',
        vaccine_type: VaccineType.HPV,
      });

      await expect(
        service.rescheduleBooking(booking.id, {
          new_slot_id: slot2.id,
        })
      ).rejects.toThrow('fully booked');
    });
  });

  describe('Check-in and Completion', () => {
    let booking: VaccinationBooking;

    beforeEach(async () => {
      const template = await service.createSlotTemplate({
        pharmacy_id: '00000000-0000-0000-0000-000000000001',
        vaccine_type: VaccineType.TETANUS,
        duration_minutes: 15,
        capacity: 1,
        day_of_week: 4,
        start_time: '09:00',
        end_time: '17:00',
      });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const slot = slotRepo.create({
        template_id: template.id,
        pharmacy_id: template.pharmacy_id,
        slot_date: tomorrow,
        start_time: tomorrow,
        end_time: new Date(tomorrow.getTime() + 15 * 60000),
        capacity: 1,
        booked_count: 0,
        status: VaccinationSlotStatus.AVAILABLE,
      });

      await slotRepo.save(slot);

      booking = await service.createBooking({
        slot_id: slot.id,
        patient_id: '00000000-0000-0000-0000-000000000040',
        vaccine_type: VaccineType.TETANUS,
      });
    });

    it('should check-in booking successfully', async () => {
      const checkedIn = await service.checkInBooking(booking.id);

      expect(checkedIn.status).toBe(BookingStatus.CHECKED_IN);
      expect(checkedIn.checked_in_at).toBeDefined();
    });

    it('should complete booking after check-in', async () => {
      await service.checkInBooking(booking.id);
      const completed = await service.completeBooking(booking.id);

      expect(completed.status).toBe(BookingStatus.COMPLETED);
      expect(completed.completed_at).toBeDefined();
    });

    it('should mark booking as no-show', async () => {
      const noShow = await service.markNoShow(booking.id);

      expect(noShow.status).toBe(BookingStatus.NO_SHOW);
      expect(noShow.no_show_at).toBeDefined();
    });
  });
});
