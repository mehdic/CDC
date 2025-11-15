/**
 * Delivery Controller
 * Handles CRUD operations for deliveries
 * Batch 3 Phase 4 - Delivery Service
 */

import { Request, Response } from 'express';
import { DataSource } from 'typeorm';
import { Delivery, DeliveryStatus } from '../../../../shared/models/Delivery';

/**
 * GET /deliveries
 * List deliveries with optional filtering
 */
export async function listDeliveries(req: Request, res: Response): Promise<void> {
  try {
    const dataSource: DataSource = req.app.locals.dataSource;
    const deliveryRepo = dataSource.getRepository(Delivery);

    // Parse query parameters
    const { status, user_id, order_id, delivery_personnel_id } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    // Build query
    let queryBuilder = deliveryRepo
      .createQueryBuilder('delivery')
      .leftJoinAndSelect('delivery.user', 'user')
      .leftJoinAndSelect('delivery.delivery_personnel', 'delivery_personnel');

    // Apply filters
    if (status) {
      queryBuilder = queryBuilder.andWhere('delivery.status = :status', { status });
    }
    if (user_id) {
      queryBuilder = queryBuilder.andWhere('delivery.user_id = :userId', { userId: user_id });
    }
    if (order_id) {
      queryBuilder = queryBuilder.andWhere('delivery.order_id = :orderId', { orderId: order_id });
    }
    if (delivery_personnel_id) {
      queryBuilder = queryBuilder.andWhere('delivery.delivery_personnel_id = :deliveryPersonnelId', {
        deliveryPersonnelId: delivery_personnel_id,
      });
    }

    // Apply sorting
    queryBuilder = queryBuilder.orderBy('delivery.created_at', 'DESC');

    // Count total
    const totalItems = await queryBuilder.getCount();

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder = queryBuilder.skip(skip).take(limit);

    // Execute query
    const deliveries = await queryBuilder.getMany();

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      deliveries: deliveries.map(sanitizeDelivery),
      pagination: {
        page,
        limit,
        total_items: totalItems,
        total_pages: totalPages,
        has_next_page: page < totalPages,
        has_prev_page: page > 1,
      },
    });
  } catch (error: any) {
    console.error('[Delivery Controller] List error:', error);
    res.status(500).json({
      error: 'Failed to list deliveries',
      message: error.message,
    });
  }
}

/**
 * GET /deliveries/:id
 * Get a single delivery by ID
 */
export async function getDelivery(req: Request, res: Response): Promise<void> {
  try {
    const dataSource: DataSource = req.app.locals.dataSource;
    const deliveryRepo = dataSource.getRepository(Delivery);

    const delivery = await deliveryRepo.findOne({
      where: { id: req.params.id },
      relations: ['user', 'delivery_personnel'],
    });

    if (!delivery) {
      res.status(404).json({
        error: 'Delivery not found',
      });
      return;
    }

    res.json(sanitizeDelivery(delivery));
  } catch (error: any) {
    console.error('[Delivery Controller] Get error:', error);
    res.status(500).json({
      error: 'Failed to get delivery',
      message: error.message,
    });
  }
}

/**
 * POST /deliveries
 * Create a new delivery
 */
export async function createDelivery(req: Request, res: Response): Promise<void> {
  try {
    const dataSource: DataSource = req.app.locals.dataSource;
    const deliveryRepo = dataSource.getRepository(Delivery);

    const {
      user_id,
      order_id,
      delivery_address_encrypted,
      delivery_notes_encrypted,
      scheduled_at,
    } = req.body;

    // Validation
    if (!user_id) {
      res.status(400).json({
        error: 'user_id is required',
      });
      return;
    }

    if (!delivery_address_encrypted) {
      res.status(400).json({
        error: 'delivery_address_encrypted is required',
      });
      return;
    }

    // Create delivery
    const delivery = deliveryRepo.create({
      user_id,
      order_id: order_id || null,
      delivery_address_encrypted: Buffer.from(delivery_address_encrypted, 'base64'),
      delivery_notes_encrypted: delivery_notes_encrypted
        ? Buffer.from(delivery_notes_encrypted, 'base64')
        : null,
      scheduled_at: scheduled_at ? new Date(scheduled_at) : null,
      status: DeliveryStatus.PENDING,
    });

    await deliveryRepo.save(delivery);

    res.status(201).json(sanitizeDelivery(delivery));
  } catch (error: any) {
    console.error('[Delivery Controller] Create error:', error);
    res.status(500).json({
      error: 'Failed to create delivery',
      message: error.message,
    });
  }
}

