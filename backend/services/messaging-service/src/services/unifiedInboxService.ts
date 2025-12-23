/**
 * Unified Inbox Service
 * Aggregates messages from all channels and provides unified inbox interface
 * Implements message threading across different channels
 */

import { Repository } from 'typeorm';
import { Message, MessageChannel, MessageStatus } from '../models/Message';
import { Conversation } from '../models/Conversation';

export interface UnifiedInboxFilter {
  userId: string;
  channels?: MessageChannel[];
  statuses?: MessageStatus[];
  unreadOnly?: boolean;
  searchText?: string;
  startDate?: Date;
  endDate?: Date;
  limit: number;
  offset: number;
}

export interface UnifiedInboxItem {
  conversation: {
    id: string;
    subject?: string;
    participantCount: number;
    lastMessageAt: Date;
  };
  lastMessage: {
    id: string;
    preview: string;
    channel: MessageChannel;
    status: MessageStatus;
    sentAt?: Date;
  };
  unreadCount: number;
  channels: Set<MessageChannel>;
}

export interface MessageThreadInfo {
  threadId: string;
  subject: string;
  messages: Array<{
    id: string;
    content: string;
    channel: MessageChannel;
    senderRole: string;
    sentAt?: Date;
    status: MessageStatus;
  }>;
  messageCount: number;
  channelCount: number;
}

/**
 * Unified Inbox Service
 * Provides consolidated view of all messages across channels
 */
export class UnifiedInboxService {
  constructor(
    private messageRepository: Repository<Message>,
    private conversationRepository: Repository<Conversation>
  ) {}

  /**
   * Get unified inbox for a user
   * Aggregates messages from all channels with proper threading
   */
  async getUnifiedInbox(filter: UnifiedInboxFilter): Promise<{
    items: UnifiedInboxItem[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      // Find conversations where user is a participant
      const conversations = await this.conversationRepository.find({
        where: {
          participants: {
            userId: filter.userId,
          },
        },
        order: {
          lastMessageAt: 'DESC',
        },
        take: filter.limit + 1, // Fetch one extra to determine hasMore
        skip: filter.offset,
        relations: ['messages'],
      });

      const hasMore = conversations.length > filter.limit;
      const items = conversations.slice(0, filter.limit);

      const inboxItems: UnifiedInboxItem[] = await Promise.all(
        items.map(async (conversation) => {
          const messages = await this.filterMessages(
            conversation.messages,
            filter
          );

          const lastMessage = messages[messages.length - 1];
          const channels = new Set(messages.map((m) => m.channel));

          // Get unread count for this user
          const participant = conversation.participants.find(
            (p) => p.userId === filter.userId
          );

          return {
            conversation: {
              id: conversation.id,
              subject: conversation.subject,
              participantCount: conversation.participants.length,
              lastMessageAt: conversation.lastMessageAt || new Date(),
            },
            lastMessage: {
              id: lastMessage.id,
              preview: this.getMessagePreview(lastMessage.content),
              channel: lastMessage.channel,
              status: lastMessage.status,
              sentAt: lastMessage.sentAt,
            },
            unreadCount: participant?.unreadCount || 0,
            channels,
          };
        })
      );

      // Count total conversations for this user
      const totalConversations = await this.conversationRepository.count({
        where: {
          participants: {
            userId: filter.userId,
          },
        },
      });

      return {
        items: inboxItems,
        total: totalConversations,
        hasMore,
      };
    } catch (error) {
      console.error('Error getting unified inbox:', error);
      throw error;
    }
  }

