/**
 * Order Routes
 * CRUD operations for orders
 * Batch 3 Phase 4 - Order Service
 */

import { Router } from 'express';
import {
  listOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
} from '../controllers/orderController';

const router = Router();

/**
 * GET /orders
 * List orders with filtering and pagination
 *
 * Query parameters:
 * - status: Filter by status
 * - payment_status: Filter by payment status
 * - user_id: Filter by user UUID
 * - pharmacy_id: Filter by pharmacy UUID
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 */
router.get('/', listOrders);

/**
 * GET /orders/:id
 * Get a single order by ID
 */
router.get('/:id', getOrder);

/**
 * POST /orders
 * Create a new order
 *
 * Body:
 * - user_id: UUID (required)
 * - pharmacy_id: UUID (required)
 * - items: Array of order items (required)
 * - subtotal: Decimal (required)
 * - tax_amount: Decimal (optional)
 * - shipping_cost: Decimal (optional)
 * - discount_amount: Decimal (optional)
 * - total_amount: Decimal (required)
 * - shipping_address_encrypted: Base64 string (optional)
 * - shipping_notes_encrypted: Base64 string (optional)
 * - delivery_method: String (optional)
 * - notes: String (optional)
 */
router.post('/', createOrder);

/**
 * PUT /orders/:id
 * Update an order
 *
 * Body:
 * - status: OrderStatus (optional)
 * - payment_status: PaymentStatus (optional)
 * - payment_method: String (optional)
 * - payment_transaction_id: String (optional)
 * - delivery_id: UUID (optional)
 * - notes: String (optional)
 * - cancellation_reason: String (optional, required if status=cancelled)
 */
router.put('/:id', updateOrder);

/**
 * DELETE /orders/:id
 * Delete an order (only if pending)
 */
router.delete('/:id', deleteOrder);

export default router;
