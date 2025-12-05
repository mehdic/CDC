/**
 * Delivery App TypeScript Type Definitions
 * Defines all types for delivery management, GPS tracking, and verification
 */

/**
 * Delivery Status
 */
export type DeliveryStatus =
  | 'pending'
  | 'assigned'
  | 'accepted'
  | 'in_transit'
  | 'arrived'
  | 'delivered'
  | 'failed'
  | 'returned';

/**
 * Special Handling Requirements
 */
export type SpecialHandling =
  | 'cold_chain'
  | 'narcotics'
  | 'signature_required'
  | 'id_verification'
  | 'time_sensitive';

/**
 * Failure Reasons
 */
export type FailureReason =
  | 'patient_absent'
  | 'wrong_address'
  | 'refused_delivery'
  | 'access_denied'
  | 'other';

/**
 * Address Information
 */
export interface Address {
  street: string;
  city: string;
  postalCode: string;
  canton: string;
  country: string;
  latitude?: number;
  longitude?: number;
  instructions?: string;
}

/**
 * Patient Information (minimal for delivery)
 */
export interface DeliveryPatient {
  id: string;
  name: string;
  phone: string;
  address: Address;
  availabilityWindow?: {
    start: string;
    end: string;
  };
}

/**
 * Medication Item
 */
export interface MedicationItem {
  id: string;
  name: string;
  quantity: number;
  dosage: string;
  requiresColdChain: boolean;
  isControlledSubstance: boolean;
}

/**
 * Delivery Package
 */
export interface DeliveryPackage {
  id: string;
  qrCode: string;
  medications: MedicationItem[];
  specialHandling: SpecialHandling[];
  temperatureLog?: TemperatureReading[];
}

/**
 * Temperature Reading (for cold chain)
 */
export interface TemperatureReading {
  timestamp: string;
  temperature: number;
  withinRange: boolean;
}

/**
 * Delivery Request
 */
export interface DeliveryRequest {
  id: string;
  pharmacyId: string;
  pharmacyName: string;
  patient: DeliveryPatient;
  packages: DeliveryPackage[];
  status: DeliveryStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedDuration: number; // minutes
  distance: number; // kilometers
  paymentMethod: 'insurance' | 'cash' | 'card' | 'prepaid';
  specialInstructions?: string;
  createdAt: string;
  assignedAt?: string;
  acceptedAt?: string;
  deliveredAt?: string;
  scheduledTime?: string;
}

/**
 * GPS Coordinates
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

/**
 * Delivery Constraints
 */
export interface DeliveryConstraints {
  coldChain: boolean;
  controlledSubstance: boolean;
  idVerificationRequired: boolean;
}

/**
 * Route Waypoint
 */
export interface Waypoint {
  deliveryId: string;
  address: Address;
  coordinates: Coordinates;
  sequence: number;
  estimatedArrival: string;
  completed: boolean;
  constraints: DeliveryConstraints;
}

/**
 * Optimized Route
 */
export interface DeliveryRoute {
  id: string;
  deliveryIds: string[];
  waypoints: Waypoint[];
  totalDistance: number; // kilometers
  totalDuration: number; // minutes
  optimizedAt: string;
  currentWaypointIndex: number;
}

/**
 * Proof of Delivery
 */
export interface ProofOfDelivery {
  deliveryId: string;
  signatureImage?: string;
  photoImage?: string;
  idVerificationImage?: string;
  recipientName?: string;
  timestamp: string;
  location: Coordinates;
  notes?: string;
}

/**
 * Delivery Statistics
 */
export interface DeliveryStats {
  today: {
    completed: number;
    earnings: number;
    distance: number;
    onTimeRate: number;
  };
  week: {
    completed: number;
    earnings: number;
    distance: number;
    onTimeRate: number;
  };
  month: {
    completed: number;
    earnings: number;
    distance: number;
    onTimeRate: number;
  };
}

/**
 * Delivery Personnel Profile
 */
export interface DeliveryPersonnelProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicleType: 'bike' | 'scooter' | 'car' | 'van';
  licensePlate?: string;
  badgeNumber: string;
  isActive: boolean;
  currentLocation?: Coordinates;
  rating: number;
  totalDeliveries: number;
}

/**
 * Auth State
 */
export interface AuthState {
  isAuthenticated: boolean;
  personnel: DeliveryPersonnelProfile | null;
  token: string | null;
  hinEIDVerified: boolean;
}

/**
 * Delivery State (Redux)
 */
export interface DeliveryState {
  requests: DeliveryRequest[];
  activeDelivery: DeliveryRequest | null;
  route: DeliveryRoute | null;
  currentLocation: Coordinates | null;
  locationHistory: Coordinates[];
  isTracking: boolean;
  stats: DeliveryStats | null;
  syncQueue: SyncQueueItem[];
  isOnline: boolean;
}

/**
 * Sync Queue Item (for offline mode)
 */
export interface SyncQueueItem {
  id: string;
  type: 'status_update' | 'location_update' | 'proof_of_delivery' | 'acceptance';
  data: any;
  timestamp: string;
  retryCount: number;
}

/**
 * API Response Types
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
