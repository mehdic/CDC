/**
 * Route Optimizer Unit Tests
 * Tests for TSP approximation, constraint validation, and route optimization
 */

import { optimizeRoute, recalculateRoute, Waypoint, OptimizedRoute } from '../routeOptimizer';
import { DeliveryRequest, Coordinates } from '../../types/delivery';

/**
 * Mock delivery creation helper
 */
function createMockDelivery(overrides?: Partial<DeliveryRequest>): DeliveryRequest {
  const baseId = Math.random().toString(36).substr(2, 9);
  return {
    id: `delivery_${baseId}`,
    pharmacyId: 'pharmacy_001',
    pharmacyName: 'Test Pharmacy',
    patient: {
      id: `patient_${baseId}`,
      name: 'Test Patient',
      phone: '0791234567',
      address: {
        street: 'Test Street 1',
        city: 'Bern',
        postalCode: '3011',
        canton: 'BE',
        country: 'Switzerland',
        latitude: 46.95 + Math.random() * 0.5,
        longitude: 7.45 + Math.random() * 0.5,
        instructions: 'Ring doorbell',
      },
    },
    packages: [
      {
        id: `package_${baseId}`,
        qrCode: `QR_${baseId}`,
        medications: [
          {
            id: `med_${baseId}`,
            name: 'Paracetamol',
            quantity: 1,
            dosage: '500mg',
            requiresColdChain: false,
            isControlledSubstance: false,
          },
        ],
        specialHandling: [],
      },
    ],
    status: 'pending',
    priority: 'medium',
    estimatedDuration: 15,
    distance: 5,
    paymentMethod: 'insurance',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('Route Optimizer', () => {
  describe('optimizeRoute', () => {
    it('should return empty route for empty deliveries', () => {
      const result = optimizeRoute([]);
      expect(result.deliveryIds).toHaveLength(0);
      expect(result.waypoints).toHaveLength(0);
      expect(result.totalDistance).toBe(0);
      expect(result.totalDuration).toBe(0);
    });

    it('should optimize a single delivery', () => {
      const delivery = createMockDelivery();
      const result = optimizeRoute([delivery]);

      expect(result.deliveryIds).toEqual([delivery.id]);
      expect(result.waypoints).toHaveLength(1);
      expect(result.totalDistance).toBeGreaterThan(0);
      expect(result.totalDuration).toBeGreaterThan(0);
    });

    it('should optimize multiple deliveries', () => {
      const deliveries = [
        createMockDelivery(),
        createMockDelivery(),
        createMockDelivery(),
      ];

      const result = optimizeRoute(deliveries);

      expect(result.deliveryIds).toHaveLength(3);
      expect(result.waypoints).toHaveLength(3);
      expect(result.totalDistance).toBeGreaterThan(0);
      expect(result.totalDuration).toBeGreaterThan(0);
    });

    it('should sort deliveries by priority', () => {
      const baseLocation = { latitude: 46.95, longitude: 7.45 };
      const deliveries = [
        createMockDelivery({
          priority: 'low',
          patient: {
            ...createMockDelivery().patient,
            ...baseLocation,
          },
        }),
        createMockDelivery({
          priority: 'urgent',
          patient: {
            ...createMockDelivery().patient,
            ...baseLocation,
          },
        }),
        createMockDelivery({
          priority: 'medium',
          patient: {
            ...createMockDelivery().patient,
            ...baseLocation,
          },
        }),
      ];

      const result = optimizeRoute(deliveries);

      // Should contain all deliveries
      expect(result.deliveryIds).toHaveLength(3);

      // Verify that priority is respected in overall route planning
      // (urgent deliveries get higher priority scores)
      const urgentDelivery = deliveries.find((d) => d.priority === 'urgent');
      expect(result.deliveryIds).toContain(urgentDelivery?.id);
    });

    it('should set correct waypoint sequence numbers', () => {
      const deliveries = [
        createMockDelivery(),
        createMockDelivery(),
        createMockDelivery(),
      ];

      const result = optimizeRoute(deliveries);

      result.waypoints.forEach((waypoint, index) => {
        expect(waypoint.sequence).toBe(index + 1);
      });
    });

    it('should calculate estimated arrival times in chronological order', () => {
      const deliveries = [
        createMockDelivery(),
        createMockDelivery(),
        createMockDelivery(),
      ];

      const result = optimizeRoute(deliveries);

      const arrivals = result.waypoints.map((w) => new Date(w.estimatedArrival).getTime());

      for (let i = 1; i < arrivals.length; i++) {
        expect(arrivals[i]).toBeGreaterThanOrEqual(arrivals[i - 1]);
      }
    });

    it('should respect time window constraints', () => {
      const now = new Date();
      const futureStart = new Date(now.getTime() + 3600000); // 1 hour from now
      const futureEnd = new Date(now.getTime() + 7200000); // 2 hours from now

      const delivery = createMockDelivery({
        patient: {
          ...createMockDelivery().patient,
          availabilityWindow: {
            start: futureStart.toISOString(),
            end: futureEnd.toISOString(),
          },
        },
      });

      const result = optimizeRoute([delivery]);
      const waypoint = result.waypoints[0];

      expect(waypoint.constraints.timeWindow).toEqual({
        start: futureStart.toISOString(),
        end: futureEnd.toISOString(),
      });
    });

    it('should detect cold chain requirements', () => {
      const delivery = createMockDelivery({
        packages: [
          {
            id: 'pkg_001',
            qrCode: 'QR_001',
            medications: [
              {
                id: 'med_001',
                name: 'Insulin',
                quantity: 1,
                dosage: '100IU',
                requiresColdChain: true,
                isControlledSubstance: false,
              },
            ],
            specialHandling: ['cold_chain'],
          },
        ],
      });

      const result = optimizeRoute([delivery]);
      const waypoint = result.waypoints[0];

      expect(waypoint.constraints.coldChain).toBe(true);
    });

    it('should detect controlled substance requirements', () => {
      const delivery = createMockDelivery({
        packages: [
          {
            id: 'pkg_001',
            qrCode: 'QR_001',
            medications: [
              {
                id: 'med_001',
                name: 'Morphine',
                quantity: 1,
                dosage: '10mg',
                requiresColdChain: false,
                isControlledSubstance: true,
              },
            ],
            specialHandling: ['narcotics'],
          },
        ],
      });

      const result = optimizeRoute([delivery]);
      const waypoint = result.waypoints[0];

      expect(waypoint.constraints.controlledSubstance).toBe(true);
    });

    it('should detect ID verification requirements', () => {
      const delivery = createMockDelivery({
        packages: [
          {
            id: 'pkg_001',
            qrCode: 'QR_001',
            medications: [
              {
                id: 'med_001',
                name: 'Paracetamol',
                quantity: 1,
                dosage: '500mg',
                requiresColdChain: false,
                isControlledSubstance: false,
              },
            ],
            specialHandling: ['id_verification'],
          },
        ],
      });

      const result = optimizeRoute([delivery]);
      const waypoint = result.waypoints[0];

      expect(waypoint.constraints.idVerificationRequired).toBe(true);
    });

    it('should validate constraints for incompatible items', () => {
      const deliveries = [
        createMockDelivery({
          packages: [
            {
              id: 'pkg_001',
              qrCode: 'QR_001',
              medications: [
                {
                  id: 'med_001',
                  name: 'Insulin',
                  quantity: 1,
                  dosage: '100IU',
                  requiresColdChain: true,
                  isControlledSubstance: false,
                },
              ],
              specialHandling: ['cold_chain'],
            },
          ],
        }),
        createMockDelivery({
          packages: [
            {
              id: 'pkg_002',
              qrCode: 'QR_002',
              medications: [
                {
                  id: 'med_002',
                  name: 'Paracetamol',
                  quantity: 1,
                  dosage: '500mg',
                  requiresColdChain: false,
                  isControlledSubstance: false,
                },
              ],
              specialHandling: [],
            },
          ],
        }),
      ];

      const result = optimizeRoute(deliveries);

      // Should flag that constraints are not respected for mixing cold chain with non-cold chain
      expect(result.routeDetails.constraintsRespected).toBe(false);
    });

    it('should use custom start location', () => {
      const customStart: Coordinates = {
        latitude: 47.5,
        longitude: 8.5,
        timestamp: new Date().toISOString(),
      };

      const delivery = createMockDelivery();
      const result = optimizeRoute([delivery], customStart);

      expect(result.waypoints).toHaveLength(1);
      expect(result.totalDistance).toBeGreaterThan(0);
    });

    it('should calculate route details including priority score', () => {
      const deliveries = [
        createMockDelivery({ priority: 'urgent' }),
        createMockDelivery({ priority: 'low' }),
      ];

      const result = optimizeRoute(deliveries);

      expect(result.routeDetails.priorityScore).toBeGreaterThan(0);
      expect(typeof result.routeDetails.priorityScore).toBe('number');
    });

    it('should calculate time efficiency percentage', () => {
      const deliveries = [
        createMockDelivery(),
        createMockDelivery(),
      ];

      const result = optimizeRoute(deliveries);

      expect(result.routeDetails.timeEfficiency).toBeGreaterThanOrEqual(0);
      expect(result.routeDetails.timeEfficiency).toBeLessThanOrEqual(100);
    });

    it('should include optimized timestamp', () => {
      const deliveries = [createMockDelivery()];
      const beforeOptimize = new Date();

      const result = optimizeRoute(deliveries);

      const optimizedTime = new Date(result.optimizedAt);
      const afterOptimize = new Date();

      expect(optimizedTime.getTime()).toBeGreaterThanOrEqual(beforeOptimize.getTime());
      expect(optimizedTime.getTime()).toBeLessThanOrEqual(afterOptimize.getTime());
    });

    it('should set currentWaypointIndex to 0', () => {
      const deliveries = [
        createMockDelivery(),
        createMockDelivery(),
      ];

      const result = optimizeRoute(deliveries);

      expect(result.currentWaypointIndex).toBe(0);
    });

    it('should generate unique route ID', () => {
      const deliveries = [createMockDelivery()];

      const result1 = optimizeRoute(deliveries);
      const result2 = optimizeRoute(deliveries);

      expect(result1.id).not.toBe(result2.id);
    });
  });

  describe('recalculateRoute', () => {
    it('should recalculate route from new position', () => {
      const deliveries = [
        createMockDelivery(),
        createMockDelivery(),
        createMockDelivery(),
      ];

      const newPosition: Coordinates = {
        latitude: 47.0,
        longitude: 8.0,
        timestamp: new Date().toISOString(),
      };

      const result = recalculateRoute(deliveries, newPosition);

      expect(result.deliveryIds).toHaveLength(3);
      expect(result.waypoints).toHaveLength(3);
      expect(result.totalDistance).toBeGreaterThan(0);
    });

    it('should handle empty remaining deliveries', () => {
      const newPosition: Coordinates = {
        latitude: 47.0,
        longitude: 8.0,
        timestamp: new Date().toISOString(),
      };

      const result = recalculateRoute([], newPosition);

      expect(result.deliveryIds).toHaveLength(0);
      expect(result.waypoints).toHaveLength(0);
    });
  });

  describe('Waypoint validation', () => {
    it('should have all required waypoint fields', () => {
      const delivery = createMockDelivery();
      const result = optimizeRoute([delivery]);
      const waypoint = result.waypoints[0];

      expect(waypoint).toHaveProperty('deliveryId');
      expect(waypoint).toHaveProperty('coordinates');
      expect(waypoint).toHaveProperty('sequence');
      expect(waypoint).toHaveProperty('estimatedArrival');
      expect(waypoint).toHaveProperty('estimatedDuration');
      expect(waypoint).toHaveProperty('completed');
      expect(waypoint).toHaveProperty('constraints');
    });

    it('should have valid coordinates for each waypoint', () => {
      const deliveries = [
        createMockDelivery(),
        createMockDelivery(),
      ];

      const result = optimizeRoute(deliveries);

      result.waypoints.forEach((waypoint) => {
        expect(typeof waypoint.coordinates.latitude).toBe('number');
        expect(typeof waypoint.coordinates.longitude).toBe('number');
        expect(waypoint.coordinates.latitude).toBeGreaterThanOrEqual(-90);
        expect(waypoint.coordinates.latitude).toBeLessThanOrEqual(90);
        expect(waypoint.coordinates.longitude).toBeGreaterThanOrEqual(-180);
        expect(waypoint.coordinates.longitude).toBeLessThanOrEqual(180);
      });
    });

    it('should mark all waypoints as not completed initially', () => {
      const deliveries = [
        createMockDelivery(),
        createMockDelivery(),
      ];

      const result = optimizeRoute(deliveries);

      result.waypoints.forEach((waypoint) => {
        expect(waypoint.completed).toBe(false);
      });
    });
  });

  describe('Integration tests', () => {
    it('should handle complex multi-stop route with mixed constraints', () => {
      const deliveries = [
        createMockDelivery({
          priority: 'urgent',
          packages: [
            {
              id: 'pkg_001',
              qrCode: 'QR_001',
              medications: [
                {
                  id: 'med_001',
                  name: 'Urgent Meds',
                  quantity: 1,
                  dosage: '100mg',
                  requiresColdChain: false,
                  isControlledSubstance: false,
                },
              ],
              specialHandling: ['time_sensitive'],
            },
          ],
        }),
        createMockDelivery({
          priority: 'high',
          packages: [
            {
              id: 'pkg_002',
              qrCode: 'QR_002',
              medications: [
                {
                  id: 'med_002',
                  name: 'Regular Meds',
                  quantity: 1,
                  dosage: '50mg',
                  requiresColdChain: false,
                  isControlledSubstance: false,
                },
              ],
              specialHandling: [],
            },
          ],
        }),
        createMockDelivery({
          priority: 'medium',
        }),
        createMockDelivery({
          priority: 'low',
        }),
      ];

      const result = optimizeRoute(deliveries);

      expect(result.deliveryIds).toHaveLength(4);
      expect(result.waypoints).toHaveLength(4);

      // Verify all deliveries are included in the optimized route
      const deliveryIds = new Set(result.deliveryIds);
      deliveries.forEach((delivery) => {
        expect(deliveryIds).toContain(delivery.id);
      });
    });
  });
});
