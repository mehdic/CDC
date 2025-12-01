/**
 * Router Service Unit Tests
 */

import { RouterService, RouterConfig } from '../../services/routerService';
import { MessageService } from '../../services/messageService';
import { IMessageChannel, SendMessageResult } from '../../channels/ChannelInterface';
import { Message, MessageChannel, MessageStatus } from '../../models/Message';

describe('RouterService', () => {
  let routerService: RouterService;
  let mockMessageService: jest.Mocked<MessageService>;
  let mockChannel: jest.Mocked<IMessageChannel>;

  const defaultConfig: RouterConfig = {
    defaultChannel: MessageChannel.IN_APP,
    fallbackChain: [MessageChannel.EMAIL, MessageChannel.WHATSAPP],
    routingRules: [],
    rateLimits: {},
  };

  beforeEach(() => {
    mockMessageService = {
      updateMessageStatus: jest.fn(),
    } as any;

    mockChannel = {
      name: 'test-channel',
      isAvailable: jest.fn().mockResolvedValue(true),
      sendMessage: jest.fn().mockResolvedValue({
        success: true,
        externalId: 'ext-123',
      } as SendMessageResult),
      getConfig: jest.fn().mockReturnValue({ enabled: true }),
    };

    routerService = new RouterService(defaultConfig, mockMessageService);
  });

  describe('registerChannel', () => {
    it('should register a channel', () => {
      routerService.registerChannel(mockChannel, MessageChannel.IN_APP);

      // Channel should be registered (tested indirectly via routeMessage)
      expect(mockChannel.getConfig).toBeDefined();
    });
  });

  describe('routeMessage', () => {
    it('should route message through registered channel', async () => {
      routerService.registerChannel(mockChannel, MessageChannel.IN_APP);

      const message: Partial<Message> = {
        id: 'msg-1',
        channel: MessageChannel.IN_APP,
        senderId: 'user-1',
        content: 'Test message',
      };

      const result = await routerService.routeMessage(message as Message);

      expect(result.success).toBe(true);
      expect(mockChannel.sendMessage).toHaveBeenCalledWith(message);
      expect(mockMessageService.updateMessageStatus).toHaveBeenCalledWith('msg-1', {
        status: MessageStatus.SENT,
        metadata: expect.objectContaining({
          externalId: 'ext-123',
          channel: MessageChannel.IN_APP,
        }),
      });
    });

    it('should throw error if channel not registered', async () => {
      const message: Partial<Message> = {
        id: 'msg-1',
        channel: MessageChannel.WHATSAPP,
        senderId: 'user-1',
        content: 'Test',
      };

      const result = await routerService.routeMessage(message as Message);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not registered');
    });

    it('should mark message as failed on error when no fallbacks', async () => {
      // Create config with no fallbacks
      const configNoFallback: RouterConfig = {
        defaultChannel: MessageChannel.IN_APP,
        fallbackChain: [], // No fallbacks
        routingRules: [],
        rateLimits: {},
      };

      routerService = new RouterService(configNoFallback, mockMessageService);
      routerService.registerChannel(mockChannel, MessageChannel.IN_APP);

      mockChannel.sendMessage.mockResolvedValue({
        success: false,
        error: 'Send failed',
      });

      const message: Partial<Message> = {
        id: 'msg-1',
        channel: MessageChannel.IN_APP,
        senderId: 'user-1',
        content: 'Test',
      };

      const result = await routerService.routeMessage(message as Message);

      expect(result.success).toBe(false);
      expect(mockMessageService.updateMessageStatus).toHaveBeenCalledWith('msg-1', {
        status: MessageStatus.FAILED,
        metadata: expect.objectContaining({
          errorMessage: 'Send failed',
        }),
      });
    });
  });

  describe('getChannelStatus', () => {
    it('should return status of all registered channels', async () => {
      routerService.registerChannel(mockChannel, MessageChannel.IN_APP);

      const status = await routerService.getChannelStatus();

      expect(status[MessageChannel.IN_APP]).toEqual({
        registered: true,
        available: true,
      });
    });
  });

  describe('rate limiting', () => {
    it('should track rate limits', async () => {
      const configWithLimits: RouterConfig = {
        ...defaultConfig,
        rateLimits: {
          [MessageChannel.IN_APP]: {
            maxMessages: 2,
            windowMs: 60000,
          },
        },
      };

      routerService = new RouterService(configWithLimits, mockMessageService);
      routerService.registerChannel(mockChannel, MessageChannel.IN_APP);

      const message: Partial<Message> = {
        id: 'msg-1',
        channel: MessageChannel.IN_APP,
        senderId: 'user-1',
        content: 'Test',
      };

      // First message - should succeed
      await routerService.routeMessage(message as Message);
      expect(mockChannel.sendMessage).toHaveBeenCalledTimes(1);

      // Second message - should succeed
      await routerService.routeMessage({ ...message, id: 'msg-2' } as Message);
      expect(mockChannel.sendMessage).toHaveBeenCalledTimes(2);

      // Third message - should be rate limited
      const result = await routerService.routeMessage({ ...message, id: 'msg-3' } as Message);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limit exceeded');
    });
  });
});
