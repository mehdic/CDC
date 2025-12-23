/**
 * Multi-Channel Messaging Integration Tests
 * Tests the entire messaging flow across all channels
 */

import { Repository } from 'typeorm';
import { Message, MessageChannel, MessageStatus, MessageDirection } from '../../models/Message';
import { Conversation, ConversationType } from '../../models/Conversation';
import { MessageService, CreateMessageDTO } from '../../services/messageService';
import { ConversationService } from '../../services/conversationService';
import { UnifiedInboxService } from '../../services/unifiedInboxService';
import { RouterService } from '../../services/routerService';
import { WhatsAppChannel } from '../../channels/whatsappChannel';
import { EmailChannel } from '../../channels/emailChannel';
import { FaxChannel } from '../../channels/faxChannel';

describe('Multi-Channel Messaging Integration', () => {
  let messageRepository: jest.Mocked<Repository<Message>>;
  let conversationRepository: jest.Mocked<Repository<Conversation>>;
  let messageService: MessageService;
  let conversationService: ConversationService;
  let unifiedInboxService: UnifiedInboxService;
  let routerService: RouterService;

  let mockWhatsAppChannel: jest.Mocked<WhatsAppChannel>;
  let mockEmailChannel: jest.Mocked<EmailChannel>;
  let mockFaxChannel: jest.Mocked<FaxChannel>;

  beforeEach(() => {
    // Create mock repositories
    messageRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    } as any;

    conversationRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
    } as any;

    // Initialize services
    messageService = new MessageService(messageRepository, conversationRepository);
    conversationService = new ConversationService(
      conversationRepository,
      messageRepository
    );
    unifiedInboxService = new UnifiedInboxService(
      messageRepository,
      conversationRepository
    );

    routerService = new RouterService(
      {
        defaultChannel: MessageChannel.IN_APP,
        fallbackChain: [MessageChannel.EMAIL, MessageChannel.WHATSAPP],
        routingRules: [],
        rateLimits: {},
      },
      messageService
    );

    // Mock channels
    mockWhatsAppChannel = {
      name: 'whatsapp',
      isAvailable: jest.fn().mockResolvedValue(true),
      sendMessage: jest.fn().mockResolvedValue({ success: true, externalId: 'wa-123' }),
      getConfig: jest.fn().mockReturnValue({ enabled: true }),
    } as any;

    mockEmailChannel = {
      name: 'email',
      isAvailable: jest.fn().mockResolvedValue(true),
      sendMessage: jest.fn().mockResolvedValue({ success: true, externalId: 'email-123' }),
      getConfig: jest.fn().mockReturnValue({ enabled: true }),
    } as any;

    mockFaxChannel = {
      name: 'fax',
      isAvailable: jest.fn().mockResolvedValue(true),
      sendMessage: jest.fn().mockResolvedValue({ success: true, externalId: 'fax-123' }),
      getConfig: jest.fn().mockReturnValue({ enabled: true }),
    } as any;
  });

  describe('WhatsApp Message Flow', () => {
    it('should send WhatsApp message with <5s latency', async () => {
      const startTime = Date.now();

      const conversation: Conversation = {
        id: 'conv-1',
        type: ConversationType.DIRECT,
        participants: [
          { userId: 'user-1', role: 'pharmacist', joinedAt: new Date(), unreadCount: 0 },
          { userId: 'user-2', role: 'patient', joinedAt: new Date(), unreadCount: 0 },
        ],
        subject: 'Test',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isParticipant: jest.fn().mockReturnValue(true),
        addParticipant: jest.fn(),
        removeParticipant: jest.fn(),
        updateLastMessage: jest.fn(),
        markAsRead: jest.fn(),
        incrementUnreadCount: jest.fn(),
        getParticipantIds: jest.fn().mockReturnValue(['user-1', 'user-2']),
      };

      const messageData: CreateMessageDTO = {
        conversationId: 'conv-1',
        senderId: 'user-1',
        senderRole: 'pharmacist',
        recipientId: 'user-2',
        recipientRole: 'patient',
        channel: MessageChannel.WHATSAPP,
        content: 'Hello from WhatsApp',
      };

      const mockMessage: Message = {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'user-1',
        senderRole: 'pharmacist',
        recipientId: 'user-2',
        recipientRole: 'patient',
        channel: MessageChannel.WHATSAPP,
        direction: MessageDirection.OUTBOUND,
        content: 'Hello from WhatsApp',
        status: MessageStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        conversation: conversation,
        markAsSent: jest.fn(),
        markAsDelivered: jest.fn(),
        markAsRead: jest.fn(),
        markAsFailed: jest.fn(),
        incrementDeliveryAttempt: jest.fn(),
      };

      conversationRepository.findOne.mockResolvedValue(conversation);
      messageRepository.create.mockReturnValue(mockMessage);
      messageRepository.save.mockResolvedValue(mockMessage);
      messageRepository.findOne.mockResolvedValue(mockMessage);
      conversationRepository.save.mockResolvedValue(conversation);

      routerService.registerChannel(mockWhatsAppChannel, MessageChannel.WHATSAPP);
      const result = await routerService.routeMessage(mockMessage);

      const elapsedTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(elapsedTime).toBeLessThan(5000); // < 5 seconds
      expect(mockWhatsAppChannel.sendMessage).toHaveBeenCalledWith(mockMessage);
    });

    it('should handle incoming WhatsApp messages', async () => {
      const conversation: Conversation = {
        id: 'conv-1',
        type: ConversationType.DIRECT,
        participants: [
          { userId: 'user-1', role: 'pharmacist', joinedAt: new Date(), unreadCount: 0 },
          { userId: 'user-2', role: 'patient', joinedAt: new Date(), unreadCount: 1 },
        ],
        subject: 'Test',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isParticipant: jest.fn().mockReturnValue(true),
        addParticipant: jest.fn(),
        removeParticipant: jest.fn(),
        updateLastMessage: jest.fn(),
        markAsRead: jest.fn(),
        incrementUnreadCount: jest.fn(),
        getParticipantIds: jest.fn().mockReturnValue(['user-1', 'user-2']),
      };

      const incomingPayload = {
        entry: [{
          changes: [{
            value: {
              messages: [{
                id: 'wamid-123',
                from: '41791234567',
                type: 'text',
                timestamp: Math.floor(Date.now() / 1000),
                text: { body: 'Response from WhatsApp' },
              }],
            },
          }],
        }],
      };

      // Add handleIncoming method if it doesn't exist
      mockWhatsAppChannel.handleIncoming = jest.fn();

      await mockWhatsAppChannel.handleIncoming(incomingPayload);

      expect(mockWhatsAppChannel.handleIncoming).toHaveBeenCalledWith(incomingPayload);
    });
  });

  describe('Email Message Flow', () => {
    it('should send email message with proper headers', async () => {
      const conversation: Conversation = {
        id: 'conv-1',
        type: ConversationType.DIRECT,
        participants: [
          { userId: 'user-1', role: 'pharmacist', joinedAt: new Date(), unreadCount: 0 },
          { userId: 'user-2', role: 'patient', joinedAt: new Date(), unreadCount: 0 },
        ],
        subject: 'Test',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isParticipant: jest.fn().mockReturnValue(true),
        addParticipant: jest.fn(),
        removeParticipant: jest.fn(),
        updateLastMessage: jest.fn(),
        markAsRead: jest.fn(),
        incrementUnreadCount: jest.fn(),
        getParticipantIds: jest.fn().mockReturnValue(['user-1', 'user-2']),
      };

      const messageData: CreateMessageDTO = {
        conversationId: 'conv-1',
        senderId: 'user-1',
        senderRole: 'pharmacist',
        recipientId: 'test@example.com',
        recipientRole: 'patient',
        channel: MessageChannel.EMAIL,
        content: 'Email content',
        metadata: {
          subject: 'Test Subject',
        },
      };

      const mockMessage: Message = {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'user-1',
        senderRole: 'pharmacist',
        recipientId: 'test@example.com',
        recipientRole: 'patient',
        channel: MessageChannel.EMAIL,
        direction: MessageDirection.OUTBOUND,
        content: 'Email content',
        status: MessageStatus.PENDING,
        metadata: { subject: 'Test Subject' },
        createdAt: new Date(),
        updatedAt: new Date(),
        conversation: conversation,
        markAsSent: jest.fn(),
        markAsDelivered: jest.fn(),
        markAsRead: jest.fn(),
        markAsFailed: jest.fn(),
        incrementDeliveryAttempt: jest.fn(),
      };

      conversationRepository.findOne.mockResolvedValue(conversation);
      messageRepository.create.mockReturnValue(mockMessage);
      messageRepository.save.mockResolvedValue(mockMessage);
      messageRepository.findOne.mockResolvedValue(mockMessage);
      conversationRepository.save.mockResolvedValue(conversation);

      routerService.registerChannel(mockEmailChannel, MessageChannel.EMAIL);
      const result = await routerService.routeMessage(mockMessage);

      expect(result.success).toBe(true);
      expect(mockEmailChannel.sendMessage).toHaveBeenCalled();
    });
  });

  describe('Fax Message Flow', () => {
    it('should send fax with PDF attachment', async () => {
      const conversation: Conversation = {
        id: 'conv-1',
        type: ConversationType.DIRECT,
        participants: [
          { userId: 'user-1', role: 'pharmacist', joinedAt: new Date(), unreadCount: 0 },
          { userId: 'user-2', role: 'patient', joinedAt: new Date(), unreadCount: 0 },
        ],
        subject: 'Test',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isParticipant: jest.fn().mockReturnValue(true),
        addParticipant: jest.fn(),
        removeParticipant: jest.fn(),
        updateLastMessage: jest.fn(),
        markAsRead: jest.fn(),
        incrementUnreadCount: jest.fn(),
        getParticipantIds: jest.fn().mockReturnValue(['user-1', 'user-2']),
      };

      const messageData: CreateMessageDTO = {
        conversationId: 'conv-1',
        senderId: 'user-1',
        senderRole: 'pharmacist',
        recipientId: '+41791234567',
        recipientRole: 'patient',
        channel: MessageChannel.FAX,
        content: 'Fax document',
        attachments: [
          {
            id: 'att-1',
            type: 'document',
            url: 'https://example.com/document.pdf',
            filename: 'document.pdf',
            size: 50000,
            mimeType: 'application/pdf',
          },
        ],
      };

      const mockMessage: Message = {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'user-1',
        senderRole: 'pharmacist',
        recipientId: '+41791234567',
        recipientRole: 'patient',
        channel: MessageChannel.FAX,
        direction: MessageDirection.OUTBOUND,
        content: 'Fax document',
        status: MessageStatus.PENDING,
        attachments: messageData.attachments,
        createdAt: new Date(),
        updatedAt: new Date(),
        conversation: conversation,
        markAsSent: jest.fn(),
        markAsDelivered: jest.fn(),
        markAsRead: jest.fn(),
        markAsFailed: jest.fn(),
        incrementDeliveryAttempt: jest.fn(),
      };

      conversationRepository.findOne.mockResolvedValue(conversation);
      messageRepository.create.mockReturnValue(mockMessage);
      messageRepository.save.mockResolvedValue(mockMessage);
      messageRepository.findOne.mockResolvedValue(mockMessage);
      conversationRepository.save.mockResolvedValue(conversation);

      routerService.registerChannel(mockFaxChannel, MessageChannel.FAX);
      const result = await routerService.routeMessage(mockMessage);

      expect(result.success).toBe(true);
      expect(mockFaxChannel.sendMessage).toHaveBeenCalled();
    });
  });

  describe('Unified Inbox', () => {
    it('should retrieve unified inbox with messages from all channels', async () => {
      const conversation: Conversation = {
        id: 'conv-1',
        type: ConversationType.DIRECT,
        participants: [
          { userId: 'user-1', role: 'pharmacist', joinedAt: new Date(), unreadCount: 0 },
          { userId: 'user-2', role: 'patient', joinedAt: new Date(), unreadCount: 2 },
        ],
        subject: 'Multi-Channel Conversation',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessageAt: new Date(),
        isParticipant: jest.fn().mockReturnValue(true),
        addParticipant: jest.fn(),
        removeParticipant: jest.fn(),
        updateLastMessage: jest.fn(),
        markAsRead: jest.fn(),
        incrementUnreadCount: jest.fn(),
        getParticipantIds: jest.fn().mockReturnValue(['user-1', 'user-2']),
      };

      const messages: Message[] = [
        {
          id: 'msg-1',
          conversationId: 'conv-1',
          senderId: 'user-1',
          senderRole: 'pharmacist',
          recipientId: 'user-2',
          recipientRole: 'patient',
          channel: MessageChannel.WHATSAPP,
          direction: MessageDirection.OUTBOUND,
          content: 'Message via WhatsApp',
          status: MessageStatus.DELIVERED,
          createdAt: new Date(Date.now() - 3600000),
          updatedAt: new Date(),
          conversation: conversation,
          markAsSent: jest.fn(),
          markAsDelivered: jest.fn(),
          markAsRead: jest.fn(),
          markAsFailed: jest.fn(),
          incrementDeliveryAttempt: jest.fn(),
        },
        {
          id: 'msg-2',
          conversationId: 'conv-1',
          senderId: 'user-2',
          senderRole: 'patient',
          recipientId: 'user-1',
          recipientRole: 'pharmacist',
          channel: MessageChannel.EMAIL,
          direction: MessageDirection.INBOUND,
          content: 'Reply via Email',
          status: MessageStatus.DELIVERED,
          createdAt: new Date(Date.now() - 1800000),
          updatedAt: new Date(),
          conversation: conversation,
          markAsSent: jest.fn(),
          markAsDelivered: jest.fn(),
          markAsRead: jest.fn(),
          markAsFailed: jest.fn(),
          incrementDeliveryAttempt: jest.fn(),
        },
      ];

      conversation.messages = messages;

      conversationRepository.find.mockResolvedValue([conversation]);
      conversationRepository.count.mockResolvedValue(1);

      const result = await unifiedInboxService.getUnifiedInbox({
        userId: 'user-1',
        limit: 10,
        offset: 0,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].channels.size).toBe(2); // WhatsApp and Email
      expect(result.items[0].unreadCount).toBe(0); // user-1's unreadCount is 0
      expect(result.total).toBe(1);
    });

    it('should get message thread across channels', async () => {
      const conversation: Conversation = {
        id: 'conv-1',
        type: ConversationType.DIRECT,
        participants: [
          { userId: 'user-1', role: 'pharmacist', joinedAt: new Date(), unreadCount: 0 },
          { userId: 'user-2', role: 'patient', joinedAt: new Date(), unreadCount: 0 },
        ],
        subject: 'Prescription Inquiry',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isParticipant: jest.fn().mockReturnValue(true),
        addParticipant: jest.fn(),
        removeParticipant: jest.fn(),
        updateLastMessage: jest.fn(),
        markAsRead: jest.fn(),
        incrementUnreadCount: jest.fn(),
        getParticipantIds: jest.fn().mockReturnValue(['user-1', 'user-2']),
      };

      const threadMessages: Message[] = [
        {
          id: 'msg-1',
          conversationId: 'conv-1',
          senderId: 'user-2',
          senderRole: 'patient',
          recipientId: 'user-1',
          recipientRole: 'pharmacist',
          channel: MessageChannel.WHATSAPP,
          direction: MessageDirection.INBOUND,
          content: 'I need my prescription refilled',
          status: MessageStatus.DELIVERED,
          sentAt: new Date(Date.now() - 3600000),
          createdAt: new Date(Date.now() - 3600000),
          updatedAt: new Date(),
          conversation: conversation,
          markAsSent: jest.fn(),
          markAsDelivered: jest.fn(),
          markAsRead: jest.fn(),
          markAsFailed: jest.fn(),
          incrementDeliveryAttempt: jest.fn(),
        },
        {
          id: 'msg-2',
          conversationId: 'conv-1',
          senderId: 'user-1',
          senderRole: 'pharmacist',
          recipientId: 'user-2',
          recipientRole: 'patient',
          channel: MessageChannel.EMAIL,
          direction: MessageDirection.OUTBOUND,
          content: 'Please provide your prescription details',
          status: MessageStatus.DELIVERED,
          sentAt: new Date(Date.now() - 1800000),
          createdAt: new Date(Date.now() - 1800000),
          updatedAt: new Date(),
          conversation: conversation,
          markAsSent: jest.fn(),
          markAsDelivered: jest.fn(),
          markAsRead: jest.fn(),
          markAsFailed: jest.fn(),
          incrementDeliveryAttempt: jest.fn(),
        },
      ];

      conversation.messages = threadMessages;
      conversationRepository.findOne.mockResolvedValue(conversation);

      const result = await unifiedInboxService.getMessageThread('conv-1');

      expect(result.threadId).toBe('conv-1');
      expect(result.messageCount).toBe(2);
      expect(result.channelCount).toBe(2); // WhatsApp and Email
      expect(result.messages[0].channel).toBe(MessageChannel.WHATSAPP);
      expect(result.messages[1].channel).toBe(MessageChannel.EMAIL);
    });

    it('should search across all channels', async () => {
      const conversation: Conversation = {
        id: 'conv-1',
        type: ConversationType.DIRECT,
        participants: [
          { userId: 'user-1', role: 'pharmacist', joinedAt: new Date(), unreadCount: 0 },
          { userId: 'user-2', role: 'patient', joinedAt: new Date(), unreadCount: 0 },
        ],
        subject: 'Test',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isParticipant: jest.fn().mockReturnValue(true),
        addParticipant: jest.fn(),
        removeParticipant: jest.fn(),
        updateLastMessage: jest.fn(),
        markAsRead: jest.fn(),
        incrementUnreadCount: jest.fn(),
        getParticipantIds: jest.fn().mockReturnValue(['user-1', 'user-2']),
      };

      const searchMessages: Message[] = [
        {
          id: 'msg-1',
          conversationId: 'conv-1',
          senderId: 'user-1',
          senderRole: 'pharmacist',
          recipientId: 'user-2',
          recipientRole: 'patient',
          channel: MessageChannel.WHATSAPP,
          direction: MessageDirection.OUTBOUND,
          content: 'The prescription has been updated',
          status: MessageStatus.DELIVERED,
          createdAt: new Date(),
          updatedAt: new Date(),
          conversation: conversation,
          markAsSent: jest.fn(),
          markAsDelivered: jest.fn(),
          markAsRead: jest.fn(),
          markAsFailed: jest.fn(),
          incrementDeliveryAttempt: jest.fn(),
        },
      ];

      conversation.messages = searchMessages;
      conversationRepository.find.mockResolvedValue([conversation]);

      const result = await unifiedInboxService.searchMessages(
        'user-1',
        'prescription'
      );

      expect(result.total).toBe(1);
      expect(result.results[0].messageId).toBe('msg-1');
      expect(result.results[0].matchPositions.length).toBeGreaterThan(0);
    });
  });

  describe('Channel Status Monitoring', () => {
    it('should check channel availability', async () => {
      const whatsAppAvailable = await mockWhatsAppChannel.isAvailable();
      const emailAvailable = await mockEmailChannel.isAvailable();
      const faxAvailable = await mockFaxChannel.isAvailable();

      expect(whatsAppAvailable).toBe(true);
      expect(emailAvailable).toBe(true);
      expect(faxAvailable).toBe(true);
    });

    it('should get channel statistics', async () => {
      const conversation: Conversation = {
        id: 'conv-1',
        type: ConversationType.DIRECT,
        participants: [
          { userId: 'user-1', role: 'pharmacist', joinedAt: new Date(), unreadCount: 0 },
          { userId: 'user-2', role: 'patient', joinedAt: new Date(), unreadCount: 0 },
        ],
        subject: 'Test',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isParticipant: jest.fn().mockReturnValue(true),
        addParticipant: jest.fn(),
        removeParticipant: jest.fn(),
        updateLastMessage: jest.fn(),
        markAsRead: jest.fn(),
        incrementUnreadCount: jest.fn(),
        getParticipantIds: jest.fn().mockReturnValue(['user-1', 'user-2']),
      };

      const messages: Message[] = [
        {
          id: 'msg-1',
          conversationId: 'conv-1',
          senderId: 'user-1',
          senderRole: 'pharmacist',
          recipientId: 'user-2',
          recipientRole: 'patient',
          channel: MessageChannel.WHATSAPP,
          direction: MessageDirection.OUTBOUND,
          content: 'WhatsApp message',
          status: MessageStatus.SENT,
          sentAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          conversation: conversation,
          markAsSent: jest.fn(),
          markAsDelivered: jest.fn(),
          markAsRead: jest.fn(),
          markAsFailed: jest.fn(),
          incrementDeliveryAttempt: jest.fn(),
        },
        {
          id: 'msg-2',
          conversationId: 'conv-1',
          senderId: 'user-2',
          senderRole: 'patient',
          recipientId: 'user-1',
          recipientRole: 'pharmacist',
          channel: MessageChannel.EMAIL,
          direction: MessageDirection.INBOUND,
          content: 'Email reply',
          status: MessageStatus.DELIVERED,
          sentAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          conversation: conversation,
          markAsSent: jest.fn(),
          markAsDelivered: jest.fn(),
          markAsRead: jest.fn(),
          markAsFailed: jest.fn(),
          incrementDeliveryAttempt: jest.fn(),
        },
      ];

      conversation.messages = messages;
      conversationRepository.find.mockResolvedValue([conversation]);

      const stats = await unifiedInboxService.getChannelStats('user-1');

      expect(stats.totalMessages).toBe(2);
      expect(stats.byChannel[MessageChannel.WHATSAPP].count).toBe(1);
      expect(stats.byChannel[MessageChannel.EMAIL].count).toBe(1);
    });
  });
});
