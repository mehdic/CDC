/**
 * Order Controller
 * Handles CRUD operations for orders
 * Batch 3 Phase 4 - Order Service
 */

import { Request, Response } from 'express';
import { DataSource } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from '../../../../shared/models/Order';

/**
 * GET /orders
 * List orders with optional filtering
 */
export async function listOrders(req: Request, res: Response): Promise<void> {
  try {
    const dataSource: DataSource = req.app.locals.dataSource;
    const orderRepo = dataSource.getRepository(Order);

    // Parse query parameters
    const { status, payment_status, user_id, pharmacy_id } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    // Build query
    let queryBuilder = orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.pharmacy', 'pharmacy');

    // Apply filters
    if (status) {
      queryBuilder = queryBuilder.andWhere('order.status = :status', { status });
    }
    if (payment_status) {
      queryBuilder = queryBuilder.andWhere('order.payment_status = :paymentStatus', {
        paymentStatus: payment_status,
      });
    }
    if (user_id) {
      queryBuilder = queryBuilder.andWhere('order.user_id = :userId', { userId: user_id });
    }
    if (pharmacy_id) {
      queryBuilder = queryBuilder.andWhere('order.pharmacy_id = :pharmacyId', {
        pharmacyId: pharmacy_id,
      });
    }

    // Apply sorting
    queryBuilder = queryBuilder.orderBy('order.created_at', 'DESC');

    // Count total
    const totalItems = await queryBuilder.getCount();

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder = queryBuilder.skip(skip).take(limit);

    // Execute query
    const orders = await queryBuilder.getMany();

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      orders: orders.map(sanitizeOrder),
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
    console.error('[Order Controller] List error:', error);
    res.status(500).json({
      error: 'Failed to list orders',
      message: error.message,
    });
  }
}

/**
 * GET /orders/:id
 * Get a single order by ID
 */
export async function getOrder(req: Request, res: Response): Promise<void> {
  try {
    const dataSource: DataSource = req.app.locals.dataSource;
    const orderRepo = dataSource.getRepository(Order);

    const order = await orderRepo.findOne({
      where: { id: req.params.id },
      relations: ['user', 'pharmacy'],
    });

    if (!order) {
      res.status(404).json({
        error: 'Order not found',
      });
      return;
    }

    res.json(sanitizeOrder(order));
  } catch (error: any) {
    console.error('[Order Controller] Get error:', error);
    res.status(500).json({
      error: 'Failed to get order',
      message: error.message,
    });
  }
}

/**
 * POST /orders
 * Create a new order
 */
export async function createOrder(req: Request, res: Response): Promise<void> {
  try {
    const dataSource: DataSource = req.app.locals.dataSource;
    const orderRepo = dataSource.getRepository(Order);

    const {
      user_id,
      pharmacy_id,
      items,
      subtotal,
      tax_amount,
      shipping_cost,
      discount_amount,
      total_amount,
      shipping_address_encrypted,
      shipping_notes_encrypted,
      delivery_method,
      notes,
    } = req.body;

    // Validation
    if (!user_id) {
      res.status(400).json({
        error: 'user_id is required',
      });
      return;
    }

    if (!pharmacy_id) {
      res.status(400).json({
        error: 'pharmacy_id is required',
      });
      return;
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        error: 'items array is required and must not be empty',
      });
      return;
    }

    if (total_amount === undefined || total_amount === null) {
      res.status(400).json({
        error: 'total_amount is required',
      });
      return;
    }

    // Create order
    const order = orderRepo.create({
      user_id,
      pharmacy_id,
      items,
      subtotal: subtotal || 0,
      tax_amount: tax_amount || 0,
      shipping_cost: shipping_cost || 0,
      discount_amount: discount_amount || 0,
      total_amount,
      shipping_address_encrypted: shipping_address_encrypted
        ? Buffer.from(shipping_address_encrypted, 'base64')
        : null,
      shipping_notes_encrypted: shipping_notes_encrypted
        ? Buffer.from(shipping_notes_encrypted, 'base64')
        : null,
      delivery_method: delivery_method || null,
      notes: notes || null,
      status: OrderStatus.PENDING,
      payment_status: PaymentStatus.PENDING,
    });

    await orderRepo.save(order);

    res.status(201).json(sanitizeOrder(order));
  } catch (error: any) {
    console.error('[Order Controller] Create error:', error);
    res.status(500).json({
      error: 'Failed to create order',
      message: error.message,
    });
  }
}

