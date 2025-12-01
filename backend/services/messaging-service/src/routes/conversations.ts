/**
 * Conversation Routes
 * API endpoints for conversation management
 */

import { Router, Request, Response } from 'express';
import {
  ConversationService,
  CreateConversationDTO,
  ConversationFilterDTO,
} from '../services/conversationService';

export function createConversationRoutes(
  conversationService: ConversationService
): Router {
  const router = Router();

  /**
   * POST /api/conversations
   * Create a new conversation
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const data: CreateConversationDTO = req.body;

      // Validate required fields
      if (!data.type || !data.participants || data.participants.length < 2) {
        return res.status(400).json({
          error: 'Invalid conversation data. Required: type, participants (minimum 2)',
        });
      }

      const conversation = await conversationService.createConversation(data);

      return res.status(201).json(conversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
      return res.status(500).json({
        error: (error as Error).message,
      });
    }
  });

  /**
   * GET /api/conversations
   * Get conversations for a user
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const filter: ConversationFilterDTO = {
        userId: req.query.userId as string,
        type: req.query.type as any,
        archived: req.query.archived === 'true',
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      if (!filter.userId) {
        return res.status(400).json({
          error: 'userId is required',
        });
      }

      const result = await conversationService.getConversationsForUser(filter);

      return res.json(result);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return res.status(500).json({
        error: (error as Error).message,
      });
    }
  });

  /**
   * GET /api/conversations/:id
   * Get conversation by ID
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const includeMessages = req.query.includeMessages === 'true';

      const conversation = await conversationService.getConversationById(
        req.params.id,
        includeMessages
      );

      if (!conversation) {
        return res.status(404).json({
          error: 'Conversation not found',
        });
      }

      return res.json(conversation);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return res.status(500).json({
        error: (error as Error).message,
      });
    }
  });

  /**
   * GET /api/conversations/:id/messages
   * Get conversation messages with pagination
   */
  router.get('/:id/messages', async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      const result = await conversationService.getConversationMessages(
        req.params.id,
        limit,
        offset
      );

      return res.json(result);
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
      return res.status(500).json({
        error: (error as Error).message,
      });
    }
  });

  /**
   * POST /api/conversations/direct
   * Get or create direct conversation between two users
   */
  router.post('/direct', async (req: Request, res: Response) => {
    try {
      const { user1Id, user1Role, user2Id, user2Role } = req.body;

      if (!user1Id || !user1Role || !user2Id || !user2Role) {
        return res.status(400).json({
          error: 'Required fields: user1Id, user1Role, user2Id, user2Role',
        });
      }

      const conversation = await conversationService.getOrCreateDirectConversation(
        user1Id,
        user1Role,
        user2Id,
        user2Role
      );

      return res.json(conversation);
    } catch (error) {
      console.error('Error getting/creating direct conversation:', error);
      return res.status(500).json({
        error: (error as Error).message,
      });
    }
  });

  /**
   * POST /api/conversations/:id/participants
   * Add participant to conversation
   */
  router.post('/:id/participants', async (req: Request, res: Response) => {
    try {
      const { userId, role } = req.body;

      if (!userId || !role) {
        return res.status(400).json({
          error: 'Required fields: userId, role',
        });
      }

      const conversation = await conversationService.addParticipant(
        req.params.id,
        userId,
        role
      );

      return res.json(conversation);
    } catch (error) {
      console.error('Error adding participant:', error);
      return res.status(500).json({
        error: (error as Error).message,
      });
    }
  });

  /**
   * DELETE /api/conversations/:id/participants/:userId
   * Remove participant from conversation
   */
  router.delete('/:id/participants/:userId', async (req: Request, res: Response) => {
    try {
      const conversation = await conversationService.removeParticipant(
        req.params.id,
        req.params.userId
      );

      return res.json(conversation);
    } catch (error) {
      console.error('Error removing participant:', error);
      return res.status(500).json({
        error: (error as Error).message,
      });
    }
  });

  /**
   * PUT /api/conversations/:id/read
   * Mark conversation as read for user
   */
  router.put('/:id/read', async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          error: 'userId is required',
        });
      }

      const conversation = await conversationService.markAsRead(req.params.id, userId);

      return res.json(conversation);
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      return res.status(500).json({
        error: (error as Error).message,
      });
    }
  });

  /**
   * PUT /api/conversations/:id/archive
   * Archive conversation
   */
  router.put('/:id/archive', async (req: Request, res: Response) => {
    try {
      const conversation = await conversationService.archiveConversation(req.params.id);

      return res.json(conversation);
    } catch (error) {
      console.error('Error archiving conversation:', error);
      return res.status(500).json({
        error: (error as Error).message,
      });
    }
  });

  /**
   * PUT /api/conversations/:id/unarchive
   * Unarchive conversation
   */
  router.put('/:id/unarchive', async (req: Request, res: Response) => {
    try {
      const conversation = await conversationService.unarchiveConversation(req.params.id);

      return res.json(conversation);
    } catch (error) {
      console.error('Error unarchiving conversation:', error);
      return res.status(500).json({
        error: (error as Error).message,
      });
    }
  });

  /**
   * DELETE /api/conversations/:id
   * Delete conversation
   */
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      await conversationService.deleteConversation(req.params.id);

      return res.status(204).send();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return res.status(500).json({
        error: (error as Error).message,
      });
    }
  });

  return router;
}
