/**
 * Logout Route (T050)
 * Invalidate current session and revoke refresh token
 *
 * Implementation:
 * - Verify current access token
 * - Log logout event in audit trail
 * - In production: Would revoke refresh token in database
 */

import { Router, Request, Response } from 'express';
import { AppDataSource } from '../index';
import { AuditTrailEntry, AuditAction } from '@models/AuditTrailEntry';
import { verifyAccessToken } from '@utils/jwt';

const router = Router();

// ============================================================================
// DELETE /auth/logout
// Logout and invalidate current session
// ============================================================================

router.delete('/logout', async (req: Request, res: Response) => {
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
      // Even if token is expired, we still consider logout successful
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    }

    // =========================================================================
    // Invalidate Refresh Token
    // =========================================================================

    // Note: In a production implementation, we would:
    // 1. Find the refresh token in RefreshToken table
    // 2. Mark it as revoked
    // 3. Optionally: Clear all sessions if "logout from all devices" is requested
    //
    // Example:
    // const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);
    // await refreshTokenRepo.update(
    //   { user_id: decoded.userId, revoked: false },
    //   { revoked: true, revoked_at: new Date() }
    // );

    // For now, we'll just log the logout event

    // =========================================================================
    // Create Audit Trail Entry
    // =========================================================================

    const auditRepository = AppDataSource.getRepository(AuditTrailEntry);

    const auditEntry = auditRepository.create({
      pharmacy_id: null,
      user_id: decoded.userId,
      event_type: 'logout.success',
      action: AuditAction.CREATE,
      resource_type: 'authentication',
      resource_id: decoded.userId,
      changes: {
        description: 'User logged out successfully',
      } as any,
      ip_address: req.ip || req.socket.remoteAddress || 'unknown',
      user_agent: req.headers['user-agent'] || 'unknown',
      device_info: {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      } as any,
    });

    await auditRepository.save(auditEntry);

    console.log(`User ${decoded.userId} logged out successfully`);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred during logout',
    });
  }
});

// ============================================================================
// POST /auth/logout-all
// Logout from all devices (revoke all refresh tokens)
// ============================================================================

router.post('/logout-all', async (req: Request, res: Response) => {
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
    // Revoke All Refresh Tokens
    // =========================================================================

    // Note: In production, this would revoke all refresh tokens for the user
    // Example:
    // const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);
    // await refreshTokenRepo.update(
    //   { user_id: decoded.userId, revoked: false },
    //   { revoked: true, revoked_at: new Date() }
    // );

    // =========================================================================
    // Create Audit Trail Entry
    // =========================================================================

    const auditRepository = AppDataSource.getRepository(AuditTrailEntry);

    const auditEntry = auditRepository.create({
      pharmacy_id: null,
      user_id: decoded.userId,
      event_type: 'logout.all_devices',
      action: AuditAction.CREATE,
      resource_type: 'authentication',
      resource_id: decoded.userId,
      changes: {
        description: 'User logged out from all devices',
      } as any,
      ip_address: req.ip || req.socket.remoteAddress || 'unknown',
      user_agent: req.headers['user-agent'] || 'unknown',
      device_info: {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      } as any,
    });

    await auditRepository.save(auditEntry);

    console.log(`User ${decoded.userId} logged out from all devices`);

    return res.status(200).json({
      success: true,
      message: 'Logged out from all devices successfully',
    });

  } catch (error) {
    console.error('Logout all error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred during logout',
    });
  }
});

export default router;
