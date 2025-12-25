/**
 * Route Optimization Controller
 * Handles route optimization requests
 */

import { Request, Response } from 'express';
import { optimizeRoute, recalculateRoute } from '../services/routeOptimizer';
import { DeliveryRequest, Coordinates, ApiResponse, OptimizedRoute } from '../types/delivery';

/**
 * POST /delivery/route/optimize
 * Optimize a list of deliveries into an efficient route
 *
 * Body:
 * - deliveryIds: string[] (array of delivery IDs to optimize)
 * - startLocation?: { latitude: number, longitude: number } (starting point, defaults to central Swiss location)
 */
export async function optimizeRouteController(req: Request, res: Response): Promise<void> {
  try {
    const { deliveryIds, startLocation } = req.body;

    // Validation
    if (!deliveryIds || !Array.isArray(deliveryIds) || deliveryIds.length === 0) {
      res.status(400).json({
        success: false,
        error: 'deliveryIds must be a non-empty array',
      } as ApiResponse<null>);
      return;
    }

    // For now, we'll create mock delivery data
    // In production, this would fetch from the database
    const mockDeliveries = createMockDeliveries(deliveryIds);

    // Default to Bern, Switzerland if not provided
    const startCoord: Coordinates = startLocation
      ? {
          latitude: startLocation.latitude,
          longitude: startLocation.longitude,
          timestamp: new Date().toISOString(),
        }
      : {
          latitude: 46.95,
          longitude: 7.45,
          timestamp: new Date().toISOString(),
        };

    // Optimize the route
    const optimizedRoute = optimizeRoute(mockDeliveries, startCoord);

    res.json({
      success: true,
      data: optimizedRoute,
    } as ApiResponse<OptimizedRoute>);
  } catch (error: any) {
    console.error('[Route Controller] Optimize error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to optimize route',
      message: error.message,
    } as ApiResponse<null>);
  }
}

/**
 * PUT /delivery/route/:routeId/progress
 * Update route progress (current waypoint index)
 *
 * Body:
 * - waypointIndex: number (current waypoint index)
 */
export async function updateRouteProgressController(req: Request, res: Response): Promise<void> {
  try {
    const { routeId } = req.params;
    const { waypointIndex } = req.body;

    if (typeof waypointIndex !== 'number' || waypointIndex < 0) {
      res.status(400).json({
        success: false,
        error: 'waypointIndex must be a non-negative number',
      } as ApiResponse<null>);
      return;
    }

    // In production, this would update the route in the database
    res.json({
      success: true,
      data: {
        routeId,
        waypointIndex,
        updatedAt: new Date().toISOString(),
      },
    } as ApiResponse<any>);
  } catch (error: any) {
    console.error('[Route Controller] Progress error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update route progress',
      message: error.message,
    } as ApiResponse<null>);
  }
}

/**
 * POST /delivery/route/:routeId/recalculate
 * Recalculate route from current position
 * Used when driver deviates significantly from planned route
 *
 * Body:
 * - currentLocation: { latitude: number, longitude: number }
 * - remainingDeliveryIds: string[] (delivery IDs not yet completed)
 */
export async function recalculateRouteController(req: Request, res: Response): Promise<void> {
  try {
    const { routeId } = req.params;
    const { currentLocation, remainingDeliveryIds } = req.body;

    // Validation
    if (!currentLocation || typeof currentLocation.latitude !== 'number' || typeof currentLocation.longitude !== 'number') {
      res.status(400).json({
        success: false,
        error: 'currentLocation must have latitude and longitude',
      } as ApiResponse<null>);
      return;
    }

    if (!remainingDeliveryIds || !Array.isArray(remainingDeliveryIds)) {
      res.status(400).json({
        success: false,
        error: 'remainingDeliveryIds must be an array',
      } as ApiResponse<null>);
      return;
    }

    // Create mock deliveries
    const mockDeliveries = createMockDeliveries(remainingDeliveryIds);

    // Recalculate route
    const recalculatedRoute = recalculateRoute(
      mockDeliveries,
      {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        timestamp: new Date().toISOString(),
      }
    );

    res.json({
      success: true,
      data: recalculatedRoute,
    } as ApiResponse<OptimizedRoute>);
  } catch (error: any) {
    console.error('[Route Controller] Recalculate error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to recalculate route',
      message: error.message,
    } as ApiResponse<null>);
  }
}

/**
 * Helper function to create mock delivery data for testing
 * In production, this would fetch from the database
 */
function createMockDeliveries(deliveryIds: string[]): DeliveryRequest[] {
  const mockDeliveries: DeliveryRequest[] = deliveryIds.map((id, index) => ({
    id,
    pharmacyId: 'pharmacy_001',
    pharmacyName: 'Main Pharmacy',
    patient: {
      id: `patient_${index}`,
      name: `Patient ${index + 1}`,
      phone: '0791234567',
      address: {
        street: `Rue de la Paix ${index + 1}`,
        city: ['Bern', 'Zurich', 'Geneva', 'Basel', 'Lausanne'][index % 5],
        postalCode: `${2000 + index}`,
        canton: ['BE', 'ZH', 'GE', 'BS', 'VD'][index % 5],
        country: 'Switzerland',
        latitude: 46.95 + Math.random() * 1,
        longitude: 7.45 + Math.random() * 1,
        instructions: `Building ${String.fromCharCode(65 + (index % 5))}`,
      },
      availabilityWindow: {
        start: new Date(Date.now() + 3600000).toISOString(),
        end: new Date(Date.now() + 7200000).toISOString(),
      },
    },
    packages: [
      {
        id: `package_${id}`,
        qrCode: `QR_${id}`,
        medications: [
          {
            id: `med_${id}`,
            name: 'Paracetamol',
            quantity: 1,
            dosage: '500mg',
            requiresColdChain: false,
            isControlledSubstance: false,
          },
        ],
        specialHandling: index % 3 === 0 ? ['cold_chain'] : [],
      },
    ],
    status: 'pending',
    priority: ['low', 'medium', 'high', 'urgent'][index % 4] as any,
    estimatedDuration: 15 + Math.random() * 30,
    distance: 2 + Math.random() * 10,
    paymentMethod: 'insurance',
    createdAt: new Date().toISOString(),
  }));

  return mockDeliveries;
}
