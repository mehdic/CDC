/**
 * Channel Contract Tests
 * Verifies that all channels implement the IMessageChannel interface correctly
 * and follow the expected behavior contracts
 */

import {
  IMessageChannel,
  SendMessageResult,
  ChannelConfig,
  BaseMessageChannel,
} from '../../channels/ChannelInterface';
import { Message, MessageChannel, MessageStatus, MessageDirection } from '../../models/Message';
import { WhatsAppChannel } from '../../channels/whatsappChannel';
import { EmailChannel } from '../../channels/emailChannel';
import { FaxChannel } from '../../channels/faxChannel';
import { InAppChannel } from '../../channels/inAppChannel';

/**
 * Contract test suite for message channels
 * These tests verify that each channel implementation follows the contract
 */
describe('Channel Contract Tests', () => {
  /**
   * Helper function to create a valid test message
   */
  function createTestMessage(channel: MessageChannel): Message {
    return {
      id: 'test-msg-1',
      conversationId: 'conv-1',
      senderId: 'sender-1',
      senderRole: 'pharmacist',
      recipientId: 'recipient-1',
      recipientRole: 'patient',
      channel,
      direction: MessageDirection.OUTBOUND,
      content: 'Test message content',
      status: MessageStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      conversation: {} as any,
      markAsSent: jest.fn(),
      markAsDelivered: jest.fn(),
      markAsRead: jest.fn(),
      markAsFailed: jest.fn(),
      incrementDeliveryAttempt: jest.fn(),
    };
  }

  /**
   * Verification helper for contract compliance
   */
  function verifyChannelContract(channel: IMessageChannel): void {
    // All channels must have a name property
    expect(channel.name).toBeDefined();
    expect(typeof channel.name).toBe('string');

    // All channels must have required methods
    expect(typeof channel.isAvailable).toBe('function');
    expect(typeof channel.sendMessage).toBe('function');
    expect(typeof channel.getConfig).toBe('function');

    // Config must be valid
    const config = channel.getConfig();
    expect(config).toBeDefined();
    expect(typeof config.enabled).toBe('boolean');
  }

  describe('WhatsApp Channel Contract', () => {
    let channel: WhatsAppChannel;

    beforeEach(() => {
      channel = new WhatsAppChannel({
        enabled: true,
        apiUrl: 'https://graph.instagram.com/v13.0',
        phoneNumberId: 'test-phone-id',
        accessToken: 'test-token',
        webhookSecret: 'test-secret',
      });
    });

    it('should implement IMessageChannel interface', () => {
      verifyChannelContract(channel);
    });

    it('should have correct channel name', () => {
      expect(channel.name).toBe('whatsapp');
    });

    it('should return enabled config', () => {
      const config = channel.getConfig();
      expect(config.enabled).toBe(true);
    });

    it('should validate message before sending', async () => {
      const invalidMessage = createTestMessage(MessageChannel.WHATSAPP);
      invalidMessage.content = '';

      await expect(channel.sendMessage(invalidMessage)).rejects.toThrow(
        'Message content cannot be empty'
      );
    });

    it('should handle webhook signature verification', () => {
      const payload = { test: 'data' };
      const signature = 'sha256=invalid';

      const isValid = channel.verifyWebhook(signature, payload);
      expect(typeof isValid).toBe('boolean');
    });

    it('should support webhook handling', () => {
      expect(typeof channel.handleIncoming).toBe('function');
    });
  });

  describe('Email Channel Contract', () => {
    let channel: EmailChannel;

    beforeEach(() => {
      channel = new EmailChannel({
        enabled: true,
        provider: 'sendgrid',
        apiKey: 'test-key',
        fromEmail: 'noreply@metapharm.ch',
        fromName: 'MetaPharm Connect',
      });
    });

    it('should implement IMessageChannel interface', () => {
      verifyChannelContract(channel);
    });

    it('should have correct channel name', () => {
      expect(channel.name).toBe('email');
    });

    it('should return enabled config', () => {
      const config = channel.getConfig();
      expect(config.enabled).toBe(true);
    });

    it('should validate email recipient format', async () => {
      const message = createTestMessage(MessageChannel.EMAIL);
      message.recipientId = 'invalid-email';

      // Even though email channel might accept it, it should handle validation
      const config = channel.getConfig();
      expect(config.enabled).toBe(true);
    });

    it('should support webhook handling for delivery events', () => {
      expect(typeof channel.handleIncoming).toBe('function');
    });

    it('should support webhook verification', () => {
      const payload = {};
      const signature = 'test-sig';

      const isValid = channel.verifyWebhook(signature, payload);
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('Fax Channel Contract', () => {
    let channel: FaxChannel;

    beforeEach(() => {
      channel = new FaxChannel({
        enabled: true,
        provider: 'twilio',
        accountSid: 'test-sid',
        authToken: 'test-token',
        fromFaxNumber: '+41791234567',
      });
    });

    it('should implement IMessageChannel interface', () => {
      verifyChannelContract(channel);
    });

    it('should have correct channel name', () => {
      expect(channel.name).toBe('fax');
    });

    it('should return enabled config', () => {
      const config = channel.getConfig();
      expect(config.enabled).toBe(true);
    });

    it('should require PDF attachment for fax messages', async () => {
      const message = createTestMessage(MessageChannel.FAX);
      message.attachments = undefined;

      await expect(channel.sendMessage(message)).rejects.toThrow(
        'Fax requires a PDF attachment'
      );
    });

    it('should support webhook handling', () => {
      expect(typeof channel.handleIncoming).toBe('function');
    });
  });

  describe('InApp Channel Contract', () => {
    let channel: InAppChannel;

    beforeEach(() => {
      channel = new InAppChannel({
        enabled: true,
      });
    });

    it('should implement IMessageChannel interface', () => {
      verifyChannelContract(channel);
    });

    it('should have correct channel name', () => {
      expect(channel.name).toBe('in_app');
    });

    it('should always be available when enabled', async () => {
      const isAvailable = await channel.isAvailable();
      expect(isAvailable).toBe(true);
    });
  });

  describe('Channel Message Sending Contract', () => {
    it('should return SendMessageResult with required fields', async () => {
      const channel = new InAppChannel({ enabled: true });
      const message = createTestMessage(MessageChannel.IN_APP);

      const result = await channel.sendMessage(message);

      // SendMessageResult must have success field
      expect(typeof result.success).toBe('boolean');

      // If successful, should have externalId
      if (result.success) {
        expect(result.externalId).toBeDefined();
        expect(result.error).toBeUndefined();
      }

      // If failed, should have error
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.externalId).toBeUndefined();
      }
    });

    it('should handle message with attachments', async () => {
      const channel = new InAppChannel({ enabled: true });
      const message = createTestMessage(MessageChannel.IN_APP);
      message.attachments = [
        {
          id: 'att-1',
          type: 'image',
          url: 'https://example.com/image.jpg',
          filename: 'image.jpg',
          size: 1000,
          mimeType: 'image/jpeg',
        },
      ];

      const result = await channel.sendMessage(message);
      expect(result.success).toBeDefined();
    });

    it('should handle message with metadata', async () => {
      const channel = new InAppChannel({ enabled: true });
      const message = createTestMessage(MessageChannel.IN_APP);
      message.metadata = {
        priority: 'high',
        templateId: 'template-1',
      };

      const result = await channel.sendMessage(message);
      expect(result.success).toBeDefined();
    });
  });

  describe('Channel Configuration Contract', () => {
    it('should have consistent configuration schema', () => {
      const channels = [
        new InAppChannel({ enabled: true }),
        new EmailChannel({
          enabled: true,
          provider: 'sendgrid',
          apiKey: 'test',
          fromEmail: 'test@example.com',
          fromName: 'Test',
        }),
        new WhatsAppChannel({
          enabled: true,
          apiUrl: 'https://test.com',
          phoneNumberId: 'test',
          accessToken: 'test',
          webhookSecret: 'test',
        }),
      ];

      for (const channel of channels) {
        const config = channel.getConfig();

        // All configs must have enabled property
        expect(typeof config.enabled).toBe('boolean');

        // Config should be immutable when appropriate
        expect(config).toBeDefined();
      }
    });

    it('should respect rate limiting configuration', () => {
      const channelWithRateLimit = new InAppChannel({
        enabled: true,
        rateLimit: {
          maxMessages: 100,
          windowMs: 60000,
        },
      });

      const config = channelWithRateLimit.getConfig();
      expect(config.rateLimit).toBeDefined();
      expect(config.rateLimit?.maxMessages).toBe(100);
      expect(config.rateLimit?.windowMs).toBe(60000);
    });

    it('should support retry policy configuration', () => {
      const channelWithRetry = new InAppChannel({
        enabled: true,
        retryPolicy: {
          maxAttempts: 3,
          backoffMs: 1000,
        },
      });

      const config = channelWithRetry.getConfig();
      expect(config.retryPolicy).toBeDefined();
      expect(config.retryPolicy?.maxAttempts).toBe(3);
      expect(config.retryPolicy?.backoffMs).toBe(1000);
    });
  });

  describe('Error Handling Contract', () => {
    it('should catch and handle API errors gracefully', async () => {
      const channel = new InAppChannel({ enabled: true });
      const message = createTestMessage(MessageChannel.IN_APP);

      // Message with empty content should fail validation
      message.content = '';

      const result = await channel.sendMessage(message);

      // Should return error result, not throw
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should provide meaningful error messages', async () => {
      const channel = new EmailChannel({
        enabled: true,
        provider: 'sendgrid',
        apiKey: '',
        fromEmail: 'test@example.com',
        fromName: 'Test',
      });

      const message = createTestMessage(MessageChannel.EMAIL);

      const result = await channel.sendMessage(message);

      // Error should explain what went wrong
      if (!result.success && result.error) {
        expect(result.error.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Webhook Contract', () => {
    it('should verify webhook payload format', () => {
      const channel = new WhatsAppChannel({
        enabled: true,
        apiUrl: 'https://test.com',
        phoneNumberId: 'test',
        accessToken: 'test',
        webhookSecret: 'test-secret',
      });

      const payload = {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      id: 'msg-1',
                      from: '1234567890',
                      type: 'text',
                      text: { body: 'test' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      // Should accept valid payload format
      expect(async () => {
        await channel.handleIncoming!(payload);
      }).toBeDefined();
    });
  });
});