  /**
   * Get a complete message thread across all channels
   * Shows all messages in a conversation with channel information
   */
  async getMessageThread(conversationId: string): Promise<MessageThreadInfo> {
    try {
      const conversation = await this.conversationRepository.findOne({
        where: { id: conversationId },
        relations: ['messages'],
      });

      if (!conversation) {
        throw new Error(`Conversation ${conversationId} not found`);
      }

      // Sort messages by date
      const sortedMessages = conversation.messages.sort((a, b) => {
        const aDate = a.createdAt?.getTime() || 0;
        const bDate = b.createdAt?.getTime() || 0;
        return aDate - bDate;
      });

      // Group by channel and get unique channels
      const channels = new Set(sortedMessages.map((m) => m.channel));

      const threadMessages = sortedMessages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        channel: msg.channel,
        senderRole: msg.senderRole,
        sentAt: msg.sentAt,
        status: msg.status,
      }));

      return {
        threadId: conversationId,
        subject: conversation.subject || 'Conversation',
        messages: threadMessages,
        messageCount: sortedMessages.length,
        channelCount: channels.size,
      };
    } catch (error) {
      console.error('Error getting message thread:', error);
      throw error;
    }
  }

  /**
   * Get channel statistics for unified inbox
   * Shows breakdown of messages by channel
   */
  async getChannelStats(userId: string): Promise<{
    totalMessages: number;
    byChannel: Record<MessageChannel, { count: number; unread: number }>;
    averageResponseTime: number; // in milliseconds
  }> {
    try {
      // Get all conversations for user
      const conversations = await this.conversationRepository.find({
        where: {
          participants: {
            userId,
          },
        },
        relations: ['messages'],
      });

      const stats: Record<MessageChannel, { count: number; unread: number }> =
        {
          [MessageChannel.IN_APP]: { count: 0, unread: 0 },
          [MessageChannel.WHATSAPP]: { count: 0, unread: 0 },
          [MessageChannel.EMAIL]: { count: 0, unread: 0 },
          [MessageChannel.FAX]: { count: 0, unread: 0 },
        };

      let totalMessages = 0;
      const responseTimes: number[] = [];

      for (const conversation of conversations) {
        const participant = conversation.participants.find(
          (p) => p.userId === userId
        );

        for (const message of conversation.messages) {
          stats[message.channel].count++;
          totalMessages++;

          if (
            message.status === MessageStatus.DELIVERED ||
            message.status === MessageStatus.SENT
          ) {
            if (participant) {
              stats[message.channel].unread++;
            }
          }

          // Calculate response time if there are inbound/outbound pairs
          if (message.sentAt) {
            // This is a simplified calculation
            // A real implementation would track response pairs
            responseTimes.push(Date.now() - message.sentAt.getTime());
          }
        }
      }

      const averageResponseTime =
        responseTimes.length > 0
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          : 0;

      return {
        totalMessages,
        byChannel: stats,
        averageResponseTime,
      };
    } catch (error) {
      console.error('Error getting channel stats:', error);
      throw error;
    }
  }

  /**
   * Search across all channels
   */
  async searchMessages(
    userId: string,
    searchText: string,
    options: {
      channels?: MessageChannel[];
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    results: Array<{
      messageId: string;
      conversationId: string;
      preview: string;
      channel: MessageChannel;
      matchPositions: number[];
    }>;
    total: number;
  }> {
    try {
      // Get all conversations for user
      const conversations = await this.conversationRepository.find({
        where: {
          participants: {
            userId,
          },
        },
        relations: ['messages'],
      });

      const results: Array<{
        messageId: string;
        conversationId: string;
        preview: string;
        channel: MessageChannel;
        matchPositions: number[];
      }> = [];

      // Search through messages
      for (const conversation of conversations) {
        for (const message of conversation.messages) {
          // Filter by channel if specified
          if (
            options.channels &&
            !options.channels.includes(message.channel)
          ) {
            continue;
          }

          // Search in message content
          const searchTerm = searchText.toLowerCase();
          const content = message.content.toLowerCase();
          const matchPositions: number[] = [];
          let index = content.indexOf(searchTerm);

          while (index !== -1) {
            matchPositions.push(index);
            index = content.indexOf(searchTerm, index + 1);
          }

          if (matchPositions.length > 0) {
            results.push({
              messageId: message.id,
              conversationId: conversation.id,
              preview: this.getMessagePreview(message.content),
              channel: message.channel,
              matchPositions,
            });
          }
        }
      }

      // Sort by match count descending
      results.sort((a, b) => b.matchPositions.length - a.matchPositions.length);

      // Apply pagination
      const limit = options.limit || 20;
      const offset = options.offset || 0;
      const paginated = results.slice(offset, offset + limit);

      return {
        results: paginated,
        total: results.length,
      };
    } catch (error) {
      console.error('Error searching messages:', error);
      throw error;
    }
  }

  /**
   * Get channel availability status
   */
  async getChannelAvailability(): Promise<{
    [key in MessageChannel]: {
      available: boolean;
      lastCheck: Date;
      responseTime: number;
    };
  }> {
    // This would be called by a monitoring service
    // For now, return a basic structure

    return {
      [MessageChannel.IN_APP]: {
        available: true,
        lastCheck: new Date(),
        responseTime: 10,
      },
      [MessageChannel.WHATSAPP]: {
        available: true,
        lastCheck: new Date(),
        responseTime: 500,
      },
      [MessageChannel.EMAIL]: {
        available: true,
        lastCheck: new Date(),
        responseTime: 2000,
      },
      [MessageChannel.FAX]: {
        available: true,
        lastCheck: new Date(),
        responseTime: 1500,
      },
    };
  }

  /**
   * Get message preview (truncated)
   */
  private getMessagePreview(content: string, length: number = 100): string {
    if (content.length <= length) {
      return content;
    }
    return content.substring(0, length) + '...';
  }

  /**
   * Filter messages based on criteria
   */
  private async filterMessages(
    messages: Message[],
    filter: UnifiedInboxFilter
  ): Promise<Message[]> {
    return messages.filter((msg) => {
      // Filter by channels
      if (
        filter.channels &&
        filter.channels.length > 0 &&
        !filter.channels.includes(msg.channel)
      ) {
        return false;
      }

      // Filter by status
      if (
        filter.statuses &&
        filter.statuses.length > 0 &&
        !filter.statuses.includes(msg.status)
      ) {
        return false;
      }

      // Filter by date range
      if (filter.startDate && msg.createdAt < filter.startDate) {
        return false;
      }

      if (filter.endDate && msg.createdAt > filter.endDate) {
        return false;
      }

      // Filter by search text
      if (
        filter.searchText &&
        !msg.content.toLowerCase().includes(filter.searchText.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }
}
