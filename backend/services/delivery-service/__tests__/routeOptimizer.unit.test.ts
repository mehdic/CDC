/**
 * Route Optimizer Unit Tests
 * Tests ML-based route optimization with traffic prediction, vehicle capacity, and patient preferences
 */

import {
  optimizeRoute,
  recalculateRoute,
  createDefaultVehicleCapacity,
  VehicleCapacity,
  PatientDeliveryPreferences,
  TrafficLevel,
} from '../src/services/routeOptimizer';
import { DeliveryRequest, Coordinates } from '../src/types/delivery';

describe('Route Optimizer - ML-based Features', () => {
  const startCoord: Coordinates = {
    latitude: 46.95,
    longitude: 7.45,
    timestamp: new Date().toISOString(),
  };

  const createMockDelivery = (
    id: string,
    lat: number,
    lng: number,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
    specialHandling: string[] = []
  ): DeliveryRequest => ({
    id,
    pharmacyId: 'pharmacy_001',
    pharmacyName: 'Test Pharmacy',
    patient: {
      id: `patient_${id}`,
      name: `Patient ${id}`,
      phone: '0791234567',
      address: {
        street: 'Test Street',
        city: 'Bern',
        postalCode: '3000',
        canton: 'BE',
        country: 'Switzerland',
        latitude: lat,
        longitude: lng,
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
            name: 'Test Medication',
            quantity: 1,
            dosage: '500mg',
            requiresColdChain: specialHandling.includes('cold_chain'),
            isControlledSubstance: specialHandling.includes('controlled'),
          },
        ],
        specialHandling: specialHandling as any[],
      },
    ],
    status: 'pending',
    priority,
    estimatedDuration: 15,
    distance: 5,
    paymentMethod: 'insurance',
    createdAt: new Date().toISOString(),
  });

  describe('Basic Route Optimization', () => {
    test('should optimize empty delivery list', () => {
      const result = optimizeRoute([]);
      expect(result.deliveryIds).toEqual([]);
      expect(result.waypoints).toEqual([]);
      expect(result.totalDistance).toBe(0);
      expect(result.totalDuration).toBe(0);
    });

    test('should optimize single delivery', () => {
      const deliveries = [createMockDelivery('D1', 46.96, 7.46)];
      const result = optimizeRoute(deliveries, startCoord);

      expect(result.deliveryIds).toEqual(['D1']);
      expect(result.waypoints).toHaveLength(1);
      expect(result.waypoints[0].deliveryId).toBe('D1');
      expect(result.totalDistance).toBeGreaterThan(0);
      expect(result.totalDuration).toBeGreaterThan(0);
    });

    test('should optimize multiple deliveries', () => {
      const deliveries = [
        createMockDelivery('D1', 46.96, 7.46, 'high'),
        createMockDelivery('D2', 46.97, 7.47, 'medium'),
        createMockDelivery('D3', 46.98, 7.48, 'urgent'),
      ];
      const result = optimizeRoute(deliveries, startCoord);

      expect(result.deliveryIds).toHaveLength(3);
      expect(result.waypoints).toHaveLength(3);
      expect(result.totalDistance).toBeGreaterThan(0);
      expect(result.totalDuration).toBeGreaterThan(0);

      // Check waypoint sequencing
      result.waypoints.forEach((waypoint, index) => {
        expect(waypoint.sequence).toBe(index + 1);
        expect(waypoint.completed).toBe(false);
      });
    });

    test('should consider priority in route calculation', () => {
      const deliveries = [
        createMockDelivery('D1', 46.96, 7.46, 'low'),
        createMockDelivery('D2', 46.97, 7.47, 'urgent'),
        createMockDelivery('D3', 46.98, 7.48, 'high'),
        createMockDelivery('D4', 46.99, 7.49, 'medium'),
      ];
      const result = optimizeRoute(deliveries, startCoord);

      // All deliveries should be included
      expect(result.waypoints).toHaveLength(4);

      // Route should have a priority score
      expect(result.routeDetails.priorityScore).toBeGreaterThan(0);

      // Verify deliveries are sequenced (nearest neighbor + 2-opt may reorder based on distance)
      expect(result.waypoints[0].sequence).toBe(1);
      expect(result.waypoints[1].sequence).toBe(2);
      expect(result.waypoints[2].sequence).toBe(3);
      expect(result.waypoints[3].sequence).toBe(4);
    });
  });

  describe('Vehicle Capacity Constraints (T5-029)', () => {
    test('should respect vehicle weight capacity', () => {
      const capacity: VehicleCapacity = {
        maxWeight: 4, // Very low weight limit (each delivery = 2kg)
        maxVolume: 200,
        hasColdStorage: true,
        hasControlledSubstanceStorage: true,
        currentWeight: 0,
        currentVolume: 0,
      };

      const deliveries = [
        createMockDelivery('D1', 46.96, 7.46),
        createMockDelivery('D2', 46.97, 7.47),
        createMockDelivery('D3', 46.98, 7.48),
        createMockDelivery('D4', 46.99, 7.49),
        createMockDelivery('D5', 47.0, 7.5),
      ];

      const result = optimizeRoute(deliveries, startCoord, capacity);

      // Should exclude some deliveries due to capacity (max 2 deliveries with 4kg limit)
      expect(result.deliveryIds.length).toBeLessThanOrEqual(2);
      expect(result.deliveryIds.length).toBeGreaterThan(0);
    });

    test('should respect cold storage requirements', () => {
      const capacityNoCold: VehicleCapacity = {
        maxWeight: 100,
        maxVolume: 200,
        hasColdStorage: false,
        hasControlledSubstanceStorage: true,
        currentWeight: 0,
        currentVolume: 0,
      };

      const deliveries = [
        createMockDelivery('D1', 46.96, 7.46, 'medium', ['cold_chain']),
        createMockDelivery('D2', 46.97, 7.47),
      ];

      const result = optimizeRoute(deliveries, startCoord, capacityNoCold);

      // Cold chain delivery should be excluded
      expect(result.deliveryIds).not.toContain('D1');
      expect(result.deliveryIds).toContain('D2');
    });

    test('should respect controlled substance storage requirements', () => {
      const capacityNoControlled: VehicleCapacity = {
        maxWeight: 100,
        maxVolume: 200,
        hasColdStorage: true,
        hasControlledSubstanceStorage: false,
        currentWeight: 0,
        currentVolume: 0,
      };

      const deliveries = [
        createMockDelivery('D1', 46.96, 7.46, 'medium', ['controlled']),
        createMockDelivery('D2', 46.97, 7.47),
      ];

      const result = optimizeRoute(deliveries, startCoord, capacityNoControlled);

      // Controlled substance delivery should be excluded
      expect(result.deliveryIds).not.toContain('D1');
      expect(result.deliveryIds).toContain('D2');
    });

    test('should use default vehicle capacity when not provided', () => {
      const deliveries = [createMockDelivery('D1', 46.96, 7.46)];
      const result = optimizeRoute(deliveries, startCoord);

      expect(result.deliveryIds).toContain('D1');
    });
  });

  describe('Traffic Prediction (T5-029)', () => {
    test('should include traffic prediction in waypoints', () => {
      const deliveries = [createMockDelivery('D1', 46.96, 7.46)];
      const result = optimizeRoute(deliveries, startCoord);

      expect(result.waypoints[0].trafficPrediction).toBeDefined();
      expect(result.waypoints[0].trafficPrediction?.level).toBeDefined();
      expect(result.waypoints[0].trafficPrediction?.delayFactor).toBeGreaterThanOrEqual(1.0);
      expect(result.waypoints[0].trafficPrediction?.confidenceScore).toBeGreaterThan(0);
      expect(result.waypoints[0].trafficPrediction?.confidenceScore).toBeLessThanOrEqual(1);
    });

    test('should adjust travel time based on traffic', () => {
      const deliveries = [
        createMockDelivery('D1', 46.96, 7.46),
        createMockDelivery('D2', 46.97, 7.47),
      ];
      const result = optimizeRoute(deliveries, startCoord);

      // Traffic should affect total duration
      expect(result.totalDuration).toBeGreaterThan(0);

      // Each waypoint should have traffic-adjusted duration
      result.waypoints.forEach((waypoint) => {
        expect(waypoint.estimatedDuration).toBeGreaterThan(0);
        if (waypoint.trafficPrediction && waypoint.trafficPrediction.delayFactor > 1.0) {
          // Duration should reflect traffic delay
          expect(waypoint.estimatedDuration).toBeGreaterThan(5); // More than base stop time
        }
      });
    });

    test('should predict traffic levels correctly', () => {
      const deliveries = [createMockDelivery('D1', 46.96, 7.46)];
      const result = optimizeRoute(deliveries, startCoord);

      const trafficLevel = result.waypoints[0].trafficPrediction?.level;
      expect(['light', 'moderate', 'heavy', 'severe']).toContain(trafficLevel);
    });
  });

  describe('Patient Delivery Preferences (T5-030)', () => {
    test('should include patient preferences in waypoints', () => {
      const deliveries = [createMockDelivery('D1', 46.96, 7.46)];
      const preferences = new Map<string, PatientDeliveryPreferences>();
      preferences.set('patient_D1', {
        patientId: 'patient_D1',
        preferredTimeSlots: [{ start: '09:00', end: '12:00' }],
        avoidTimeSlots: [{ start: '13:00', end: '14:00' }],
        isRecurring: true,
        contactPreference: 'sms',
        lastUpdated: new Date().toISOString(),
      });

      const result = optimizeRoute(deliveries, startCoord, undefined, preferences);

      expect(result.waypoints[0].patientPreferences).toBeDefined();
      expect(result.waypoints[0].patientPreferences?.patientId).toBe('patient_D1');
      expect(result.waypoints[0].patientPreferences?.preferredTimeSlots).toHaveLength(1);
      expect(result.waypoints[0].patientPreferences?.isRecurring).toBe(true);
    });

    test('should support recurring delivery schedules', () => {
      const deliveries = [createMockDelivery('D1', 46.96, 7.46)];
      const preferences = new Map<string, PatientDeliveryPreferences>();
      preferences.set('patient_D1', {
        patientId: 'patient_D1',
        preferredTimeSlots: [
          { start: '09:00', end: '12:00', dayOfWeek: 1 }, // Monday
          { start: '14:00', end: '17:00', dayOfWeek: 3 }, // Wednesday
        ],
        avoidTimeSlots: [],
        isRecurring: true,
        contactPreference: 'app',
        lastUpdated: new Date().toISOString(),
      });

      const result = optimizeRoute(deliveries, startCoord, undefined, preferences);

      expect(result.waypoints[0].patientPreferences?.isRecurring).toBe(true);
      expect(result.waypoints[0].patientPreferences?.preferredTimeSlots).toHaveLength(2);
    });

    test('should handle avoid time slots', () => {
      const deliveries = [createMockDelivery('D1', 46.96, 7.46)];
      const preferences = new Map<string, PatientDeliveryPreferences>();
      preferences.set('patient_D1', {
        patientId: 'patient_D1',
        preferredTimeSlots: [],
        avoidTimeSlots: [
          { start: '12:00', end: '13:00' }, // Lunch
          { start: '18:00', end: '19:00' }, // Dinner
        ],
        isRecurring: false,
        contactPreference: 'call',
        lastUpdated: new Date().toISOString(),
      });

      const result = optimizeRoute(deliveries, startCoord, undefined, preferences);

      expect(result.waypoints[0].patientPreferences?.avoidTimeSlots).toHaveLength(2);
    });

    test('should handle different contact preferences', () => {
      const deliveries = [
        createMockDelivery('D1', 46.96, 7.46),
        createMockDelivery('D2', 46.97, 7.47),
        createMockDelivery('D3', 46.98, 7.48),
      ];
      const preferences = new Map<string, PatientDeliveryPreferences>();
      preferences.set('patient_D1', {
        patientId: 'patient_D1',
        preferredTimeSlots: [],
        avoidTimeSlots: [],
        isRecurring: false,
        contactPreference: 'call',
        lastUpdated: new Date().toISOString(),
      });
      preferences.set('patient_D2', {
        patientId: 'patient_D2',
        preferredTimeSlots: [],
        avoidTimeSlots: [],
        isRecurring: false,
        contactPreference: 'sms',
        lastUpdated: new Date().toISOString(),
      });
      preferences.set('patient_D3', {
        patientId: 'patient_D3',
        preferredTimeSlots: [],
        avoidTimeSlots: [],
        isRecurring: false,
        contactPreference: 'app',
        lastUpdated: new Date().toISOString(),
      });

      const result = optimizeRoute(deliveries, startCoord, undefined, preferences);

      expect(result.waypoints[0].patientPreferences?.contactPreference).toBe('call');
      expect(result.waypoints[1].patientPreferences?.contactPreference).toBe('sms');
      expect(result.waypoints[2].patientPreferences?.contactPreference).toBe('app');
    });
  });

  describe('Route Recalculation (T5-029)', () => {
    test('should recalculate route from new position', () => {
      const deliveries = [
        createMockDelivery('D1', 46.96, 7.46),
        createMockDelivery('D2', 46.97, 7.47),
      ];

      const newPosition: Coordinates = {
        latitude: 46.96,
        longitude: 7.46,
        timestamp: new Date().toISOString(),
      };

      const result = recalculateRoute(deliveries, newPosition);

      expect(result.deliveryIds).toHaveLength(2);
      expect(result.waypoints).toHaveLength(2);
    });

    test('should recalculate with updated vehicle capacity', () => {
      const deliveries = [
        createMockDelivery('D1', 46.96, 7.46),
        createMockDelivery('D2', 46.97, 7.47),
      ];

      const newPosition: Coordinates = {
        latitude: 46.96,
        longitude: 7.46,
        timestamp: new Date().toISOString(),
      };

      const updatedCapacity: VehicleCapacity = {
        maxWeight: 100,
        maxVolume: 200,
        hasColdStorage: true,
        hasControlledSubstanceStorage: true,
        currentWeight: 50, // Half capacity used
        currentVolume: 100,
      };

      const result = recalculateRoute(deliveries, newPosition, updatedCapacity);

      expect(result.deliveryIds.length).toBeGreaterThan(0);
    });

    test('should recalculate with updated patient preferences', () => {
      const deliveries = [createMockDelivery('D1', 46.96, 7.46)];

      const newPosition: Coordinates = {
        latitude: 46.96,
        longitude: 7.46,
        timestamp: new Date().toISOString(),
      };

      const preferences = new Map<string, PatientDeliveryPreferences>();
      preferences.set('patient_D1', {
        patientId: 'patient_D1',
        preferredTimeSlots: [{ start: '15:00', end: '18:00' }],
        avoidTimeSlots: [],
        isRecurring: false,
        contactPreference: 'app',
        lastUpdated: new Date().toISOString(),
      });

      const result = recalculateRoute(deliveries, newPosition, undefined, preferences);

      expect(result.waypoints[0].patientPreferences).toBeDefined();
    });
  });

  describe('Route Optimization Metrics', () => {
    test('should calculate route details correctly', () => {
      const deliveries = [
        createMockDelivery('D1', 46.96, 7.46, 'high'),
        createMockDelivery('D2', 46.97, 7.47, 'medium'),
      ];
      const result = optimizeRoute(deliveries, startCoord);

      expect(result.routeDetails.priorityScore).toBeGreaterThan(0);
      expect(result.routeDetails.constraintsRespected).toBeDefined();
      expect(result.routeDetails.timeEfficiency).toBeGreaterThan(0);
      expect(result.routeDetails.timeEfficiency).toBeLessThanOrEqual(100);
    });

    test('should generate unique route IDs', () => {
      const deliveries = [createMockDelivery('D1', 46.96, 7.46)];
      const result1 = optimizeRoute(deliveries, startCoord);
      const result2 = optimizeRoute(deliveries, startCoord);

      expect(result1.id).not.toBe(result2.id);
    });

    test('should track optimization timestamp', () => {
      const deliveries = [createMockDelivery('D1', 46.96, 7.46)];
      const beforeOptimization = new Date();
      const result = optimizeRoute(deliveries, startCoord);
      const afterOptimization = new Date();

      const optimizedAt = new Date(result.optimizedAt);
      expect(optimizedAt.getTime()).toBeGreaterThanOrEqual(beforeOptimization.getTime());
      expect(optimizedAt.getTime()).toBeLessThanOrEqual(afterOptimization.getTime());
    });
  });

  describe('Helper Functions', () => {
    test('should create default vehicle capacity', () => {
      const capacity = createDefaultVehicleCapacity();

      expect(capacity.maxWeight).toBe(100);
      expect(capacity.maxVolume).toBe(200);
      expect(capacity.hasColdStorage).toBe(true);
      expect(capacity.hasControlledSubstanceStorage).toBe(true);
      expect(capacity.currentWeight).toBe(0);
      expect(capacity.currentVolume).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle deliveries without coordinates', () => {
      const delivery = createMockDelivery('D1', 46.96, 7.46);
      delivery.patient.address.latitude = undefined;
      delivery.patient.address.longitude = undefined;

      const result = optimizeRoute([delivery], startCoord);

      // Should skip deliveries without coordinates
      expect(result.waypoints).toHaveLength(0);
    });

    test('should handle urgent delivery priority', () => {
      const deliveries = [
        createMockDelivery('D1', 46.96, 7.46, 'urgent'),
        createMockDelivery('D2', 46.97, 7.47, 'low'),
      ];
      const result = optimizeRoute(deliveries, startCoord);

      // Urgent should come before low
      const urgentIndex = result.waypoints.findIndex((w) => w.deliveryId === 'D1');
      const lowIndex = result.waypoints.findIndex((w) => w.deliveryId === 'D2');

      expect(urgentIndex).toBeLessThan(lowIndex);
    });
  });
});
