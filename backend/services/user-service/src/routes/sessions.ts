/**
 * Sessions Routes
 * Handles user session management
 */

import { Router, Request, Response } from 'express';
import { AppDataSource } from '../index';
import { UserSession } from '@models/UserSession';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware
router.use(authenticateToken);

// ============================================================================
// GET /account/sessions
// List active sessions for current user
// ============================================================================

router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user?.userId;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const sessionRepository = AppDataSource.getRepository(UserSession);

    const sessions = await sessionRepository.find({
      where: { user_id: currentUserId, is_active: true },
      order: { created_at: 'DESC' },
    });

    const sessionsResponse = sessions.map(session => {
      const deviceInfo = session.getDeviceInfo();
      return {
        id: session.id,
        token: session.token.substring(0, 20) + '...', // Partial token for security
        ipAddress: session.ip_address,
        userAgent: session.user_agent,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        createdAt: session.created_at,
        lastActivityAt: session.last_activity_at,
        expiresAt: session.expires_at,
        isValid: session.isValid(),
        duration: session.getDuration(),
      };
    });

    return res.status(200).json({
      success: true,
      sessions: sessionsResponse,
    });
  } catch (error) {
    console.error('List sessions error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to list sessions',
    });
  }
});

export default router;
