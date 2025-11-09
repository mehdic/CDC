/**
 * Alerts Route
 * GET /inventory/alerts - List active alerts with filtering
 * PUT /inventory/alerts/:id/acknowledge - Acknowledge alert
 * PUT /inventory/alerts/:id/resolve - Resolve alert
 * PUT /inventory/alerts/:id/dismiss - Dismiss alert
 */

import { Router, Request, Response } from 'express';
import { AppDataSource } from '../index';
import { InventoryAlert, AlertStatus } from '../../../../shared/models/InventoryAlert';
import { z } from 'zod';

export const alertsRouter = Router();

// ============================================================================
// GET /inventory/alerts - List with filtering
// ============================================================================

alertsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const {
      pharmacy_id,
      alert_type,
      severity,
      status = 'active',
      limit = '50',
      offset = '0',
    } = req.query;

    if (!pharmacy_id) {
      return res.status(400).json({ error: 'pharmacy_id query parameter is required' });
    }

    // Set RLS context
    await AppDataSource.query(`SET app.current_pharmacy_id = '${pharmacy_id}'`);

    const alertRepository = AppDataSource.getRepository(InventoryAlert);
    const queryBuilder = alertRepository.createQueryBuilder('alert');

    // Join inventory item for display
    queryBuilder.leftJoinAndSelect('alert.inventory_item', 'item');

    // Base filter: pharmacy
    queryBuilder.where('alert.pharmacy_id = :pharmacy_id', { pharmacy_id });

    // Filter: alert type
    if (alert_type) {
      queryBuilder.andWhere('alert.alert_type = :alert_type', { alert_type });
    }

    // Filter: severity
    if (severity) {
      queryBuilder.andWhere('alert.severity = :severity', { severity });
    }

    // Filter: status
    if (status) {
      queryBuilder.andWhere('alert.status = :status', { status });
    }

    // Pagination
    queryBuilder.skip(parseInt(offset as string));
    queryBuilder.take(parseInt(limit as string));

    // Sort by severity (critical first) then created_at
    queryBuilder.orderBy({
      'alert.severity': 'DESC',
      'alert.created_at': 'DESC',
    });

    const [alerts, total] = await queryBuilder.getManyAndCount();

    res.json({
      alerts,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        has_more: parseInt(offset as string) + alerts.length < total,
      },
    });
  } catch (error) {
    console.error('List alerts error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// PUT /inventory/alerts/:id/acknowledge - Acknowledge alert
// ============================================================================

const acknowledgeSchema = z.object({
  pharmacy_id: z.string().uuid(),
  user_id: z.string().uuid(),
});

alertsRouter.put('/:id/acknowledge', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = acknowledgeSchema.parse(req.body);

    // Set RLS context
    await AppDataSource.query(`SET app.current_pharmacy_id = '${validatedData.pharmacy_id}'`);

    const alertRepository = AppDataSource.getRepository(InventoryAlert);
    const alert = await alertRepository.findOne({
      where: { id, pharmacy_id: validatedData.pharmacy_id },
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    alert.status = AlertStatus.ACKNOWLEDGED;
    alert.acknowledged_by_user_id = validatedData.user_id;
    alert.acknowledged_at = new Date();

    await alertRepository.save(alert);

    res.json({
      success: true,
      message: 'Alert acknowledged',
      alert,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Acknowledge alert error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// PUT /inventory/alerts/:id/resolve - Resolve alert
// ============================================================================

alertsRouter.put('/:id/resolve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { pharmacy_id } = req.body;

    if (!pharmacy_id) {
      return res.status(400).json({ error: 'pharmacy_id is required' });
    }

    // Set RLS context
    await AppDataSource.query(`SET app.current_pharmacy_id = '${pharmacy_id}'`);

    const alertRepository = AppDataSource.getRepository(InventoryAlert);
    const alert = await alertRepository.findOne({
      where: { id, pharmacy_id },
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    alert.status = AlertStatus.RESOLVED;
    alert.resolved_at = new Date();

    await alertRepository.save(alert);

    res.json({
      success: true,
      message: 'Alert resolved',
      alert,
    });
  } catch (error) {
    console.error('Resolve alert error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// PUT /inventory/alerts/:id/dismiss - Dismiss alert
// ============================================================================

alertsRouter.put('/:id/dismiss', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { pharmacy_id } = req.body;

    if (!pharmacy_id) {
      return res.status(400).json({ error: 'pharmacy_id is required' });
    }

    // Set RLS context
    await AppDataSource.query(`SET app.current_pharmacy_id = '${pharmacy_id}'`);

    const alertRepository = AppDataSource.getRepository(InventoryAlert);
    const alert = await alertRepository.findOne({
      where: { id, pharmacy_id },
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    alert.status = AlertStatus.DISMISSED;

    await alertRepository.save(alert);

    res.json({
      success: true,
      message: 'Alert dismissed',
      alert,
    });
  } catch (error) {
    console.error('Dismiss alert error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
