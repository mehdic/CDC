/**
 * Route Service
 * T8-021: GPS Tracking & Route Display
 * Provides route optimization, traffic-aware routing, and navigation
 */

import deliveryApi from './deliveryApi';
import { DeliveryRoute, Coordinates } from '../types/delivery';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Route state with discriminated union
 */
type RouteState =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'success'; data: DeliveryRoute }
  | { type: 'error'; error: Error };

/**
 * Route Service Configuration
 */
interface RouteConfig {
  cacheKey: string;
  cacheDurationMs: number;
  maxRetries: number;
  retryDelayMs: number;
}

const DEFAULT_CONFIG: RouteConfig = {
  cacheKey: '@route_cache',
  cacheDurationMs: 5 * 60 * 1000, // 5 minutes
  maxRetries: 3,
  retryDelayMs: 1000,
};

/**
 * Cached Route Entry
 */
interface CachedRoute {
  route: DeliveryRoute;
  timestamp: number;
}

/**
 * Route Service Class
 */
class RouteService {
  private config: RouteConfig;
  private routeCache: Map<string, CachedRoute> = new Map();

  constructor(config: Partial<RouteConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
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
    return R * c; // Distance in km
  }

  /**
   * Estimate time between two coordinates based on distance
   * Uses traffic-aware estimates (simplified)
   */
  private estimateTime(
    coord1: Coordinates,
    coord2: Coordinates,
    isUrbanArea: boolean = true
  ): number {
    const distanceKm = this.calculateDistance(coord1, coord2);

    // Urban: 20 km/h average, Highway: 60 km/h average
    const avgSpeed = isUrbanArea ? 20 : 60;
    const timeMinutes = (distanceKm / avgSpeed) * 60;

    // Add traffic buffer (urban +30%, highway +10%)
    const trafficBuffer = isUrbanArea ? 1.3 : 1.1;
    return Math.round(timeMinutes * trafficBuffer);
  }

  /**
   * Get cached route if valid
   */
  private getCachedRoute(cacheKey: string): DeliveryRoute | null {
    const cached = this.routeCache.get(cacheKey);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.config.cacheDurationMs;
    if (isExpired) {
      this.routeCache.delete(cacheKey);
      return null;
    }

    return cached.route;
  }

  /**
   * Cache route for future use
   */
  private cacheRoute(cacheKey: string, route: DeliveryRoute): void {
    this.routeCache.set(cacheKey, {
      route,
      timestamp: Date.now(),
    });
  }

  /**
   * Get Optimized Route with Retry Logic
   */
  async getOptimizedRoute(
    deliveryIds: string[],
    bypassCache: boolean = false
  ): Promise<DeliveryRoute> {
    if (!deliveryIds || deliveryIds.length === 0) {
      throw new Error('deliveryIds must not be empty');
    }

    // Create cache key
    const cacheKey = `route_${deliveryIds.sort().join('_')}`;

    // Check cache first
    if (!bypassCache) {
      const cached = this.getCachedRoute(cacheKey);
      if (cached) {
        console.log('[RouteService] Returning cached route');
        return cached;
      }
    }

    // Retry logic
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        console.log(
          `[RouteService] Fetching optimized route (attempt ${attempt}/${this.config.maxRetries})`
        );

        const response = await deliveryApi.getOptimizedRoute(deliveryIds);

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to get optimized route');
        }

        // Cache successful result
        this.cacheRoute(cacheKey, response.data);

        console.log('[RouteService] Route optimized successfully');
        return response.data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[RouteService] Attempt ${attempt} failed:`, lastError.message);

        // Wait before retry
        if (attempt < this.config.maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.config.retryDelayMs * attempt)
          );
        }
      }
    }

    throw lastError || new Error('Failed to get optimized route');
  }

  /**
   * Calculate Turn-by-Turn Instructions (simplified)
   * In production, use Google Maps Directions API or similar
   */
  calculateTurnByTurnInstructions(
    start: Coordinates,
    waypoints: Coordinates[],
    end: Coordinates
  ): string[] {
    const instructions: string[] = [];

    // Start instruction
    instructions.push(`Start at ${start.latitude.toFixed(4)}, ${start.longitude.toFixed(4)}`);

    // Waypoint instructions
    let previousCoord = start;
    for (let i = 0; i < waypoints.length; i++) {
      const currentCoord = waypoints[i];
      const distance = this.calculateDistance(previousCoord, currentCoord);
      const bearing = this.calculateBearing(previousCoord, currentCoord);

      instructions.push(`In ${distance.toFixed(1)} km, ${this.bearingToDirection(bearing)}`);
      previousCoord = currentCoord;
    }

    // End instruction
    const finalDistance = this.calculateDistance(previousCoord, end);
    instructions.push(`In ${finalDistance.toFixed(1)} km, arrive at destination`);

    return instructions;
  }

  /**
   * Calculate bearing between two coordinates
   */
  private calculateBearing(from: Coordinates, to: Coordinates): number {
    const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;
    const y = Math.sin(dLon) * Math.cos((to.latitude * Math.PI) / 180);
    const x =
      Math.cos((from.latitude * Math.PI) / 180) * Math.sin((to.latitude * Math.PI) / 180) -
      Math.sin((from.latitude * Math.PI) / 180) * Math.cos((to.latitude * Math.PI) / 180) * Math.cos(dLon);

    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  }

  /**
   * Convert bearing to compass direction
   */
  private bearingToDirection(bearing: number): string {
    const directions = ['North', 'NorthEast', 'East', 'SouthEast', 'South', 'SouthWest', 'West', 'NorthWest'];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
  }

  /**
   * Check if on route (within tolerance)
   */
  isOnRoute(
    currentLocation: Coordinates,
    route: DeliveryRoute,
    toleranceMeters: number = 50
  ): boolean {
    if (!route || !route.waypoints || route.waypoints.length === 0) {
      return false;
    }

    // Check distance to current waypoint
    const currentWaypoint = route.waypoints[route.currentWaypointIndex];
    if (!currentWaypoint) return false;

    const distance = this.calculateDistance(currentLocation, currentWaypoint.coordinates);
    const distanceMeters = distance * 1000;

    return distanceMeters <= toleranceMeters;
  }

  /**
   * Calculate ETA to next waypoint
   */
  calculateETA(
    currentLocation: Coordinates,
    nextWaypoint: Coordinates,
    speedKmh: number = 20
  ): Date {
    const distance = this.calculateDistance(currentLocation, nextWaypoint);
    const timeHours = distance / speedKmh;
    const timeMs = timeHours * 60 * 60 * 1000;

    return new Date(Date.now() + timeMs);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.routeCache.clear();
    console.log('[RouteService] Cache cleared');
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.routeCache.size;
  }
}

// Export singleton instance
export const routeService = new RouteService();
export default routeService;
