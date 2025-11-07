/**
 * Audit Trail API Routes
 * Provides read-only access to audit trail entries for compliance reporting
 * Based on: /specs/002-metapharm-platform/spec.md (FR-105, FR-106)
 *
 * IMPORTANT: Audit trail is READ-ONLY. No UPDATE or DELETE operations allowed.
 * Only pharmacists and admins can access audit entries for their pharmacy.
 */

import { Router, Request, Response } from 'express';
import { DataSource, FindOptionsWhere, Between, In } from 'typeorm';
import { AuditTrailEntry, AuditAction } from '../../../shared/models/AuditTrailEntry';

const router = Router();

/**
 * Query parameters for GET /audit/entries
 */
interface AuditQueryParams {
  /**
   * Filter by pharmacy ID (required for pharmacists, optional for global admins)
   */
  pharmacy_id?: string;

  /**
   * Filter by user ID (who performed the action)
   */
  user_id?: string;

  /**
   * Filter by resource type (e.g., "prescription", "teleconsultation")
   */
  resource_type?: string;

  /**
   * Filter by resource ID (specific resource UUID)
   */
  resource_id?: string;

  /**
   * Filter by event type (e.g., "prescription.approved")
   */
  event_type?: string;

  /**
   * Filter by action (create, read, update, delete)
   */
  action?: AuditAction;

  /**
   * Filter by date range - start date (ISO 8601 format)
   */
  start_date?: string;

  /**
   * Filter by date range - end date (ISO 8601 format)
   */
  end_date?: string;

  /**
   * Pagination - page number (default: 1)
   */
  page?: string;

  /**
   * Pagination - items per page (default: 50, max: 200)
   */
  limit?: string;

  /**
   * Sort order (default: 'desc' - newest first)
   */
  sort?: 'asc' | 'desc';
}

/**
 * GET /audit/entries
 *
 * Retrieve audit trail entries with filtering and pagination
 *
 * Access Control:
 * - Pharmacists: Can view audit entries for their pharmacy only
 * - Admins: Can view all audit entries (global)
 * - Other roles: Forbidden (403)
 *
 * Query Parameters:
 * - pharmacy_id: Filter by pharmacy UUID
 * - user_id: Filter by user UUID who performed action
 * - resource_type: Filter by resource type (prescription, teleconsultation, etc.)
 * - resource_id: Filter by specific resource UUID
 * - event_type: Filter by event type (prescription.approved, etc.)
 * - action: Filter by action (create, read, update, delete)
 * - start_date: Filter by date range start (ISO 8601)
 * - end_date: Filter by date range end (ISO 8601)
 * - page: Page number for pagination (default: 1)
 * - limit: Items per page (default: 50, max: 200)
 * - sort: Sort order 'asc' or 'desc' (default: 'desc')
 *
 * Response:
 * {
 *   data: AuditTrailEntry[],
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     total: number,
 *     total_pages: number
 *   }
 * }
 *
 * @example
 * GET /audit/entries?pharmacy_id=123&resource_type=prescription&page=1&limit=50
 */
