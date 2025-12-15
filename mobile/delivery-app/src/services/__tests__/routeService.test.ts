/**
 * RouteService Unit Tests
 * T8-021: GPS Tracking & Route Display
 */

import { DeliveryRoute, Coordinates } from '../../types/delivery';
import deliveryApi from '../deliveryApi';
import { routeService } from '../routeService';

/**
 * Mock deliveryApi
 */
jest.mock('../deliveryApi', () => ({
  getOptimizedRoute: jest.fn(),
}));

/**
 * Mock Route Data
 */
const createMockRoute = (id: string = 'route-1'): DeliveryRoute => ({
  id,
  deliveryIds: ['delivery-1', 'delivery-2'],
  waypoints: [
    {
      deliveryId: 'delivery-1',
      address: {
        street: '123 Main St',
        city: 'Zurich',
        postalCode: '8000',
        canton: 'ZH',
        country: 'CH',
      },
      coordinates: {
        latitude: 47.3769,
        longitude: 8.5417,
        timestamp: new Date().toISOString(),
      },
      sequence: 1,
      estimatedArrival: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      completed: false,
    },
    {
      deliveryId: 'delivery-2',
      address: {
        street: '456 Oak Ave',
        city: 'Zurich',
        postalCode: '8000',
        canton: 'ZH',
        country: 'CH',
      },
      coordinates: {
        latitude: 47.3769,
        longitude: 8.5417,
        timestamp: new Date().toISOString(),
      },
      sequence: 2,
      estimatedArrival: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
      completed: false,
    },
  ],
  totalDistance: 5.2,
  totalDuration: 25,
  optimizedAt: new Date().toISOString(),
  currentWaypointIndex: 0,
});

