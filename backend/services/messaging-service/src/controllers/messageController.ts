/**
 * Message Controller
 * HTTP endpoints for unified inbox
 */

import { Request, Response } from 'express';
import { unifiedInboxService } from '../services/unifiedInbox';
import { SendMessageRequest, MessageFilter, MessageChannel } from '../types/message';

/**
 * POST /messages/send
 * Send a message through any channel
 */
export async function sendMessage(req: Request, res: Response): Promise<void> {
  try {
    const request: SendMessageRequest = req.body;

    // Validate required fields
    if (!request.pharmacyId) {
      res.status(400).json({ error: 'pharmacyId is required' });
      return;
    }

    if (!request.channel) {
      res.status(400).json({ error: 'channel is required' });
      return;
    }

    if (!request.to || request.to.length === 0) {
      res.status(400).json({ error: 'at least one recipient is required' });
      return;
    }

    if (!request.body) {
      res.status(400).json({ error: 'message body is required' });
      return;
    }

    const result = await unifiedInboxService.sendMessage(request);

    if (result.success) {
      res.status(200).json({
        success: true,
        messageId: result.messageId,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('[MessageController] Error sending message:', error);
    res.status(500).json({
      error: 'Failed to send message',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /messages
 * Get messages with optional filtering
 */
export async function getMessages(req: Request, res: Response): Promise<void> {
  try {
    const filter: MessageFilter = {
      pharmacyId: req.query.pharmacyId as string,
      channel: req.query.channel as MessageChannel | undefined,
      conversationId: req.query.conversationId as string | undefined,
      unreadOnly: req.query.unreadOnly === 'true',
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };

    if (!filter.pharmacyId) {
      res.status(400).json({ error: 'pharmacyId is required' });
      return;
    }

    const messages = await unifiedInboxService.getMessages(filter);

    res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error('[MessageController] Error fetching messages:', error);
    res.status(500).json({
      error: 'Failed to fetch messages',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /conversations
 * Get conversations for a pharmacy
 */
export async function getConversations(req: Request, res: Response): Promise<void> {
  try {
    const pharmacyId = req.query.pharmacyId as string;
    const channel = req.query.channel as MessageChannel | undefined;

    if (!pharmacyId) {
      res.status(400).json({ error: 'pharmacyId is required' });
      return;
    }

    const conversations = await unifiedInboxService.getConversations(pharmacyId, channel);

    res.status(200).json({
      success: true,
      count: conversations.length,
      conversations,
    });
  } catch (error) {
    console.error('[MessageController] Error fetching conversations:', error);
    res.status(500).json({
      error: 'Failed to fetch conversations',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /conversations/:conversationId
 * Get a specific conversation
 */
export async function getConversation(req: Request, res: Response): Promise<void> {
  try {
    const { conversationId } = req.params;
    const pharmacyId = req.query.pharmacyId as string;

    if (!pharmacyId) {
      res.status(400).json({ error: 'pharmacyId is required' });
      return;
    }

    const conversation = await unifiedInboxService.getConversation(conversationId, pharmacyId);

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error('[MessageController] Error fetching conversation:', error);
    res.status(500).json({
      error: 'Failed to fetch conversation',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * PUT /messages/:messageId/read
 * Mark message as read
 */
export async function markMessageAsRead(req: Request, res: Response): Promise<void> {
  try {
    const { messageId } = req.params;
    const pharmacyId = req.body.pharmacyId as string;

    if (!pharmacyId) {
      res.status(400).json({ error: 'pharmacyId is required' });
      return;
    }

    const success = await unifiedInboxService.markMessageAsRead(messageId, pharmacyId);

    if (success) {
      res.status(200).json({ success: true });
    } else {
      res.status(404).json({ error: 'Message not found' });
    }
  } catch (error) {
    console.error('[MessageController] Error marking message as read:', error);
    res.status(500).json({
      error: 'Failed to mark message as read',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * PUT /conversations/:conversationId/read
 * Mark all messages in conversation as read
 */
export async function markConversationAsRead(req: Request, res: Response): Promise<void> {
  try {
    const { conversationId } = req.params;
    const pharmacyId = req.body.pharmacyId as string;

    if (!pharmacyId) {
      res.status(400).json({ error: 'pharmacyId is required' });
      return;
    }

    const success = await unifiedInboxService.markConversationAsRead(conversationId, pharmacyId);

    if (success) {
      res.status(200).json({ success: true });
    } else {
      res.status(404).json({ error: 'Conversation not found' });
    }
  } catch (error) {
    console.error('[MessageController] Error marking conversation as read:', error);
    res.status(500).json({
      error: 'Failed to mark conversation as read',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /messages/stats
 * Get message statistics
 */
export async function getMessageStats(req: Request, res: Response): Promise<void> {
  try {
    const pharmacyId = req.query.pharmacyId as string;

    if (!pharmacyId) {
      res.status(400).json({ error: 'pharmacyId is required' });
      return;
    }

    const stats = await unifiedInboxService.getMessageStats(pharmacyId);

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('[MessageController] Error fetching message stats:', error);
    res.status(500).json({
      error: 'Failed to fetch message stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
