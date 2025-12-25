/**
 * Route Optimization Routes
 * T8-053: AI Route Optimization - Use Existing Infrastructure
 * Provides TSP-based route optimization for multi-stop deliveries
 */

import { Router } from 'express';
import {
  optimizeRouteController,
  updateRouteProgressController,
  recalculateRouteController,
} from '../controllers/routeController';

const router = Router();

/**
 * POST /route/optimize
 * Optimize a list of deliveries into an efficient route
 *
 * Body:
 * - deliveryIds: string[] (array of delivery IDs to optimize, required)
 * - startLocation: { latitude: number, longitude: number } (optional, defaults to Bern)
 *
 * Response:
 * - id: string (unique route ID)
 * - deliveryIds: string[] (optimized delivery order)
 * - waypoints: Waypoint[] (detailed stop information)
 * - totalDistance: number (km)
 * - totalDuration: number (minutes)
 * - optimizedAt: ISO string
 * - currentWaypointIndex: number
 * - routeDetails: { priorityScore, constraintsRespected, timeEfficiency }
 */
router.post('/optimize', optimizeRouteController);

/**
 * PUT /route/:routeId/progress
 * Update route progress (current waypoint index)
 *
 * Params:
 * - routeId: string (route ID)
 *
 * Body:
 * - waypointIndex: number (current waypoint index, non-negative, required)
 *
 * Response:
 * - routeId: string
 * - waypointIndex: number
 * - updatedAt: ISO string
 */
router.put('/:routeId/progress', updateRouteProgressController);

/**
 * POST /route/:routeId/recalculate
 * Recalculate route from current position
 * Used when driver deviates significantly from planned route
 *
 * Params:
 * - routeId: string (route ID)
 *
 * Body:
 * - currentLocation: { latitude: number, longitude: number } (required)
 * - remainingDeliveryIds: string[] (delivery IDs not yet completed, required)
 *
 * Response:
 * - Same as /optimize endpoint (new optimized route from current location)
 */
router.post('/:routeId/recalculate', recalculateRouteController);

export default router;