describe('RouteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    routeService.clearCache();
  });

  describe('getOptimizedRoute', () => {
    it('should fetch and return optimized route', async () => {
      const mockRoute = createMockRoute();
      (deliveryApi.getOptimizedRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: mockRoute,
      });

      const route = await routeService.getOptimizedRoute(['delivery-1', 'delivery-2']);

      expect(route).toEqual(mockRoute);
      expect(deliveryApi.getOptimizedRoute).toHaveBeenCalledWith(['delivery-1', 'delivery-2']);
    });

    it('should throw error on empty deliveryIds', async () => {
      await expect(routeService.getOptimizedRoute([])).rejects.toThrow(
        'deliveryIds must not be empty'
      );
    });

    it('should cache route for subsequent calls', async () => {
      const mockRoute = createMockRoute();
      (deliveryApi.getOptimizedRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: mockRoute,
      });

      // First call
      const route1 = await routeService.getOptimizedRoute(['delivery-1']);

      // Second call should use cache
      const route2 = await routeService.getOptimizedRoute(['delivery-1']);

      expect(route1).toEqual(route2);
      expect(deliveryApi.getOptimizedRoute).toHaveBeenCalledTimes(1);
    });

    it('should bypass cache when requested', async () => {
      const mockRoute = createMockRoute();
      (deliveryApi.getOptimizedRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: mockRoute,
      });

      await routeService.getOptimizedRoute(['delivery-1']);
      await routeService.getOptimizedRoute(['delivery-1'], true);

      expect(deliveryApi.getOptimizedRoute).toHaveBeenCalledTimes(2);
    });

    it('should retry on failure', async () => {
      const mockRoute = createMockRoute();
      (deliveryApi.getOptimizedRoute as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          success: true,
          data: mockRoute,
        });

      const route = await routeService.getOptimizedRoute(['delivery-1']);

      expect(route).toEqual(mockRoute);
      expect(deliveryApi.getOptimizedRoute).toHaveBeenCalledTimes(2);
    });

    it('should throw error after max retries', async () => {
      (deliveryApi.getOptimizedRoute as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await expect(routeService.getOptimizedRoute(['delivery-1'])).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle API response error', async () => {
      (deliveryApi.getOptimizedRoute as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Route optimization failed',
      });

      await expect(routeService.getOptimizedRoute(['delivery-1'])).rejects.toThrow(
        'Route optimization failed'
      );
    });
  });

  describe('isOnRoute', () => {
    it('should return true if location is within tolerance', () => {
      const mockRoute = createMockRoute();
      const currentLocation: Coordinates = {
        latitude: 47.3769,
        longitude: 8.5417,
        timestamp: new Date().toISOString(),
      };

      const result = routeService.isOnRoute(currentLocation, mockRoute, 100);

      expect(result).toBe(true);
    });

    it('should return false if location is outside tolerance', () => {
      const mockRoute = createMockRoute();
      const currentLocation: Coordinates = {
        latitude: 47.0,
        longitude: 8.0,
        timestamp: new Date().toISOString(),
      };

      const result = routeService.isOnRoute(currentLocation, mockRoute, 100);

      expect(result).toBe(false);
    });

    it('should return false if route is invalid', () => {
      const currentLocation: Coordinates = {
        latitude: 47.3769,
        longitude: 8.5417,
        timestamp: new Date().toISOString(),
      };

      const result = routeService.isOnRoute(currentLocation, null as any, 100);

      expect(result).toBe(false);
    });
  });

  describe('calculateETA', () => {
    it('should calculate ETA based on distance and speed', () => {
      const currentLocation: Coordinates = {
        latitude: 47.3769,
        longitude: 8.5417,
        timestamp: new Date().toISOString(),
      };

      const nextWaypoint: Coordinates = {
        latitude: 47.3769,
        longitude: 8.5517, // ~1.1 km away
        timestamp: new Date().toISOString(),
      };

      const eta = routeService.calculateETA(currentLocation, nextWaypoint, 20);

      expect(eta).toBeInstanceOf(Date);
      expect(eta.getTime()).toBeGreaterThan(Date.now());
    });

    it('should use default speed of 20 km/h', () => {
      const currentLocation: Coordinates = {
        latitude: 47.3769,
        longitude: 8.5417,
        timestamp: new Date().toISOString(),
      };

      const nextWaypoint: Coordinates = {
        latitude: 47.3769,
        longitude: 8.5517,
        timestamp: new Date().toISOString(),
      };

      const eta1 = routeService.calculateETA(currentLocation, nextWaypoint);
      const eta2 = routeService.calculateETA(currentLocation, nextWaypoint, 20);

      // Should be very close (within 100ms)
      expect(Math.abs(eta1.getTime() - eta2.getTime())).toBeLessThan(100);
    });
  });

  describe('calculateTurnByTurnInstructions', () => {
    it('should generate turn-by-turn instructions', () => {
      const start: Coordinates = {
        latitude: 47.3769,
        longitude: 8.5417,
        timestamp: new Date().toISOString(),
      };

      const waypoint1: Coordinates = {
        latitude: 47.3769,
        longitude: 8.5517,
        timestamp: new Date().toISOString(),
      };

      const waypoint2: Coordinates = {
        latitude: 47.3869,
        longitude: 8.5517,
        timestamp: new Date().toISOString(),
      };

      const end: Coordinates = {
        latitude: 47.3869,
        longitude: 8.5617,
        timestamp: new Date().toISOString(),
      };

      const instructions = routeService.calculateTurnByTurnInstructions(
        start,
        [waypoint1, waypoint2],
        end
      );

      expect(instructions).toBeInstanceOf(Array);
      expect(instructions.length).toBe(4); // Start + 2 waypoints + end
      expect(instructions[0]).toContain('Start');
      expect(instructions[instructions.length - 1]).toContain('arrive');
    });

    it('should handle empty waypoints', () => {
      const start: Coordinates = {
        latitude: 47.3769,
        longitude: 8.5417,
        timestamp: new Date().toISOString(),
      };

      const end: Coordinates = {
        latitude: 47.3869,
        longitude: 8.5617,
        timestamp: new Date().toISOString(),
      };

      const instructions = routeService.calculateTurnByTurnInstructions(start, [], end);

      expect(instructions.length).toBe(2); // Start + end
    });
  });

  describe('Cache Management', () => {
    it('should clear cache on demand', async () => {
      const mockRoute = createMockRoute();
      (deliveryApi.getOptimizedRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: mockRoute,
      });

      await routeService.getOptimizedRoute(['delivery-1']);
      expect(routeService.getCacheSize()).toBeGreaterThan(0);

      routeService.clearCache();
      expect(routeService.getCacheSize()).toBe(0);
    });

    it('should expire cached routes after duration', async () => {
      const mockRoute = createMockRoute();
      (deliveryApi.getOptimizedRoute as jest.Mock).mockResolvedValue({
        success: true,
        data: mockRoute,
      });

      // Create service with short cache duration (100ms)
      const shortCacheService = new (routeService.constructor as any)({
        cacheDurationMs: 100,
      });

      await shortCacheService.getOptimizedRoute(['delivery-1']);
      expect((deliveryApi.getOptimizedRoute as jest.Mock).mock.calls.length).toBeGreaterThan(0);

      // Wait for cache to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should fetch again
      const callsBefore = (deliveryApi.getOptimizedRoute as jest.Mock).mock.calls.length;
      await shortCacheService.getOptimizedRoute(['delivery-1']);
      const callsAfter = (deliveryApi.getOptimizedRoute as jest.Mock).mock.calls.length;

      expect(callsAfter).toBeGreaterThan(callsBefore);
    });
  });
});
