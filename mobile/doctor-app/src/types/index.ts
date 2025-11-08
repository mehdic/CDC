/**
 * TypeScript Type Definitions for Doctor App
 * Based on backend models: Prescription, PrescriptionItem, Patient, Pharmacy
 */

// ============================================================================
// User & Patient Types
// ============================================================================

export interface Patient {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  date_of_birth?: string;
  allergies?: string[];
  medical_conditions?: string[];
}

export interface Doctor {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  hin_id?: string;
  specialization?: string;
}

// ============================================================================
// Pharmacy Types
// ============================================================================

export interface Pharmacy {
  id: string;
  name: string;
  license_number: string;
  address: string;
  city: string;
  canton: string;
  postal_code: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  distance?: number; // Calculated distance from doctor/patient
}

// ============================================================================
// Medication & Drug Types
// ============================================================================

export interface Drug {
  id: string;
  name: string;
  rxnorm_code?: string;
  generic_name?: string;
  brand_names?: string[];
  common_dosages?: string[];
  common_forms?: string[];
}

export interface DrugSuggestion {
  drug: Drug;
  confidence: number;
  reason?: string; // AI suggestion reason
}

// ============================================================================
// Prescription Types
// ============================================================================

export enum PrescriptionSource {
  PATIENT_UPLOAD = 'patient_upload',
  DOCTOR_DIRECT = 'doctor_direct',
  TELECONSULTATION = 'teleconsultation',
}

export enum PrescriptionStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  CLARIFICATION_NEEDED = 'clarification_needed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export interface PrescriptionItem {
  id?: string;
  medication_name: string;
  medication_rxnorm_code?: string;
  dosage: string;
  frequency: string;
  duration?: string;
  quantity?: number;
  form?: string; // tablet, capsule, liquid, etc.
}

export interface Prescription {
  id?: string;
  pharmacy_id: string;
  patient_id: string;
  prescribing_doctor_id: string;
  source: PrescriptionSource;
  status?: PrescriptionStatus;
  items: PrescriptionItem[];
  prescribed_date?: Date;
  expiry_date?: Date;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreatePrescriptionRequest {
  pharmacy_id: string;
  patient_id: string;
  items: PrescriptionItem[];
  prescribed_date: string; // ISO date string
  notes?: string;
}

export interface CreatePrescriptionResponse {
  success: boolean;
  prescription: Prescription;
  message?: string;
}

// ============================================================================
// Form State Types
// ============================================================================

export interface DosagePickerState {
  form: string; // tablet, capsule, liquid, injection, cream, etc.
  strength: string; // e.g., "500mg", "10ml"
  frequency: string; // e.g., "twice daily", "every 8 hours"
  duration: string; // e.g., "7 days", "2 weeks"
  quantity?: number;
}

export interface PrescriptionFormState {
  patient?: Patient;
  pharmacy?: Pharmacy;
  items: PrescriptionItem[];
  prescribed_date: Date;
  notes?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