/**
 * PUT /deliveries/:id
 * Update a delivery
 */
export async function updateDelivery(req: Request, res: Response): Promise<void> {
  try {
    const dataSource: DataSource = req.app.locals.dataSource;
    const deliveryRepo = dataSource.getRepository(Delivery);

    const delivery = await deliveryRepo.findOne({
      where: { id: req.params.id },
    });

    if (!delivery) {
      res.status(404).json({
        error: 'Delivery not found',
      });
      return;
    }

    const {
      status,
      delivery_personnel_id,
      tracking_info,
      tracking_number,
      failure_reason,
    } = req.body;

    // Update fields
    if (status) {
      delivery.status = status;

      // Update timestamps based on status
      if (status === DeliveryStatus.IN_TRANSIT && !delivery.picked_up_at) {
        delivery.picked_up_at = new Date();
      } else if (status === DeliveryStatus.DELIVERED && !delivery.delivered_at) {
        delivery.delivered_at = new Date();
      } else if (status === DeliveryStatus.FAILED && !delivery.failed_at) {
        delivery.failed_at = new Date();
        if (failure_reason) {
          delivery.failure_reason = failure_reason;
        }
      }
    }

    if (delivery_personnel_id !== undefined) {
      delivery.delivery_personnel_id = delivery_personnel_id;
    }

    if (tracking_info) {
      delivery.tracking_info = tracking_info;
    }

    if (tracking_number !== undefined) {
      delivery.tracking_number = tracking_number;
    }

    await deliveryRepo.save(delivery);

    res.json(sanitizeDelivery(delivery));
  } catch (error: any) {
    console.error('[Delivery Controller] Update error:', error);
    res.status(500).json({
      error: 'Failed to update delivery',
      message: error.message,
    });
  }
}

/**
 * DELETE /deliveries/:id
 * Delete a delivery
 */
export async function deleteDelivery(req: Request, res: Response): Promise<void> {
  try {
    const dataSource: DataSource = req.app.locals.dataSource;
    const deliveryRepo = dataSource.getRepository(Delivery);

    const delivery = await deliveryRepo.findOne({
      where: { id: req.params.id },
    });

    if (!delivery) {
      res.status(404).json({
        error: 'Delivery not found',
      });
      return;
    }

    // Only allow deletion if pending or cancelled
    if (delivery.status !== DeliveryStatus.PENDING && delivery.status !== DeliveryStatus.CANCELLED) {
      res.status(400).json({
        error: 'Cannot delete delivery in current status',
        status: delivery.status,
      });
      return;
    }

    await deliveryRepo.remove(delivery);

    res.status(204).send();
  } catch (error: any) {
    console.error('[Delivery Controller] Delete error:', error);
    res.status(500).json({
      error: 'Failed to delete delivery',
      message: error.message,
    });
  }
}

/**
 * Sanitize delivery object for API response
 * Remove sensitive encrypted fields
 */
function sanitizeDelivery(delivery: Delivery): any {
  return {
    id: delivery.id,
    user_id: delivery.user_id,
    order_id: delivery.order_id,
    delivery_personnel_id: delivery.delivery_personnel_id,
    status: delivery.status,
    tracking_info: delivery.tracking_info,
    tracking_number: delivery.tracking_number,
    scheduled_at: delivery.scheduled_at,
    picked_up_at: delivery.picked_up_at,
    delivered_at: delivery.delivered_at,
    failed_at: delivery.failed_at,
    failure_reason: delivery.failure_reason,
    created_at: delivery.created_at,
    updated_at: delivery.updated_at,
    // Note: Encrypted fields are excluded for security
  };
}
