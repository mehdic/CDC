/**
 * Unified Inbox Service
 *
 * Aggregates messages from all channels (WhatsApp, Email, Fax, In-App)
 * Provides:
 * - Message aggregation and filtering
 * - Conversation threading
 * - Multi-channel sending
 * - Status tracking
 */

import {
  Message,
  Conversation,
  MessageChannel,
  MessageDirection,
  MessageStatus,
  SendMessageRequest,
  MessageFilter,
  MessageRecipient,
} from '../types/message';
import { whatsappClient } from '../integrations/whatsapp';
import { emailClient } from '../integrations/email';
import { faxClient } from '../integrations/fax';

// In-memory storage (stub - would be database in production)
const messagesStore: Message[] = [];
const conversationsStore: Conversation[] = [];

export class UnifiedInboxService {
  /**
   * Send a message through appropriate channel
   */
  async sendMessage(request: SendMessageRequest): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log(`[UnifiedInbox] Sending ${request.channel} message from pharmacy ${request.pharmacyId}`);

      // Create message record
      const message: Message = {
        id: `MSG_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        conversationId: this.findOrCreateConversation(request),
        pharmacyId: request.pharmacyId,
        channel: request.channel,
        direction: MessageDirection.OUTBOUND,
        status: MessageStatus.QUEUED,
        from: {
          id: request.pharmacyId,
          name: 'MetaPharm Connect',
        },
        to: request.to,
        cc: request.cc,
        bcc: request.bcc,
        subject: request.subject,
        body: request.body,
        bodyHtml: request.bodyHtml,
        attachments: request.attachments,
        replyToMessageId: request.replyToMessageId,
        createdAt: new Date(),
        metadata: request.metadata,
      };

      // Route to appropriate channel
      let channelResult: { success: boolean; messageId?: string; error?: string };

      switch (request.channel) {
        case MessageChannel.WHATSAPP:
          channelResult = await this.sendWhatsAppMessage(message);
          break;

        case MessageChannel.EMAIL:
          channelResult = await this.sendEmailMessage(message);
          break;

        case MessageChannel.FAX:
          channelResult = await this.sendFaxMessage(message);
          break;

        case MessageChannel.IN_APP:
          channelResult = await this.sendInAppMessage(message);
          break;

        default:
          return {
            success: false,
            error: `Unsupported channel: ${request.channel}`,
          };
      }

      if (channelResult.success) {
        message.status = MessageStatus.SENT;
        message.sentAt = new Date();
        message.externalId = channelResult.messageId;

        // Store message
        messagesStore.push(message);

        // Update conversation
        this.updateConversation(message);

        return {
          success: true,
          messageId: message.id,
        };
      } else {
        message.status = MessageStatus.FAILED;
        messagesStore.push(message);

        return {
          success: false,
          error: channelResult.error,
        };
      }
    } catch (error) {
      console.error('[UnifiedInbox] Error sending message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get messages with filtering
   */
  async getMessages(filter: MessageFilter): Promise<Message[]> {
    console.log(`[UnifiedInbox] Fetching messages for pharmacy ${filter.pharmacyId}`);

    let filtered = messagesStore.filter((msg) => msg.pharmacyId === filter.pharmacyId);

    if (filter.channel) {
      filtered = filtered.filter((msg) => msg.channel === filter.channel);
    }

    if (filter.conversationId) {
      filtered = filtered.filter((msg) => msg.conversationId === filter.conversationId);
    }

    if (filter.direction) {
      filtered = filtered.filter((msg) => msg.direction === filter.direction);
    }

    if (filter.status) {
      filtered = filtered.filter((msg) => msg.status === filter.status);
    }

    if (filter.unreadOnly) {
      filtered = filtered.filter((msg) => !msg.readAt && msg.direction === MessageDirection.INBOUND);
    }

    if (filter.dateFrom) {
      filtered = filtered.filter((msg) => msg.createdAt >= filter.dateFrom!);
    }

    if (filter.dateTo) {
      filtered = filtered.filter((msg) => msg.createdAt <= filter.dateTo!);
    }

    // Sort by date descending (newest first)
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    const offset = filter.offset || 0;
    const limit = filter.limit || 50;
    return filtered.slice(offset, offset + limit);
  }

  /**
   * Get conversations with last message preview
   */
  async getConversations(pharmacyId: string, channel?: MessageChannel): Promise<Conversation[]> {
    console.log(`[UnifiedInbox] Fetching conversations for pharmacy ${pharmacyId}`);

    let filtered = conversationsStore.filter((conv) => conv.pharmacyId === pharmacyId);

    if (channel) {
      filtered = filtered.filter((conv) => conv.channel === channel);
    }

    // Sort by last message date descending
    filtered.sort((a, b) => {
      const aDate = a.lastMessageAt?.getTime() || 0;
      const bDate = b.lastMessageAt?.getTime() || 0;
      return bDate - aDate;
    });

    return filtered;
  }

  /**
   * Get a specific conversation
   */
  async getConversation(conversationId: string, pharmacyId: string): Promise<Conversation | null> {
    const conversation = conversationsStore.find(
      (conv) => conv.id === conversationId && conv.pharmacyId === pharmacyId
    );

    return conversation || null;
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string, pharmacyId: string): Promise<boolean> {
    const message = messagesStore.find((msg) => msg.id === messageId && msg.pharmacyId === pharmacyId);

    if (!message) {
      return false;
    }

    message.readAt = new Date();
    message.status = MessageStatus.READ;

    // Update conversation unread count
    const conversation = conversationsStore.find((conv) => conv.id === message.conversationId);
    if (conversation && conversation.unreadCount > 0) {
      conversation.unreadCount--;
    }

    return true;
  }

  /**
   * Mark all messages in conversation as read
   */
  async markConversationAsRead(conversationId: string, pharmacyId: string): Promise<boolean> {
    const messages = messagesStore.filter(
      (msg) =>
        msg.conversationId === conversationId &&
        msg.pharmacyId === pharmacyId &&
        msg.direction === MessageDirection.INBOUND &&
        !msg.readAt
    );

    messages.forEach((msg) => {
      msg.readAt = new Date();
      msg.status = MessageStatus.READ;
    });

    // Reset conversation unread count
    const conversation = conversationsStore.find(
      (conv) => conv.id === conversationId && conv.pharmacyId === pharmacyId
    );
    if (conversation) {
      conversation.unreadCount = 0;
    }

    return true;
  }

  /**
   * Get message statistics
   */
  async getMessageStats(pharmacyId: string): Promise<{
    total: number;
    unread: number;
    byChannel: Record<MessageChannel, number>;
  }> {
    const pharmacyMessages = messagesStore.filter((msg) => msg.pharmacyId === pharmacyId);

    const stats = {
      total: pharmacyMessages.length,
      unread: pharmacyMessages.filter((msg) => !msg.readAt && msg.direction === MessageDirection.INBOUND).length,
      byChannel: {
        [MessageChannel.WHATSAPP]: pharmacyMessages.filter((msg) => msg.channel === MessageChannel.WHATSAPP).length,
        [MessageChannel.EMAIL]: pharmacyMessages.filter((msg) => msg.channel === MessageChannel.EMAIL).length,
        [MessageChannel.FAX]: pharmacyMessages.filter((msg) => msg.channel === MessageChannel.FAX).length,
        [MessageChannel.IN_APP]: pharmacyMessages.filter((msg) => msg.channel === MessageChannel.IN_APP).length,
      },
    };

    return stats;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Send WhatsApp message
   */
  private async sendWhatsAppMessage(message: Message): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const recipient = message.to[0];
    if (!recipient.phone) {
      return { success: false, error: 'WhatsApp requires phone number' };
    }

    // Format phone number for WhatsApp
    const whatsappNumber = recipient.phone.startsWith('whatsapp:')
      ? recipient.phone
      : `whatsapp:${recipient.phone}`;

    const result = await whatsappClient.sendMessage({
      to: whatsappNumber,
      body: message.body,
      mediaUrl: message.attachments?.map((att) => att.url).filter((url): url is string => !!url),
    });

    return result;
  }

  /**
   * Send email message
   */
  private async sendEmailMessage(message: Message): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const result = await emailClient.sendEmail({
      to: message.to.map((r) => r.email).filter((e): e is string => !!e),
      cc: message.cc?.map((r) => r.email).filter((e): e is string => !!e),
      bcc: message.bcc?.map((r) => r.email).filter((e): e is string => !!e),
      subject: message.subject || '(No Subject)',
      text: message.body,
      html: message.bodyHtml,
      attachments: message.attachments?.map((att) => ({
        filename: att.filename,
        content: att.content,
      })),
      inReplyTo: message.replyToMessageId,
    });

    return result;
  }

  /**
   * Send fax message
   */
  private async sendFaxMessage(message: Message): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const recipient = message.to[0];
    if (!recipient.faxNumber) {
      return { success: false, error: 'Fax requires fax number' };
    }

    // If attachments, use first PDF
    // Otherwise, convert message body to PDF (stub)
    const pdfAttachment = message.attachments?.find((att) => att.mimeType === 'application/pdf');
    let pdfUrl = pdfAttachment?.url;
    let pdfContent: Buffer | undefined;

    if (!pdfUrl && !pdfAttachment) {
      // STUB: In production, convert body to PDF
      // For testing, create a stub PDF from the body
      pdfContent = await faxClient.convertToPDF(message.body, {
        title: message.subject || 'Fax Message',
      });
    }

    const result = await faxClient.sendFax({
      to: recipient.faxNumber,
      pdfUrl,
      pdfContent,
    });

    return { success: result.success, messageId: result.faxId, error: result.error };
  }

  /**
   * Send in-app message (stub)
   */
  private async sendInAppMessage(message: Message): Promise<{ success: boolean; messageId?: string; error?: string }> {
    console.log('[UnifiedInbox] STUB: Sending in-app message');

    // STUB: In production, this would:
    // 1. Store message in database
    // 2. Send push notification via notification-service
    // 3. Emit WebSocket event for real-time delivery

    return {
      success: true,
      messageId: message.id,
    };
  }

  /**
   * Find existing conversation or create new one
   */
  private findOrCreateConversation(request: SendMessageRequest): string {
    // Try to find existing conversation
    const participantIds = request.to.map((r) => r.id);

    let conversation = conversationsStore.find(
      (conv) =>
        conv.pharmacyId === request.pharmacyId &&
        conv.channel === request.channel &&
        conv.participantIds.some((id) => participantIds.includes(id))
    );

    if (!conversation) {
      // Create new conversation
      conversation = {
        id: `CONV_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        pharmacyId: request.pharmacyId,
        participantIds: [request.pharmacyId, ...participantIds],
        channel: request.channel,
        subject: request.subject,
        unreadCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      conversationsStore.push(conversation);
    }

    return conversation.id;
  }

  /**
   * Update conversation with latest message
   */
  private updateConversation(message: Message): void {
    const conversation = conversationsStore.find((conv) => conv.id === message.conversationId);

    if (conversation) {
      conversation.lastMessageId = message.id;
      conversation.lastMessageAt = message.createdAt;
      conversation.updatedAt = new Date();

      // Increment unread count for inbound messages
      if (message.direction === MessageDirection.INBOUND) {
        conversation.unreadCount++;
      }
    }
  }
}

// Export singleton instance
export const unifiedInboxService = new UnifiedInboxService();
