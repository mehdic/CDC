/**
 * Delivery Service Type Definitions
 * Shared types for route optimization and delivery management
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
 * Priority Level
 */
export type DeliveryPriority = 'low' | 'medium' | 'high' | 'urgent';

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
 * GPS Coordinates
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
}

/**
 * Patient Information
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
 * Temperature Reading
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
  priority: DeliveryPriority;
  estimatedDuration: number;
  distance: number;
  paymentMethod: 'insurance' | 'cash' | 'card' | 'prepaid';
  specialInstructions?: string;
  createdAt: string;
  assignedAt?: string;
  acceptedAt?: string;
  deliveredAt?: string;
  scheduledTime?: string;
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
 * API Response
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
