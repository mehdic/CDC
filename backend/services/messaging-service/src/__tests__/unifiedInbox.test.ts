/**
 * Unit Tests for Unified Inbox Service
 */

import { UnifiedInboxService } from '../services/unifiedInbox';
import { MessageChannel, MessageDirection, SendMessageRequest } from '../types/message';

describe('UnifiedInboxService', () => {
  let service: UnifiedInboxService;

  beforeEach(() => {
    service = new UnifiedInboxService();
  });

  describe('sendMessage', () => {
    it('should send a WhatsApp message successfully', async () => {
      const request: SendMessageRequest = {
        pharmacyId: 'pharmacy-1',
        channel: MessageChannel.WHATSAPP,
        to: [{ id: 'user-1', phone: 'whatsapp:+41791234567' }],
        body: 'Test WhatsApp message',
      };

      const result = await service.sendMessage(request);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should send an email message successfully', async () => {
      const request: SendMessageRequest = {
        pharmacyId: 'pharmacy-1',
        channel: MessageChannel.EMAIL,
        to: [{ id: 'user-1', email: 'user@example.com' }],
        subject: 'Test Email',
        body: 'Test email body',
      };

      const result = await service.sendMessage(request);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should send a fax message successfully', async () => {
      const request: SendMessageRequest = {
        pharmacyId: 'pharmacy-1',
        channel: MessageChannel.FAX,
        to: [{ id: 'user-1', faxNumber: '+14155551234' }],
        body: 'Test fax content',
      };

      const result = await service.sendMessage(request);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should send an in-app message successfully', async () => {
      const request: SendMessageRequest = {
        pharmacyId: 'pharmacy-1',
        channel: MessageChannel.IN_APP,
        to: [{ id: 'user-1' }],
        body: 'Test in-app message',
      };

      const result = await service.sendMessage(request);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should reject message with unsupported channel', async () => {
      const request = {
        pharmacyId: 'pharmacy-1',
        channel: 'invalid-channel' as MessageChannel,
        to: [{ id: 'user-1' }],
        body: 'Test message',
      };

      const result = await service.sendMessage(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported channel');
    });
  });

  describe('getMessages', () => {
    beforeEach(async () => {
      // Send test messages
      await service.sendMessage({
        pharmacyId: 'pharmacy-1',
        channel: MessageChannel.WHATSAPP,
        to: [{ id: 'user-1', phone: 'whatsapp:+41791234567' }],
        body: 'Test message 1',
      });

      await service.sendMessage({
        pharmacyId: 'pharmacy-1',
        channel: MessageChannel.EMAIL,
        to: [{ id: 'user-2', email: 'user@example.com' }],
        subject: 'Test Email',
        body: 'Test message 2',
      });
    });

    it('should retrieve all messages for a pharmacy', async () => {
      const messages = await service.getMessages({
        pharmacyId: 'pharmacy-1',
      });

      expect(messages.length).toBeGreaterThanOrEqual(2);
      expect(messages.every((msg) => msg.pharmacyId === 'pharmacy-1')).toBe(true);
    });

    it('should filter messages by channel', async () => {
      const messages = await service.getMessages({
        pharmacyId: 'pharmacy-1',
        channel: MessageChannel.WHATSAPP,
      });

      expect(messages.every((msg) => msg.channel === MessageChannel.WHATSAPP)).toBe(true);
    });

    it('should filter messages by direction', async () => {
      const messages = await service.getMessages({
        pharmacyId: 'pharmacy-1',
        direction: MessageDirection.OUTBOUND,
      });

      expect(messages.every((msg) => msg.direction === MessageDirection.OUTBOUND)).toBe(true);
    });

    it('should apply pagination with limit and offset', async () => {
      const firstPage = await service.getMessages({
        pharmacyId: 'pharmacy-1',
        limit: 1,
        offset: 0,
      });

      const secondPage = await service.getMessages({
        pharmacyId: 'pharmacy-1',
        limit: 1,
        offset: 1,
      });

      expect(firstPage.length).toBe(1);
      expect(secondPage.length).toBe(1);
      expect(firstPage[0].id).not.toBe(secondPage[0].id);
    });
  });

  describe('getConversations', () => {
    beforeEach(async () => {
      // Send messages to create conversations
      await service.sendMessage({
        pharmacyId: 'pharmacy-1',
        channel: MessageChannel.WHATSAPP,
        to: [{ id: 'user-1', phone: 'whatsapp:+41791234567' }],
        body: 'Test message',
      });
    });

    it('should retrieve all conversations for a pharmacy', async () => {
      const conversations = await service.getConversations('pharmacy-1');

      expect(conversations.length).toBeGreaterThan(0);
      expect(conversations.every((conv) => conv.pharmacyId === 'pharmacy-1')).toBe(true);
    });

    it('should filter conversations by channel', async () => {
      const conversations = await service.getConversations('pharmacy-1', MessageChannel.WHATSAPP);

      expect(conversations.every((conv) => conv.channel === MessageChannel.WHATSAPP)).toBe(true);
    });

    it('should sort conversations by last message date', async () => {
      const conversations = await service.getConversations('pharmacy-1');

      // Verify conversations are sorted descending
      for (let i = 0; i < conversations.length - 1; i++) {
        const current = conversations[i].lastMessageAt?.getTime() || 0;
        const next = conversations[i + 1].lastMessageAt?.getTime() || 0;
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });
  });

  describe('markMessageAsRead', () => {
    it('should mark a message as read', async () => {
      // Send a message
      const sendResult = await service.sendMessage({
        pharmacyId: 'pharmacy-1',
        channel: MessageChannel.IN_APP,
        to: [{ id: 'user-1' }],
        body: 'Test message',
      });

      // Mark as read
      const markResult = await service.markMessageAsRead(sendResult.messageId!, 'pharmacy-1');

      expect(markResult).toBe(true);
    });

    it('should return false for non-existent message', async () => {
      const result = await service.markMessageAsRead('non-existent', 'pharmacy-1');

      expect(result).toBe(false);
    });

    it('should return false for message from different pharmacy', async () => {
      // Send a message from pharmacy-1
      const sendResult = await service.sendMessage({
        pharmacyId: 'pharmacy-1',
        channel: MessageChannel.IN_APP,
        to: [{ id: 'user-1' }],
        body: 'Test message',
      });

      // Try to mark as read from pharmacy-2
      const markResult = await service.markMessageAsRead(sendResult.messageId!, 'pharmacy-2');

      expect(markResult).toBe(false);
    });
  });

  describe('markConversationAsRead', () => {
    it('should mark all messages in conversation as read', async () => {
      // Send a message to create conversation
      const sendResult = await service.sendMessage({
        pharmacyId: 'pharmacy-1',
        channel: MessageChannel.IN_APP,
        to: [{ id: 'user-1' }],
        body: 'Test message',
      });

      // Get conversation ID
      const messages = await service.getMessages({
        pharmacyId: 'pharmacy-1',
      });
      const conversationId = messages[0].conversationId;

      // Mark conversation as read
      const result = await service.markConversationAsRead(conversationId, 'pharmacy-1');

      expect(result).toBe(true);
    });
  });

  describe('getMessageStats', () => {
    beforeEach(async () => {
      // Send test messages
      await service.sendMessage({
        pharmacyId: 'pharmacy-1',
        channel: MessageChannel.WHATSAPP,
        to: [{ id: 'user-1', phone: 'whatsapp:+41791234567' }],
        body: 'WhatsApp message',
      });

      await service.sendMessage({
        pharmacyId: 'pharmacy-1',
        channel: MessageChannel.EMAIL,
        to: [{ id: 'user-2', email: 'user@example.com' }],
        subject: 'Email',
        body: 'Email message',
      });
    });

    it('should return correct message statistics', async () => {
      const stats = await service.getMessageStats('pharmacy-1');

      expect(stats.total).toBeGreaterThanOrEqual(2);
      expect(stats.byChannel[MessageChannel.WHATSAPP]).toBeGreaterThanOrEqual(1);
      expect(stats.byChannel[MessageChannel.EMAIL]).toBeGreaterThanOrEqual(1);
    });

    it('should return zero stats for pharmacy with no messages', async () => {
      const stats = await service.getMessageStats('pharmacy-999');

      expect(stats.total).toBe(0);
      expect(stats.unread).toBe(0);
    });
  });
});
