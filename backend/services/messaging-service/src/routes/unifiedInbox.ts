/**
 * Unified Inbox Routes
 * API endpoints for unified messaging inbox across all channels
 */

import { Router, Request, Response } from 'express';
import { UnifiedInboxService } from '../services/unifiedInboxService';
import { MessageChannel, MessageStatus } from '../models/Message';

export function createUnifiedInboxRoutes(inboxService: UnifiedInboxService): Router {
  const router = Router();

  /**
   * GET /api/unified-inbox
   * Get unified inbox with message threading
   *
   * Query parameters:
   * - userId: string (required) - The user ID
   * - channels: string (optional) - Comma-separated channel names (whatsapp,email,fax,in_app)
   * - unreadOnly: boolean (optional) - Only return unread messages
   * - searchText: string (optional) - Search in message content
   * - limit: number (optional, default: 20) - Number of items to return
   * - offset: number (optional, default: 0) - Pagination offset
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;

      if (!userId) {
        return res.status(400).json({
          error: 'userId query parameter is required',
        });
      }

      const channels = req.query.channels
        ? (req.query.channels as string).split(',').filter(Boolean)
        : undefined;

      const filter = {
        userId,
        channels: channels as MessageChannel[] | undefined,
        unreadOnly: req.query.unreadOnly === 'true',
        searchText: req.query.searchText as string | undefined,
        limit: parseInt(req.query.limit as string) || 20,
        offset: parseInt(req.query.offset as string) || 0,
      };

      const result = await inboxService.getUnifiedInbox(filter);

      return res.json({
        success: true,
        data: result.items,
        pagination: {
          total: result.total,
          limit: filter.limit,
          offset: filter.offset,
          hasMore: result.hasMore,
        },
      });
    } catch (error) {
      console.error('Error fetching unified inbox:', error);
      return res.status(500).json({
        success: false,
        error: (error as Error).message,
      });
    }
  });

  /**
   * GET /api/unified-inbox/thread/:conversationId
   * Get complete message thread with all channels
   */
  router.get('/thread/:conversationId', async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;

      const thread = await inboxService.getMessageThread(conversationId);

      return res.json({
        success: true,
        data: thread,
      });
    } catch (error) {
      console.error('Error fetching message thread:', error);

      if ((error as Error).message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found',
        });
      }

      return res.status(500).json({
        success: false,
        error: (error as Error).message,
      });
    }
  });

  /**
   * GET /api/unified-inbox/stats
   * Get channel statistics
   *
   * Query parameters:
   * - userId: string (required) - The user ID
   */
  router.get('/stats', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;

      if (!userId) {
        return res.status(400).json({
          error: 'userId query parameter is required',
        });
      }

      const stats = await inboxService.getChannelStats(userId);

      return res.json({
        success: true,
        data: {
          totalMessages: stats.totalMessages,
          channels: stats.byChannel,
          averageResponseTimeMs: Math.round(stats.averageResponseTime),
        },
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      return res.status(500).json({
        success: false,
        error: (error as Error).message,
      });
    }
  });

  /**
   * GET /api/unified-inbox/search
   * Search across all channels
   *
   * Query parameters:
   * - userId: string (required) - The user ID
   * - q: string (required) - Search query
   * - channels: string (optional) - Comma-separated channel names
   * - limit: number (optional, default: 20)
   * - offset: number (optional, default: 0)
   */
  router.get('/search', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      const searchText = req.query.q as string;

      if (!userId || !searchText) {
        return res.status(400).json({
          error: 'userId and q (search query) parameters are required',
        });
      }

      const channels = req.query.channels
        ? (req.query.channels as string).split(',').filter(Boolean)
        : undefined;

      const result = await inboxService.searchMessages(userId, searchText, {
        channels: channels as MessageChannel[] | undefined,
        limit: parseInt(req.query.limit as string) || 20,
        offset: parseInt(req.query.offset as string) || 0,
      });

      return res.json({
        success: true,
        data: result.results,
        pagination: {
          total: result.total,
          query: searchText,
        },
      });
    } catch (error) {
      console.error('Error searching messages:', error);
      return res.status(500).json({
        success: false,
        error: (error as Error).message,
      });
    }
  });

  /**
   * GET /api/unified-inbox/channels/status
   * Get channel availability status
   */
  router.get('/channels/status', async (req: Request, res: Response) => {
    try {
      const channelStatus = await inboxService.getChannelAvailability();

      return res.json({
        success: true,
        data: channelStatus,
      });
    } catch (error) {
      console.error('Error fetching channel status:', error);
      return res.status(500).json({
        success: false,
        error: (error as Error).message,
      });
    }
  });

  /**
   * GET /api/unified-inbox/health
   * Health check for unified inbox service
   */
  router.get('/health', async (req: Request, res: Response) => {
    try {
      const channelStatus = await inboxService.getChannelAvailability();

      const allAvailable = Object.values(channelStatus).every(
        (status) => status.available
      );

      return res.json({
        success: true,
        status: allAvailable ? 'healthy' : 'degraded',
        channels: channelStatus,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error checking health:', error);
      return res.status(503).json({
        success: false,
        status: 'unhealthy',
        error: (error as Error).message,
      });
    }
  });

  return router;
}
