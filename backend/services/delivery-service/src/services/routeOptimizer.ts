/**
 * Route Optimization Service
 * Implements route optimization with TSP approximation algorithm
 * Supports multi-stop optimization with constraints (time windows, cold chain, controlled substances)
 */

import { DeliveryRequest, Coordinates } from '../types/delivery';

/**
 * Waypoint definition for optimized routes
 */
export interface Waypoint {
  deliveryId: string;
  coordinates: Coordinates;
  sequence: number;
  estimatedArrival: string;
  estimatedDuration: number;
  completed: boolean;
  constraints: {
    timeWindow?: { start: string; end: string };
    coldChain?: boolean;
    controlledSubstance?: boolean;
    idVerificationRequired?: boolean;
  };
}

/**
 * Optimized route result
 */
export interface OptimizedRoute {
  id: string;
  deliveryIds: string[];
  waypoints: Waypoint[];
  totalDistance: number;
  totalDuration: number;
  optimizedAt: string;
  currentWaypointIndex: number;
  routeDetails: {
    priorityScore: number;
    constraintsRespected: boolean;
    timeEfficiency: number; // percentage
  };
}

/**
 * Haversine formula to calculate distance between two coordinates
 * Returns distance in kilometers
 */
function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.latitude * Math.PI) / 180) *
      Math.cos((coord2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimate travel time between two points
 * Approximation: 50 km/h average speed, plus 5 min per stop
 */
function estimateTravelTime(distance: number): number {
  const travelTimeMinutes = (distance / 50) * 60;
  const stopTimeMinutes = 5; // Time at delivery location
  return Math.ceil(travelTimeMinutes + stopTimeMinutes);
}

/**
 * Calculate priority score for a delivery based on:
 * - Priority level (urgent > high > medium > low)
 * - Time window constraints
 * - Special handling requirements
 */
function calculatePriorityScore(delivery: DeliveryRequest): number {
  let score = 0;

  // Base priority
  const priorityMap = { urgent: 100, high: 75, medium: 50, low: 25 };
  score += priorityMap[delivery.priority] || 25;

  // Time window bonus
  if (delivery.packages.some((pkg) => pkg.specialHandling.includes('time_sensitive'))) {
    score += 50;
  }

  // Controlled substance handling
  if (delivery.packages.some((pkg) => pkg.medications.some((med) => med.isControlledSubstance))) {
    score += 30;
  }

  return score;
}

/**
 * Check if a delivery can be delivered within time constraints
 */
function canDeliverAtTime(delivery: DeliveryRequest, estimatedTime: string): boolean {
  if (!delivery.patient.availabilityWindow) {
    return true;
  }

  const estimatedDate = new Date(estimatedTime);
  const windowStart = new Date(delivery.patient.availabilityWindow.start);
  const windowEnd = new Date(delivery.patient.availabilityWindow.end);

  return estimatedDate >= windowStart && estimatedDate <= windowEnd;
}

/**
 * Nearest neighbor heuristic for TSP
 * Finds a good (not necessarily optimal) solution quickly
 */
function nearestNeighbor(
  deliveries: DeliveryRequest[],
  startCoord: Coordinates
): DeliveryRequest[] {
  const unvisited = [...deliveries];
  const visited: DeliveryRequest[] = [];
  let currentCoord = startCoord;

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let nearestDistance = Infinity;

    // Find nearest unvisited delivery
    for (let i = 0; i < unvisited.length; i++) {
      const deliveryCoord = unvisited[i].patient.address;
      if (!deliveryCoord.latitude || !deliveryCoord.longitude) continue;

      const distance = calculateDistance(currentCoord, {
        latitude: deliveryCoord.latitude,
        longitude: deliveryCoord.longitude,
        timestamp: new Date().toISOString(),
      });

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIdx = i;
      }
    }

    const nearest = unvisited.splice(nearestIdx, 1)[0];
    visited.push(nearest);

    if (nearest.patient.address.latitude && nearest.patient.address.longitude) {
      currentCoord = {
        latitude: nearest.patient.address.latitude,
        longitude: nearest.patient.address.longitude,
        timestamp: new Date().toISOString(),
      };
    }
  }

  return visited;
}

/**
 * 2-opt local search optimization
 * Improves a route by trying to swap edge pairs
 */
function twoOptImprovement(
  deliveries: DeliveryRequest[],
  startCoord: Coordinates
): DeliveryRequest[] {
  if (deliveries.length < 3) return deliveries;

  let improved = [...deliveries];
  let bestDistance = calculateTotalDistance(improved, startCoord);
  let improved_flag = true;

  while (improved_flag) {
    improved_flag = false;

    for (let i = 0; i < improved.length - 1; i++) {
      for (let k = i + 2; k < improved.length; k++) {
        // Create candidate by reversing segment between i+1 and k
        const candidate = [
          ...improved.slice(0, i + 1),
          ...improved.slice(i + 1, k + 1).reverse(),
          ...improved.slice(k + 1),
        ];

        const candidateDistance = calculateTotalDistance(candidate, startCoord);

        if (candidateDistance < bestDistance) {
          improved = candidate;
          bestDistance = candidateDistance;
          improved_flag = true;
          break;
        }
      }
      if (improved_flag) break;
    }
  }

  return improved;
}

/**
 * Calculate total distance for a route
 */
