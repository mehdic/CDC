/**
 * DeliveryMap Component Tests
 * T8-042: Patient Delivery Tracking
 */

// Mock leaflet BEFORE any imports
jest.mock('leaflet', () => {
  const mockIcon = jest.fn().mockImplementation((options: any) => ({
    options,
    setIconUrl: jest.fn(),
  }));

  mockIcon.Default = {
    prototype: {
      _getIconUrl: jest.fn(),
    },
    mergeOptions: jest.fn(),
  };

  return {
    Icon: mockIcon,
  };
});

// Also mock the leaflet CSS
jest.mock('leaflet/dist/leaflet.css', () => {});

// Mock react-leaflet BEFORE any imports
jest.mock('react-leaflet', () => {
  const React = require('react');
  return {
    MapContainer: (props: any) =>
      React.createElement('div', { 'data-testid': 'map-container' }, props.children),
    TileLayer: () => React.createElement('div', { 'data-testid': 'tile-layer' }),
    Marker: (props: any) =>
      React.createElement('div', { 'data-testid': 'marker' }, props.children),
    Polyline: () => React.createElement('div', { 'data-testid': 'polyline' }),
    Popup: (props: any) =>
      React.createElement('div', { 'data-testid': 'popup' }, props.children),
    useMap: () => ({
      setView: jest.fn(),
      getZoom: jest.fn(() => 13),
    }),
  };
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import { DeliveryMap } from '../../components/DeliveryMap';
import type { Coordinates } from '../../types/tracking';

describe('DeliveryMap', () => {
  const mockDestination: Coordinates = {
    latitude: 46.8182,
    longitude: 8.2275,
  };

  const mockDriverLocation: Coordinates = {
    latitude: 46.5,
    longitude: 8.2,
  };

  it('should render map with driver and destination markers', () => {
    render(
      <DeliveryMap
        driverLocation={mockDriverLocation}
        destinationLocation={mockDestination}
        driverName="John Doe"
        etaMinutes={15}
      />
    );

    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.getAllByTestId('marker')).toHaveLength(2); // Driver + Destination
  });

  it('should show waiting message when no driver location', () => {
    render(
      <DeliveryMap
        driverLocation={null}
        destinationLocation={mockDestination}
      />
    );

    expect(screen.getByText(/Waiting for driver location/i)).toBeInTheDocument();
  });

  it('should display live tracking badge when driver location available', () => {
    render(
      <DeliveryMap
        driverLocation={mockDriverLocation}
        destinationLocation={mockDestination}
      />
    );

    expect(screen.getByText('Live Tracking')).toBeInTheDocument();
  });

  it('should render polyline when location history provided', () => {
    const locationHistory: Coordinates[] = [
      { latitude: 46.5, longitude: 8.2 },
      { latitude: 46.6, longitude: 8.22 },
      { latitude: 46.7, longitude: 8.24 },
    ];

    render(
      <DeliveryMap
        driverLocation={mockDriverLocation}
        destinationLocation={mockDestination}
        locationHistory={locationHistory}
      />
    );

    expect(screen.getByTestId('polyline')).toBeInTheDocument();
  });
});
