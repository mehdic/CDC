/**
 * Map Screen
 * T8-021: GPS Tracking & Route Display
 * Shows optimized route with GPS tracking, turn-by-turn navigation, and accuracy indicators
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import { MapMarker } from '../../components/MapMarker';
import { RouteOverlay } from '../../components/RouteOverlay';
import { useLocation } from '../../hooks/useLocation';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { routeService } from '../../services/routeService';
import { startTracking, stopTracking, updateDeliveryStatusAsync } from '../../store/deliverySlice';

/**
 * Error Message Component
 */
const ErrorMessage: React.FC<{ readonly message: string }> = ({ message }) => (
  <View style={styles.errorBanner}>
    <Text style={styles.errorText}>{message}</Text>
  </View>
);

/**
 * GPS Status Indicator Component
 */
const GPSStatusIndicator: React.FC<{
  readonly accuracy: number | null;
  readonly isTracking: boolean;
}> = ({ accuracy, isTracking }) => {
  if (!isTracking) {
    return (
      <View style={styles.statusIndicator}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>Tracking inactive</Text>
      </View>
    );
  }

  const getAccuracyColor = (acc: number | null): string => {
    if (!acc) {return '#999';}
    if (acc < 5) {return '#34C759';} // Excellent
    if (acc < 10) {return '#007AFF';} // Good
    if (acc < 25) {return '#FF9500';} // Moderate
    return '#FF3B30'; // Poor
  };

  return (
    <View style={styles.statusIndicator}>
      <View style={[styles.statusDot, { backgroundColor: getAccuracyColor(accuracy) }]} />
      <Text style={styles.statusText}>
        {accuracy ? `GPS: ${Math.round(accuracy)}m` : 'GPS: Acquiring...'}
      </Text>
    </View>
  );
};

/**
 * Map Screen Component
 */
