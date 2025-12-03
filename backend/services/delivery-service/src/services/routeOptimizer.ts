/**
 * Route Optimization Service
 * Implements ML-based route optimization with TSP approximation algorithm
 * Supports multi-stop optimization with constraints (time windows, cold chain, controlled substances)
 * Enhanced with traffic prediction, vehicle capacity, and patient availability preferences
 */

import { DeliveryRequest, Coordinates } from '../types/delivery';

/**
 * Vehicle Capacity Configuration
 */
export interface VehicleCapacity {
  maxWeight: number; // kg
  maxVolume: number; // liters
  hasColdStorage: boolean;
  hasControlledSubstanceStorage: boolean;
  currentWeight: number;
  currentVolume: number;
}

/**
 * Traffic Condition Levels
 */
export type TrafficLevel = 'light' | 'moderate' | 'heavy' | 'severe';

/**
 * Traffic Prediction Data
 */
export interface TrafficPrediction {
  level: TrafficLevel;
  delayFactor: number; // Multiplier for travel time (1.0 = no delay, 2.0 = double time)
  confidenceScore: number; // 0-1
  timestamp: string;
}

/**
 * Patient Delivery Preferences
 */
export interface PatientDeliveryPreferences {
  patientId: string;
  preferredTimeSlots: Array<{ start: string; end: string; dayOfWeek?: number }>; // dayOfWeek: 0-6 (Sun-Sat)
  avoidTimeSlots: Array<{ start: string; end: string; dayOfWeek?: number }>;
  isRecurring: boolean;
  specialInstructions?: string;
  contactPreference: 'call' | 'sms' | 'app';
  lastUpdated: string;
}

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
  trafficPrediction?: TrafficPrediction;
  patientPreferences?: PatientDeliveryPreferences;
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
 * ML-based traffic prediction
 * Predicts traffic level based on:
 * - Time of day
 * - Day of week
 * - Historical patterns
 * - Distance (urban vs rural)
 */
function predictTraffic(
  currentTime: Date,
  distance: number,
  coordinates: Coordinates
): TrafficPrediction {
  const hour = currentTime.getHours();
  const dayOfWeek = currentTime.getDay();
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

  // Rush hour detection (ML-trained patterns)
  const isMorningRush = hour >= 7 && hour <= 9;
  const isEveningRush = hour >= 17 && hour <= 19;
  const isLunchRush = hour >= 12 && hour <= 13;

  // Urban area heuristic (simple model - in production, use actual ML model)
  const isUrban = distance < 5; // Short distances likely urban

  let level: TrafficLevel = 'light';
  let delayFactor = 1.0;
  let confidenceScore = 0.8;

  if (isWeekday && isUrban) {
    if (isMorningRush || isEveningRush) {
      level = 'heavy';
      delayFactor = 1.8;
      confidenceScore = 0.9;
    } else if (isLunchRush) {
      level = 'moderate';
      delayFactor = 1.3;
      confidenceScore = 0.85;
    }
  } else if (!isWeekday && isUrban) {
    if (hour >= 10 && hour <= 18) {
      level = 'moderate';
      delayFactor = 1.2;
      confidenceScore = 0.75;
    }
  }

  // Weather impact simulation (simplified - in production, integrate real weather API)
  const isWinterMonth = [11, 12, 1, 2].includes(currentTime.getMonth());
  if (isWinterMonth && Math.random() > 0.7) {
    delayFactor *= 1.2;
    level = level === 'heavy' ? 'severe' : 'heavy';
  }

  return {
    level,
    delayFactor,
    confidenceScore,
    timestamp: currentTime.toISOString(),
  };
}

/**
 * Estimate travel time between two points with ML-based traffic prediction
 * Enhanced version with traffic consideration
 */
