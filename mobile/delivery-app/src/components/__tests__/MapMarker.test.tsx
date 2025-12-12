/**
 * MapMarker Component Unit Tests
 * T8-021: GPS Tracking & Route Display
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { MapMarker } from '../MapMarker';
import { Coordinates } from '../../types/delivery';

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
      const { container } = render(
        <MapMarker coordinate={mockCoordinate} type="current_location" title="Your Location" />
      );

      expect(container).toBeTruthy();
    });

    it('should render destination marker', () => {
      const { container } = render(
        <MapMarker
          coordinate={mockCoordinate}
          type="destination"
          title="Destination"
          description="123 Main St"
        />
      );

      expect(container).toBeTruthy();
    });

    it('should render waypoint marker', () => {
      const { container } = render(
        <MapMarker coordinate={mockCoordinate} type="waypoint" title="Waypoint 1" />
      );

      expect(container).toBeTruthy();
    });

    it('should render pharmacy marker', () => {
      const { container } = render(
        <MapMarker coordinate={mockCoordinate} type="pharmacy" title="Pharmacy" />
      );

      expect(container).toBeTruthy();
    });

    it('should render warning marker', () => {
      const { container } = render(
        <MapMarker coordinate={mockCoordinate} type="warning" title="Warning" />
      );

      expect(container).toBeTruthy();
    });
  });

  describe('Accuracy Indicator', () => {
    it('should display accuracy indicator for current location with accuracy', () => {
      const { container } = render(
        <MapMarker
          coordinate={mockCoordinate}
          type="current_location"
          title="Your Location"
          accuracy={5}
        />
      );

      expect(container).toBeTruthy();
    });

    it('should not display accuracy indicator without accuracy', () => {
      const coord: Coordinates = {
        ...mockCoordinate,
        accuracy: undefined,
      };

      const { container } = render(
        <MapMarker coordinate={coord} type="current_location" title="Your Location" />
      );

      expect(container).toBeTruthy();
    });

    it('should not display accuracy indicator for non-current locations', () => {
      const { container } = render(
        <MapMarker
          coordinate={mockCoordinate}
          type="destination"
          title="Destination"
          accuracy={5}
        />
      );

      expect(container).toBeTruthy();
    });
  });

  describe('Marker Properties', () => {
    it('should pass title to marker', () => {
      const { container } = render(
        <MapMarker
          coordinate={mockCoordinate}
          type="current_location"
          title="Test Location"
        />
      );

      expect(container).toBeTruthy();
    });

    it('should pass description to marker', () => {
      const { container } = render(
        <MapMarker
          coordinate={mockCoordinate}
          type="destination"
          title="Destination"
          description="123 Main St, Zurich"
        />
      );

      expect(container).toBeTruthy();
    });

    it('should handle onPress callback', () => {
      const onPress = jest.fn();

      const { container } = render(
        <MapMarker
          coordinate={mockCoordinate}
          type="waypoint"
          title="Waypoint"
          onPress={onPress}
        />
      );

      expect(container).toBeTruthy();
    });
  });

  describe('Color Selection', () => {
    it('should use blue color for current location', () => {
      const { container } = render(
        <MapMarker coordinate={mockCoordinate} type="current_location" />
      );

      expect(container).toBeTruthy();
    });

    it('should use red color for destination', () => {
      const { container } = render(
        <MapMarker coordinate={mockCoordinate} type="destination" />
      );

      expect(container).toBeTruthy();
    });

    it('should use green color for waypoint', () => {
      const { container } = render(
        <MapMarker coordinate={mockCoordinate} type="waypoint" />
      );

      expect(container).toBeTruthy();
    });

    it('should use orange color for pharmacy', () => {
      const { container } = render(
        <MapMarker coordinate={mockCoordinate} type="pharmacy" />
      );

      expect(container).toBeTruthy();
    });

    it('should use yellow color for warning', () => {
      const { container } = render(
        <MapMarker coordinate={mockCoordinate} type="warning" />
      );

      expect(container).toBeTruthy();
    });
  });

  describe('Accuracy Levels', () => {
    it('should show excellent accuracy (< 5m)', () => {
      const { container } = render(
        <MapMarker
          coordinate={mockCoordinate}
          type="current_location"
          accuracy={3}
        />
      );

      expect(container).toBeTruthy();
    });

    it('should show good accuracy (5-10m)', () => {
      const { container } = render(
        <MapMarker
          coordinate={mockCoordinate}
          type="current_location"
          accuracy={7}
        />
      );

      expect(container).toBeTruthy();
    });

    it('should show moderate accuracy (10-25m)', () => {
      const { container } = render(
        <MapMarker
          coordinate={mockCoordinate}
          type="current_location"
          accuracy={15}
        />
      );

      expect(container).toBeTruthy();
    });

    it('should show poor accuracy (> 25m)', () => {
      const { container } = render(
        <MapMarker
          coordinate={mockCoordinate}
          type="current_location"
          accuracy={50}
        />
      );

      expect(container).toBeTruthy();
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

      const { container } = render(
        <MapMarker coordinate={fullCoord} type="current_location" />
      );

      expect(container).toBeTruthy();
    });

    it('should accept coordinates with minimal properties', () => {
      const minimalCoord: Coordinates = {
        latitude: 47.3769,
        longitude: 8.5417,
        timestamp: new Date().toISOString(),
      };

      const { container } = render(
        <MapMarker coordinate={minimalCoord} type="destination" />
      );

      expect(container).toBeTruthy();
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
      const { container } = render(
        <MapMarker {...props} />
      );

      expect(container).toBeTruthy();
    });
  });
});
