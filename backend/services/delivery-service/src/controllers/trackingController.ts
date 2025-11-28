/**
 * Tracking Controller
 * Handles delivery location tracking and ETA calculations
 * T3-053: Create Delivery Tracking API
 */

import { Request, Response } from 'express';
import { DataSource } from 'typeorm';
import { Delivery, DeliveryStatus } from '@models/Delivery';
import { User } from '@models/User';

/**
 * Coordinates Interface
 */
interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

/**
 * Location Update Interface
 */
interface LocationUpdate extends Coordinates {
  battery_level?: number;
}

/**
 * Location History Entry Interface
 */
interface LocationHistoryEntry {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

/**
 * Calculate Haversine Distance Between Two Coordinates
 * Returns distance in kilometers
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
 * Calculate ETA in Minutes
 */
function calculateETA(
  currentLocation: Coordinates,
  destinationLocation: Coordinates,
  averageSpeed: number = 40 // km/h
): number {
  // Haversine distance (straight line)
  const straightLineDistance = calculateDistance(currentLocation, destinationLocation);

  // Apply routing factor (roads aren't straight)
  const routingFactor = 1.3; // 30% longer than straight line
  const actualDistance = straightLineDistance * routingFactor;

  // Calculate time
  const travelTimeHours = actualDistance / averageSpeed;
  const travelTimeMinutes = Math.ceil(travelTimeHours * 60);

  // Add buffer for delivery stop
  const stopTimeMinutes = 5;

  return travelTimeMinutes + stopTimeMinutes;
}

/**
 * Validate Location Update
 */
function validateLocationUpdate(location: LocationUpdate): string | null {
  // Check required fields
  if (!location.latitude || !location.longitude || !location.timestamp) {
    return 'Missing required fields: latitude, longitude, timestamp';
  }

  // Validate latitude range
  if (location.latitude < -90 || location.latitude > 90) {
    return 'Invalid latitude: must be between -90 and 90';
  }

  // Validate longitude range
  if (location.longitude < -180 || location.longitude > 180) {
    return 'Invalid longitude: must be between -180 and 180';
  }

  // Validate accuracy (if provided)
  if (location.accuracy !== undefined && location.accuracy > 100) {
    return 'GPS accuracy too low: must be < 100 meters';
  }

  // Validate timestamp (not in future)
  const timestamp = new Date(location.timestamp);
  const now = new Date();
  if (timestamp > now) {
    return 'Timestamp cannot be in the future';
  }

  // Validate timestamp (not too old - max 5 minutes)
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  if (timestamp < fiveMinutesAgo) {
    return 'Timestamp too old: must be within last 5 minutes';
  }

  return null; // Valid
}

/**
 * Validate Geofence (Ensure Location is Reasonable)
 */
function validateGeofence(
  location: Coordinates,
  deliveryAddress: Coordinates,
  maxRadiusKm: number = 50
): boolean {
  const distance = calculateDistance(location, deliveryAddress);
  return distance <= maxRadiusKm;
}

/**
 * POST /tracking/:id/location
 * Update driver location for a delivery
 */
export async function updateDeliveryLocation(req: Request, res: Response): Promise<void> {
  try {
    const dataSource: DataSource = req.app.locals.dataSource;
    const deliveryRepo = dataSource.getRepository(Delivery);

    const { id } = req.params;
    const locationUpdate: LocationUpdate = req.body;

    // Validate location update
    const validationError = validateLocationUpdate(locationUpdate);
    if (validationError) {
      res.status(400).json({
        error: 'Invalid location update',
        message: validationError,
      });
      return;
    }

    // Find delivery
    const delivery = await deliveryRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!delivery) {
      res.status(404).json({
        error: 'Delivery not found',
      });
      return;
    }

    // Check if delivery is in a state that allows tracking
    if (
      delivery.status !== DeliveryStatus.ASSIGNED &&
      delivery.status !== DeliveryStatus.IN_TRANSIT
    ) {
      res.status(400).json({
        error: 'Delivery not in trackable state',
        status: delivery.status,
      });
      return;
    }

    // Get existing tracking info
    const trackingInfo = (delivery.tracking_info as any) || {};

    // Add current location
    trackingInfo.current_location = {
      latitude: locationUpdate.latitude,
      longitude: locationUpdate.longitude,
      accuracy: locationUpdate.accuracy,
      speed: locationUpdate.speed,
      heading: locationUpdate.heading,
      timestamp: locationUpdate.timestamp,
    };

    // Initialize location history if not exists
    if (!trackingInfo.location_history) {
      trackingInfo.location_history = [];
    }

    // Add to location history
    trackingInfo.location_history.push({
      latitude: locationUpdate.latitude,
      longitude: locationUpdate.longitude,
      accuracy: locationUpdate.accuracy,
      speed: locationUpdate.speed,
      heading: locationUpdate.heading,
      timestamp: locationUpdate.timestamp,
    });

    // Keep only last 100 points in history
    if (trackingInfo.location_history.length > 100) {
      trackingInfo.location_history = trackingInfo.location_history.slice(-100);
    }

    // Store battery level (for analytics)
    if (locationUpdate.battery_level !== undefined) {
      trackingInfo.battery_level = locationUpdate.battery_level;
    }

    // Update last_updated timestamp
    trackingInfo.last_updated = new Date().toISOString();

    // Save tracking info
    delivery.tracking_info = trackingInfo;
    await deliveryRepo.save(delivery);

    console.log(`✅ Updated location for delivery ${id}`);

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      delivery_id: id,
      timestamp: trackingInfo.last_updated,
    });
  } catch (error: any) {
    console.error('[Tracking Controller] Update location error:', error);
    res.status(500).json({
      error: 'Failed to update location',
      message: error.message,
    });
  }
}

