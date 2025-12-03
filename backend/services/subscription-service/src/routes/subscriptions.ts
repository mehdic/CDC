/**
 * Subscription Routes
 * API endpoints for subscription management
 * Task T6-016 - Subscription Service Implementation
 */

import { Router } from 'express';
import {
  createSubscription,
  listPatientSubscriptions,
  getSubscription,
  updateSubscription,
  deleteSubscription,
  pauseSubscription,
  resumeSubscription,
  skipNextDelivery,
  cancelSubscription,
  getNextDeliveryPreview,
  processScheduledOrders,
} from '../controllers/subscriptionController';

const router = Router();

/**
 * POST /patients/:id/subscriptions
 * Create a new subscription for a patient
 *
 * Body:
 * - pharmacy_id: UUID (required)
 * - name: String (required, e.g., "Monthly Blood Pressure Medication")
 * - frequency: "weekly" | "biweekly" | "monthly" | "custom" (required)
 * - custom_interval_days: Integer (required if frequency=custom)
 * - next_delivery_date: Date (optional, auto-calculated if not provided)
 * - payment_method_id: UUID (optional)
 * - delivery_address_id: UUID (optional)
 * - notes: String (optional)
 * - items: Array (required, at least one item)
 *   - product_id: UUID
 *   - quantity: Integer
 *   - unit_price: Decimal
 *   - prescription_id: UUID (optional, required for prescription items)
 */
router.post('/patients/:id/subscriptions', createSubscription);

/**
 * GET /patients/:id/subscriptions
 * List all subscriptions for a patient
 *
 * Query parameters:
 * - include_inactive: Boolean (default: false) - Include paused/cancelled subscriptions
 */
router.get('/patients/:id/subscriptions', listPatientSubscriptions);

/**
 * GET /subscriptions/:id
 * Get a single subscription by ID
 */
router.get('/subscriptions/:id', getSubscription);

/**
 * PUT /subscriptions/:id
 * Update a subscription
 *
 * Body (all optional):
 * - name: String
 * - frequency: "weekly" | "biweekly" | "monthly" | "custom"
 * - custom_interval_days: Integer
 * - next_delivery_date: Date
 * - payment_method_id: UUID
 * - delivery_address_id: UUID
 * - notes: String
 */
router.put('/subscriptions/:id', updateSubscription);

/**
 * DELETE /subscriptions/:id
 * Delete a subscription (only if cancelled)
 */
router.delete('/subscriptions/:id', deleteSubscription);

/**
 * POST /subscriptions/:id/pause
 * Pause an active subscription
 */
router.post('/subscriptions/:id/pause', pauseSubscription);

/**
 * POST /subscriptions/:id/resume
 * Resume a paused subscription
 */
router.post('/subscriptions/:id/resume', resumeSubscription);

/**
 * POST /subscriptions/:id/skip
 * Skip next delivery (pushes delivery date forward by interval)
 */
router.post('/subscriptions/:id/skip', skipNextDelivery);

/**
 * POST /subscriptions/:id/cancel
 * Cancel a subscription
 *
 * Body:
 * - reason: String (optional)
 */
router.post('/subscriptions/:id/cancel', cancelSubscription);

/**
 * GET /subscriptions/:id/next-delivery
 * Get preview of next delivery
 *
 * Response:
 * - subscription_id: UUID
 * - next_delivery_date: Date
 * - items: Array of items to be delivered
 * - subtotal: Decimal
 * - discount: Decimal
 * - estimated_total: Decimal
 */
router.get('/subscriptions/:id/next-delivery', getNextDeliveryPreview);

/**
 * POST /subscriptions/process-scheduled (internal endpoint)
 * Process scheduled subscriptions (called by cron job)
 *
 * This should be protected with API key authentication
 */
router.post('/subscriptions/process-scheduled', processScheduledOrders);

export default router;
