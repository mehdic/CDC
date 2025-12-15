/**
 * MapView Component
 * T8-021: GPS Tracking & Route Display
 * Interactive map with current location, destination markers, and route polyline
 */

import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';

import { Coordinates, DeliveryRoute, Waypoint } from '../types/delivery';

/**
 * MapView Props
 */
interface DeliveryMapViewProps {
  currentLocation: Coordinates | null;
  route: DeliveryRoute | null;
  onMarkerPress?: (waypoint: Waypoint) => void;
  showUserLocation?: boolean;
  followsUserLocation?: boolean;
  style?: any;
}

/**
 * Calculate Map Region from Coordinates
 */
const calculateRegion = (
  currentLocation: Coordinates | null,
  waypoints: Waypoint[]
): Region | null => {
  const coords: Coordinates[] = [];

  if (currentLocation) {
    coords.push(currentLocation);
  }

  waypoints.forEach((wp) => coords.push(wp.coordinates));

  if (coords.length === 0) {return null;}

  // Calculate bounding box
  const latitudes = coords.map((c) => c.latitude);
  const longitudes = coords.map((c) => c.longitude);

  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  const latDelta = (maxLat - minLat) * 1.5; // Add 50% padding
  const lngDelta = (maxLng - minLng) * 1.5;

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(latDelta, 0.01), // Minimum zoom level
    longitudeDelta: Math.max(lngDelta, 0.01),
  };
};

/**
 * DeliveryMapView Component
 */
export const DeliveryMapView: React.FC<DeliveryMapViewProps> = ({
  currentLocation,
  route,
  onMarkerPress,
  showUserLocation = true,
  followsUserLocation = false,
  style,
}) => {
  const mapRef = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');

  /**
   * Auto-fit map to show all markers
   */
  useEffect(() => {
    if (!mapReady || !mapRef.current) {return;}

    const waypoints = route?.waypoints || [];
    const region = calculateRegion(currentLocation, waypoints);

    if (region) {
      mapRef.current.animateToRegion(region, 500);
    }
  }, [mapReady, currentLocation, route, followsUserLocation]);

  /**
   * Render Polyline for Route
   */
  const renderPolyline = () => {
    if (!route || !route.waypoints || route.waypoints.length < 2) {return null;}

    // Create coordinates array for polyline
    const coordinates = route.waypoints.map((wp) => ({
      latitude: wp.coordinates.latitude,
      longitude: wp.coordinates.longitude,
    }));

    // Add current location at the start if available
    if (currentLocation) {
      coordinates.unshift({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });
    }

    return (
      <Polyline
        coordinates={coordinates}
        strokeColor="#4A90E2"
        strokeWidth={4}
        lineDashPattern={[10, 5]}
      />
    );
  };

  /**
   * Render Current Location Marker
   */
  const renderCurrentLocationMarker = () => {
    if (!currentLocation || !showUserLocation) {return null;}

    return (
      <Marker
        coordinate={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        }}
        title="Your Location"
        description="Current delivery personnel location"
        anchor={{ x: 0.5, y: 0.5 }}
        pinColor="#4A90E2"
      />
    );
  };

  /**
   * Render Destination Markers
   */
  const renderDestinationMarkers = () => {
    if (!route || !route.waypoints) {return null;}

    return route.waypoints.map((waypoint, index) => {
      const isCompleted = waypoint.completed;
      const isCurrent = index === route.currentWaypointIndex;

      return (
        <Marker
          key={waypoint.deliveryId}
          coordinate={{
            latitude: waypoint.coordinates.latitude,
            longitude: waypoint.coordinates.longitude,
          }}
          title={`Stop ${waypoint.sequence}: ${waypoint.address.street}`}
          description={`${waypoint.address.city}, ${waypoint.address.postalCode}`}
          pinColor={isCompleted ? '#4CAF50' : isCurrent ? '#FF9800' : '#F44336'}
          onPress={() => onMarkerPress?.(waypoint)}
        />
      );
    });
  };

  /**
   * Toggle Map Type
   */
  const toggleMapType = () => {
    setMapType((current) => {
      if (current === 'standard') {return 'satellite';}
      if (current === 'satellite') {return 'hybrid';}
      return 'standard';
    });
  };

  /**
   * Center Map on Current Location
   */
  const centerOnCurrentLocation = () => {
    if (!currentLocation || !mapRef.current) {return;}

    mapRef.current.animateToRegion(
      {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      500
    );
  };

  /**
   * Fit All Markers
   */
  const fitAllMarkers = () => {
    if (!mapRef.current || !route) {return;}

    const waypoints = route.waypoints || [];
    const region = calculateRegion(currentLocation, waypoints);

    if (region) {
      mapRef.current.animateToRegion(region, 500);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        mapType={mapType}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        showsTraffic={true}
        loadingEnabled={true}
        loadingIndicatorColor="#4A90E2"
        loadingBackgroundColor="#FFFFFF"
        onMapReady={() => setMapReady(true)}
        followsUserLocation={followsUserLocation}
        initialRegion={
          currentLocation
            ? {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }
            : undefined
        }
      >
        {renderPolyline()}
        {renderCurrentLocationMarker()}
        {renderDestinationMarkers()}
      </MapView>

      {/* Loading Indicator */}
      {!mapReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading Map...</Text>
        </View>
      )}

      {/* Map Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={toggleMapType}
          accessibilityLabel="Toggle map type"
          accessibilityHint="Switch between standard, satellite, and hybrid views"
        >
          <Text style={styles.controlButtonText}>
            {mapType === 'standard' ? '🗺️' : mapType === 'satellite' ? '🛰️' : '🌍'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={centerOnCurrentLocation}
          disabled={!currentLocation}
          accessibilityLabel="Center on current location"
          accessibilityHint="Move map to show your current location"
        >
          <Text style={styles.controlButtonText}>📍</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={fitAllMarkers}
          disabled={!route || !route.waypoints || route.waypoints.length === 0}
          accessibilityLabel="Fit all markers"
          accessibilityHint="Zoom map to show all delivery stops"
        >
          <Text style={styles.controlButtonText}>🎯</Text>
        </TouchableOpacity>
      </View>

      {/* Map Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4A90E2' }]} />
          <Text style={styles.legendText}>Your Location</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
          <Text style={styles.legendText}>Current Stop</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
          <Text style={styles.legendText}>Upcoming</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>Completed</Text>
        </View>
      </View>
    </View>
  );
};

/**
 * Styles
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '600',
  },
  controls: {
    position: 'absolute',
    right: 16,
    top: 60,
    gap: 8,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  controlButtonText: {
    fontSize: 24,
  },
  legend: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#333',
    fontWeight: '500',
  },
});

export default DeliveryMapView;
