/**
 * PharmacyMap Component
 * Displays nearby pharmacies on a map with current location
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Pressable,
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';

import LocationService, { PharmacyLocation, Coordinates } from '../services/location';
import { PermissionsUtil, PermissionType } from '../utils/permissions';

interface PharmacyMapProps {
  radiusInMeters?: number;
  onPharmacySelected?: (pharmacy: PharmacyLocation) => void;
  showList?: boolean;
}

/**
 * PharmacyMap Component
 * Shows nearby pharmacies on a map
 */
export const PharmacyMap: React.FC<PharmacyMapProps> = ({
  radiusInMeters = 5000,
  onPharmacySelected,
  showList = true,
}) => {
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(
    null
  );
  const [pharmacies, setPharmacies] = useState<PharmacyLocation[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] =
    useState<PharmacyLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Request location permission and fetch location
  useEffect(() => {
    const initializeMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check and request location permission
        const hasPermission =
          await PermissionsUtil.checkAndRequestPermission(
            PermissionType.LOCATION
          );

        if (!hasPermission) {
          setError('Location permission not granted');
          setIsLoading(false);
          return;
        }

        // Get current location
        const location = await LocationService.getCurrentLocation();
        if (!location) {
          setError('Unable to get current location');
          setIsLoading(false);
          return;
        }

        setCurrentLocation(location);

        // Find nearby pharmacies
        const nearby = await LocationService.findNearbyPharmacies(
          radiusInMeters
        );
        setPharmacies(nearby);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    initializeMap();
  }, [radiusInMeters]);

  // Handle pharmacy selection
  const handlePharmacySelect = (pharmacy: PharmacyLocation) => {
    setSelectedPharmacy(pharmacy);
    onPharmacySelected?.(pharmacy);
  };

  // Format distance for display
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Finding nearby pharmacies...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!currentLocation) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Location not available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Current location marker */}
        <Marker
          coordinate={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          }}
          title="Your Location"
          pinColor="#3B82F6"
        />

        {/* Search radius circle */}
        <Circle
          center={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          }}
          radius={radiusInMeters}
          fillColor="rgba(59, 130, 246, 0.1)"
          strokeColor="rgba(59, 130, 246, 0.3)"
          strokeWidth={1}
        />

        {/* Pharmacy markers */}
        {pharmacies.map((pharmacy) => (
          <Marker
            key={pharmacy.id}
            coordinate={{
              latitude: pharmacy.latitude,
              longitude: pharmacy.longitude,
            }}
            title={pharmacy.name}
            description={`${formatDistance(pharmacy.distance)} away`}
            pinColor={
              selectedPharmacy?.id === pharmacy.id ? '#FF6B6B' : '#10B981'
            }
            onPress={() => handlePharmacySelect(pharmacy)}
          />
        ))}
      </MapView>

      {/* Pharmacy list */}
      {showList && (
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>
            {pharmacies.length} Pharmacies Found
          </Text>
          <ScrollView style={styles.list}>
            {pharmacies.map((pharmacy) => (
              <Pressable
                key={pharmacy.id}
                style={[
                  styles.listItem,
                  selectedPharmacy?.id === pharmacy.id &&
                    styles.listItemSelected,
                ]}
                onPress={() => handlePharmacySelect(pharmacy)}
              >
                <View style={styles.listItemContent}>
                  <Text style={styles.pharmacyName}>{pharmacy.name}</Text>
                  <Text style={styles.pharmacyDistance}>
                    {formatDistance(pharmacy.distance)} away
                  </Text>
                  {pharmacy.address && (
                    <Text style={styles.pharmacyAddress}>
                      {pharmacy.address}
                    </Text>
                  )}
                  {pharmacy.hours && (
                    <Text style={styles.pharmacyHours}>{pharmacy.hours}</Text>
                  )}
                </View>
                {pharmacy.phone && (
                  <Text style={styles.pharmacyPhone}>{pharmacy.phone}</Text>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  map: {
    flex: 1,
    minHeight: 300,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  listContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: 300,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  list: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  listItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  listItemContent: {
    flex: 1,
    marginRight: 12,
  },
  pharmacyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  pharmacyDistance: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
    marginBottom: 4,
  },
  pharmacyAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  pharmacyHours: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  pharmacyPhone: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
});

export default PharmacyMap;
