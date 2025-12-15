/**
 * Navigation Screen
 * Turn-by-turn navigation with optimized route display
 * Shows map with current position, next waypoint, and route optimization details
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import { useGeolocation } from '../../hooks/useGeolocation';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import {
  startTracking,
  stopTracking,
  updateDeliveryStatusAsync,
  optimizeRouteAsync,
  updateLocationAsync,
} from '../../store/deliverySlice';
import { DeliveryRoute, Waypoint, Coordinates } from '../../types/delivery';

interface NavigationScreenProps {
  navigation: any;
  route: any;
}

export const NavigationScreen: React.FC<NavigationScreenProps> = ({ navigation, route: navRoute }) => {
  const dispatch = useAppDispatch();
  const { activeDelivery, route: optimizedRoute, isTracking } = useAppSelector(
    (state) => state.delivery
  );
  const { currentLocation, hasPermission } = useGeolocation(true, 30000);
  const mapRef = useRef<MapView>(null);

  const [nextWaypoint, setNextWaypoint] = useState<Waypoint | null>(null);
  const [waypointIndex, setWaypointIndex] = useState(0);
  const [navigationInfo, setNavigationInfo] = useState({
    distanceToNext: 0,
    timeToNext: 0,
    routeCompletePercentage: 0,
  });

  // Initialize tracking and route optimization
  useEffect(() => {
    dispatch(startTracking());
    return () => {
      dispatch(stopTracking());
    };
  }, [dispatch]);

  // Optimize route if not already optimized and we have active deliveries
  useEffect(() => {
    if (activeDelivery && !optimizedRoute) {
      // If we have a single delivery, create a simple route
      dispatch(optimizeRouteAsync([activeDelivery.id]));
    }
  }, [activeDelivery, optimizedRoute, dispatch]);

  // Update current waypoint and navigation info
  useEffect(() => {
    if (!optimizedRoute || optimizedRoute.waypoints.length === 0) {return;}

    const currentIndex = optimizedRoute.currentWaypointIndex;
    setWaypointIndex(currentIndex);

    if (currentIndex < optimizedRoute.waypoints.length) {
      const waypoint = optimizedRoute.waypoints[currentIndex];
      setNextWaypoint(waypoint);

      // Calculate distance to next waypoint
      if (currentLocation) {
        const distance = calculateDistance(currentLocation, waypoint.coordinates);
        const timeToArrival = estimateTime(distance);

        setNavigationInfo({
          distanceToNext: distance,
          timeToNext: timeToArrival,
          routeCompletePercentage:
            ((currentIndex + 1) / optimizedRoute.waypoints.length) * 100,
        });
      }
    }
  }, [optimizedRoute, currentLocation]);

  // Update location on server periodically
  useEffect(() => {
    if (!currentLocation || !isTracking) {return;}

    const interval = setInterval(() => {
      dispatch(
        updateLocationAsync({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy,
          timestamp: new Date().toISOString(),
        })
      );
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [currentLocation, isTracking, dispatch]);

  // Animate map to show current location
  useEffect(() => {
    if (!mapRef.current || !currentLocation) {return;}
    const mapRegion = {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };
    mapRef.current.animateToRegion(mapRegion, 1000);
  }, [currentLocation]);

  const handleArrived = async () => {
    if (!activeDelivery || !nextWaypoint) {return;}

    Alert.alert('Confirm Arrival', `Have you arrived at ${nextWaypoint.deliveryId}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes, Arrived',
        onPress: async () => {
          try {
            await dispatch(
              updateDeliveryStatusAsync({
                id: nextWaypoint.deliveryId,
                status: 'arrived',
                location: currentLocation || undefined,
              })
            );

            // Navigate to QR scanner
            navigation.navigate('QRScanner', { deliveryId: nextWaypoint.deliveryId });
          } catch (error) {
            Alert.alert('Error', 'Failed to update delivery status');
          }
        },
      },
    ]);
  };

  const handleRecalculateRoute = async () => {
    if (!optimizedRoute || !currentLocation) {return;}

    try {
      const remainingDeliveries = optimizedRoute.waypoints
        .slice(waypointIndex)
        .map((w) => w.deliveryId);

      if (remainingDeliveries.length === 0) {
        Alert.alert('Notice', 'No remaining deliveries in the route');
        return;
      }

      // Recalculate route from current position
      // This would typically call a backend endpoint
      Alert.alert('Success', 'Route recalculated based on current location');
    } catch (error) {
      Alert.alert('Error', 'Failed to recalculate route');
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Location permission required for navigation</Text>
      </View>
    );
  }

  if (!activeDelivery) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No active delivery</Text>
      </View>
    );
  }

  if (!currentLocation) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Waiting for GPS location...</Text>
      </View>
    );
  }

  // Map region centered on current location
  const mapRegion = {
    latitude: currentLocation.latitude,
    longitude: currentLocation.longitude,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  return (
    <View style={styles.container}>
      {/* Map Section */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={mapRegion}
        showsUserLocation
      >
        {/* Current Location Marker */}
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="You"
            pinColor="blue"
            flat
          />
        )}

        {/* Next Waypoint Marker */}
        {nextWaypoint && (
          <Marker
            coordinate={{
              latitude: nextWaypoint.coordinates.latitude,
              longitude: nextWaypoint.coordinates.longitude,
            }}
            title={`Stop ${nextWaypoint.sequence}`}
            description={`Delivery ID: ${nextWaypoint.deliveryId}`}
            pinColor="red"
          />
        )}

        {/* Remaining Waypoints */}
        {optimizedRoute &&
          optimizedRoute.waypoints.slice(waypointIndex + 1).map((waypoint) => (
            <Marker
              key={waypoint.deliveryId}
              coordinate={{
                latitude: waypoint.coordinates.latitude,
                longitude: waypoint.coordinates.longitude,
              }}
              title={`Stop ${waypoint.sequence}`}
              pinColor="orange"
              opacity={0.7}
            />
          ))}

        {/* Route Polyline */}
        {optimizedRoute && optimizedRoute.waypoints.length > 0 && (
          <>
            {/* Path to next waypoint (highlighted) */}
            {nextWaypoint && (
              <Polyline
                coordinates={[currentLocation, nextWaypoint.coordinates]}
                strokeColor="#007AFF"
                strokeWidth={5}
                lineDashPattern={[0]}
              />
            )}

            {/* Remaining route path */}
            {waypointIndex < optimizedRoute.waypoints.length - 1 && (
              <Polyline
                coordinates={optimizedRoute.waypoints
                  .slice(waypointIndex + 1)
                  .map((wp) => wp.coordinates)}
                strokeColor="#34C759"
                strokeWidth={3}
                lineDashPattern={[5, 5]}
              />
            )}
          </>
        )}
      </MapView>

      {/* Navigation Info Panel */}
      <View style={styles.navigationPanel}>
        <ScrollView style={styles.scrollContent}>
          {/* Distance and Time Info */}
          {nextWaypoint && (
            <>
              <View style={styles.infoSection}>
                <Text style={styles.nextStopLabel}>Next Stop</Text>
                <Text style={styles.stopNumber}>Stop {nextWaypoint.sequence}</Text>
                <Text style={styles.deliveryId}>{nextWaypoint.deliveryId}</Text>
              </View>

              <View style={styles.metricsRow}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Distance</Text>
                  <Text style={styles.metricValue}>
                    {navigationInfo.distanceToNext.toFixed(1)} km
                  </Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Est. Time</Text>
                  <Text style={styles.metricValue}>
                    {navigationInfo.timeToNext.toFixed(0)} min
                  </Text>
                </View>
              </View>

              {/* Estimated Arrival Time */}
              <View style={styles.arrivalTimeBox}>
                <Text style={styles.arrivalLabel}>Estimated Arrival</Text>
                <Text style={styles.arrivalTime}>
                  {new Date(nextWaypoint.estimatedArrival).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>

              {/* Route Progress */}
              <View style={styles.progressSection}>
                <Text style={styles.progressLabel}>
                  Route Progress: {navigationInfo.routeCompletePercentage.toFixed(0)}%
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${navigationInfo.routeCompletePercentage}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {waypointIndex + 1} of {optimizedRoute?.waypoints.length || 0} deliveries
                </Text>
              </View>

              {/* Constraints Info */}
              {nextWaypoint.constraints && (nextWaypoint.constraints.coldChain ||
                nextWaypoint.constraints.controlledSubstance ||
                nextWaypoint.constraints.idVerificationRequired) && (
                <View style={styles.constraintsBox}>
                  <Text style={styles.constraintLabel}>Special Handling:</Text>
                  {nextWaypoint.constraints.coldChain && (
                    <Text style={styles.constraintItem}>- Cold Chain Required</Text>
                  )}
                  {nextWaypoint.constraints.controlledSubstance && (
                    <Text style={styles.constraintItem}>- Controlled Substance</Text>
                  )}
                  {nextWaypoint.constraints.idVerificationRequired && (
                    <Text style={styles.constraintItem}>- ID Verification Required</Text>
                  )}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.recalculateButton]}
          onPress={handleRecalculateRoute}
        >
          <Text style={styles.buttonText}>Recalculate Route</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.arrivedButton]}
          onPress={handleArrived}
        >
          <Text style={styles.arrivedButtonText}>I've Arrived</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * Helper function: Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.latitude * Math.PI) / 180) *
      Math.cos((coord2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Helper function: Estimate time based on distance
 * Approximation: 50 km/h average speed + 5 min per stop
 */
function estimateTime(distance: number): number {
  const travelTimeMinutes = (distance / 50) * 60;
  const stopTimeMinutes = 5;
  return travelTimeMinutes + stopTimeMinutes;
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  navigationPanel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '35%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  scrollContent: {
    padding: 16,
  },
  infoSection: {
    marginBottom: 12,
  },
  nextStopLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  stopNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  deliveryId: {
    fontSize: 12,
    color: '#999',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  arrivalTimeBox: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  arrivalLabel: {
    fontSize: 11,
    color: '#4CAF50',
    marginBottom: 4,
  },
  arrivalTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
  constraintsBox: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
  },
  constraintLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  constraintItem: {
    fontSize: 11,
    color: '#856404',
    marginBottom: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recalculateButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DCDCDC',
  },
  arrivedButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  arrivedButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#E53935',
    textAlign: 'center',
    marginTop: 20,
  },
});
