/**
 * Location Tracking Service
 * T3-052: Implement Location Tracking Service
 * Provides battery-efficient GPS tracking with adaptive modes, geofencing, and offline queueing
 */

import Geolocation from 'react-native-geolocation-service';
import Geofencing from '@react-native-community/geofencing';
import { Platform, PermissionsAndroid, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Coordinates } from '../types/delivery';
import deliveryApi from './deliveryApi';

/**
 * Tracking Modes for Battery Optimization
 */
export enum TrackingMode {
  HIGH_ACCURACY = 'high_accuracy',   // Near destination (<2km)
  NORMAL = 'normal',                 // In transit (2-10km)
  BATTERY_SAVER = 'battery_saver',   // Far from destination (>10km) OR low battery
}

/**
 * Tracking Configuration for Each Mode
 */
interface TrackingConfig {
  interval: number;         // Update interval in ms
  distanceFilter: number;   // Minimum distance change to trigger update (meters)
  enableHighAccuracy: boolean;
}

const TRACKING_CONFIGS: Record<TrackingMode, TrackingConfig> = {
  [TrackingMode.HIGH_ACCURACY]: {
    interval: 15000,          // 15 seconds
    distanceFilter: 20,       // 20 meters
    enableHighAccuracy: true,
  },
  [TrackingMode.NORMAL]: {
    interval: 30000,          // 30 seconds
    distanceFilter: 50,       // 50 meters
    enableHighAccuracy: true,
  },
  [TrackingMode.BATTERY_SAVER]: {
    interval: 60000,          // 60 seconds
    distanceFilter: 100,      // 100 meters
    enableHighAccuracy: false,
  },
};

/**
 * Batched Location Update
 */
interface LocationBatch {
  deliveryId: string;
  locations: Coordinates[];
  timestamp: string;
}

/**
 * Geofence Definition
 */
interface DeliveryGeofence {
  deliveryId: string;
  latitude: number;
  longitude: number;
  radius: number;
}

/**
 * Location Service Class
 */
class LocationService {
  private watchId: number | null = null;
  private currentMode: TrackingMode = TrackingMode.NORMAL;
  private isTracking: boolean = false;
  private locationBatch: Coordinates[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private currentDeliveryId: string | null = null;
  private geofences: Map<string, DeliveryGeofence> = new Map();
  private batteryLevel: number = 100;

  // Storage keys
  private readonly BATCH_QUEUE_KEY = '@location_batch_queue';
  private readonly TRACKING_MODE_KEY = '@tracking_mode';

  /**
   * Initialize Location Service
   */
  async initialize(): Promise<boolean> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.error('[LocationService] Permission denied');
      return false;
    }

    // Restore tracking mode from storage
    const savedMode = await AsyncStorage.getItem(this.TRACKING_MODE_KEY);
    if (savedMode && Object.values(TrackingMode).includes(savedMode as TrackingMode)) {
      this.currentMode = savedMode as TrackingMode;
    }

    // Monitor battery level
    this.monitorBatteryLevel();

