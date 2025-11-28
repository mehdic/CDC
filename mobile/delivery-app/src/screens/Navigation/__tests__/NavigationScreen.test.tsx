/**
 * Navigation Screen Unit Tests
 * Tests for turn-by-turn navigation UI and interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationScreen } from '../NavigationScreen';
import { useAppDispatch, useAppSelector } from '../../../hooks/useRedux';
import { useGeolocation } from '../../../hooks/useGeolocation';

/**
 * Mock dependencies
 */
jest.mock('../../../hooks/useRedux');
jest.mock('../../../hooks/useGeolocation');
jest.mock('react-native-maps', () => ({
  __esModule: true,
  default: jest.fn(),
  Marker: jest.fn(),
  Polyline: jest.fn(),
  PROVIDER_GOOGLE: 'google',
}));

/**
 * Mock data
 */
const mockCoordinates = {
  latitude: 46.95,
  longitude: 7.45,
  timestamp: new Date().toISOString(),
};

const mockWaypoint = {
  deliveryId: 'del_001',
  coordinates: mockCoordinates,
  sequence: 1,
  estimatedArrival: new Date(Date.now() + 1800000).toISOString(),
  estimatedDuration: 30,
  completed: false,
  constraints: {
    coldChain: false,
    controlledSubstance: false,
    idVerificationRequired: false,
  },
};

const mockRoute = {
  id: 'route_001',
  deliveryIds: ['del_001', 'del_002'],
  waypoints: [mockWaypoint],
  totalDistance: 5.5,
  totalDuration: 30,
  optimizedAt: new Date().toISOString(),
  currentWaypointIndex: 0,
  routeDetails: {
    priorityScore: 75,
    constraintsRespected: true,
    timeEfficiency: 85,
  },
};

const mockDelivery = {
  id: 'del_001',
  pharmacyId: 'pharmacy_001',
  pharmacyName: 'Test Pharmacy',
  patient: {
    id: 'patient_001',
    name: 'John Doe',
    phone: '0791234567',
    address: {
      street: 'Test Street 1',
      city: 'Bern',
      postalCode: '3011',
      canton: 'BE',
      country: 'Switzerland',
      latitude: 46.95,
      longitude: 7.45,
    },
  },
  packages: [],
  status: 'in_transit',
  priority: 'high',
  estimatedDuration: 30,
  distance: 5.5,
  paymentMethod: 'insurance',
  createdAt: new Date().toISOString(),
};

