/**
 * AddressCard Component Unit Tests
 * Comprehensive tests for address display card component
 */

import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';

import { Address } from '../../types/delivery';
import { AddressCard } from '../AddressCard';

describe('AddressCard Component', () => {
  // Mock address data
  const mockAddress: Address = {
    street: '123 Main Street',
    city: 'Zurich',
    postalCode: '8001',
    canton: 'ZH',
    country: 'Switzerland',
  };

  const mockOnMapPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render address card', () => {
      const { getByTestId } = render(<AddressCard address={mockAddress} />);

      expect(getByTestId('address-card')).toBeTruthy();
    });

    it('should render default title', () => {
      const { getByTestId } = render(<AddressCard address={mockAddress} />);

      const title = getByTestId('address-card-title');
      expect(title.props.children).toBe('Address');
    });

    it('should render custom title', () => {
      const { getByTestId } = render(<AddressCard address={mockAddress} title="Delivery Address" />);

      const title = getByTestId('address-card-title');
      expect(title.props.children).toBe('Delivery Address');
    });

    it('should render without title', () => {
      const { queryByTestId } = render(<AddressCard address={mockAddress} title="" />);

      expect(queryByTestId('address-card-title')).toBeNull();
    });

    it('should render all address lines', () => {
      const { getByTestId } = render(<AddressCard address={mockAddress} />);

      expect(getByTestId('address-card-line-0')).toBeTruthy();
      expect(getByTestId('address-card-line-1')).toBeTruthy();
      expect(getByTestId('address-card-line-2')).toBeTruthy();
      expect(getByTestId('address-card-line-3')).toBeTruthy();
    });

    it('should render street address', () => {
      const { getByTestId } = render(<AddressCard address={mockAddress} />);

      const line = getByTestId('address-card-line-0');
      expect(line.props.children).toBe('123 Main Street');
    });

    it('should render postal code and city', () => {
      const { getByTestId } = render(<AddressCard address={mockAddress} />);

      const line = getByTestId('address-card-line-1');
      expect(line.props.children).toBe('8001 Zurich');
    });

    it('should render canton', () => {
      const { getByTestId } = render(<AddressCard address={mockAddress} />);

      const line = getByTestId('address-card-line-2');
      expect(line.props.children).toBe('ZH');
    });

    it('should render country', () => {
      const { getByTestId } = render(<AddressCard address={mockAddress} />);

      const line = getByTestId('address-card-line-3');
      expect(line.props.children).toBe('Switzerland');
    });

    it('should render with custom testID', () => {
      const { getByTestId } = render(<AddressCard address={mockAddress} testID="custom-address" />);

      expect(getByTestId('custom-address')).toBeTruthy();
    });
  });

  describe('Address Formatting', () => {
    it('should handle missing street', () => {
      const { queryByTestId } = render(
        <AddressCard address={{ ...mockAddress, street: '' }} />
      );

      // Should still render, but with fewer lines
      expect(queryByTestId('address-card-line-0')).toBeTruthy();
    });

    it('should handle missing postal code', () => {
      const addressWithoutPostal = { ...mockAddress, postalCode: '' };
      const { getByTestId } = render(<AddressCard address={addressWithoutPostal} />);

      // Should render city without postal code
      const line = getByTestId('address-card-line-1');
      expect(line.props.children).toBe('Zurich');
    });

    it('should handle missing city', () => {
      const addressWithoutCity = { ...mockAddress, city: '' };
      const { getByTestId } = render(<AddressCard address={addressWithoutCity} />);

      expect(getByTestId('address-card-line-0')).toBeTruthy();
    });

    it('should handle missing canton', () => {
      const addressWithoutCanton = { ...mockAddress, canton: '' };
      const { queryByTestId } = render(<AddressCard address={addressWithoutCanton} />);

      expect(queryByTestId('address-card')).toBeTruthy();
    });

    it('should handle missing country', () => {
      const addressWithoutCountry = { ...mockAddress, country: '' };
      const { queryByTestId } = render(<AddressCard address={addressWithoutCountry} />);

      expect(queryByTestId('address-card')).toBeTruthy();
    });

    it('should handle minimal address', () => {
      const minimalAddress: Address = {
        street: '',
        city: 'Zurich',
        postalCode: '',
        canton: '',
        country: '',
      };

      const { getByTestId } = render(<AddressCard address={minimalAddress} />);

      expect(getByTestId('address-card')).toBeTruthy();
    });
  });

  describe('Instructions', () => {
    it('should render instructions when present', () => {
      const addressWithInstructions = {
        ...mockAddress,
        instructions: 'Ring doorbell twice',
      };

      const { getByTestId } = render(<AddressCard address={addressWithInstructions} />);

      expect(getByTestId('address-card-instructions-label')).toBeTruthy();
      expect(getByTestId('address-card-instructions-text')).toBeTruthy();
    });

    it('should not render instructions when absent', () => {
      const { queryByTestId } = render(<AddressCard address={mockAddress} />);

      expect(queryByTestId('address-card-instructions-label')).toBeNull();
      expect(queryByTestId('address-card-instructions-text')).toBeNull();
    });

    it('should render instruction text', () => {
      const addressWithInstructions = {
        ...mockAddress,
        instructions: 'Ring doorbell twice',
      };

      const { getByTestId } = render(<AddressCard address={addressWithInstructions} />);

      const text = getByTestId('address-card-instructions-text');
      expect(text.props.children).toBe('Ring doorbell twice');
    });

    it('should handle long instructions', () => {
      const longInstructions = 'A'.repeat(200);
      const addressWithLongInstructions = {
        ...mockAddress,
        instructions: longInstructions,
      };

      const { getByTestId } = render(<AddressCard address={addressWithLongInstructions} />);

      const text = getByTestId('address-card-instructions-text');
      expect(text.props.children).toBe(longInstructions);
    });
  });

  describe('Map Button', () => {
    it('should render map button when showMapButton is true', () => {
      const { getByTestId } = render(
        <AddressCard address={mockAddress} showMapButton={true} onMapPress={mockOnMapPress} />
      );

      expect(getByTestId('address-card-map-button')).toBeTruthy();
    });

    it('should not render map button by default', () => {
      const { queryByTestId } = render(<AddressCard address={mockAddress} />);

      expect(queryByTestId('address-card-map-button')).toBeNull();
    });

    it('should not render map button when showMapButton is false', () => {
      const { queryByTestId } = render(
        <AddressCard address={mockAddress} showMapButton={false} onMapPress={mockOnMapPress} />
      );

      expect(queryByTestId('address-card-map-button')).toBeNull();
    });

    it('should call onMapPress when map button is pressed', () => {
      const { getByTestId } = render(
        <AddressCard address={mockAddress} showMapButton={true} onMapPress={mockOnMapPress} />
      );

      fireEvent.press(getByTestId('address-card-map-button'));
      expect(mockOnMapPress).toHaveBeenCalledTimes(1);
    });

    it('should not crash when onMapPress is undefined', () => {
      const { getByTestId } = render(
        <AddressCard address={mockAddress} showMapButton={true} />
      );

      expect(() => {
        fireEvent.press(getByTestId('address-card-map-button'));
      }).not.toThrow();
    });
  });

  describe('Coordinates', () => {
    it('should render coordinates when present', () => {
      const addressWithCoordinates = {
        ...mockAddress,
        latitude: 47.3769,
        longitude: 8.5417,
      };

      const { getByTestId } = render(<AddressCard address={addressWithCoordinates} />);

      expect(getByTestId('address-card-coordinates')).toBeTruthy();
    });

    it('should not render coordinates when absent', () => {
      const { queryByTestId } = render(<AddressCard address={mockAddress} />);

      expect(queryByTestId('address-card-coordinates')).toBeNull();
    });

    it('should format coordinates correctly', () => {
      const addressWithCoordinates = {
        ...mockAddress,
        latitude: 47.3769,
        longitude: 8.5417,
      };

      const { getByTestId } = render(<AddressCard address={addressWithCoordinates} />);

      const coords = getByTestId('address-card-coordinates');
      expect(coords.props.children).toEqual(['47.376900', ', ', '8.541700']);
    });

    it('should handle negative coordinates', () => {
      const addressWithNegativeCoordinates = {
        ...mockAddress,
        latitude: -47.3769,
        longitude: -8.5417,
      };

      const { getByTestId } = render(<AddressCard address={addressWithNegativeCoordinates} />);

      const coords = getByTestId('address-card-coordinates');
      expect(coords.props.children).toEqual(['-47.376900', ', ', '-8.541700']);
    });

    it('should handle zero coordinates', () => {
      const addressWithZeroCoordinates = {
        ...mockAddress,
        latitude: 0,
        longitude: 0,
      };

      const { queryByTestId } = render(<AddressCard address={addressWithZeroCoordinates} />);

      // Zero coordinates are falsy, so they won't render
      expect(queryByTestId('address-card-coordinates')).toBeNull();
    });

    it('should render coordinates with only latitude', () => {
      const addressWithOnlyLat = {
        ...mockAddress,
        latitude: 47.3769,
      };

      const { queryByTestId } = render(<AddressCard address={addressWithOnlyLat} />);

      // Should not render without both coordinates
      expect(queryByTestId('address-card-coordinates')).toBeNull();
    });

    it('should render coordinates with only longitude', () => {
      const addressWithOnlyLon = {
        ...mockAddress,
        longitude: 8.5417,
      };

      const { queryByTestId } = render(<AddressCard address={addressWithOnlyLon} />);

      // Should not render without both coordinates
      expect(queryByTestId('address-card-coordinates')).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('should mark title as header', () => {
      const { getByTestId } = render(<AddressCard address={mockAddress} />);

      const title = getByTestId('address-card-title');
      expect(title.props.accessibilityRole).toBe('header');
    });

    it('should have accessibility labels for address lines', () => {
      const { getByTestId } = render(<AddressCard address={mockAddress} />);

      const line0 = getByTestId('address-card-line-0');
      expect(line0.props.accessibilityLabel).toBe('123 Main Street');
    });

    it('should have accessibility labels for instructions', () => {
      const addressWithInstructions = {
        ...mockAddress,
        instructions: 'Ring doorbell twice',
      };

      const { getByTestId } = render(<AddressCard address={addressWithInstructions} />);

      const instructionsText = getByTestId('address-card-instructions-text');
      expect(instructionsText.props.accessibilityLabel).toBe('Delivery instructions: Ring doorbell twice');
    });

    it('should have accessible map button', () => {
      const { getByTestId } = render(
        <AddressCard address={mockAddress} showMapButton={true} onMapPress={mockOnMapPress} />
      );

      const mapButton = getByTestId('address-card-map-button');
      expect(mapButton.props.accessibilityLabel).toBe('View on map');
      expect(mapButton.props.accessibilityRole).toBe('button');
      expect(mapButton.props.accessibilityHint).toBe('Double tap to view this address on the map');
    });

    it('should have accessibility labels for coordinates', () => {
      const addressWithCoordinates = {
        ...mockAddress,
        latitude: 47.3769,
        longitude: 8.5417,
      };

      const { getByTestId } = render(<AddressCard address={addressWithCoordinates} />);

      const coords = getByTestId('address-card-coordinates');
      expect(coords.props.accessibilityLabel).toContain('Latitude 47.376900');
      expect(coords.props.accessibilityLabel).toContain('Longitude 8.541700');
    });

    it('should mark instructions label as header', () => {
      const addressWithInstructions = {
        ...mockAddress,
        instructions: 'Ring doorbell twice',
      };

      const { getByTestId } = render(<AddressCard address={addressWithInstructions} />);

      const label = getByTestId('address-card-instructions-label');
      expect(label.props.accessibilityRole).toBe('header');
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom style', () => {
      const customStyle = { backgroundColor: '#F0F0F0' };
      const { getByTestId } = render(
        <AddressCard address={mockAddress} style={customStyle} />
      );

      const card = getByTestId('address-card');
      // Style is an array when custom style is applied
      const styles = Array.isArray(card.props.style) ? card.props.style : [card.props.style];
      expect(styles).toContainEqual(customStyle);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long street names', () => {
      const longStreet = 'A'.repeat(200);
      const { getByTestId } = render(
        <AddressCard address={{ ...mockAddress, street: longStreet }} />
      );

      const line = getByTestId('address-card-line-0');
      expect(line.props.children).toBe(longStreet);
    });

    it('should handle very long city names', () => {
      const longCity = 'B'.repeat(200);
      const { getByTestId } = render(
        <AddressCard address={{ ...mockAddress, city: longCity }} />
      );

      expect(getByTestId('address-card')).toBeTruthy();
    });

    it('should handle special characters in address', () => {
      const specialAddress = {
        ...mockAddress,
        street: 'Rue de l\'Église № 123',
      };

      const { getByTestId } = render(<AddressCard address={specialAddress} />);

      const line = getByTestId('address-card-line-0');
      expect(line.props.children).toBe('Rue de l\'Église № 123');
    });

    it('should handle unicode characters', () => {
      const unicodeAddress = {
        ...mockAddress,
        city: 'Zürich 🇨🇭',
      };

      const { getByTestId } = render(<AddressCard address={unicodeAddress} />);

      expect(getByTestId('address-card')).toBeTruthy();
    });

    it('should handle all fields present', () => {
      const completeAddress: Address = {
        street: '123 Main Street',
        city: 'Zurich',
        postalCode: '8001',
        canton: 'ZH',
        country: 'Switzerland',
        latitude: 47.3769,
        longitude: 8.5417,
        instructions: 'Ring doorbell',
      };

      const { getByTestId, queryByTestId } = render(
        <AddressCard address={completeAddress} showMapButton={true} onMapPress={mockOnMapPress} />
      );

      expect(getByTestId('address-card')).toBeTruthy();
      expect(getByTestId('address-card-instructions-text')).toBeTruthy();
      expect(getByTestId('address-card-map-button')).toBeTruthy();
      expect(getByTestId('address-card-coordinates')).toBeTruthy();
    });

    it('should handle empty address object', () => {
      const emptyAddress: Address = {
        street: '',
        city: '',
        postalCode: '',
        canton: '',
        country: '',
      };

      const { getByTestId } = render(<AddressCard address={emptyAddress} />);

      expect(getByTestId('address-card')).toBeTruthy();
    });
  });
});
