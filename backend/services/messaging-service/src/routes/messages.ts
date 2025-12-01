/**
 * Message Routes
 * API endpoints for message operations
 */

import { Router, Request, Response } from 'express';
import { MessageService, CreateMessageDTO, MessageFilterDTO } from '../services/messageService';
import { RouterService } from '../services/routerService';

export function createMessageRoutes(
  messageService: MessageService,
  routerService: RouterService
): Router {
  const router = Router();

  /**
   * POST /api/messages
   * Send a new message
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const data: CreateMessageDTO = req.body;

      // Validate required fields
      if (!data.conversationId || !data.senderId || !data.recipientId || !data.content) {
        return res.status(400).json({
          error: 'Missing required fields: conversationId, senderId, recipientId, content',
        });
      }

      // Create message
      const message = await messageService.createMessage(data);

      // Route and send through appropriate channel
      const result = await routerService.routeMessage(message);

      return res.status(201).json({
        message,
        deliveryResult: result,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      return res.status(500).json({
        error: (error as Error).message,
      });
    }
  });

  /**
   * GET /api/messages
   * Get messages with filters
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const filter: MessageFilterDTO = {
        conversationId: req.query.conversationId as string,
        senderId: req.query.senderId as string,
        recipientId: req.query.recipientId as string,
        channel: req.query.channel as any,
        status: req.query.status as any,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      const result = await messageService.getMessages(filter);

      return res.json(result);
    } catch (error) {
      console.error('Error fetching messages:', error);
      return res.status(500).json({
        error: (error as Error).message,
      });
    }
  });

  /**
   * GET /api/messages/:id
   * Get message by ID
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const message = await messageService.getMessageById(req.params.id);

      if (!message) {
        return res.status(404).json({
          error: 'Message not found',
        });
      }

      return res.json(message);
    } catch (error) {
      console.error('Error fetching message:', error);
      return res.status(500).json({
        error: (error as Error).message,
      });
    }
  });

  /**
   * PUT /api/messages/:id/read
   * Mark message as read
   */
  router.put('/:id/read', async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          error: 'userId is required',
        });
      }

      const message = await messageService.markAsRead(req.params.id, userId);

      return res.json(message);
    } catch (error) {
      console.error('Error marking message as read:', error);
      return res.status(500).json({
        error: (error as Error).message,
      });
    }
  });

  /**
   * GET /api/messages/unread/count
   * Get unread message count for a user
   */
  router.get('/unread/count', async (req: Request, res: Response) => {
    try {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({
          error: 'userId is required',
        });
      }

      const count = await messageService.getUnreadCount(userId as string);

      return res.json({ count });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return res.status(500).json({
        error: (error as Error).message,
      });
    }
  });

  /**
   * POST /api/messages/:id/retry
   * Retry failed message
   */
  router.post('/:id/retry', async (req: Request, res: Response) => {
    try {
      const message = await messageService.retryFailedMessage(req.params.id);

      // Re-route the message
      const result = await routerService.routeMessage(message);

      return res.json({
        message,
        deliveryResult: result,
      });
    } catch (error) {
      console.error('Error retrying message:', error);
      return res.status(500).json({
        error: (error as Error).message,
      });
    }
  });

  /**
   * DELETE /api/messages/:id
   * Delete message
   */
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      await messageService.deleteMessage(req.params.id);

      return res.status(204).send();
    } catch (error) {
      console.error('Error deleting message:', error);
      return res.status(500).json({
        error: (error as Error).message,
      });
    }
  });

  return router;
}