/**
 * PUT /orders/:id
 * Update an order
 */
export async function updateOrder(req: Request, res: Response): Promise<void> {
  try {
    const dataSource: DataSource = req.app.locals.dataSource;
    const orderRepo = dataSource.getRepository(Order);

    const order = await orderRepo.findOne({
      where: { id: req.params.id },
    });

    if (!order) {
      res.status(404).json({
        error: 'Order not found',
      });
      return;
    }

    const {
      status,
      payment_status,
      payment_method,
      payment_transaction_id,
      delivery_id,
      notes,
      cancellation_reason,
    } = req.body;

    // Update fields
    if (status) {
      order.status = status;

      // Update timestamps based on status
      if (status === OrderStatus.CONFIRMED && !order.confirmed_at) {
        order.confirmed_at = new Date();
      } else if (status === OrderStatus.COMPLETED && !order.completed_at) {
        order.completed_at = new Date();
      } else if (status === OrderStatus.CANCELLED && !order.cancelled_at) {
        order.cancelled_at = new Date();
        if (cancellation_reason) {
          order.cancellation_reason = cancellation_reason;
        }
      }
    }

    if (payment_status) {
      order.payment_status = payment_status;

      if (payment_status === PaymentStatus.PAID && !order.paid_at) {
        order.paid_at = new Date();
        if (payment_transaction_id) {
          order.payment_transaction_id = payment_transaction_id;
        }
      }
    }

    if (payment_method !== undefined) {
      order.payment_method = payment_method;
    }

    if (delivery_id !== undefined) {
      order.delivery_id = delivery_id;
    }

    if (notes !== undefined) {
      order.notes = notes;
    }

    await orderRepo.save(order);

    res.json(sanitizeOrder(order));
  } catch (error: any) {
    console.error('[Order Controller] Update error:', error);
    res.status(500).json({
      error: 'Failed to update order',
      message: error.message,
    });
  }
}

/**
 * DELETE /orders/:id
 * Delete an order
 */
export async function deleteOrder(req: Request, res: Response): Promise<void> {
  try {
    const dataSource: DataSource = req.app.locals.dataSource;
    const orderRepo = dataSource.getRepository(Order);

    const order = await orderRepo.findOne({
      where: { id: req.params.id },
    });

    if (!order) {
      res.status(404).json({
        error: 'Order not found',
      });
      return;
    }

    // Only allow deletion if pending
    if (order.status !== OrderStatus.PENDING) {
      res.status(400).json({
        error: 'Cannot delete order in current status',
        status: order.status,
      });
      return;
    }

    await orderRepo.remove(order);

    res.status(204).send();
  } catch (error: any) {
    console.error('[Order Controller] Delete error:', error);
    res.status(500).json({
      error: 'Failed to delete order',
      message: error.message,
    });
  }
}

/**
 * Sanitize order object for API response
 * Remove sensitive encrypted fields
 */
function sanitizeOrder(order: Order): any {
  return {
    id: order.id,
    pharmacy_id: order.pharmacy_id,
    user_id: order.user_id,
    status: order.status,
    items: order.items,
    subtotal: order.subtotal,
    tax_amount: order.tax_amount,
    shipping_cost: order.shipping_cost,
    discount_amount: order.discount_amount,
    total_amount: order.total_amount,
    payment_status: order.payment_status,
    payment_method: order.payment_method,
    payment_transaction_id: order.payment_transaction_id,
    paid_at: order.paid_at,
    delivery_method: order.delivery_method,
    delivery_id: order.delivery_id,
    notes: order.notes,
    cancellation_reason: order.cancellation_reason,
    created_at: order.created_at,
    updated_at: order.updated_at,
    confirmed_at: order.confirmed_at,
    completed_at: order.completed_at,
    cancelled_at: order.cancelled_at,
    total_items_count: order.getTotalItemsCount(),
    can_be_cancelled: order.canBeCancelled(),
    // Note: Encrypted fields are excluded for security
  };
}
