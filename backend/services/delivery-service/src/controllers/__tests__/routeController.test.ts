/**
 * Route Controller Integration Tests
 * Tests for route optimization API endpoints
 */

import { Request, Response } from 'express';
import {
  optimizeRouteController,
  updateRouteProgressController,
  recalculateRouteController,
} from '../routeController';
import { ApiResponse, OptimizedRoute } from '../../types/delivery';

/**
 * Mock Request/Response helpers
 */
class MockRequest {
  body: any = {};
  params: any = {};
  query: any = {};

  constructor(body?: any, params?: any) {
    if (body) this.body = body;
    if (params) this.params = params;
  }
}

class MockResponse {
  statusCode: number = 200;
  jsonData: any = null;
  errorData: any = null;

  status(code: number) {
    this.statusCode = code;
    return this;
  }

  json(data: any) {
    this.jsonData = data;
    return this;
  }

  send(data: any) {
    this.jsonData = data;
    return this;
  }
}

describe('Route Controller', () => {
  describe('optimizeRouteController', () => {
    it('should optimize route with valid input', async () => {
      const req = new MockRequest({
        deliveryIds: ['del_001', 'del_002', 'del_003'],
      });
      const res = new MockResponse() as any;

      await optimizeRouteController(req as any, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData).toHaveProperty('success', true);
      expect(res.jsonData).toHaveProperty('data');
      expect(res.jsonData.data).toHaveProperty('deliveryIds');
      expect(res.jsonData.data.deliveryIds).toHaveLength(3);
    });

    it('should accept custom start location', async () => {
      const req = new MockRequest({
        deliveryIds: ['del_001', 'del_002'],
        startLocation: {
          latitude: 47.5,
          longitude: 8.5,
        },
      });
      const res = new MockResponse() as any;

      await optimizeRouteController(req as any, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);
    });

    it('should return error for empty deliveryIds', async () => {
      const req = new MockRequest({
        deliveryIds: [],
      });
      const res = new MockResponse() as any;

      await optimizeRouteController(req as any, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.error).toContain('non-empty array');
    });

    it('should return error for missing deliveryIds', async () => {
      const req = new MockRequest({});
      const res = new MockResponse() as any;

      await optimizeRouteController(req as any, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.error).toContain('deliveryIds');
    });

    it('should return error for non-array deliveryIds', async () => {
      const req = new MockRequest({
        deliveryIds: 'del_001',
      });
      const res = new MockResponse() as any;

      await optimizeRouteController(req as any, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.success).toBe(false);
    });

    it('should return optimized route with complete structure', async () => {
      const req = new MockRequest({
        deliveryIds: ['del_001', 'del_002'],
      });
      const res = new MockResponse() as any;

      await optimizeRouteController(req as any, res);

      const route: OptimizedRoute = res.jsonData.data;

      expect(route).toHaveProperty('id');
      expect(route).toHaveProperty('deliveryIds');
      expect(route).toHaveProperty('waypoints');
      expect(route).toHaveProperty('totalDistance');
      expect(route).toHaveProperty('totalDuration');
      expect(route).toHaveProperty('optimizedAt');
      expect(route).toHaveProperty('currentWaypointIndex', 0);
      expect(route).toHaveProperty('routeDetails');
    });

    it('should include route details', async () => {
      const req = new MockRequest({
        deliveryIds: ['del_001'],
      });
      const res = new MockResponse() as any;

      await optimizeRouteController(req as any, res);

      const route: OptimizedRoute = res.jsonData.data;

      expect(route.routeDetails).toHaveProperty('priorityScore');
      expect(route.routeDetails).toHaveProperty('constraintsRespected');
      expect(route.routeDetails).toHaveProperty('timeEfficiency');
    });

    it('should include waypoints with coordinates', async () => {
      const req = new MockRequest({
        deliveryIds: ['del_001', 'del_002'],
      });
      const res = new MockResponse() as any;

      await optimizeRouteController(req as any, res);

      const route: OptimizedRoute = res.jsonData.data;

      expect(route.waypoints.length).toBeGreaterThan(0);
      route.waypoints.forEach((waypoint) => {
        expect(waypoint).toHaveProperty('deliveryId');
        expect(waypoint).toHaveProperty('coordinates');
        expect(waypoint.coordinates).toHaveProperty('latitude');
        expect(waypoint.coordinates).toHaveProperty('longitude');
        expect(waypoint).toHaveProperty('sequence');
        expect(waypoint).toHaveProperty('estimatedArrival');
        expect(waypoint).toHaveProperty('estimatedDuration');
      });
    });
  });

  describe('updateRouteProgressController', () => {
    it('should update route progress with valid input', async () => {
      const req = new MockRequest(
        {
          waypointIndex: 2,
        },
        {
          routeId: 'route_001',
        }
      );
      const res = new MockResponse() as any;

      await updateRouteProgressController(req as any, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);
      expect(res.jsonData.data).toHaveProperty('routeId', 'route_001');
      expect(res.jsonData.data).toHaveProperty('waypointIndex', 2);
    });

    it('should return error for missing waypointIndex', async () => {
      const req = new MockRequest({}, { routeId: 'route_001' });
      const res = new MockResponse() as any;

      await updateRouteProgressController(req as any, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.error).toContain('waypointIndex');
    });

    it('should return error for negative waypointIndex', async () => {
      const req = new MockRequest(
        {
          waypointIndex: -1,
        },
        {
          routeId: 'route_001',
        }
      );
      const res = new MockResponse() as any;

      await updateRouteProgressController(req as any, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.success).toBe(false);
    });

    it('should return error for non-numeric waypointIndex', async () => {
      const req = new MockRequest(
        {
          waypointIndex: 'two',
        },
        {
          routeId: 'route_001',
        }
      );
      const res = new MockResponse() as any;

      await updateRouteProgressController(req as any, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.success).toBe(false);
    });

    it('should include updatedAt timestamp', async () => {
      const req = new MockRequest(
        {
          waypointIndex: 1,
        },
        {
          routeId: 'route_001',
        }
      );
      const res = new MockResponse() as any;

      await updateRouteProgressController(req as any, res);

      expect(res.jsonData.data).toHaveProperty('updatedAt');
      expect(typeof res.jsonData.data.updatedAt).toBe('string');
    });
  });

  describe('recalculateRouteController', () => {
    it('should recalculate route with valid input', async () => {
      const req = new MockRequest(
        {
          currentLocation: {
            latitude: 46.95,
            longitude: 7.45,
          },
          remainingDeliveryIds: ['del_001', 'del_002'],
        },
        {
          routeId: 'route_001',
        }
      );
      const res = new MockResponse() as any;

      await recalculateRouteController(req as any, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);
      expect(res.jsonData.data).toHaveProperty('id');
      expect(res.jsonData.data).toHaveProperty('waypoints');
    });

    it('should return error for missing currentLocation', async () => {
      const req = new MockRequest(
        {
          remainingDeliveryIds: ['del_001'],
        },
        {
          routeId: 'route_001',
        }
      );
      const res = new MockResponse() as any;

      await recalculateRouteController(req as any, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.error).toContain('currentLocation');
    });

    it('should return error for invalid latitude in currentLocation', async () => {
      const req = new MockRequest(
        {
          currentLocation: {
            longitude: 7.45,
          },
          remainingDeliveryIds: ['del_001'],
        },
        {
          routeId: 'route_001',
        }
      );
      const res = new MockResponse() as any;

      await recalculateRouteController(req as any, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.success).toBe(false);
    });

    it('should return error for missing remainingDeliveryIds', async () => {
      const req = new MockRequest(
        {
          currentLocation: {
            latitude: 46.95,
            longitude: 7.45,
          },
        },
        {
          routeId: 'route_001',
        }
      );
      const res = new MockResponse() as any;

      await recalculateRouteController(req as any, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.error).toContain('remainingDeliveryIds');
    });

    it('should return recalculated route with new waypoints', async () => {
      const req = new MockRequest(
        {
          currentLocation: {
            latitude: 47.0,
            longitude: 8.0,
          },
          remainingDeliveryIds: ['del_002', 'del_003'],
        },
        {
          routeId: 'route_001',
        }
      );
      const res = new MockResponse() as any;

      await recalculateRouteController(req as any, res);

      const route: OptimizedRoute = res.jsonData.data;

      expect(route.deliveryIds).toEqual(['del_002', 'del_003']);
      expect(route.waypoints).toHaveLength(2);
    });

    it('should handle empty remainingDeliveryIds', async () => {
      const req = new MockRequest(
        {
          currentLocation: {
            latitude: 46.95,
            longitude: 7.45,
          },
          remainingDeliveryIds: [],
        },
        {
          routeId: 'route_001',
        }
      );
      const res = new MockResponse() as any;

      await recalculateRouteController(req as any, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);
      expect(res.jsonData.data.waypoints).toHaveLength(0);
    });
  });

  describe('Error handling', () => {
    it('should handle server errors gracefully', async () => {
      const req = new MockRequest({
        deliveryIds: null, // This will cause an error during processing
      });
      const res = new MockResponse() as any;

      // Should not throw
      await expect(optimizeRouteController(req as any, res)).resolves.not.toThrow();

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.success).toBe(false);
    });
  });

  describe('Response format validation', () => {
    it('should always return success boolean in response', async () => {
      const req = new MockRequest({
        deliveryIds: ['del_001'],
      });
      const res = new MockResponse() as any;

      await optimizeRouteController(req as any, res);

      expect(res.jsonData).toHaveProperty('success');
      expect(typeof res.jsonData.success).toBe('boolean');
    });

    it('should return data or error, never both', async () => {
      const req = new MockRequest({
        deliveryIds: ['del_001'],
      });
      const res = new MockResponse() as any;

      await optimizeRouteController(req as any, res);

      const hasData = res.jsonData.data !== undefined;
      const hasError = res.jsonData.error !== undefined;

      // Should have one or the other, not both
      expect(hasData || hasError).toBe(true);
      expect(hasData && hasError).toBe(false);
    });
  });
});
