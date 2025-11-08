/**
 * Sessions Route (T049)
 * List active sessions for the authenticated user
 *
 * Sessions are tracked via refresh tokens in the database
 * Each login creates a new session (refresh token)
 */

import { Router, Request, Response } from 'express';
import { AppDataSource } from '../index';
import { verifyAccessToken, decodeTokenUnsafe, isTokenExpired } from '@utils/jwt';

const router = Router();

// ============================================================================
// Session Interface
// ============================================================================

interface Session {
  tokenId: string;
  device: string;
  ipAddress: string;
  createdAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
}

// ============================================================================
// GET /auth/sessions
// List active sessions for current user
// ============================================================================

router.get('/', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Authorization header required',
      });
    }

    const token = authHeader.replace('Bearer ', '');
    let decoded;

    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }

    // =========================================================================
    // Query active sessions
    // =========================================================================

    // Note: In a production implementation, we would store refresh tokens
    // in a dedicated RefreshToken table with device info, IP, etc.
    // For now, we'll return a simplified response based on audit trail

    const auditRepository = AppDataSource.getRepository('AuditTrailEntry');

    // Find recent login events for this user
    const loginEvents = await auditRepository
      .createQueryBuilder('audit')
      .where('audit.user_id = :userId', { userId: decoded.userId })
      .andWhere("audit.event_type LIKE 'login%'")
      .andWhere("audit.event_type NOT LIKE '%failed'")
      .orderBy('audit.created_at', 'DESC')
      .limit(10)
      .getMany();

    // Transform to session format
    const sessions: Session[] = loginEvents.map((event: any, index: number) => ({
      tokenId: event.id,
      device: extractDeviceInfo(event.user_agent),
      ipAddress: event.ip_address || 'Unknown',
      createdAt: event.created_at,
      expiresAt: calculateExpiryDate(event.created_at),
      isCurrent: index === 0, // Most recent is current session
    }));

    return res.status(200).json({
      success: true,
      sessions,
      totalSessions: sessions.length,
    });

  } catch (error) {
    console.error('Sessions list error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred while fetching sessions',
    });
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract device information from user agent string
 */
function extractDeviceInfo(userAgent: string): string {
  if (!userAgent) return 'Unknown Device';

  // Simple device detection
  if (userAgent.includes('iPhone')) return 'iPhone';
  if (userAgent.includes('iPad')) return 'iPad';
  if (userAgent.includes('Android')) return 'Android Device';
  if (userAgent.includes('Windows')) return 'Windows PC';
  if (userAgent.includes('Macintosh')) return 'Mac';
  if (userAgent.includes('Linux')) return 'Linux PC';

  return 'Unknown Device';
}

/**
 * Calculate expiry date for session
 * Refresh tokens expire after 7 days
 */
function calculateExpiryDate(createdAt: Date): Date {
  const expiry = new Date(createdAt);
  expiry.setDate(expiry.getDate() + 7); // 7 days from creation
  return expiry;
}

export default router;
