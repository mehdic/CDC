/**
 * Conversation Service
 * Handles conversation management and threading
 */

import { Repository, FindOptionsWhere, In } from 'typeorm';
import { Conversation, ConversationType } from '../models/Conversation';
import { Message } from '../models/Message';

export interface CreateConversationDTO {
  type: ConversationType;
  participants: {
    userId: string;
    role: string;
  }[];
  subject?: string;
  metadata?: {
    prescriptionId?: string;
    orderId?: string;
    deliveryId?: string;
    consultationId?: string;
    tags?: string[];
    [key: string]: unknown;
  };
}

export interface ConversationFilterDTO {
  userId?: string;
  type?: ConversationType;
  archived?: boolean;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export class ConversationService {
  constructor(
    private conversationRepository: Repository<Conversation>,
    private messageRepository: Repository<Message>
  ) {}

  /**
   * Create a new conversation
   */
  async createConversation(data: CreateConversationDTO): Promise<Conversation> {
    // Validate participants
    if (!data.participants || data.participants.length < 2) {
      throw new Error('Conversation must have at least 2 participants');
    }

    // For direct conversations, ensure only 2 participants
    if (data.type === ConversationType.DIRECT && data.participants.length !== 2) {
      throw new Error('Direct conversations must have exactly 2 participants');
    }

    const conversation = this.conversationRepository.create({
      type: data.type,
      participants: data.participants.map((p) => ({
        userId: p.userId,
        role: p.role,
        joinedAt: new Date(),
        unreadCount: 0,
      })),
      subject: data.subject,
      metadata: data.metadata,
    });

    return this.conversationRepository.save(conversation);
  }

  /**
   * Get conversation by ID
   */
  async getConversationById(id: string, includeMessages = false): Promise<Conversation | null> {
    const options: any = {
      where: { id },
    };

    if (includeMessages) {
      options.relations = ['messages'];
      options.order = {
        messages: {
          createdAt: 'ASC',
        },
      };
    }

    return this.conversationRepository.findOne(options);
  }

  /**
   * Get conversations for a user
   */
  async getConversationsForUser(filter: ConversationFilterDTO): Promise<{
    conversations: Conversation[];
    total: number;
  }> {
    if (!filter.userId) {
      throw new Error('userId is required');
    }

    const queryBuilder = this.conversationRepository
      .createQueryBuilder('conversation')
      .where(
        `EXISTS (
          SELECT 1 FROM jsonb_array_elements(conversation.participants) AS participant
          WHERE participant->>'userId' = :userId
        )`,
        { userId: filter.userId }
      );

    // Filter by type
    if (filter.type) {
      queryBuilder.andWhere('conversation.type = :type', { type: filter.type });
    }

    // Filter by archived
    if (filter.archived !== undefined) {
      if (filter.archived) {
        queryBuilder.andWhere("conversation.metadata->>'archived' = 'true'");
      } else {
        queryBuilder.andWhere(
          "(conversation.metadata->>'archived' IS NULL OR conversation.metadata->>'archived' = 'false')"
        );
      }
    }

    // Filter by tags
    if (filter.tags && filter.tags.length > 0) {
      queryBuilder.andWhere(
        `conversation.metadata->'tags' ?| ARRAY[:...tags]`,
        { tags: filter.tags }
      );
    }

    // Order by last message
    queryBuilder.orderBy('conversation.lastMessageAt', 'DESC', 'NULLS LAST');

    // Pagination
    queryBuilder.skip(filter.offset || 0);
    queryBuilder.take(filter.limit || 50);

    const [conversations, total] = await queryBuilder.getManyAndCount();

    return { conversations, total };
  }

  /**
   * Get or create direct conversation between two users
   */
  async getOrCreateDirectConversation(
    user1Id: string,
    user1Role: string,
    user2Id: string,
    user2Role: string
  ): Promise<Conversation> {
    // Try to find existing conversation
    const existing = await this.conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.type = :type', { type: ConversationType.DIRECT })
      .andWhere(
        `EXISTS (
          SELECT 1 FROM jsonb_array_elements(conversation.participants) AS p1
          WHERE p1->>'userId' = :user1Id
        )`,
        { user1Id }
      )
      .andWhere(
        `EXISTS (
          SELECT 1 FROM jsonb_array_elements(conversation.participants) AS p2
          WHERE p2->>'userId' = :user2Id
        )`,
        { user2Id }
      )
      .getOne();

    if (existing) {
      return existing;
    }

    // Create new conversation
    return this.createConversation({
      type: ConversationType.DIRECT,
      participants: [
        { userId: user1Id, role: user1Role },
        { userId: user2Id, role: user2Role },
      ],
    });
  }

  /**
   * Add participant to conversation
   */
  async addParticipant(
    conversationId: string,
    userId: string,
    role: string
  ): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    if (conversation.type === ConversationType.DIRECT) {
      throw new Error('Cannot add participants to direct conversations');
    }

    conversation.addParticipant(userId, role);

    return this.conversationRepository.save(conversation);
  }

  /**
   * Remove participant from conversation
   */
  async removeParticipant(conversationId: string, userId: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    conversation.removeParticipant(userId);

    return this.conversationRepository.save(conversation);
  }

  /**
   * Mark conversation as read for user
   */
  async markAsRead(conversationId: string, userId: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    if (!conversation.isParticipant(userId)) {
      throw new Error(`User ${userId} is not a participant in this conversation`);
    }

    conversation.markAsRead(userId);

    return this.conversationRepository.save(conversation);
  }

  /**
   * Archive conversation
   */
  async archiveConversation(conversationId: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    conversation.metadata = {
      ...conversation.metadata,
      archived: true,
    };

    return this.conversationRepository.save(conversation);
  }

  /**
   * Unarchive conversation
   */
  async unarchiveConversation(conversationId: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    conversation.metadata = {
      ...conversation.metadata,
      archived: false,
    };

    return this.conversationRepository.save(conversation);
  }

  /**
   * Delete conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    const result = await this.conversationRepository.delete(conversationId);

    if (result.affected === 0) {
      throw new Error(`Conversation ${conversationId} not found`);
    }
  }

  /**
   * Get conversation messages with pagination
   */
  async getConversationMessages(
    conversationId: string,
    limit = 50,
    offset = 0
  ): Promise<{
    messages: Message[];
    total: number;
  }> {
    const [messages, total] = await this.messageRepository.findAndCount({
      where: { conversationId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { messages, total };
  }
}