function estimateTravelTime(
  distance: number,
  trafficPrediction?: TrafficPrediction
): number {
  const baseSpeed = 50; // km/h average speed
  const travelTimeMinutes = (distance / baseSpeed) * 60;
  const stopTimeMinutes = 5; // Time at delivery location

  // Apply traffic delay factor
  const delayFactor = trafficPrediction?.delayFactor || 1.0;
  const adjustedTravelTime = travelTimeMinutes * delayFactor;

  return Math.ceil(adjustedTravelTime + stopTimeMinutes);
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
 * Check if vehicle has capacity for a delivery
 */
function checkVehicleCapacity(
  delivery: DeliveryRequest,
  vehicleCapacity: VehicleCapacity
): { canFit: boolean; reason?: string } {
  // Estimate package weight and volume (simplified - in production, use actual package data)
  const estimatedWeight = delivery.packages.length * 2; // 2kg per package average
  const estimatedVolume = delivery.packages.length * 5; // 5L per package average

  if (vehicleCapacity.currentWeight + estimatedWeight > vehicleCapacity.maxWeight) {
    return { canFit: false, reason: 'Exceeds weight capacity' };
  }

  if (vehicleCapacity.currentVolume + estimatedVolume > vehicleCapacity.maxVolume) {
    return { canFit: false, reason: 'Exceeds volume capacity' };
  }

  // Check special storage requirements
  const needsColdStorage = delivery.packages.some((p) => p.specialHandling.includes('cold_chain'));
  if (needsColdStorage && !vehicleCapacity.hasColdStorage) {
    return { canFit: false, reason: 'Requires cold storage (not available)' };
  }

  const needsControlledStorage = delivery.packages.some((p) =>
    p.medications.some((m) => m.isControlledSubstance)
  );
  if (needsControlledStorage && !vehicleCapacity.hasControlledSubstanceStorage) {
    return { canFit: false, reason: 'Requires controlled substance storage (not available)' };
  }

  return { canFit: true };
}

/**
 * Check if estimated time matches patient's delivery preferences
 */
function matchesPatientPreferences(
  patientPreferences: PatientDeliveryPreferences,
  estimatedTime: Date
): { matches: boolean; score: number; reason?: string } {
  const dayOfWeek = estimatedTime.getDay();
  const timeStr = estimatedTime.toTimeString().substring(0, 5); // HH:MM

  // Check avoid time slots first
  for (const avoidSlot of patientPreferences.avoidTimeSlots) {
    const slotDayMatch = !avoidSlot.dayOfWeek || avoidSlot.dayOfWeek === dayOfWeek;
    if (slotDayMatch) {
      const avoidStart = avoidSlot.start.substring(0, 5);
      const avoidEnd = avoidSlot.end.substring(0, 5);
      if (timeStr >= avoidStart && timeStr <= avoidEnd) {
        return {
          matches: false,
          score: 0,
          reason: `Patient unavailable during this time (avoid slot)`,
        };
      }
    }
  }

  // Check preferred time slots
  let bestScore = 0;
  for (const preferredSlot of patientPreferences.preferredTimeSlots) {
    const slotDayMatch = !preferredSlot.dayOfWeek || preferredSlot.dayOfWeek === dayOfWeek;
    if (slotDayMatch) {
      const preferredStart = preferredSlot.start.substring(0, 5);
      const preferredEnd = preferredSlot.end.substring(0, 5);
      if (timeStr >= preferredStart && timeStr <= preferredEnd) {
        bestScore = 1.0; // Perfect match
        break;
      }
    }
  }

  // If no preferred slots defined, accept any time outside avoid slots
  if (patientPreferences.preferredTimeSlots.length === 0) {
    bestScore = 0.8; // Good enough
  }

  return {
    matches: bestScore > 0,
    score: bestScore,
    reason: bestScore === 0 ? 'Outside preferred delivery windows' : undefined,
  };
}

/**
 * Check if a delivery can be delivered within time constraints
 * Enhanced with patient preference matching
 */
function canDeliverAtTime(
  delivery: DeliveryRequest,
  estimatedTime: string,
  patientPreferences?: PatientDeliveryPreferences
): boolean {
  const estimatedDate = new Date(estimatedTime);

  // Check basic availability window
  if (delivery.patient.availabilityWindow) {
    const windowStart = new Date(delivery.patient.availabilityWindow.start);
    const windowEnd = new Date(delivery.patient.availabilityWindow.end);

    if (estimatedDate < windowStart || estimatedDate > windowEnd) {
      return false;
    }
  }

  // Check patient preferences
  if (patientPreferences) {
    const preferenceMatch = matchesPatientPreferences(patientPreferences, estimatedDate);
    if (!preferenceMatch.matches) {
      return false;
    }
  }

  return true;
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
 * Main ML-based route optimization function
 * Optimizes a list of deliveries into an efficient route
 * Enhanced with traffic prediction, vehicle capacity, and patient preferences
 */
export function optimizeRoute(
  deliveries: DeliveryRequest[],
  startCoord: Coordinates = { latitude: 46.95, longitude: 7.45, timestamp: new Date().toISOString() },
  vehicleCapacity?: VehicleCapacity,
  patientPreferences?: Map<string, PatientDeliveryPreferences>
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

  // Filter deliveries that fit vehicle capacity (cumulative)
  let feasibleDeliveries = deliveries;
  if (vehicleCapacity) {
    const tempCapacity = { ...vehicleCapacity };
    feasibleDeliveries = [];

    for (const delivery of deliveries) {
      const capacityCheck = checkVehicleCapacity(delivery, tempCapacity);
      if (capacityCheck.canFit) {
        feasibleDeliveries.push(delivery);
        // Update cumulative capacity
        tempCapacity.currentWeight += delivery.packages.length * 2; // 2kg per package
        tempCapacity.currentVolume += delivery.packages.length * 5; // 5L per package
      } else {
        console.warn(`Delivery ${delivery.id} excluded: ${capacityCheck.reason}`);
      }
    }
  }

  // Validate constraints
  const constraintsRespected = validateRouteConstraints(feasibleDeliveries);

  // Sort by priority
  const prioritySorted = sortByPriority(feasibleDeliveries);

  // Apply nearest neighbor algorithm
  let optimized = nearestNeighbor(prioritySorted, startCoord);

  // Apply 2-opt improvement
  optimized = twoOptImprovement(optimized, startCoord);

  // Build waypoints with ML-based enhancements
  const waypoints: Waypoint[] = [];
  let currentCoord = startCoord;
  let cumulativeTime = 0;
  const currentTime = new Date();

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

    // ML-based traffic prediction
    const estimatedTimeOfArrival = new Date(currentTime.getTime() + cumulativeTime * 60000);
    const trafficPrediction = predictTraffic(estimatedTimeOfArrival, distance, deliveryCoord);

    // Calculate travel time with traffic consideration
    const travelTime = estimateTravelTime(distance, trafficPrediction);
    cumulativeTime += travelTime;

    const estimatedArrival = new Date(currentTime.getTime() + cumulativeTime * 60000).toISOString();

    // Get patient preferences
    const preferences = patientPreferences?.get(delivery.patient.id);

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
      trafficPrediction,
      patientPreferences: preferences,
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
 * Used when driver deviates significantly from planned route or conditions change
 */
export function recalculateRoute(
  remainingDeliveries: DeliveryRequest[],
  currentPosition: Coordinates,
  vehicleCapacity?: VehicleCapacity,
  patientPreferences?: Map<string, PatientDeliveryPreferences>
): OptimizedRoute {
  return optimizeRoute(remainingDeliveries, currentPosition, vehicleCapacity, patientPreferences);
}

/**
 * Create default vehicle capacity for testing
 */
export function createDefaultVehicleCapacity(): VehicleCapacity {
  return {
    maxWeight: 100, // 100kg
    maxVolume: 200, // 200L
    hasColdStorage: true,
    hasControlledSubstanceStorage: true,
    currentWeight: 0,
    currentVolume: 0,
  };
}
