/**
 * Delivery Tracking Routes
 * T3-053: Create Delivery Tracking API
 * Provides real-time location updates and tracking history
 */

import { Router } from 'express';
import {
  updateDeliveryLocation,
  getDeliveryTracking,
  getLocationHistory,
} from '../controllers/trackingController';

const router = Router();

/**
 * POST /tracking/:id/location
 * Update driver location for a delivery
 *
 * Body:
 * - latitude: number (required)
 * - longitude: number (required)
 * - accuracy: number (meters)
 * - speed: number (m/s, optional)
 * - heading: number (degrees, optional)
 * - timestamp: ISO string (required)
 * - battery_level: number (percentage, optional)
 */
router.post('/:id/location', updateDeliveryLocation);

/**
 * GET /tracking/:id
 * Get delivery tracking information
 *
 * Response:
 * - delivery_id: string
 * - current_location: Coordinates
 * - eta_minutes: number
 * - distance_remaining_km: number
 * - location_history: Coordinates[] (last 20 points)
 * - status: DeliveryStatus
 * - driver_info: object
 */
router.get('/:id', getDeliveryTracking);

/**
 * GET /tracking/:id/history
 * Get full location history for a delivery
 *
 * Query parameters:
 * - start_date: ISO string (optional, defaults to delivery created_at)
 * - end_date: ISO string (optional, defaults to now)
 * - limit: number (optional, max 1000, default 100)
 */
router.get('/:id/history', getLocationHistory);

export default router;
