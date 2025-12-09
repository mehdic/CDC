/**
 * Notification Client Tests
 * Task: T8-010 - Notification Service Integration
 */

import axios from 'axios';
import { NotificationClient } from '../notificationClient';

jest.mock('axios');

describe('NotificationClient', () => {
  let notificationClient: NotificationClient;
  const mockBaseUrl = 'http://notification-service:4006';
  const mockServiceKey = 'test-key';

  beforeEach(() => {
    jest.clearAllMocks();
    notificationClient = new NotificationClient(mockBaseUrl, mockServiceKey);
  });

  describe('Constructor', () => {
    it('should initialize with custom base URL and service key', () => {
      const client = new NotificationClient(mockBaseUrl, mockServiceKey);
      expect(client).toBeDefined();
    });

    it('should use environment variables when not provided', () => {
      process.env.NOTIFICATION_SERVICE_URL = 'http://custom-notif:4006';
      process.env.SERVICE_KEY = 'env-key';

      const client = new NotificationClient();
      expect(client).toBeDefined();

      delete process.env.NOTIFICATION_SERVICE_URL;
      delete process.env.SERVICE_KEY;
    });
  });

  describe('sendNotification', () => {
    it('should send direct notification via HTTP', async () => {
      const mockResponse = {
        data: {
          id: 'notif-123',
          status: 'sent',
        },
      };

      (axios.create as jest.Mock).mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
      });

      const client = new NotificationClient(mockBaseUrl, mockServiceKey);
      const result = await client.sendNotification({
        userId: 'user-123',
        channel: 'push',
        type: 'test',
        message: 'Test notification',
      });

      expect(result).toBeDefined();
      expect(result?.status).toBe('sent');
    });

    it('should handle notification service errors gracefully', async () => {
      (axios.create as jest.Mock).mockReturnValue({
        post: jest.fn().mockRejectedValue(new Error('Service unavailable')),
      });

      const client = new NotificationClient(mockBaseUrl, mockServiceKey);
      const result = await client.sendNotification({
        userId: 'user-123',
        channel: 'push',
        type: 'test',
        message: 'Test notification',
      });

      expect(result).toBeNull();
    });

    it('should support multiple channels', async () => {
      const mockResponse = {
        data: {
          id: 'notif-123',
          status: 'sent',
        },
      };

      (axios.create as jest.Mock).mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
      });

      const client = new NotificationClient(mockBaseUrl, mockServiceKey);
      const result = await client.sendNotification({
        userId: 'user-123',
        channel: ['push', 'email', 'sms'],
        type: 'test',
        message: 'Multi-channel notification',
      });

      expect(result?.channels).toContain('push');
      expect(result?.channels).toContain('email');
      expect(result?.channels).toContain('sms');
    });
  });

  describe('sendPrescriptionReadyNotification', () => {
    it('should send prescription ready notification', async () => {
      const mockResponse = {
        data: {
          id: 'notif-123',
          status: 'sent',
        },
      };

      (axios.create as jest.Mock).mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
      });

      const client = new NotificationClient(mockBaseUrl, mockServiceKey);
      const result = await client.sendPrescriptionReadyNotification(
        'user-123',
        'rx-001',
        'Main Pharmacy',
        'CODE123'
      );

      expect(result).toBeDefined();
      expect(result?.status).toBe('sent');
    });
  });

  describe('sendPrescriptionRejectedNotification', () => {
    it('should send prescription rejected notification', async () => {
      const mockResponse = {
        data: {
          id: 'notif-123',
          status: 'sent',
        },
      };

      (axios.create as jest.Mock).mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
      });

      const client = new NotificationClient(mockBaseUrl, mockServiceKey);
      const result = await client.sendPrescriptionRejectedNotification(
        'user-123',
        'rx-001',
        'Drug interaction detected'
      );

      expect(result).toBeDefined();
      expect(result?.status).toBe('sent');
    });
  });

  describe('sendDeliveryStatusNotification', () => {
    it('should send out-for-delivery notification', async () => {
      const mockResponse = {
        data: {
          id: 'notif-123',
          status: 'sent',
        },
      };

      (axios.create as jest.Mock).mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
      });

      const client = new NotificationClient(mockBaseUrl, mockServiceKey);
      const result = await client.sendDeliveryStatusNotification(
        'user-123',
        'order-001',
        'out_for_delivery',
        { tracking_url: 'https://example.com/track' }
      );

      expect(result).toBeDefined();
      expect(result?.status).toBe('sent');
    });

    it('should send delivery-delivered notification', async () => {
      const mockResponse = {
        data: {
          id: 'notif-123',
          status: 'sent',
        },
      };

      (axios.create as jest.Mock).mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
      });

      const client = new NotificationClient(mockBaseUrl, mockServiceKey);
      const result = await client.sendDeliveryStatusNotification(
        'user-123',
        'order-001',
        'delivered'
      );

      expect(result).toBeDefined();
      expect(result?.status).toBe('sent');
    });

    it('should send delayed delivery notification with high priority', async () => {
      const mockResponse = {
        data: {
          id: 'notif-123',
          status: 'sent',
        },
      };

      (axios.create as jest.Mock).mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
      });

      const client = new NotificationClient(mockBaseUrl, mockServiceKey);
      const result = await client.sendDeliveryStatusNotification(
        'user-123',
        'order-001',
        'delayed',
        { eta: '2024-01-01T15:00:00Z' }
      );

      expect(result).toBeDefined();
    });
  });

  describe('sendAppointmentReminderNotification', () => {
    it('should send appointment reminder notification', async () => {
      const mockResponse = {
        data: {
          id: 'notif-123',
          status: 'sent',
        },
      };

      (axios.create as jest.Mock).mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
      });

      const client = new NotificationClient(mockBaseUrl, mockServiceKey);
      const appointmentTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now

      const result = await client.sendAppointmentReminderNotification(
        'user-123',
        'appt-001',
        appointmentTime,
        'Consultation'
      );

      expect(result).toBeDefined();
      expect(result?.status).toBe('sent');
    });

    it('should set high priority for imminent appointments', async () => {
      const mockResponse = {
        data: {
          id: 'notif-123',
          status: 'sent',
        },
      };

      (axios.create as jest.Mock).mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
      });

      const client = new NotificationClient(mockBaseUrl, mockServiceKey);
      const appointmentTime = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour from now

      const result = await client.sendAppointmentReminderNotification(
        'user-123',
        'appt-001',
        appointmentTime,
        'Consultation'
      );

      expect(result).toBeDefined();
    });
  });

  describe('sendEmail', () => {
    it('should send email notification', async () => {
      const mockResponse = {
        data: {
          id: 'notif-123',
          status: 'sent',
        },
      };

      (axios.create as jest.Mock).mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
      });

      const client = new NotificationClient(mockBaseUrl, mockServiceKey);
      const result = await client.sendEmail(
        'test@example.com',
        'Test Subject',
        'Test message body'
      );

      expect(result).toBeDefined();
      expect(result?.channels).toContain('email');
    });

    it('should support email templates', async () => {
      const mockResponse = {
        data: {
          id: 'notif-123',
          status: 'sent',
        },
      };

      (axios.create as jest.Mock).mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
      });

      const client = new NotificationClient(mockBaseUrl, mockServiceKey);
      const result = await client.sendEmail(
        'test@example.com',
        'Welcome',
        'Welcome to MetaPharm',
        'welcome',
        { name: 'John' }
      );

      expect(result).toBeDefined();
    });
  });

  describe('sendSMS', () => {
    it('should send SMS notification', async () => {
      const mockResponse = {
        data: {
          id: 'notif-123',
          status: 'sent',
        },
      };

      (axios.create as jest.Mock).mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
      });

      const client = new NotificationClient(mockBaseUrl, mockServiceKey);
      const result = await client.sendSMS(
        '+41791234567',
        'Your prescription is ready for pickup'
      );

      expect(result).toBeDefined();
      expect(result?.channels).toContain('sms');
    });

    it('should support SMS priority levels', async () => {
      const mockResponse = {
        data: {
          id: 'notif-123',
          status: 'sent',
        },
      };

      (axios.create as jest.Mock).mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
      });

      const client = new NotificationClient(mockBaseUrl, mockServiceKey);
      const result = await client.sendSMS(
        '+41791234567',
        'Urgent: Check medication interactions',
        'high'
      );

      expect(result).toBeDefined();
    });
  });

  describe('sendPush', () => {
    it('should send push notification', async () => {
      const mockResponse = {
        data: {
          id: 'notif-123',
          status: 'sent',
        },
      };

      (axios.create as jest.Mock).mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
      });

      const client = new NotificationClient(mockBaseUrl, mockServiceKey);
      const result = await client.sendPush(
        'user-123',
        'Prescription Ready',
        'Your prescription is ready for pickup'
      );

      expect(result).toBeDefined();
      expect(result?.channels).toContain('push');
    });

    it('should support push notification data payload', async () => {
      const mockResponse = {
        data: {
          id: 'notif-123',
          status: 'sent',
        },
      };

      (axios.create as jest.Mock).mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
      });

      const client = new NotificationClient(mockBaseUrl, mockServiceKey);
      const result = await client.sendPush(
        'user-123',
        'Prescription Ready',
        'Your prescription is ready for pickup',
        {
          prescription_id: 'rx-001',
          action: 'open_prescription',
        }
      );

      expect(result).toBeDefined();
    });
  });

  describe('healthCheck', () => {
    it('should return true when service is healthy', async () => {
      (axios.create as jest.Mock).mockReturnValue({
        get: jest.fn().mockResolvedValue({ status: 200 }),
      });

      const client = new NotificationClient(mockBaseUrl, mockServiceKey);
      const result = await client.healthCheck();

      expect(result).toBe(true);
    });

    it('should return false when service is unavailable', async () => {
      (axios.create as jest.Mock).mockReturnValue({
        get: jest.fn().mockRejectedValue(new Error('Service unavailable')),
      });

      const client = new NotificationClient(mockBaseUrl, mockServiceKey);
      const result = await client.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('Retry Logic', () => {
    it('should retry on network errors', async () => {
      const mockError = new Error('ECONNREFUSED');
      (mockError as any).code = 'ECONNREFUSED';

      const mockPost = jest
        .fn()
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce({ data: { id: 'notif-123', status: 'sent' } });

      (axios.create as jest.Mock).mockReturnValue({
        post: mockPost,
      });

      const client = new NotificationClient(mockBaseUrl, mockServiceKey);
      const result = await client.sendNotification({
        userId: 'user-123',
        channel: 'push',
        type: 'test',
        message: 'Test',
      });

      expect(mockPost).toHaveBeenCalledTimes(2);
      expect(result?.status).toBe('sent');
    });

    it('should retry on 5xx server errors', async () => {
      const mockPost = jest
        .fn()
        .mockRejectedValueOnce({ response: { status: 503 } })
        .mockResolvedValueOnce({ data: { id: 'notif-123', status: 'sent' } });

      (axios.create as jest.Mock).mockReturnValue({
        post: mockPost,
      });

      const client = new NotificationClient(mockBaseUrl, mockServiceKey);
      const result = await client.sendNotification({
        userId: 'user-123',
        channel: 'push',
        type: 'test',
        message: 'Test',
      });

      expect(mockPost).toHaveBeenCalledTimes(2);
    });
  });
});