router.get(
  '/audit/entries',
  async (req: Request<{}, {}, {}, AuditQueryParams>, res: Response) => {
    try {
      // Access control: Only pharmacists and admins
      // Note: This assumes auth middleware has set req.user
      const currentUser = (req as any).user;

      if (!currentUser) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required to access audit entries',
        });
      }

      // Check role-based access
      const allowedRoles = ['pharmacist', 'admin'];
      if (!allowedRoles.includes(currentUser.role)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only pharmacists and admins can access audit entries',
        });
      }

      // Get DataSource (assumes it's available in req.app.locals or similar)
      const dataSource: DataSource = (req as any).dataSource || (req.app as any).dataSource;
      if (!dataSource) {
        throw new Error('Database connection not available');
      }

      // Parse query parameters
      const {
        pharmacy_id,
        user_id,
        resource_type,
        resource_id,
        event_type,
        action,
        start_date,
        end_date,
        page = '1',
        limit = '50',
        sort = 'desc',
      } = req.query;

      // Pagination
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50)); // Max 200 items per page
      const skip = (pageNum - 1) * limitNum;

      // Build WHERE clause
      const where: FindOptionsWhere<AuditTrailEntry> = {};

      // Pharmacy isolation for pharmacists
      if (currentUser.role === 'pharmacist') {
        // Pharmacists can only see their pharmacy's audit entries
        where.pharmacy_id = currentUser.primary_pharmacy_id;
      } else if (pharmacy_id) {
        // Admins can filter by pharmacy_id if provided
        where.pharmacy_id = pharmacy_id;
      }

      // Filter by user
      if (user_id) {
        where.user_id = user_id;
      }

      // Filter by resource type
      if (resource_type) {
        where.resource_type = resource_type;
      }

      // Filter by resource ID
      if (resource_id) {
        where.resource_id = resource_id;
      }

      // Filter by event type
      if (event_type) {
        where.event_type = event_type;
      }

      // Filter by action
      if (action && Object.values(AuditAction).includes(action as AuditAction)) {
        where.action = action as AuditAction;
      }

      // Filter by date range
      if (start_date || end_date) {
        const startDateTime = start_date ? new Date(start_date) : new Date('1970-01-01');
        const endDateTime = end_date ? new Date(end_date) : new Date();

        // Validate dates
        if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
          return res.status(400).json({
            error: 'Invalid date format',
            message: 'start_date and end_date must be valid ISO 8601 dates',
          });
        }

        where.created_at = Between(startDateTime, endDateTime);
      }

      // Get repository
      const auditRepository = dataSource.getRepository(AuditTrailEntry);

      // Count total entries (for pagination)
      const total = await auditRepository.count({ where });

      // Fetch audit entries
      const entries = await auditRepository.find({
        where,
        order: {
          created_at: sort.toUpperCase() === 'ASC' ? 'ASC' : 'DESC',
        },
        skip,
        take: limitNum,
        relations: ['user', 'pharmacy'], // Include related user and pharmacy data
      });

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limitNum);

      // Return response
      return res.status(200).json({
        data: entries,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          total_pages: totalPages,
        },
      });
    } catch (error) {
      console.error('Error fetching audit entries:', error);

      // Check for specific error types
      if (error instanceof Error && error.message.includes('Database connection')) {
        return res.status(500).json({
          error: 'Internal Server Error',
          message: 'Database connection not available',
        });
      }

      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve audit entries',
      });
    }
  }
);

/**
 * GET /audit/entries/:id
 *
 * Retrieve a specific audit trail entry by ID
 *
 * Access Control: Same as GET /audit/entries
 *
 * Path Parameters:
 * - id: Audit entry UUID
 *
 * Response: AuditTrailEntry
 */
router.get('/audit/entries/:id', async (req: Request, res: Response) => {
  try {
    // Access control
    const currentUser = (req as any).user;

    if (!currentUser) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const allowedRoles = ['pharmacist', 'admin'];
    if (!allowedRoles.includes(currentUser.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only pharmacists and admins can access audit entries',
      });
    }

    // Get DataSource
    const dataSource: DataSource = (req as any).dataSource || (req.app as any).dataSource;
    if (!dataSource) {
      throw new Error('Database connection not available');
    }

    const { id } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        error: 'Invalid ID',
        message: 'Audit entry ID must be a valid UUID',
      });
    }

    // Get repository
    const auditRepository = dataSource.getRepository(AuditTrailEntry);

    // Build WHERE clause with pharmacy isolation
    const where: FindOptionsWhere<AuditTrailEntry> = { id };

    // Pharmacists can only see their pharmacy's entries
    if (currentUser.role === 'pharmacist') {
      where.pharmacy_id = currentUser.primary_pharmacy_id;
    }

    // Fetch entry
    const entry = await auditRepository.findOne({
      where,
      relations: ['user', 'pharmacy'],
    });

    if (!entry) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Audit entry not found or access denied',
      });
    }

    return res.status(200).json(entry);
  } catch (error) {
    console.error('Error fetching audit entry:', error);

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve audit entry',
    });
  }
});

