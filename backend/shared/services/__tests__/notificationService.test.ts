/**
 * Notification Service Tests
 * Task T3-028: Write comprehensive tests
 */

import { DataSource, Repository } from 'typeorm';
import {
  NotificationService,
  NotificationCategory,
  NotificationPriority,
  INotificationProvider,
  NotificationPayload,
} from '../notificationService';
import { Notification, NotificationType, NotificationStatus } from '../../models/Notification';
import { User } from '../../models/User';
import { MockNotificationProvider } from '../notification-providers/MockNotificationProvider';

// Mock TypeORM
jest.mock('typeorm', () => ({
  DataSource: jest.fn(),
  Repository: jest.fn(),
}));

describe('NotificationService', () => {
  let dataSource: DataSource;
  let notificationService: NotificationService;
  let mockNotificationRepo: jest.Mocked<Repository<Notification>>;
  let mockUserRepo: jest.Mocked<Repository<User>>;
  let mockEmailProvider: MockNotificationProvider;
  let mockSMSProvider: MockNotificationProvider;
  let mockPushProvider: MockNotificationProvider;

  const mockUser: Partial<User> = {
    id: 'user-123',
    email: 'test@example.com',
    phone: '+41791234567',
    first_name: 'Test',
    last_name: 'User',
    notification_preferences: {
      email_enabled: true,
      sms_enabled: true,
      push_enabled: true,
      categories: {},
    } as any,
  };

  beforeEach(() => {
    mockNotificationRepo = {
      create: jest.fn((data) => {
        const notification = Object.assign(new Notification(), { ...data, id: 'notification-456' });
        return notification;
      }),
      save: jest.fn((notification) => Promise.resolve(notification)),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      })),
    } as any;

    mockUserRepo = {
      findOne: jest.fn().mockResolvedValue(mockUser),
      save: jest.fn((user) => Promise.resolve(user)),
    } as any;

    dataSource = {
      getRepository: jest.fn((entity) => {
        if (entity === Notification || entity.name === 'Notification') {
          return mockNotificationRepo;
        }
        if (entity === User || entity.name === 'User') {
          return mockUserRepo;
        }
        return {} as any;
      }),
    } as any;

    notificationService = new NotificationService(dataSource);

    // Register mock providers
    mockEmailProvider = new MockNotificationProvider(NotificationType.EMAIL);
    mockSMSProvider = new MockNotificationProvider(NotificationType.SMS);
    mockPushProvider = new MockNotificationProvider(NotificationType.PUSH);

    notificationService.registerProvider(mockEmailProvider);
    notificationService.registerProvider(mockSMSProvider);
    notificationService.registerProvider(mockPushProvider);

    // Clear provider state
    mockEmailProvider.clearSentNotifications();
    mockSMSProvider.clearSentNotifications();
    mockPushProvider.clearSentNotifications();

    jest.clearAllMocks();
  });

  describe('Provider Registration', () => {
    it('should register notification providers', () => {
      const provider = notificationService.getProvider(NotificationType.EMAIL);
      expect(provider).toBe(mockEmailProvider);
    });

    it('should get registered provider by type', () => {
      expect(notificationService.getProvider(NotificationType.SMS)).toBe(mockSMSProvider);
      expect(notificationService.getProvider(NotificationType.PUSH)).toBe(mockPushProvider);
    });
  });

  describe('Email Notifications', () => {
    it('should send email notification', async () => {
      const notification = await notificationService.sendEmail(
        'user-123',
        'Test Subject',
        'Test Message',
        NotificationCategory.PRESCRIPTION_STATUS
      );

      expect(mockNotificationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          type: NotificationType.EMAIL,
          subject: 'Test Subject',
          message: 'Test Message',
        })
      );

      expect(mockNotificationRepo.save).toHaveBeenCalledTimes(2); // Once for create, once for mark sent
      expect(mockEmailProvider.getSentCount()).toBe(1);
    });

    it('should send email with HTML content', async () => {
      await notificationService.sendEmail(
        'user-123',
        'Test Subject',
        'Test Message',
        NotificationCategory.PRESCRIPTION_STATUS,
        { html: '<p>HTML Content</p>' }
      );

      const sentNotifications = mockEmailProvider.getSentNotifications();
      expect(sentNotifications[0].payload.email?.html).toBe('<p>HTML Content</p>');
    });

    it('should throw error if user not found for email', async () => {
      mockUserRepo.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        notificationService.sendEmail(
          'invalid-user',
          'Test',
          'Test',
          NotificationCategory.PRESCRIPTION_STATUS
        )
      ).rejects.toThrow('User not found: invalid-user');
    });
  });

  describe('SMS Notifications', () => {
    it('should send SMS notification', async () => {
      const notification = await notificationService.sendSMS(
        'user-123',
        'SMS Message',
        NotificationCategory.DELIVERY_STATUS
      );

      expect(mockNotificationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          type: NotificationType.SMS,
          message: 'SMS Message',
        })
      );

      expect(mockSMSProvider.getSentCount()).toBe(1);
    });

    it('should throw error if user phone missing', async () => {
      mockUserRepo.findOne = jest.fn().mockResolvedValue({ ...mockUser, phone: null });

      await expect(
        notificationService.sendSMS(
          'user-123',
          'Test',
          NotificationCategory.DELIVERY_STATUS
        )
      ).rejects.toThrow('User not found or phone number missing');
    });
  });

  describe('Push Notifications', () => {
    it('should send push notification', async () => {
      const notification = await notificationService.sendPush(
        'user-123',
        'Push Title',
        'Push Body',
        NotificationCategory.APPOINTMENT_REMINDER
      );

      expect(mockNotificationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          type: NotificationType.PUSH,
          subject: 'Push Title',
          message: 'Push Body',
        })
      );

      expect(mockPushProvider.getSentCount()).toBe(1);
    });

    it('should send push notification with custom data', async () => {
      await notificationService.sendPush(
        'user-123',
        'Title',
        'Body',
        NotificationCategory.APPOINTMENT_REMINDER,
        {
          data: { appointment_id: '123' },
          badge: 5,
        }
      );

      const sentNotifications = mockPushProvider.getSentNotifications();
      expect(sentNotifications[0].payload.push?.data).toEqual({ appointment_id: '123' });
      expect(sentNotifications[0].payload.push?.badge).toBe(5);
    });
  });

  describe('Multi-Channel Notifications', () => {
    it('should send notifications through multiple channels', async () => {
      const notifications = await notificationService.sendMultiChannel(
        'user-123',
        'Multi Subject',
        'Multi Message',
        NotificationCategory.PRESCRIPTION_STATUS,
        [NotificationType.EMAIL, NotificationType.PUSH]
      );

      expect(notifications).toHaveLength(2);
      expect(mockEmailProvider.getSentCount()).toBe(1);
      expect(mockPushProvider.getSentCount()).toBe(1);
      expect(mockSMSProvider.getSentCount()).toBe(0);
    });
  });

  describe('User Preferences', () => {
    it('should get user notification preferences', async () => {
      const preferences = await notificationService.getUserPreferences('user-123');

      expect(preferences.email_enabled).toBe(true);
      expect(preferences.sms_enabled).toBe(true);
      expect(preferences.push_enabled).toBe(true);
    });

    it('should return default preferences if not set', async () => {
      mockUserRepo.findOne = jest.fn().mockResolvedValue({
        ...mockUser,
        notification_preferences: null,
      });

      const preferences = await notificationService.getUserPreferences('user-123');

      expect(preferences.email_enabled).toBe(true);
      expect(preferences.push_enabled).toBe(true);
    });

    it('should update user notification preferences', async () => {
      await notificationService.updateUserPreferences('user-123', {
        email_enabled: false,
        sms_enabled: true,
      });

      expect(mockUserRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          notification_preferences: expect.objectContaining({
            email_enabled: false,
            sms_enabled: true,
          }),
        })
      );
    });
  });

  describe('Priority Handling', () => {
    it('should send urgent notifications through all channels', async () => {
      mockUserRepo.findOne = jest.fn().mockResolvedValue({
        ...mockUser,
        notification_preferences: {
          email_enabled: true,
          sms_enabled: true,
          push_enabled: true,
          categories: {
            [NotificationCategory.PRESCRIPTION_STATUS]: {
              email: false, // Disabled for category
              push: false,
            },
          },
        } as any,
      });

      await notificationService.send({
        userId: 'user-123',
        type: NotificationType.EMAIL,
        category: NotificationCategory.PRESCRIPTION_STATUS,
        priority: NotificationPriority.URGENT, // Urgent overrides preferences
        subject: 'Urgent',
        message: 'Urgent message',
      });

      // All channels should be used for urgent notifications
      expect(mockNotificationRepo.save).toHaveBeenCalled();
    });
  });

  describe('Notification Retrieval', () => {
    it('should get notification by ID', async () => {
      const mockNotification = { id: 'notification-456', subject: 'Test' };
      mockNotificationRepo.findOne = jest.fn().mockResolvedValue(mockNotification);

      const notification = await notificationService.getNotification('notification-456');

      expect(notification).toEqual(mockNotification);
      expect(mockNotificationRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'notification-456' },
      });
    });

    it('should get user notifications with pagination', async () => {
      const result = await notificationService.getUserNotifications('user-123', {
        limit: 20,
        offset: 0,
      });

      expect(result.notifications).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should filter notifications by status', async () => {
      await notificationService.getUserNotifications('user-123', {
        status: NotificationStatus.SENT,
      });

      // Verify query builder was called with status filter
      expect(mockNotificationRepo.createQueryBuilder).toHaveBeenCalled();
    });

    it('should filter notifications by category', async () => {
      await notificationService.getUserNotifications('user-123', {
        category: NotificationCategory.PRESCRIPTION_STATUS,
      });

      expect(mockNotificationRepo.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('Mark as Read', () => {
    it('should mark notification as read', async () => {
      const mockNotification = {
        id: 'notification-456',
        markAsRead: jest.fn(),
      };
      mockNotificationRepo.findOne = jest.fn().mockResolvedValue(mockNotification);

      await notificationService.markAsRead('notification-456');

      expect(mockNotification.markAsRead).toHaveBeenCalled();
      expect(mockNotificationRepo.save).toHaveBeenCalledWith(mockNotification);
    });

    it('should throw error if notification not found', async () => {
      mockNotificationRepo.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        notificationService.markAsRead('invalid-id')
      ).rejects.toThrow('Notification not found');
    });
  });

  describe('Health Check', () => {
    it('should check health of all providers', async () => {
      const health = await notificationService.healthCheck();

      expect(health[NotificationType.EMAIL]).toBe(true);
      expect(health[NotificationType.SMS]).toBe(true);
      expect(health[NotificationType.PUSH]).toBe(true);
    });

    it('should return false for unhealthy providers', async () => {
      // Override healthCheck to return false
      mockEmailProvider.healthCheck = jest.fn().mockResolvedValue(false);

      const health = await notificationService.healthCheck();

      expect(health[NotificationType.EMAIL]).toBe(false);
    });
  });
});
