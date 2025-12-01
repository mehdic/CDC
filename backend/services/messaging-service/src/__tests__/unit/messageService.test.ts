/**
 * Message Service Unit Tests
 */

import { Repository } from 'typeorm';
import { MessageService, CreateMessageDTO } from '../../services/messageService';
import { Message, MessageChannel, MessageStatus, MessageDirection } from '../../models/Message';
import { Conversation, ConversationType } from '../../models/Conversation';

describe('MessageService', () => {
  let messageService: MessageService;
  let messageRepository: jest.Mocked<Repository<Message>>;
  let conversationRepository: jest.Mocked<Repository<Conversation>>;

  beforeEach(() => {
    // Create mock repositories
    messageRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    } as any;

    conversationRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as any;

    messageService = new MessageService(messageRepository, conversationRepository);
  });

  describe('createMessage', () => {
    it('should create a message successfully', async () => {
      const conversation: Partial<Conversation> = {
        id: 'conv-1',
        type: ConversationType.DIRECT,
        participants: [
          { userId: 'user-1', role: 'pharmacist', joinedAt: new Date(), unreadCount: 0 },
          { userId: 'user-2', role: 'patient', joinedAt: new Date(), unreadCount: 0 },
        ],
        isParticipant: jest.fn().mockReturnValue(true),
        updateLastMessage: jest.fn(),
        incrementUnreadCount: jest.fn(),
      };

      const messageData: CreateMessageDTO = {
        conversationId: 'conv-1',
        senderId: 'user-1',
        senderRole: 'pharmacist',
        recipientId: 'user-2',
        recipientRole: 'patient',
        channel: MessageChannel.IN_APP,
        content: 'Hello, how can I help you?',
      };

      const mockMessage: Partial<Message> = {
        id: 'msg-1',
        ...messageData,
        direction: MessageDirection.OUTBOUND,
        status: MessageStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      conversationRepository.findOne.mockResolvedValue(conversation as Conversation);
      messageRepository.create.mockReturnValue(mockMessage as Message);
      messageRepository.save.mockResolvedValue(mockMessage as Message);
      conversationRepository.save.mockResolvedValue(conversation as Conversation);

      const result = await messageService.createMessage(messageData);

      expect(result).toEqual(mockMessage);
      expect(conversationRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
      });
      expect(messageRepository.create).toHaveBeenCalled();
      expect(messageRepository.save).toHaveBeenCalled();
    });

    it('should throw error if conversation not found', async () => {
      const messageData: CreateMessageDTO = {
        conversationId: 'invalid-conv',
        senderId: 'user-1',
        senderRole: 'pharmacist',
        recipientId: 'user-2',
        recipientRole: 'patient',
        channel: MessageChannel.IN_APP,
        content: 'Test',
      };

      conversationRepository.findOne.mockResolvedValue(null);

      await expect(messageService.createMessage(messageData)).rejects.toThrow(
        'Conversation invalid-conv not found'
      );
    });

    it('should throw error if sender is not a participant', async () => {
      const conversation: Partial<Conversation> = {
        id: 'conv-1',
        isParticipant: jest.fn().mockReturnValue(false),
      };

      const messageData: CreateMessageDTO = {
        conversationId: 'conv-1',
        senderId: 'invalid-user',
        senderRole: 'pharmacist',
        recipientId: 'user-2',
        recipientRole: 'patient',
        channel: MessageChannel.IN_APP,
        content: 'Test',
      };

      conversationRepository.findOne.mockResolvedValue(conversation as Conversation);

      await expect(messageService.createMessage(messageData)).rejects.toThrow(
        'User invalid-user is not a participant in this conversation'
      );
    });
  });

  describe('updateMessageStatus', () => {
    it('should update message status to SENT', async () => {
      const mockMessage: Partial<Message> = {
        id: 'msg-1',
        status: MessageStatus.PENDING,
        markAsSent: jest.fn(),
      };

      messageRepository.findOne.mockResolvedValue(mockMessage as Message);
      messageRepository.save.mockResolvedValue(mockMessage as Message);

      await messageService.updateMessageStatus('msg-1', {
        status: MessageStatus.SENT,
      });

      expect(mockMessage.markAsSent).toHaveBeenCalled();
      expect(messageRepository.save).toHaveBeenCalled();
    });

    it('should throw error if message not found', async () => {
      messageRepository.findOne.mockResolvedValue(null);

      await expect(
        messageService.updateMessageStatus('invalid-msg', {
          status: MessageStatus.SENT,
        })
      ).rejects.toThrow('Message invalid-msg not found');
    });
  });

  describe('markAsRead', () => {
    it('should mark message as read', async () => {
      const conversation: Partial<Conversation> = {
        id: 'conv-1',
        markAsRead: jest.fn(),
      };

      const mockMessage: Partial<Message> = {
        id: 'msg-1',
        recipientId: 'user-2',
        conversation: conversation as Conversation,
        markAsRead: jest.fn(),
      };

      messageRepository.findOne.mockResolvedValue(mockMessage as Message);
      messageRepository.save.mockResolvedValue(mockMessage as Message);
      conversationRepository.save.mockResolvedValue(conversation as Conversation);

      await messageService.markAsRead('msg-1', 'user-2');

      expect(mockMessage.markAsRead).toHaveBeenCalled();
      expect(conversation.markAsRead).toHaveBeenCalledWith('user-2');
    });

    it('should throw error if user is not recipient', async () => {
      const mockMessage: Partial<Message> = {
        id: 'msg-1',
        recipientId: 'user-2',
      };

      messageRepository.findOne.mockResolvedValue(mockMessage as Message);

      await expect(messageService.markAsRead('msg-1', 'wrong-user')).rejects.toThrow(
        'Only the recipient can mark a message as read'
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread message count', async () => {
      messageRepository.count.mockResolvedValue(5);

      const count = await messageService.getUnreadCount('user-1');

      expect(count).toBe(5);
      expect(messageRepository.count).toHaveBeenCalledWith({
        where: {
          recipientId: 'user-1',
          status: MessageStatus.DELIVERED,
        },
      });
    });
  });
});
