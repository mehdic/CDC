/**
 * Map Screen
 * Shows optimized route with GPS tracking and turn-by-turn navigation
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { useGeolocation } from '../../hooks/useGeolocation';
import { startTracking, stopTracking, updateDeliveryStatusAsync } from '../../store/deliverySlice';

export const MapScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { activeDelivery, route, isTracking } = useAppSelector((state) => state.delivery);
  const { currentLocation, hasPermission, error } = useGeolocation(true, 30000);

  useEffect(() => {
    dispatch(startTracking());
    return () => {
      dispatch(stopTracking());
    };
  }, [dispatch]);

  const handleArrived = () => {
    if (!activeDelivery) return;

    Alert.alert('Confirm Arrival', 'Have you arrived at the delivery location?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes, Arrived',
        onPress: async () => {
          await dispatch(
            updateDeliveryStatusAsync({
              id: activeDelivery.id,
              status: 'arrived',
              location: currentLocation || undefined,
            })
          );
          navigation.navigate('QRScanner', { deliveryId: activeDelivery.id });
        },
      },
    ]);
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text>Location permission required</Text>
      </View>
    );
  }

  if (!activeDelivery) {
    return (
      <View style={styles.container}>
        <Text>No active delivery</Text>
      </View>
    );
  }

  const mapRegion = currentLocation
    ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : {
        latitude: activeDelivery.patient.address.latitude || 46.8182,
        longitude: activeDelivery.patient.address.longitude || 8.2275,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} provider={PROVIDER_GOOGLE} region={mapRegion} showsUserLocation>
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="Your Location"
            pinColor="blue"
          />
        )}

        {activeDelivery.patient.address.latitude && activeDelivery.patient.address.longitude && (
          <Marker
            coordinate={{
              latitude: activeDelivery.patient.address.latitude,
              longitude: activeDelivery.patient.address.longitude,
            }}
            title={activeDelivery.patient.name}
            description={activeDelivery.patient.address.street}
            pinColor="red"
          />
        )}

        {route && route.waypoints.length > 1 && (
          <Polyline
            coordinates={route.waypoints.map((wp) => ({
              latitude: wp.coordinates.latitude,
              longitude: wp.coordinates.longitude,
            }))}
            strokeColor="#007AFF"
            strokeWidth={4}
          />
        )}
      </MapView>

      <View style={styles.infoPanel}>
        <Text style={styles.patientName}>{activeDelivery.patient.name}</Text>
        <Text style={styles.address}>
          {activeDelivery.patient.address.street}, {activeDelivery.patient.address.city}
        </Text>
        <View style={styles.stats}>
          <Text style={styles.stat}>{activeDelivery.distance.toFixed(1)} km</Text>
          <Text style={styles.stat}>{activeDelivery.estimatedDuration} min</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.arrivedButton} onPress={handleArrived}>
        <Text style={styles.arrivedButtonText}>I've Arrived</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  infoPanel: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  patientName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  address: { fontSize: 14, color: '#666', marginTop: 4 },
  stats: { flexDirection: 'row', marginTop: 12, gap: 16 },
  stat: { fontSize: 14, fontWeight: '600', color: '#007AFF' },
  arrivedButton: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    backgroundColor: '#28A745',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  arrivedButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});

export default MapScreen;