/**
 * GET /tracking/:id
 * Get delivery tracking information
 */
export async function getDeliveryTracking(req: Request, res: Response): Promise<void> {
  try {
    const dataSource: DataSource = req.app.locals.dataSource;
    const deliveryRepo = dataSource.getRepository(Delivery);
    const userRepo = dataSource.getRepository(User);

    const { id } = req.params;

    // Find delivery
    const delivery = await deliveryRepo.findOne({
      where: { id },
      relations: ['user', 'delivery_personnel'],
    });

    if (!delivery) {
      res.status(404).json({
        error: 'Delivery not found',
      });
      return;
    }

    const trackingInfo = (delivery.tracking_info as any) || {};
    const currentLocation = trackingInfo.current_location || null;

    // If no current location, return basic info
    if (!currentLocation) {
      res.status(200).json({
        delivery_id: id,
        status: delivery.status,
        current_location: null,
        eta_minutes: null,
        distance_remaining_km: null,
        location_history: [],
        driver_info: null,
      });
      return;
    }

    // Calculate ETA and distance (we need destination coordinates)
    // For now, we'll use a placeholder. In production, decrypt delivery_address_encrypted
    // and geocode it to get coordinates
    const destinationCoords: Coordinates = {
      latitude: 47.3769, // Zurich - different location for testing
      longitude: 8.5417, // Zurich coordinates
      timestamp: new Date().toISOString(),
    };

    const etaMinutes = calculateETA(currentLocation, destinationCoords);
    const distanceRemainingKm = Math.round(calculateDistance(currentLocation, destinationCoords) * 100) / 100;

    // Get driver info
    let driverInfo = null;
    if (delivery.delivery_personnel_id) {
      const driver = await userRepo.findOne({
        where: { id: delivery.delivery_personnel_id },
        select: ['id', 'email'],
      });

      if (driver) {
        driverInfo = {
          id: driver.id,
          name: 'Delivery Personnel', // Name is encrypted, use placeholder for now
          // In production, decrypt first_name_encrypted and last_name_encrypted
          // photo_url: driver.photo_url, // If available
        };
      }
    }

    // Get location history (last 20 points)
    const locationHistory: LocationHistoryEntry[] = trackingInfo.location_history
      ? trackingInfo.location_history.slice(-20)
      : [];

    res.status(200).json({
      delivery_id: id,
      status: delivery.status,
      current_location: currentLocation,
      eta_minutes: etaMinutes,
      distance_remaining_km: distanceRemainingKm,
      location_history: locationHistory,
      driver_info: driverInfo,
      last_updated: trackingInfo.last_updated || null,
    });
  } catch (error: any) {
    console.error('[Tracking Controller] Get tracking error:', error);
    res.status(500).json({
      error: 'Failed to get tracking information',
      message: error.message,
    });
  }
}

/**
 * GET /tracking/:id/history
 * Get full location history for a delivery
 */
export async function getLocationHistory(req: Request, res: Response): Promise<void> {
  try {
    const dataSource: DataSource = req.app.locals.dataSource;
    const deliveryRepo = dataSource.getRepository(Delivery);

    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);

    // Find delivery
    const delivery = await deliveryRepo.findOne({
      where: { id },
    });

    if (!delivery) {
      res.status(404).json({
        error: 'Delivery not found',
      });
      return;
    }

    const trackingInfo = (delivery.tracking_info as any) || {};
    const locationHistory: LocationHistoryEntry[] = trackingInfo.location_history || [];

    // Apply limit
    const limitedHistory = locationHistory.slice(-limit);

    res.status(200).json({
      delivery_id: id,
      location_history: limitedHistory,
      count: limitedHistory.length,
      total_count: locationHistory.length,
    });
  } catch (error: any) {
    console.error('[Tracking Controller] Get history error:', error);
    res.status(500).json({
      error: 'Failed to get location history',
      message: error.message,
    });
  }
}
