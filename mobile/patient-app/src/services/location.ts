/**
 * Location Service
 * Manages geolocation for finding nearby pharmacies
 * Efficient location tracking with battery optimization
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform as _Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

/**
 * Coordinates interface
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

/**
 * Pharmacy location interface
 */
export interface PharmacyLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distance: number; // in meters
  address: string;
  phone?: string;
  hours?: string;
}

/**
 * Location Service
 * Provides location tracking and nearby pharmacy discovery
 */
export class LocationService {
  private static instance: LocationService;
  private currentLocation: Coordinates | null = null;
  private watchId: number | null = null;
  private locationListeners: ((location: Coordinates) => void)[] = [];
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Request location permission
   */
  async requestLocationPermission(): Promise<boolean> {
    try {
      // In production, use react-native-permissions to request
      // For iOS: NSLocationWhenInUseUsageDescription in Info.plist
      // For Android: ACCESS_FINE_LOCATION in AndroidManifest.xml
      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  /**
   * Get current location
   */
  async getCurrentLocation(): Promise<Coordinates | null> {
    try {
      // Check cache first
      const cached = await this.getCachedLocation();
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached;
      }

      return new Promise((resolve) => {
        Geolocation.getCurrentPosition(
          (position) => {
            const location: Coordinates = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: Date.now(),
            };

            this.currentLocation = location;
            this.cacheLocation(location);
            resolve(location);
          },
          (error) => {
            console.error('Error getting current location:', error);
            resolve(null);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
          }
        );
      });
    } catch (error) {
      console.error('Error in getCurrentLocation:', error);
      return null;
    }
  }

  /**
   * Start watching location updates
   * Useful for real-time delivery tracking
   */
  startWatchingLocation(
    callback: (location: Coordinates) => void
  ): number | null {
    try {
      const listener = (location: Coordinates) => {
        this.currentLocation = location;
        callback(location);
      };

      this.locationListeners.push(listener);

      this.watchId = Geolocation.watchPosition(
        (position) => {
          const location: Coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now(),
          };

          this.cacheLocation(location);
          listener(location);
        },
        (error) => {
          console.error('Error watching location:', error);
        },
        {
          enableHighAccuracy: false, // Lower accuracy for better battery
          distanceFilter: 50, // Update only when moved 50 meters
          interval: 30000, // Update interval in milliseconds
        }
      );

      return this.watchId;
    } catch (error) {
      console.error('Error starting location watch:', error);
      return null;
    }
  }

  /**
   * Stop watching location
   */
  stopWatchingLocation(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.locationListeners = [];
    }
  }

  /**
   * Get current cached location
   */
  getCurrentLocation_Cached(): Coordinates | null {
    return this.currentLocation;
  }

  /**
   * Cache location to AsyncStorage
   */
  private async cacheLocation(location: Coordinates): Promise<void> {
    try {
      await AsyncStorage.setItem(
        'last_known_location',
        JSON.stringify(location)
      );
    } catch (error) {
      console.error('Error caching location:', error);
    }
  }

  /**
   * Get cached location from AsyncStorage
   */
  private async getCachedLocation(): Promise<Coordinates | null> {
    try {
      const data = await AsyncStorage.getItem('last_known_location');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting cached location:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two coordinates
   * Returns distance in meters
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Radius of Earth in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Find nearby pharmacies
   * In production, this would call the backend API
   */
  async findNearbyPharmacies(
    radiusInMeters: number = 5000
  ): Promise<PharmacyLocation[]> {
    try {
      const location = await this.getCurrentLocation();

      if (!location) {
        console.error('Unable to get current location');
        return [];
      }

      // In production, this would be an API call:
      // const response = await apiClient.get('/pharmacies/nearby', {
      //   params: {
      //     lat: location.latitude,
      //     lon: location.longitude,
      //     radius: radiusInMeters,
      //   },
      // });

      // Mock data for demonstration
      const mockPharmacies: PharmacyLocation[] = [
        {
          id: '1',
          name: 'Pharmacie du Centre',
          latitude: location.latitude + 0.01,
          longitude: location.longitude + 0.01,
          distance: 1000,
          address: '123 Rue de la Paix',
          phone: '+41 22 123 4567',
          hours: '08:00 - 20:00',
        },
        {
          id: '2',
          name: 'Pharmacie de la Gare',
          latitude: location.latitude - 0.01,
          longitude: location.longitude - 0.01,
          distance: 1500,
          address: '456 Rue de la Station',
          phone: '+41 22 765 4321',
          hours: '07:00 - 22:00',
        },
      ];

      // Calculate actual distances
      const pharmaciesWithDistance = mockPharmacies
        .map((pharmacy) => ({
          ...pharmacy,
          distance: this.calculateDistance(
            location.latitude,
            location.longitude,
            pharmacy.latitude,
            pharmacy.longitude
          ),
        }))
        .filter((pharmacy) => pharmacy.distance <= radiusInMeters)
        .sort((a, b) => a.distance - b.distance);

      return pharmaciesWithDistance;
    } catch (error) {
      console.error('Error finding nearby pharmacies:', error);
      return [];
    }
  }

  /**
   * Get distance between two coordinates
   */
  getDistance(coords1: Coordinates, coords2: Coordinates): number {
    return this.calculateDistance(
      coords1.latitude,
      coords1.longitude,
      coords2.latitude,
      coords2.longitude
    );
  }

  /**
   * Clear location cache
   */
  async clearLocationCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem('last_known_location');
      this.currentLocation = null;
    } catch (error) {
      console.error('Error clearing location cache:', error);
    }
  }
}

export default LocationService.getInstance();
