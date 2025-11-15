/**
 * Delivery Routes
 * CRUD operations for deliveries
 * Batch 3 Phase 4 - Delivery Service
 */

import { Router } from 'express';
import {
  listDeliveries,
  getDelivery,
  createDelivery,
  updateDelivery,
  deleteDelivery,
} from '../controllers/deliveryController';

const router = Router();

/**
 * GET /deliveries
 * List deliveries with filtering and pagination
 *
 * Query parameters:
 * - status: Filter by status
 * - user_id: Filter by user UUID
 * - order_id: Filter by order UUID
 * - delivery_personnel_id: Filter by delivery personnel UUID
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 */
router.get('/', listDeliveries);

/**
 * GET /deliveries/:id
 * Get a single delivery by ID
 */
router.get('/:id', getDelivery);

/**
 * POST /deliveries
 * Create a new delivery
 *
 * Body:
 * - user_id: UUID (required)
 * - order_id: UUID (optional)
 * - delivery_address_encrypted: Base64 string (required)
 * - delivery_notes_encrypted: Base64 string (optional)
 * - scheduled_at: ISO timestamp (optional)
 */
router.post('/', createDelivery);

/**
 * PUT /deliveries/:id
 * Update a delivery
 *
 * Body:
 * - status: DeliveryStatus (optional)
 * - delivery_personnel_id: UUID (optional)
 * - tracking_info: Object (optional)
 * - tracking_number: String (optional)
 * - failure_reason: String (optional, required if status=failed)
 */
router.put('/:id', updateDelivery);

/**
 * DELETE /deliveries/:id
 * Delete a delivery (only if pending or cancelled)
 */
router.delete('/:id', deleteDelivery);

export default router;