export const MapScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { activeDelivery, route, isTracking } = useAppSelector((state) => state.delivery);

  const {
    currentLocation,
    locationState,
    accuracy,
    startTracking: startLocationTracking,
    hasPermission,
  } = useLocation({
    enableTracking: isTracking,
    updateInterval: 10000, // 10 seconds
    distanceFilter: 10, // 10 meters
    enableHighAccuracy: true,
  });

  const [showRouteOverlay, setShowRouteOverlay] = useState(true);
  const [isOptimizingRoute, setIsOptimizingRoute] = useState(false);

  /**
   * Initialize Tracking
   */
  useEffect(() => {
    dispatch(startTracking());
    return () => {
      dispatch(stopTracking());
    };
  }, [dispatch]);

  /**
   * Optimize Route on Active Delivery Change
   */
  useEffect(() => {
    const optimizeRoute = async () => {
      if (!activeDelivery) {return;}

      try {
        setIsOptimizingRoute(true);
        await routeService.getOptimizedRoute([activeDelivery.id]);
        console.log('[MapScreen] Route optimized successfully');
      } catch (error) {
        console.error('[MapScreen] Failed to optimize route:', error);
      } finally {
        setIsOptimizingRoute(false);
      }
    };

    optimizeRoute();
  }, [activeDelivery?.id]);

  /**
   * Calculate Map Region - MUST COME BEFORE ALL EARLY RETURNS
   */
  const mapRegion = useMemo(() => {
    if (currentLocation) {
      return {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    if (activeDelivery?.patient.address.latitude && activeDelivery?.patient.address.longitude) {
      return {
        latitude: activeDelivery.patient.address.latitude,
        longitude: activeDelivery.patient.address.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    // Default to Switzerland (Bern)
    return {
      latitude: 46.8182,
      longitude: 8.2275,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }, [currentLocation, activeDelivery]);

  /**
   * Handle Arrived Button Press
   */
  const handleArrived = () => {
    if (!activeDelivery) {return;}

    Alert.alert(
      'Confirm Arrival',
      `Have you arrived at ${activeDelivery.patient.address.street}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Arrived',
          onPress: async () => {
            try {
              await dispatch(
                updateDeliveryStatusAsync({
                  id: activeDelivery.id,
                  status: 'arrived',
                  location: currentLocation || undefined,
                })
              );
              navigation.navigate('QRScanner', { deliveryId: activeDelivery.id });
            } catch (error) {
              Alert.alert('Error', 'Failed to confirm arrival. Please try again.');
            }
          },
        },
      ]
    );
  };

  /**
   * NOW HANDLE EARLY RETURNS (after all hooks)
   */

  // Permission Denied
  if (
    locationState.type === 'permission_denied' ||
    (!hasPermission && locationState.type !== 'requesting_permission')
  ) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorTitle}>Location Permission Required</Text>
          <Text style={styles.errorDescription}>
            This app needs access to your location to track deliveries. Please enable location
            permissions in Settings.
          </Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => {
              if (Platform.OS === 'ios') {
                // iOS: Open Settings
              } else {
                // Android: Open App Settings
              }
            }}
          >
            <Text style={styles.settingsButtonText}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // GPS Unavailable
  if (locationState.type === 'gps_unavailable') {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorTitle}>GPS Unavailable</Text>
          <Text style={styles.errorDescription}>
            Unable to determine your location. Please check your GPS settings and try again.
          </Text>
          {locationState.lastKnownLocation && (
            <Text style={styles.warningText}>
              Using last known location: {locationState.lastKnownLocation.latitude.toFixed(4)},
              {locationState.lastKnownLocation.longitude.toFixed(4)}
            </Text>
          )}
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => startLocationTracking()}
          >
            <Text style={styles.settingsButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Error State
  if (locationState.type === 'error') {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorDescription}>{locationState.error.message}</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => startLocationTracking()}
          >
            <Text style={styles.settingsButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // No Active Delivery
  if (!activeDelivery) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorTitle}>No Active Delivery</Text>
          <Text style={styles.errorDescription}>Accept a delivery to view the map and route.</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.settingsButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={mapRegion}
        showsUserLocation
      >
        {/* Route Polyline */}
        {route && route.waypoints.length > 1 && (
          <Polyline
            coordinates={route.waypoints.map((wp) => ({
              latitude: wp.coordinates.latitude,
              longitude: wp.coordinates.longitude,
            }))}
            strokeColor="#007AFF"
            strokeWidth={4}
            lineDashPattern={[5, 5]}
          />
        )}

        {/* Current Location Marker */}
        {currentLocation && (
          <MapMarker
            coordinate={currentLocation}
            type="current_location"
            title="Your Location"
            accuracy={accuracy ?? undefined}
          />
        )}

        {/* Destination Marker */}
        {activeDelivery.patient.address.latitude && activeDelivery.patient.address.longitude && (
          <MapMarker
            coordinate={{
              latitude: activeDelivery.patient.address.latitude,
              longitude: activeDelivery.patient.address.longitude,
              timestamp: new Date().toISOString(),
            }}
            type="destination"
            title={activeDelivery.patient.name}
            description={activeDelivery.patient.address.street}
          />
        )}

        {/* Waypoint Markers */}
        {route &&
          route.waypoints.map((waypoint) => (
            <MapMarker
              key={waypoint.deliveryId}
              coordinate={waypoint.coordinates}
              type={waypoint.completed ? 'waypoint' : 'pharmacy'}
              title={`Delivery ${route.waypoints.indexOf(waypoint) + 1}`}
            />
          ))}
      </MapView>

      {/* Error Banner */}
      {locationState.type === 'tracking' && currentLocation === null && (
        <ErrorMessage message="Acquiring GPS signal..." />
      )}

      {/* GPS Status Indicator */}
      <GPSStatusIndicator accuracy={accuracy} isTracking={isTracking} />

      {/* Route Overlay Panel */}
      {showRouteOverlay && !isOptimizingRoute && (
        <ScrollView
          style={styles.overlayPanel}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <RouteOverlay route={route} currentWaypointIndex={route?.currentWaypointIndex ?? 0} />
        </ScrollView>
      )}

      {/* Loading Indicator */}
      {isOptimizingRoute && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Optimizing route...</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowRouteOverlay(!showRouteOverlay)}
        >
          <Text style={styles.toggleButtonText}>
            {showRouteOverlay ? 'Hide' : 'Show'} Route
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.arrivedButton} onPress={handleArrived}>
          <Text style={styles.arrivedButtonText}>I've Arrived</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  map: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  warningText: {
    fontSize: 12,
    color: '#FF9500',
    marginBottom: 16,
    textAlign: 'center',
  },
  settingsButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  settingsButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Error Banner
  errorBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
  },

  // Status Indicator
  statusIndicator: {
    position: 'absolute',
    top: 60,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },

  // Overlay Panel
  overlayPanel: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    maxHeight: 300,
    borderRadius: 12,
    overflow: 'hidden',
  },

  // Loading Overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },

  // Button Container
  buttonContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    gap: 12,
  },
  toggleButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D1D6',
  },
  toggleButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  arrivedButton: {
    backgroundColor: '#28A745',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  arrivedButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MapScreen;
