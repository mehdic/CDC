/**
 * Message Service
 * Handles CRUD operations for messages
 */

import { Repository, FindOptionsWhere, Between } from 'typeorm';
import { Message, MessageChannel, MessageStatus, MessageDirection } from '../models/Message';
import { Conversation } from '../models/Conversation';

export interface CreateMessageDTO {
  conversationId: string;
  senderId: string;
  senderRole: string;
  recipientId: string;
  recipientRole: string;
  channel: MessageChannel;
  content: string;
  attachments?: {
    id: string;
    type: string;
    url: string;
    filename: string;
    size: number;
    mimeType: string;
  }[];
  metadata?: {
    templateId?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    [key: string]: unknown;
  };
}

export interface UpdateMessageStatusDTO {
  status: MessageStatus;
  metadata?: {
    externalId?: string;
    errorMessage?: string;
    [key: string]: unknown;
  };
}

export interface MessageFilterDTO {
  conversationId?: string;
  senderId?: string;
  recipientId?: string;
  channel?: MessageChannel;
  status?: MessageStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class MessageService {
  constructor(
    private messageRepository: Repository<Message>,
    private conversationRepository: Repository<Conversation>
  ) {}

  /**
   * Create a new message
   */
  async createMessage(data: CreateMessageDTO): Promise<Message> {
    // Verify conversation exists
    const conversation = await this.conversationRepository.findOne({
      where: { id: data.conversationId },
    });

    if (!conversation) {
      throw new Error(`Conversation ${data.conversationId} not found`);
    }

    // Verify sender is participant
    if (!conversation.isParticipant(data.senderId)) {
      throw new Error(`User ${data.senderId} is not a participant in this conversation`);
    }

    // Create message
    const message = this.messageRepository.create({
      conversationId: data.conversationId,
      senderId: data.senderId,
      senderRole: data.senderRole,
      recipientId: data.recipientId,
      recipientRole: data.recipientRole,
      channel: data.channel,
      direction: MessageDirection.OUTBOUND,
      content: data.content,
      attachments: data.attachments,
      status: MessageStatus.PENDING,
      metadata: data.metadata,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update conversation
    conversation.updateLastMessage(savedMessage.id);
    conversation.incrementUnreadCount(data.recipientId);
    await this.conversationRepository.save(conversation);

    return savedMessage;
  }

  /**
   * Get message by ID
   */
  async getMessageById(id: string): Promise<Message | null> {
    return this.messageRepository.findOne({
      where: { id },
      relations: ['conversation'],
    });
  }

  /**
   * Get messages with filters
   */
  async getMessages(filter: MessageFilterDTO): Promise<{
    messages: Message[];
    total: number;
  }> {
    const where: FindOptionsWhere<Message> = {};

    if (filter.conversationId) {
      where.conversationId = filter.conversationId;
    }

    if (filter.senderId) {
      where.senderId = filter.senderId;
    }

    if (filter.recipientId) {
      where.recipientId = filter.recipientId;
    }

    if (filter.channel) {
      where.channel = filter.channel;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.startDate && filter.endDate) {
      where.createdAt = Between(filter.startDate, filter.endDate) as any;
    }

    const [messages, total] = await this.messageRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: filter.limit || 50,
      skip: filter.offset || 0,
      relations: ['conversation'],
    });

    return { messages, total };
  }

  /**
   * Update message status
   */
  async updateMessageStatus(
    id: string,
    update: UpdateMessageStatusDTO
  ): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id },
    });

    if (!message) {
      throw new Error(`Message ${id} not found`);
    }

    // Update status and timestamps
    message.status = update.status;

    if (update.status === MessageStatus.SENT) {
      message.markAsSent();
    } else if (update.status === MessageStatus.DELIVERED) {
      message.markAsDelivered();
    } else if (update.status === MessageStatus.READ) {
      message.markAsRead();
    } else if (update.status === MessageStatus.FAILED) {
      message.markAsFailed(update.metadata?.errorMessage || 'Unknown error');
    }

    // Merge metadata
    if (update.metadata) {
      message.metadata = {
        ...message.metadata,
        ...update.metadata,
      };
    }

    return this.messageRepository.save(message);
  }

  /**
   * Mark message as read
   */
  async markAsRead(id: string, userId: string): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id },
      relations: ['conversation'],
    });

    if (!message) {
      throw new Error(`Message ${id} not found`);
    }

    // Verify user is recipient
    if (message.recipientId !== userId) {
      throw new Error('Only the recipient can mark a message as read');
    }

    message.markAsRead();

    // Update conversation
    if (message.conversation) {
      message.conversation.markAsRead(userId);
      await this.conversationRepository.save(message.conversation);
    }

    return this.messageRepository.save(message);
  }

  /**
   * Get unread message count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.messageRepository.count({
      where: {
        recipientId: userId,
        status: MessageStatus.DELIVERED,
      },
    });
  }

  /**
   * Delete message
   */
  async deleteMessage(id: string): Promise<void> {
    const result = await this.messageRepository.delete(id);

    if (result.affected === 0) {
      throw new Error(`Message ${id} not found`);
    }
  }

  /**
   * Retry failed message
   */
  async retryFailedMessage(id: string): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id },
    });

    if (!message) {
      throw new Error(`Message ${id} not found`);
    }

    if (message.status !== MessageStatus.FAILED) {
      throw new Error('Only failed messages can be retried');
    }

    message.status = MessageStatus.PENDING;
    message.incrementDeliveryAttempt();

    return this.messageRepository.save(message);
  }
}
