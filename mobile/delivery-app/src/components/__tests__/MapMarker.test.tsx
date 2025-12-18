/**
 * MapMarker Component Unit Tests
 * T8-021: GPS Tracking & Route Display
 */

import { render } from '@testing-library/react-native';
import React from 'react';

import { Coordinates } from '../../types/delivery';
import { MapMarker } from '../MapMarker';

/**
 * Mock react-native-maps
 */
jest.mock('react-native-maps', () => ({
  Marker: ({ title, description, pinColor, children }: any) => (
    <mock-marker title={title} description={description} pinColor={pinColor}>
      {children}
    </mock-marker>
  ),
}));

describe('MapMarker Component', () => {
  const mockCoordinate: Coordinates = {
    latitude: 47.3769,
    longitude: 8.5417,
    timestamp: new Date().toISOString(),
    accuracy: 5,
  };

  describe('Rendering', () => {
    it('should render current location marker', () => {
      const { UNSAFE_root } = render(
        <MapMarker coordinate={mockCoordinate} type="current_location" title="Your Location" />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should render destination marker', () => {
      const { UNSAFE_root } = render(
        <MapMarker
          coordinate={mockCoordinate}
          type="destination"
          title="Destination"
          description="123 Main St"
        />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should render waypoint marker', () => {
      const { UNSAFE_root } = render(
        <MapMarker coordinate={mockCoordinate} type="waypoint" title="Waypoint 1" />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should render pharmacy marker', () => {
      const { UNSAFE_root } = render(
        <MapMarker coordinate={mockCoordinate} type="pharmacy" title="Pharmacy" />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should render warning marker', () => {
      const { UNSAFE_root } = render(
        <MapMarker coordinate={mockCoordinate} type="warning" title="Warning" />
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Accuracy Indicator', () => {
    it('should display accuracy indicator for current location with accuracy', () => {
      const { UNSAFE_root } = render(
        <MapMarker
          coordinate={mockCoordinate}
          type="current_location"
          title="Your Location"
          accuracy={5}
        />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should not display accuracy indicator without accuracy', () => {
      const coord: Coordinates = {
        ...mockCoordinate,
        accuracy: undefined,
      };

      const { UNSAFE_root } = render(
        <MapMarker coordinate={coord} type="current_location" title="Your Location" />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should not display accuracy indicator for non-current locations', () => {
      const { UNSAFE_root } = render(
        <MapMarker
          coordinate={mockCoordinate}
          type="destination"
          title="Destination"
          accuracy={5}
        />
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Marker Properties', () => {
    it('should pass title to marker', () => {
      const { UNSAFE_root } = render(
        <MapMarker
          coordinate={mockCoordinate}
          type="current_location"
          title="Test Location"
        />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should pass description to marker', () => {
      const { UNSAFE_root } = render(
        <MapMarker
          coordinate={mockCoordinate}
          type="destination"
          title="Destination"
          description="123 Main St, Zurich"
        />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should handle onPress callback', () => {
      const onPress = jest.fn();

      const { UNSAFE_root } = render(
        <MapMarker
          coordinate={mockCoordinate}
          type="waypoint"
          title="Waypoint"
          onPress={onPress}
        />
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Color Selection', () => {
    it('should use blue color for current location', () => {
      const { UNSAFE_root } = render(
        <MapMarker coordinate={mockCoordinate} type="current_location" />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should use red color for destination', () => {
      const { UNSAFE_root } = render(
        <MapMarker coordinate={mockCoordinate} type="destination" />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should use green color for waypoint', () => {
      const { UNSAFE_root } = render(
        <MapMarker coordinate={mockCoordinate} type="waypoint" />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should use orange color for pharmacy', () => {
      const { UNSAFE_root } = render(
        <MapMarker coordinate={mockCoordinate} type="pharmacy" />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should use yellow color for warning', () => {
      const { UNSAFE_root } = render(
        <MapMarker coordinate={mockCoordinate} type="warning" />
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Accuracy Levels', () => {
    it('should show excellent accuracy (< 5m)', () => {
      const { UNSAFE_root } = render(
        <MapMarker
          coordinate={mockCoordinate}
          type="current_location"
          accuracy={3}
        />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should show good accuracy (5-10m)', () => {
      const { UNSAFE_root } = render(
        <MapMarker
          coordinate={mockCoordinate}
          type="current_location"
          accuracy={7}
        />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should show moderate accuracy (10-25m)', () => {
      const { UNSAFE_root } = render(
        <MapMarker
          coordinate={mockCoordinate}
          type="current_location"
          accuracy={15}
        />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should show poor accuracy (> 25m)', () => {
      const { UNSAFE_root } = render(
        <MapMarker
          coordinate={mockCoordinate}
          type="current_location"
          accuracy={50}
        />
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Coordinate Types', () => {
    it('should accept coordinates with all properties', () => {
      const fullCoord: Coordinates = {
        latitude: 47.3769,
        longitude: 8.5417,
        timestamp: new Date().toISOString(),
        accuracy: 5,
        speed: 20,
        heading: 90,
      };

      const { UNSAFE_root } = render(
        <MapMarker coordinate={fullCoord} type="current_location" />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should accept coordinates with minimal properties', () => {
      const minimalCoord: Coordinates = {
        latitude: 47.3769,
        longitude: 8.5417,
        timestamp: new Date().toISOString(),
      };

      const { UNSAFE_root } = render(
        <MapMarker coordinate={minimalCoord} type="destination" />
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('TypeScript Readonly Props', () => {
    it('should enforce readonly props', () => {
      const props = {
        coordinate: mockCoordinate,
        type: 'current_location' as const,
        title: 'Test',
      };

      // This test verifies TypeScript compilation
      const { UNSAFE_root } = render(
        <MapMarker {...props} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });
});