/**
 * GET /audit/stats
 *
 * Get audit trail statistics for a pharmacy
 *
 * Access Control: Pharmacists and admins only
 *
 * Query Parameters:
 * - pharmacy_id: Pharmacy UUID (required for admins, auto-set for pharmacists)
 * - start_date: Start date for stats (default: 30 days ago)
 * - end_date: End date for stats (default: now)
 *
 * Response:
 * {
 *   total_events: number,
 *   events_by_type: { [event_type: string]: number },
 *   events_by_action: { [action: string]: number },
 *   events_by_user: { user_id: string, count: number }[],
 *   events_by_resource_type: { [resource_type: string]: number }
 * }
 */
router.get('/audit/stats', async (req: Request, res: Response) => {
  try {
    // Access control
    const currentUser = (req as any).user;

    if (!currentUser) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const allowedRoles = ['pharmacist', 'admin'];
    if (!allowedRoles.includes(currentUser.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only pharmacists and admins can access audit statistics',
      });
    }

    // Get DataSource
    const dataSource: DataSource = (req as any).dataSource || (req.app as any).dataSource;
    if (!dataSource) {
      throw new Error('Database connection not available');
    }

    const { pharmacy_id, start_date, end_date } = req.query;

    // Determine pharmacy ID
    let pharmacyId: string;
    if (currentUser.role === 'pharmacist') {
      pharmacyId = currentUser.primary_pharmacy_id;
    } else if (pharmacy_id) {
      pharmacyId = pharmacy_id as string;
    } else {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'pharmacy_id is required for admins',
      });
    }

    // Date range (default: last 30 days)
    const endDate = end_date ? new Date(end_date as string) : new Date();
    const startDate = start_date
      ? new Date(start_date as string)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    // Get repository
    const auditRepository = dataSource.getRepository(AuditTrailEntry);

    // Total events
    const total_events = await auditRepository.count({
      where: {
        pharmacy_id: pharmacyId,
        created_at: Between(startDate, endDate),
      },
    });

    // Events by type
    const eventsByType = await auditRepository
      .createQueryBuilder('audit')
      .select('audit.event_type', 'event_type')
      .addSelect('COUNT(*)', 'count')
      .where('audit.pharmacy_id = :pharmacyId', { pharmacyId })
      .andWhere('audit.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('audit.event_type')
      .orderBy('count', 'DESC')
      .getRawMany();

    const events_by_type = eventsByType.reduce((acc, row) => {
      acc[row.event_type] = parseInt(row.count, 10);
      return acc;
    }, {} as Record<string, number>);

    // Events by action
    const eventsByAction = await auditRepository
      .createQueryBuilder('audit')
      .select('audit.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .where('audit.pharmacy_id = :pharmacyId', { pharmacyId })
      .andWhere('audit.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('audit.action')
      .getRawMany();

    const events_by_action = eventsByAction.reduce((acc, row) => {
      acc[row.action] = parseInt(row.count, 10);
      return acc;
    }, {} as Record<string, number>);

    // Events by user (top 10)
    const eventsByUser = await auditRepository
      .createQueryBuilder('audit')
      .select('audit.user_id', 'user_id')
      .addSelect('COUNT(*)', 'count')
      .where('audit.pharmacy_id = :pharmacyId', { pharmacyId })
      .andWhere('audit.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('audit.user_id')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const events_by_user = eventsByUser.map((row) => ({
      user_id: row.user_id,
      count: parseInt(row.count, 10),
    }));

    // Events by resource type
    const eventsByResourceType = await auditRepository
      .createQueryBuilder('audit')
      .select('audit.resource_type', 'resource_type')
      .addSelect('COUNT(*)', 'count')
      .where('audit.pharmacy_id = :pharmacyId', { pharmacyId })
      .andWhere('audit.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('audit.resource_type')
      .getRawMany();

    const events_by_resource_type = eventsByResourceType.reduce((acc, row) => {
      acc[row.resource_type] = parseInt(row.count, 10);
      return acc;
    }, {} as Record<string, number>);

    return res.status(200).json({
      total_events,
      events_by_type,
      events_by_action,
      events_by_user,
      events_by_resource_type,
      date_range: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching audit stats:', error);

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve audit statistics',
    });
  }
});

export default router;
