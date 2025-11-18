/**
 * Delivery Model Types and Interfaces
 */

export type DeliveryStatus = 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';

export interface Location {
  lat: number;
  lng: number;
}

export interface Delivery {
  id: string;
  orderId: string;
  pharmacyId: string;
  patientId: string;
  driverId?: string;
  pickupAddress: string;
  deliveryAddress: string;
  status: DeliveryStatus;
  currentLocation?: Location;
  estimatedDeliveryTime: string;
  actualDeliveryTime?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Database row representation (with separate lat/lng columns)
 */
export interface DeliveryRow {
  id: number;
  orderId: string;
  pharmacyId: string;
  patientId: string;
  driverId: string | null;
  pickupAddress: string;
  deliveryAddress: string;
  status: DeliveryStatus;
  currentLocationLat: number | null;
  currentLocationLng: number | null;
  estimatedDeliveryTime: string;
  actualDeliveryTime: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Convert database row to Delivery model
 */
export function rowToDelivery(row: DeliveryRow): Delivery {
  const delivery: Delivery = {
    id: String(row.id),
    orderId: row.orderId,
    pharmacyId: row.pharmacyId,
    patientId: row.patientId,
    pickupAddress: row.pickupAddress,
    deliveryAddress: row.deliveryAddress,
    status: row.status,
    estimatedDeliveryTime: row.estimatedDeliveryTime,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };

  // Optional fields
  if (row.driverId) {
    delivery.driverId = row.driverId;
  }

  if (row.actualDeliveryTime) {
    delivery.actualDeliveryTime = row.actualDeliveryTime;
  }

  if (row.currentLocationLat !== null && row.currentLocationLng !== null) {
    delivery.currentLocation = {
      lat: row.currentLocationLat,
      lng: row.currentLocationLng,
    };
  }

  return delivery;
}