function calculateTotalDistance(deliveries: DeliveryRequest[], startCoord: Coordinates): number {
  let totalDistance = 0;
  let currentCoord = startCoord;

  for (const delivery of deliveries) {
    const { address } = delivery.patient;
    if (!address.latitude || !address.longitude) continue;

    const deliveryCoord: Coordinates = {
      latitude: address.latitude,
      longitude: address.longitude,
      timestamp: new Date().toISOString(),
    };

    totalDistance += calculateDistance(currentCoord, deliveryCoord);
    currentCoord = deliveryCoord;
  }

  return totalDistance;
}

/**
 * Check if route respects all constraints
 */
function validateRouteConstraints(deliveries: DeliveryRequest[]): boolean {
  // Check for incompatible items (e.g., cold chain + regular items)
  const hasColdChain = deliveries.some((d) =>
    d.packages.some((p) => p.specialHandling.includes('cold_chain'))
  );

  const hasNonColdChain = deliveries.some((d) =>
    d.packages.some((p) => !p.specialHandling.includes('cold_chain'))
  );

  if (hasColdChain && hasNonColdChain) {
    return false; // Cannot mix cold chain with regular items
  }

  // Check for controlled substances with time-sensitive items
  const hasControlled = deliveries.some((d) =>
    d.packages.some((p) => p.medications.some((m) => m.isControlledSubstance))
  );

  const hasTimeSensitive = deliveries.some((d) =>
    d.packages.some((p) => p.specialHandling.includes('time_sensitive'))
  );

  if (hasControlled && hasTimeSensitive) {
    // Controlled substances require direct delivery, not to be held with time-sensitive items
    return false;
  }

  return true;
}

/**
 * Sort deliveries by priority
 */
function sortByPriority(deliveries: DeliveryRequest[]): DeliveryRequest[] {
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };

  return [...deliveries].sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Secondary sort: by priority score
    return calculatePriorityScore(b) - calculatePriorityScore(a);
  });
}

/**
 * Main route optimization function
 * Optimizes a list of deliveries into an efficient route
 */
export function optimizeRoute(
  deliveries: DeliveryRequest[],
  startCoord: Coordinates = { latitude: 46.95, longitude: 7.45, timestamp: new Date().toISOString() }
): OptimizedRoute {
  if (deliveries.length === 0) {
    return {
      id: `route_${Date.now()}`,
      deliveryIds: [],
      waypoints: [],
      totalDistance: 0,
      totalDuration: 0,
      optimizedAt: new Date().toISOString(),
      currentWaypointIndex: 0,
      routeDetails: {
        priorityScore: 0,
        constraintsRespected: true,
        timeEfficiency: 100,
      },
    };
  }

  // Validate constraints
  const constraintsRespected = validateRouteConstraints(deliveries);

  // Sort by priority
  const prioritySorted = sortByPriority(deliveries);

  // Apply nearest neighbor algorithm
  let optimized = nearestNeighbor(prioritySorted, startCoord);

  // Apply 2-opt improvement
  optimized = twoOptImprovement(optimized, startCoord);

  // Build waypoints
  const waypoints: Waypoint[] = [];
  let currentCoord = startCoord;
  let cumulativeTime = 0;

  for (let i = 0; i < optimized.length; i++) {
    const delivery = optimized[i];
    const { address } = delivery.patient;

    if (!address.latitude || !address.longitude) {
      continue;
    }

    const deliveryCoord: Coordinates = {
      latitude: address.latitude,
      longitude: address.longitude,
      timestamp: new Date().toISOString(),
    };

    const distance = calculateDistance(currentCoord, deliveryCoord);
    const travelTime = estimateTravelTime(distance);
    cumulativeTime += travelTime;

    const estimatedArrival = new Date(Date.now() + cumulativeTime * 60000).toISOString();

    waypoints.push({
      deliveryId: delivery.id,
      coordinates: deliveryCoord,
      sequence: i + 1,
      estimatedArrival,
      estimatedDuration: travelTime,
      completed: false,
      constraints: {
        timeWindow: delivery.patient.availabilityWindow,
        coldChain: delivery.packages.some((p) => p.specialHandling.includes('cold_chain')),
        controlledSubstance: delivery.packages.some((p) =>
          p.medications.some((m) => m.isControlledSubstance)
        ),
        idVerificationRequired: delivery.packages.some((p) =>
          p.specialHandling.includes('id_verification')
        ),
      },
    });

    currentCoord = deliveryCoord;
  }

  const totalDistance = calculateTotalDistance(optimized, startCoord);
  const totalDuration = cumulativeTime;

  // Calculate priority score average
  const totalPriorityScore = optimized.reduce((sum, d) => sum + calculatePriorityScore(d), 0);
  const avgPriorityScore = optimized.length > 0 ? totalPriorityScore / optimized.length : 0;

  // Time efficiency: ideal would be straight line distance at avg speed
  const maxTimeRequired = Math.max(...waypoints.map((w) => w.estimatedDuration));
  const timeEfficiency = Math.min(100, (maxTimeRequired / totalDuration) * 100);

  return {
    id: `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    deliveryIds: optimized.map((d) => d.id),
    waypoints,
    totalDistance: Math.round(totalDistance * 100) / 100,
    totalDuration,
    optimizedAt: new Date().toISOString(),
    currentWaypointIndex: 0,
    routeDetails: {
      priorityScore: avgPriorityScore,
      constraintsRespected,
      timeEfficiency: Math.round(timeEfficiency),
    },
  };
}

/**
 * Recalculate route from current position
 * Used when driver deviates significantly from planned route
 */
export function recalculateRoute(
  remainingDeliveries: DeliveryRequest[],
  currentPosition: Coordinates
): OptimizedRoute {
  return optimizeRoute(remainingDeliveries, currentPosition);
}