    console.log('[LocationService] Initialized successfully');
    return true;
  }

  /**
   * Request Location Permissions
   */
  private async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      const auth = await Geolocation.requestAuthorization('always');
      return auth === 'granted';
    }

    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
      ]);

      return (
        granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED
      );
    }

    return false;
  }

  /**
   * Monitor Battery Level
   */
  private monitorBatteryLevel(): void {
    // Note: In production, use react-native-device-info
    // For now, assume 100% battery
    this.batteryLevel = 100;

    // In production:
    // DeviceInfo.getBatteryLevel().then(level => {
    //   this.batteryLevel = level * 100;
    //   this.adjustTrackingMode();
    // });
  }

  /**
   * Calculate Haversine Distance Between Two Coordinates
   */
  private calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
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
    return R * c; // Distance in km
  }

  /**
   * Determine Optimal Tracking Mode Based on Distance and Battery
   */
  private determineTrackingMode(
    distanceToDestinationKm: number,
    batteryLevel: number
  ): TrackingMode {
    // Battery critical: Force BATTERY_SAVER
    if (batteryLevel < 20) {
      return TrackingMode.BATTERY_SAVER;
    }

    // Near destination: HIGH_ACCURACY
    if (distanceToDestinationKm < 2) {
      return TrackingMode.HIGH_ACCURACY;
    }

    // In transit: NORMAL
    if (distanceToDestinationKm < 10) {
      return TrackingMode.NORMAL;
    }

    // Far away: BATTERY_SAVER
    return TrackingMode.BATTERY_SAVER;
  }

  /**
   * Adjust Tracking Mode Based on Distance to Destination
   */
  private async adjustTrackingMode(destinationCoords: Coordinates): Promise<void> {
    if (!this.isTracking) return;

    // Get current location
    Geolocation.getCurrentPosition(
      async (position) => {
        const currentCoords: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: new Date(position.timestamp).toISOString(),
        };

        const distanceKm = this.calculateDistance(currentCoords, destinationCoords);
        const newMode = this.determineTrackingMode(distanceKm, this.batteryLevel);

        if (newMode !== this.currentMode) {
          console.log(`[LocationService] Switching mode: ${this.currentMode} → ${newMode}`);
          this.currentMode = newMode;
          await AsyncStorage.setItem(this.TRACKING_MODE_KEY, newMode);

          // Restart tracking with new mode
          if (this.currentDeliveryId) {
            this.stopTracking();
            await this.startTracking(this.currentDeliveryId, destinationCoords);
          }
        }
      },
      (error) => {
        console.error('[LocationService] Failed to get current position:', error);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  /**
   * Start Location Tracking for a Delivery
   */
  async startTracking(deliveryId: string, destinationCoords: Coordinates): Promise<void> {
    if (this.isTracking) {
      console.warn('[LocationService] Already tracking');
      return;
    }

    console.log(`[LocationService] Starting tracking for delivery ${deliveryId}`);
    this.currentDeliveryId = deliveryId;
    this.isTracking = true;

    // Determine initial tracking mode
    await this.adjustTrackingMode(destinationCoords);

    const config = TRACKING_CONFIGS[this.currentMode];

    // Get initial position
    Geolocation.getCurrentPosition(
      (position) => {
        this.handleLocationUpdate(position);
      },
      (error) => {
        console.error('[LocationService] Initial position error:', error);
      },
      {
        enableHighAccuracy: config.enableHighAccuracy,
        timeout: 15000,
        maximumAge: 10000,
      }
    );

    // Start watching position
    this.watchId = Geolocation.watchPosition(
      (position) => {
        this.handleLocationUpdate(position);
      },
      (error) => {
        console.error('[LocationService] Watch position error:', error);
      },
      {
        enableHighAccuracy: config.enableHighAccuracy,
        distanceFilter: config.distanceFilter,
        interval: config.interval,
        fastestInterval: config.interval / 2,
        showLocationDialog: true,
      }
    );

    // Set up geofencing for delivery zone
    this.setupGeofence(deliveryId, destinationCoords, 2000); // 2km radius

    // Start batch upload timer
    this.startBatchUpload();

    console.log(`[LocationService] Tracking started in ${this.currentMode} mode`);
  }

  /**
   * Stop Location Tracking
   */
  stopTracking(): void {
    if (!this.isTracking) return;

    console.log('[LocationService] Stopping tracking');

    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }

    // Upload remaining batched locations
    this.uploadBatch();

    // Clear geofences
    this.geofences.clear();

    this.isTracking = false;
    this.currentDeliveryId = null;

    console.log('[LocationService] Tracking stopped');
  }

  /**
   * Handle Location Update
   */
  private handleLocationUpdate(position: GeolocationPosition): void {
    const coords: Coordinates = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed ?? undefined,
      heading: position.coords.heading ?? undefined,
      timestamp: new Date(position.timestamp).toISOString(),
    };

    console.log('[LocationService] Location update:', coords);

    // Add to batch
    this.locationBatch.push(coords);

    // If batch size reaches 5, upload immediately
    if (this.locationBatch.length >= 5) {
      this.uploadBatch();
    }
  }

  /**
   * Start Batch Upload Timer
   */
  private startBatchUpload(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }

    // Upload batch every 30 seconds
    this.batchTimer = setInterval(() => {
      this.uploadBatch();
    }, 30000);
  }

  /**
   * Upload Batched Locations to Backend
   */
  private async uploadBatch(): Promise<void> {
    if (this.locationBatch.length === 0 || !this.currentDeliveryId) {
      return;
    }

    const batch: LocationBatch = {
      deliveryId: this.currentDeliveryId,
      locations: [...this.locationBatch],
      timestamp: new Date().toISOString(),
    };

    console.log(`[LocationService] Uploading batch of ${batch.locations.length} locations`);

    // Clear batch
    this.locationBatch = [];

    try {
      // Upload each location (in production, create a batch endpoint)
      for (const location of batch.locations) {
        await deliveryApi.updateLocation(location);
      }

      console.log('[LocationService] Batch uploaded successfully');
    } catch (error) {
      console.error('[LocationService] Batch upload failed:', error);

      // Queue for offline sync
      await this.queueBatchForOfflineSync(batch);
    }
  }

  /**
   * Queue Batch for Offline Sync
   */
  private async queueBatchForOfflineSync(batch: LocationBatch): Promise<void> {
    try {
      const existingQueue = await AsyncStorage.getItem(this.BATCH_QUEUE_KEY);
      const queue: LocationBatch[] = existingQueue ? JSON.parse(existingQueue) : [];

      queue.push(batch);

      // Keep only last 100 batches
      const trimmedQueue = queue.slice(-100);

      await AsyncStorage.setItem(this.BATCH_QUEUE_KEY, JSON.stringify(trimmedQueue));
      console.log('[LocationService] Batch queued for offline sync');
    } catch (error) {
      console.error('[LocationService] Failed to queue batch:', error);
    }
  }

  /**
   * Sync Offline Queue
   */
  async syncOfflineQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem(this.BATCH_QUEUE_KEY);
      if (!queueData) return;

      const queue: LocationBatch[] = JSON.parse(queueData);
      if (queue.length === 0) return;

      console.log(`[LocationService] Syncing ${queue.length} offline batches`);

      for (const batch of queue) {
        try {
          for (const location of batch.locations) {
            await deliveryApi.updateLocation(location);
          }
        } catch (error) {
          console.error('[LocationService] Failed to sync batch:', error);
          // Keep failed batch in queue
          return;
        }
      }

      // Clear queue after successful sync
      await AsyncStorage.removeItem(this.BATCH_QUEUE_KEY);
      console.log('[LocationService] Offline queue synced successfully');
    } catch (error) {
      console.error('[LocationService] Failed to sync offline queue:', error);
    }
  }

  /**
   * Setup Geofence for Delivery Zone
   */
  private async setupGeofence(
    deliveryId: string,
    coords: Coordinates,
    radiusMeters: number
  ): Promise<void> {
    const geofence: DeliveryGeofence = {
      deliveryId,
      latitude: coords.latitude,
      longitude: coords.longitude,
      radius: radiusMeters,
    };

    this.geofences.set(deliveryId, geofence);

    try {
      // Note: Geofencing API varies by platform
      // This is a simplified version
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        await Geofencing.addCircularRegion({
          latitude: coords.latitude,
          longitude: coords.longitude,
          radius: radiusMeters,
          identifier: deliveryId,
          notifyOnEntry: true,
          notifyOnExit: true,
        });

        console.log(`[LocationService] Geofence set for delivery ${deliveryId}`);
      }
    } catch (error) {
      console.error('[LocationService] Failed to set up geofence:', error);
    }
  }

  /**
   * Handle Geofence Entry
   */
  onGeofenceEntry(deliveryId: string): void {
    console.log(`[LocationService] Entered geofence for delivery ${deliveryId}`);

    // Switch to HIGH_ACCURACY mode
    if (this.currentMode !== TrackingMode.HIGH_ACCURACY) {
      this.currentMode = TrackingMode.HIGH_ACCURACY;
      AsyncStorage.setItem(this.TRACKING_MODE_KEY, this.currentMode);

      // Restart tracking with new mode
      if (this.watchId !== null) {
        Geolocation.clearWatch(this.watchId);
        this.watchId = null;
      }

      const config = TRACKING_CONFIGS[TrackingMode.HIGH_ACCURACY];
      this.watchId = Geolocation.watchPosition(
        (position) => this.handleLocationUpdate(position),
        (error) => console.error('[LocationService] Watch position error:', error),
        {
          enableHighAccuracy: config.enableHighAccuracy,
          distanceFilter: config.distanceFilter,
          interval: config.interval,
          fastestInterval: config.interval / 2,
          showLocationDialog: true,
        }
      );
    }
  }

  /**
   * Handle Geofence Exit
   */
  onGeofenceExit(deliveryId: string): void {
    console.log(`[LocationService] Exited geofence for delivery ${deliveryId}`);

    // Switch back to NORMAL mode
    if (this.currentMode === TrackingMode.HIGH_ACCURACY) {
      this.currentMode = TrackingMode.NORMAL;
      AsyncStorage.setItem(this.TRACKING_MODE_KEY, this.currentMode);
    }
  }

  /**
   * Get Current Tracking Mode
   */
  getCurrentMode(): TrackingMode {
    return this.currentMode;
  }

  /**
   * Get Current Location
   */
  async getCurrentLocation(): Promise<Coordinates | null> {
    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const coords: Coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp).toISOString(),
          };
          resolve(coords);
        },
        (error) => {
          console.error('[LocationService] Failed to get current location:', error);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    });
  }

  /**
   * Check if Tracking is Active
   */
  isActive(): boolean {
    return this.isTracking;
  }
}

// Export singleton instance
export const locationService = new LocationService();
export default locationService;
