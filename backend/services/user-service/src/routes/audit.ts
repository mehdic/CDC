/**
 * Audit Routes
 * Handles audit log retrieval and filtering
 */

import { Router, Request, Response } from 'express';
import { AppDataSource } from '../index';
import { AuditLog } from '@models/AuditLog';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware
router.use(authenticateToken);

// ============================================================================
// GET /account/audit-log
// Fetch audit log with filtering
// ============================================================================

router.get('/audit-log', async (req: Request, res: Response) => {
  try {
    const { userId, action, limit = '50', offset = '0' } = req.query;

    const auditRepository = AppDataSource.getRepository(AuditLog);

    let query = auditRepository.createQueryBuilder('audit_log')
      .leftJoinAndSelect('audit_log.user', 'user')
      .orderBy('audit_log.created_at', 'DESC');

    // Apply filters
    if (userId) {
      query = query.where('audit_log.user_id = :userId', { userId });
    }

    if (action) {
      query = query.andWhere('audit_log.action = :action', { action });
    }

    // Apply pagination
    query = query
      .skip(parseInt(offset as string, 10))
      .take(parseInt(limit as string, 10));

    const auditLogs = await query.getMany();

    const auditLogsResponse = auditLogs.map(log => ({
      id: log.id,
      userId: log.user_id,
      userEmail: log.user?.email || 'Unknown',
      action: log.action,
      actionDescription: log.getActionDescription(),
      resource: log.resource,
      resourceId: log.resource_id,
      details: log.details,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      createdAt: log.created_at,
    }));

    return res.status(200).json({
      success: true,
      auditLogs: auditLogsResponse,
      pagination: {
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
        total: auditLogsResponse.length,
      },
    });
  } catch (error) {
    console.error('Fetch audit log error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch audit log',
    });
  }
});

export default router;