describe('NavigationScreen', () => {
  let mockDispatch: jest.Mock;
  let mockUseAppDispatch: jest.Mock;
  let mockUseAppSelector: jest.Mock;
  let mockUseGeolocation: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDispatch = jest.fn();
    mockUseAppDispatch = useAppDispatch as jest.Mock;
    mockUseAppDispatch.mockReturnValue(mockDispatch);

    mockUseAppSelector = useAppSelector as jest.Mock;
    mockUseGeolocation = useGeolocation as jest.Mock;
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      mockUseAppSelector.mockImplementation((selector) => {
        return selector({
          delivery: {
            activeDelivery: mockDelivery,
            route: mockRoute,
            isTracking: true,
          },
        });
      });

      mockUseGeolocation.mockReturnValue({
        currentLocation: mockCoordinates,
        hasPermission: true,
        error: null,
      });

      const mockNavigation = {
        navigate: jest.fn(),
      };

      render(
        <NavigationScreen navigation={mockNavigation} route={{ params: {} }} />
      );

      expect(screen.getByText(/Next Stop/i)).toBeTruthy();
    });

    it('should show permission error when location permission is denied', () => {
      mockUseAppSelector.mockImplementation((selector) => {
        return selector({
          delivery: {
            activeDelivery: mockDelivery,
            route: mockRoute,
            isTracking: true,
          },
        });
      });

      mockUseGeolocation.mockReturnValue({
        currentLocation: null,
        hasPermission: false,
        error: 'Permission denied',
      });

      const mockNavigation = {
        navigate: jest.fn(),
      };

      render(
        <NavigationScreen navigation={mockNavigation} route={{ params: {} }} />
      );

      expect(
        screen.getByText(/Location permission required/i)
      ).toBeTruthy();
    });

    it('should show loading state when waiting for GPS', () => {
      mockUseAppSelector.mockImplementation((selector) => {
        return selector({
          delivery: {
            activeDelivery: mockDelivery,
            route: mockRoute,
            isTracking: true,
          },
        });
      });

      mockUseGeolocation.mockReturnValue({
        currentLocation: null,
        hasPermission: true,
        error: null,
      });

      const mockNavigation = {
        navigate: jest.fn(),
      };

      render(
        <NavigationScreen navigation={mockNavigation} route={{ params: {} }} />
      );

      expect(
        screen.getByText(/Waiting for GPS location/i)
      ).toBeTruthy();
    });

    it('should show error when no active delivery', () => {
      mockUseAppSelector.mockImplementation((selector) => {
        return selector({
          delivery: {
            activeDelivery: null,
            route: null,
            isTracking: false,
          },
        });
      });

      mockUseGeolocation.mockReturnValue({
        currentLocation: mockCoordinates,
        hasPermission: true,
        error: null,
      });

      const mockNavigation = {
        navigate: jest.fn(),
      };

      render(
        <NavigationScreen navigation={mockNavigation} route={{ params: {} }} />
      );

      expect(screen.getByText(/No active delivery/i)).toBeTruthy();
    });
  });

  describe('Navigation Information Display', () => {
    beforeEach(() => {
      mockUseAppSelector.mockImplementation((selector) => {
        return selector({
          delivery: {
            activeDelivery: mockDelivery,
            route: mockRoute,
            isTracking: true,
          },
        });
      });

      mockUseGeolocation.mockReturnValue({
        currentLocation: mockCoordinates,
        hasPermission: true,
        error: null,
      });
    });

    it('should display next waypoint sequence number', () => {
      const mockNavigation = {
        navigate: jest.fn(),
      };

      render(
        <NavigationScreen navigation={mockNavigation} route={{ params: {} }} />
      );

      expect(screen.getByText(/Stop 1/i)).toBeTruthy();
    });

    it('should display distance to next waypoint', () => {
      const mockNavigation = {
        navigate: jest.fn(),
      };

      render(
        <NavigationScreen navigation={mockNavigation} route={{ params: {} }} />
      );

      // Should show distance in km
      expect(screen.getByText(/km/i)).toBeTruthy();
    });

    it('should display estimated time to arrival', () => {
      const mockNavigation = {
        navigate: jest.fn(),
      };

      render(
        <NavigationScreen navigation={mockNavigation} route={{ params: {} }} />
      );

      // Should show time in minutes
      expect(screen.getByText(/Est. Time/i)).toBeTruthy();
      expect(screen.getByText(/min/i)).toBeTruthy();
    });

    it('should display route progress percentage', () => {
      const mockNavigation = {
        navigate: jest.fn(),
      };

      render(
        <NavigationScreen navigation={mockNavigation} route={{ params: {} }} />
      );

      expect(screen.getByText(/Route Progress/i)).toBeTruthy();
    });

    it('should display special handling constraints', () => {
      const mockRouteWithConstraints = {
        ...mockRoute,
        waypoints: [
          {
            ...mockWaypoint,
            constraints: {
              coldChain: true,
              controlledSubstance: true,
              idVerificationRequired: true,
            },
          },
        ],
      };

      mockUseAppSelector.mockImplementation((selector) => {
        return selector({
          delivery: {
            activeDelivery: mockDelivery,
            route: mockRouteWithConstraints,
            isTracking: true,
          },
        });
      });

      const mockNavigation = {
        navigate: jest.fn(),
      };

      render(
        <NavigationScreen navigation={mockNavigation} route={{ params: {} }} />
      );

      expect(screen.getByText(/Special Handling/i)).toBeTruthy();
      expect(screen.getByText(/Cold Chain/i)).toBeTruthy();
      expect(screen.getByText(/Controlled Substance/i)).toBeTruthy();
      expect(screen.getByText(/ID Verification/i)).toBeTruthy();
    });
  });

  describe('Button Interactions', () => {
    beforeEach(() => {
      mockUseAppSelector.mockImplementation((selector) => {
        return selector({
          delivery: {
            activeDelivery: mockDelivery,
            route: mockRoute,
            isTracking: true,
          },
        });
      });

      mockUseGeolocation.mockReturnValue({
        currentLocation: mockCoordinates,
        hasPermission: true,
        error: null,
      });
    });

    it('should have recalculate route button', () => {
      const mockNavigation = {
        navigate: jest.fn(),
      };

      render(
        <NavigationScreen navigation={mockNavigation} route={{ params: {} }} />
      );

      expect(screen.getByText(/Recalculate Route/i)).toBeTruthy();
    });

    it('should have arrived button', () => {
      const mockNavigation = {
        navigate: jest.fn(),
      };

      render(
        <NavigationScreen navigation={mockNavigation} route={{ params: {} }} />
      );

      expect(screen.getByText(/I've Arrived/i)).toBeTruthy();
    });
  });

  describe('Route Optimization Integration', () => {
    it('should dispatch optimizeRoute when no route is present', () => {
      mockUseAppSelector.mockImplementation((selector) => {
        return selector({
          delivery: {
            activeDelivery: mockDelivery,
            route: null,
            isTracking: true,
          },
        });
      });

      mockUseGeolocation.mockReturnValue({
        currentLocation: mockCoordinates,
        hasPermission: true,
        error: null,
      });

      const mockNavigation = {
        navigate: jest.fn(),
      };

      render(
        <NavigationScreen navigation={mockNavigation} route={{ params: {} }} />
      );

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('optimizeRoute'),
        })
      );
    });

    it('should dispatch startTracking on mount', () => {
      mockUseAppSelector.mockImplementation((selector) => {
        return selector({
          delivery: {
            activeDelivery: mockDelivery,
            route: mockRoute,
            isTracking: false,
          },
        });
      });

      mockUseGeolocation.mockReturnValue({
        currentLocation: mockCoordinates,
        hasPermission: true,
        error: null,
      });

      const mockNavigation = {
        navigate: jest.fn(),
      };

      render(
        <NavigationScreen navigation={mockNavigation} route={{ params: {} }} />
      );

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('startTracking'),
        })
      );
    });
  });

  describe('Location Updates', () => {
    beforeEach(() => {
      mockUseAppSelector.mockImplementation((selector) => {
        return selector({
          delivery: {
            activeDelivery: mockDelivery,
            route: mockRoute,
            isTracking: true,
          },
        });
      });

      mockUseGeolocation.mockReturnValue({
        currentLocation: mockCoordinates,
        hasPermission: true,
        error: null,
      });
    });

    it('should periodically update location when tracking', async () => {
      const mockNavigation = {
        navigate: jest.fn(),
      };

      jest.useFakeTimers();

      render(
        <NavigationScreen navigation={mockNavigation} route={{ params: {} }} />
      );

      // Fast-forward 30 seconds to trigger location update
      jest.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            type: expect.stringContaining('updateLocation'),
          })
        );
      });

      jest.useRealTimers();
    });
  });

  describe('Type Safety', () => {
    it('should handle waypoint without time window', () => {
      const mockRouteNoTimeWindow = {
        ...mockRoute,
        waypoints: [
          {
            ...mockWaypoint,
            constraints: {
              ...mockWaypoint.constraints,
              timeWindow: undefined,
            },
          },
        ],
      };

      mockUseAppSelector.mockImplementation((selector) => {
        return selector({
          delivery: {
            activeDelivery: mockDelivery,
            route: mockRouteNoTimeWindow,
            isTracking: true,
          },
        });
      });

      mockUseGeolocation.mockReturnValue({
        currentLocation: mockCoordinates,
        hasPermission: true,
        error: null,
      });

      const mockNavigation = {
        navigate: jest.fn(),
      };

      // Should not throw
      expect(() => {
        render(
          <NavigationScreen
            navigation={mockNavigation}
            route={{ params: {} }}
          />
        );
      }).not.toThrow();
    });
  });
});
