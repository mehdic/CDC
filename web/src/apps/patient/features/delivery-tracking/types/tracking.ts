/**
 * Patient Delivery Tracking Types
 * T8-042: Patient Delivery Tracking (Uber-style)
 * Type-safe definitions for real-time delivery tracking
 */

/**
 * GPS Coordinates
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp?: string;
}

/**
 * Delivery Status Type
 */
export type DeliveryStatus =
  | 'pending'
  | 'assigned'
  | 'accepted'
  | 'in_transit'
  | 'arrived'
  | 'delivered'
  | 'failed'
  | 'cancelled';

/**
 * Driver Information
 */
export interface DriverInfo {
  id: string;
  name: string;
  phone?: string;
  photo_url?: string;
  rating?: number;
  total_deliveries?: number;
}

/**
 * Delivery Proof
 */
export interface DeliveryProof {
  signature_image?: string;
  photo_image?: string;
  recipient_name?: string;
  timestamp: string;
  location?: Coordinates;
  notes?: string;
}

/**
 * Delivery Rating
 */
export interface DeliveryRating {
  rating: number; // 1-5
  comment?: string;
  timestamp: string;
  driver_id: string;
}

/**
 * Delivery Tracking Data
 */
export interface DeliveryTracking {
  delivery_id: string;
  status: DeliveryStatus;
  current_location: Coordinates | null;
  destination_location?: Coordinates;
  eta_minutes: number | null;
  distance_remaining_km: number | null;
  location_history: Coordinates[];
  driver_info: DriverInfo | null;
  delivery_proof?: DeliveryProof;
  rating?: DeliveryRating;
  last_updated: string | null;
  created_at: string;
  picked_up_at?: string;
  delivered_at?: string;
}

/**
 * Notification Type
 */
export type NotificationType = 'assigned' | 'picked_up' | 'in_transit' | 'arrived' | 'delivered';

/**
 * Notification Data
 */
export interface DeliveryNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  delivery_id: string;
  read: boolean;
}

/**
 * WebSocket Message Types
 */
export type WebSocketMessageType =
  | 'location_update'
  | 'status_update'
  | 'eta_update'
  | 'delivery_complete';

/**
 * WebSocket Message
 */
export interface WebSocketMessage {
  type: WebSocketMessageType;
  delivery_id: string;
  data: Partial<DeliveryTracking>;
  timestamp: string;
}
