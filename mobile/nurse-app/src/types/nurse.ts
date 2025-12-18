/**
 * Nurse App Type Definitions
 * Types for nurse-specific functionality
 */

/**
 * Nurse Profile
 */
export interface NurseProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  licenseNumber: string;
  specialization: string[];
  facility: string;
  hinEIDVerified: boolean;
  phoneNumber: string;
  shift: 'day' | 'night' | 'rotating';
  certifications: string[];
}

/**
 * Patient Information
 */
export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  allergies: string[];
  chronicConditions: string[];
  currentMedications: Medication[];
  insuranceId?: string;
  roomNumber?: string;
  admissionDate?: string;
}

/**
 * Medication
 */
export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  route: 'oral' | 'IV' | 'IM' | 'topical' | 'other';
  startDate: string;
  endDate?: string;
  prescribedBy: string;
  notes?: string;
}

/**
 * Medication Order
 */
export interface MedicationOrder {
  id: string;
  patientId: string;
  pharmacyId: string;
  medications: {
    medicationId: string;
    name: string;
    quantity: number;
    dosage: string;
  }[];
  urgency: 'routine' | 'urgent' | 'stat';
  status: 'pending' | 'processing' | 'ready' | 'delivered' | 'cancelled';
  orderedBy: string;
  orderedAt: string;
  estimatedDeliveryTime?: string;
  notes?: string;
}

/**
 * Pharmacy Patient Record
 */
export interface PharmacyPatientRecord {
  id: string;
  patientId: string;
  pharmacyId: string;
  pharmacyName: string;
  medicationHistory: {
    medicationId: string;
    name: string;
    dispensedDate: string;
    quantity: number;
  }[];
  allergies: string[];
  interactions: string[];
  lastUpdated: string;
}

/**
 * Delivery Tracking
 */
export interface DeliveryTracking {
  id: string;
  orderId: string;
  status: 'pending' | 'picked_up' | 'in_transit' | 'arrived' | 'delivered';
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  estimatedArrival?: string;
  deliveryPersonnel?: {
    id: string;
    name: string;
    phoneNumber: string;
  };
  trackingNotes?: string[];
}

/**
 * Administration Log Entry
 */
export interface AdministrationLog {
  id: string;
  patientId: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  route: string;
  administeredBy: string;
  administeredAt: string;
  witnessedBy?: string;
  notes?: string;
  adverseReaction?: boolean;
  reactionDetails?: string;
}

/**
 * Shift Handover Note
 */
export interface ShiftHandoverNote {
  id: string;
  fromNurse: string;
  toNurse?: string;
  shift: 'day' | 'night';
  date: string;
  patients: {
    patientId: string;
    patientName: string;
    status: string;
    criticalNotes: string;
    pendingTasks: string[];
  }[];
  generalNotes?: string;
  createdAt: string;
}

/**
 * Auth State
 */
export interface AuthState {
  isAuthenticated: boolean;
  nurse: NurseProfile | null;
  token: string | null;
  hinEIDVerified: boolean;
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
