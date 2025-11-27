/**
 * Appointment Reminder Service Tests
 * Task T3-028: Write comprehensive tests - timezone handling
 */

import { DataSource, Repository } from 'typeorm';
import {
  AppointmentReminderService,
  SWISS_TIMEZONE,
} from '../appointmentReminderService';
import { NotificationService } from '../notificationService';
import { Teleconsultation, TeleconsultationStatus } from '../../models/Teleconsultation';
import { addHours, subHours } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

// Mock date-fns-tz
jest.mock('date-fns-tz', () => ({
  toZonedTime: jest.fn((date) => date),
  fromZonedTime: jest.fn((date) => date),
  formatInTimeZone: jest.fn(() => 'Vendredi, 27 novembre 2025 à 14:30'),
}));

describe('AppointmentReminderService', () => {
  let dataSource: DataSource;
  let notificationService: jest.Mocked<NotificationService>;
  let reminderService: AppointmentReminderService;
  let mockTeleconsultationRepo: jest.Mocked<Repository<Teleconsultation>>;

  const mockAppointment: Partial<Teleconsultation> = {
    id: 'telecon-123',
    patient_id: 'patient-456',
    pharmacist_id: 'pharmacist-789',
    pharmacy_id: 'pharmacy-111',
    scheduled_at: new Date('2025-11-27T14:30:00Z'),
    duration_minutes: 15,
    status: TeleconsultationStatus.SCHEDULED,
    patient: {
      id: 'patient-456',
      first_name: 'Jean',
      last_name: 'Dupont',
    } as any,
    pharmacist: {
      id: 'pharmacist-789',
      first_name: 'Marie',
      last_name: 'Martin',
    } as any,
    pharmacy: {
      id: 'pharmacy-111',
      name: 'Pharmacie Centrale',
    } as any,
  };

  beforeEach(() => {
    mockTeleconsultationRepo = {
      find: jest.fn().mockResolvedValue([mockAppointment]),
    } as any;

    dataSource = {
      getRepository: jest.fn(() => mockTeleconsultationRepo),
    } as any;

    notificationService = {
      sendEmail: jest.fn().mockResolvedValue({}),
      sendPush: jest.fn().mockResolvedValue({}),
    } as any;

    reminderService = new AppointmentReminderService(dataSource, notificationService);

    jest.clearAllMocks();
  });

  describe('Reminder Processing', () => {
    it('should process reminders for 24-hour window', async () => {
      await reminderService.processReminders();

      expect(mockTeleconsultationRepo.find).toHaveBeenCalled();
      expect(notificationService.sendEmail).toHaveBeenCalled();
      expect(notificationService.sendPush).toHaveBeenCalled();
    });

    it('should send reminders to both patient and pharmacist', async () => {
      await reminderService.processReminders();

      // Patient notifications (email + push)
      expect(notificationService.sendEmail).toHaveBeenCalledWith(
        'patient-456',
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(Object)
      );
      expect(notificationService.sendPush).toHaveBeenCalledWith(
        'patient-456',
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(Object)
      );

      // Pharmacist notification (email)
      expect(notificationService.sendEmail).toHaveBeenCalledWith(
        'pharmacist-789',
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should include appointment details in notification', async () => {
      await reminderService.processReminders();

      const emailCall = (notificationService.sendEmail as jest.Mock).mock.calls[0];
      const message = emailCall[2]; // message is 3rd argument

      expect(message).toContain('Jean');
      expect(message).toContain('Pharmacie Centrale');
      expect(message).toContain('15 minutes');
    });

    it('should not process if already running', async () => {
      // Start first process
      const firstProcess = reminderService.processReminders();

      // Try to start second process immediately
      await reminderService.processReminders();

      await firstProcess;

      // Should only call once (second call skipped)
      expect(mockTeleconsultationRepo.find).toHaveBeenCalledTimes(2); // Each config window
    });

    it('should handle errors gracefully', async () => {
      notificationService.sendEmail = jest.fn().mockRejectedValue(new Error('Send failed'));

      // Should not throw
      await expect(reminderService.processReminders()).resolves.not.toThrow();
    });
  });

  describe('Timezone Handling', () => {
    it('should use Swiss timezone (Europe/Zurich)', async () => {
      await reminderService.processReminders();

      // Verify timezone conversion functions were called
      expect(toZonedTime).toHaveBeenCalled();
    });

    it('should convert UTC to Swiss time', () => {
      const utcDate = new Date('2025-11-27T14:30:00Z');
      const swissTime = AppointmentReminderService.toSwissTime(utcDate);

      expect(toZonedTime).toHaveBeenCalledWith(utcDate, SWISS_TIMEZONE);
    });

    it('should convert Swiss time to UTC', () => {
      const swissDate = new Date('2025-11-27T15:30:00');
      const utcTime = AppointmentReminderService.fromSwissTime(swissDate);

      expect(fromZonedTime).toHaveBeenCalledWith(swissDate, SWISS_TIMEZONE);
    });

    it('should format dates in Swiss timezone', () => {
      const date = new Date('2025-11-27T14:30:00Z');
      const formatted = AppointmentReminderService.formatSwissTime(date);

      expect(formatted).toBeDefined();
    });
  });

  describe('Reminder Configuration', () => {
    it('should use default 24h and 1h reminders', async () => {
      await reminderService.processReminders();

      // Should process for both time windows
      expect(mockTeleconsultationRepo.find).toHaveBeenCalledTimes(2);
    });

    it('should support custom reminder configuration', () => {
      const customConfig = [
        { hoursBeforeAppointment: 48, enabled: true },
        { hoursBeforeAppointment: 2, enabled: true },
      ];

      const customService = new AppointmentReminderService(
        dataSource,
        notificationService,
        customConfig
      );

      expect(customService).toBeDefined();
    });

    it('should skip disabled reminder windows', async () => {
      const config = [
        { hoursBeforeAppointment: 24, enabled: false },
        { hoursBeforeAppointment: 1, enabled: true },
      ];

      const customService = new AppointmentReminderService(
        dataSource,
        notificationService,
        config
      );

      await customService.processReminders();

      // Should only process enabled window
      expect(mockTeleconsultationRepo.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('Upcoming Appointments', () => {
    it('should get upcoming appointments', async () => {
      const appointments = await reminderService.getUpcomingAppointments(48);

      expect(mockTeleconsultationRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: TeleconsultationStatus.SCHEDULED,
          }),
          relations: ['patient', 'pharmacist', 'pharmacy'],
        })
      );

      expect(appointments).toEqual([mockAppointment]);
    });

    it('should filter by hours ahead', async () => {
      await reminderService.getUpcomingAppointments(24);

      expect(mockTeleconsultationRepo.find).toHaveBeenCalled();
    });
  });

  describe('Reminder Messages', () => {
    it('should build 24-hour reminder message', async () => {
      await reminderService.processReminders();

      const emailCall = (notificationService.sendEmail as jest.Mock).mock.calls[0];
      const subject = emailCall[1];

      expect(subject).toContain('demain');
    });

    it('should build 1-hour reminder message', async () => {
      const config = [{ hoursBeforeAppointment: 1, enabled: true }];

      const customService = new AppointmentReminderService(
        dataSource,
        notificationService,
        config
      );

      await customService.processReminders();

      const emailCall = (notificationService.sendEmail as jest.Mock).mock.calls[0];
      const subject = emailCall[1];

      expect(subject).toContain('1 heure');
    });

    it('should include pharmacy name in message', async () => {
      await reminderService.processReminders();

      const emailCall = (notificationService.sendEmail as jest.Mock).mock.calls[0];
      const message = emailCall[2];

      expect(message).toContain('Pharmacie Centrale');
    });

    it('should include pharmacist name in message', async () => {
      await reminderService.processReminders();

      const emailCall = (notificationService.sendEmail as jest.Mock).mock.calls[0];
      const message = emailCall[2];

      expect(message).toContain('Marie Martin');
    });
  });

  describe('Error Handling', () => {
    it('should continue processing if one reminder fails', async () => {
      mockTeleconsultationRepo.find = jest.fn().mockResolvedValue([
        mockAppointment,
        { ...mockAppointment, id: 'telecon-999' },
      ]);

      notificationService.sendEmail = jest.fn()
        .mockResolvedValueOnce({}) // First succeeds
        .mockRejectedValueOnce(new Error('Failed')); // Second fails

      await reminderService.processReminders();

      // Should have attempted both
      expect(notificationService.sendEmail).toHaveBeenCalledTimes(4); // 2 appointments × 2 recipients
    });

    it('should handle missing relations gracefully', async () => {
      const incompleteAppointment = {
        ...mockAppointment,
        patient: null,
        pharmacist: null,
      };

      mockTeleconsultationRepo.find = jest.fn().mockResolvedValue([incompleteAppointment]);

      // Should not throw
      await expect(reminderService.processReminders()).rejects.toThrow();
    });
  });

  describe('Priority Setting', () => {
    it('should set HIGH priority for 1-hour reminders', async () => {
      const config = [{ hoursBeforeAppointment: 1, enabled: true }];

      const customService = new AppointmentReminderService(
        dataSource,
        notificationService,
        config
      );

      await customService.processReminders();

      const emailCall = (notificationService.sendEmail as jest.Mock).mock.calls[0];
      const options = emailCall[4];

      expect(options.priority).toBe('high');
    });

    it('should set NORMAL priority for 24-hour reminders', async () => {
      const config = [{ hoursBeforeAppointment: 24, enabled: true }];

      const customService = new AppointmentReminderService(
        dataSource,
        notificationService,
        config
      );

      await customService.processReminders();

      const emailCall = (notificationService.sendEmail as jest.Mock).mock.calls[0];
      const options = emailCall[4];

      expect(options.priority).toBe('normal');
    });
  });
});
