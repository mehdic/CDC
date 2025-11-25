/**
 * Nurse App - Type Definitions
 * Comprehensive TypeScript types for nurse workflows
 */

export interface Nurse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  hinId: string; // HIN e-ID for Swiss healthcare
  licenseNumber: string;
  specialization?: string;
  facility: string;
  department: string;
  shiftSchedule?: ShiftSchedule;
  profilePicture?: string;
  verified: boolean;
  mfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftSchedule {
  currentShift?: Shift;
  upcomingShifts: Shift[];
}

export interface Shift {
  id: string;
  startTime: string;
  endTime: string;
  department: string;
  assignedPatients: string[];
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  roomNumber?: string;
  bedNumber?: string;
  mrn: string; // Medical Record Number
  insuranceId?: string;
  allergies: string[];
  chronicConditions: string[];
  currentMedications: Medication[];
  profilePicture?: string;
  admissionDate?: string;
  status: 'active' | 'discharged' | 'transferred';
}

export interface Medication {
  id: string;
  name: string;
  genericName?: string;
  dosage: string;
  unit: string;
  frequency: string;
  route: 'oral' | 'iv' | 'im' | 'subcutaneous' | 'topical' | 'inhalation' | 'other';
  prescriptionId: string;
  prescribedBy: string;
  startDate: string;
  endDate?: string;
  instructions?: string;
  barcode?: string;
  status: 'active' | 'completed' | 'discontinued';
  administrationSchedule: AdministrationSchedule[];
}

export interface AdministrationSchedule {
  scheduledTime: string;
  administered: boolean;
  administeredAt?: string;
  administeredBy?: string;
  dosageGiven?: string;
  notes?: string;
  skipped?: boolean;
  skipReason?: string;
}

export interface MedicationAdministration {
  id: string;
  patientId: string;
  medicationId: string;
  scheduledTime: string;
  administeredAt: string;
  administeredBy: string;
  dosage: string;
  route: string;
  notes?: string;
  barcodeVerified: boolean;
  sideEffects?: string[];
  witnessed?: boolean;
  witnessedBy?: string;
}

export interface MedicationOrder {
  id: string;
  patientId: string;
  patientName: string;
  nurseName: string;
  nurseId: string;
  pharmacyId: string;
  pharmacyName: string;
  medications: OrderMedication[];
  urgency: 'routine' | 'urgent' | 'stat';
  requiredBy?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'dispatched' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  estimatedDeliveryTime?: string;
  deliveryTracking?: DeliveryTracking;
}

export interface OrderMedication {
  medicationId: string;
  name: string;
  dosage: string;
  quantity: number;
  prescriptionId: string;
  validated: boolean;
}

export interface DeliveryTracking {
  orderId: string;
  status: 'pending' | 'picked_up' | 'in_transit' | 'arrived' | 'delivered';
  currentLocation?: string;
  estimatedArrival: string;
  deliveryPersonnel?: {
    id: string;
    name: string;
    phone: string;
  };
  updates: DeliveryUpdate[];
}

export interface DeliveryUpdate {
  timestamp: string;
  status: string;
  location?: string;
  notes?: string;
}

export interface PatientRecord {
  id: string;
  patientId: string;
  type: 'prescription' | 'lab_result' | 'visit_note' | 'medication_history' | 'allergy';
  date: string;
  description: string;
  provider: string;
  content: any;
  attachments?: string[];
  accessGranted: boolean;
  accessGrantedBy?: string;
  accessGrantedAt?: string;
}

export interface AdverseReaction {
  id: string;
  patientId: string;
  medicationId: string;
  medicationName: string;
  reactionType: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  symptoms: string[];
  onsetTime: string;
  reportedBy: string;
  reportedAt: string;
  actionTaken: string;
  resolved: boolean;
  resolvedAt?: string;
  notes?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'nurse' | 'pharmacist' | 'doctor';
  recipientId: string;
  recipientName: string;
  recipientType: 'nurse' | 'pharmacist' | 'doctor';
  subject?: string;
  content: string;
  patientId?: string;
  prescriptionId?: string;
  orderId?: string;
  attachments?: MessageAttachment[];
  read: boolean;
  readAt?: string;
  urgent: boolean;
  createdAt: string;
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
}

export interface HandoverNote {
  id: string;
  patientId: string;
  patientName: string;
  shiftFrom: string;
  shiftTo: string;
  handoverFrom: string;
  handoverTo?: string;
  date: string;
  summary: string;
  medicationsGiven: string[];
  pendingMedications: string[];
  observations: string;
  concerns: string[];
  planOfCare: string;
  followUpRequired: boolean;
  acknowledged: boolean;
  acknowledgedAt?: string;
}

export interface Notification {
  id: string;
  type: 'medication_due' | 'order_update' | 'delivery_arrival' | 'message' | 'shift_handover' | 'urgent';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

export interface AuthState {
  nurse: Nurse | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  mfaRequired: boolean;
  loading: boolean;
  error: string | null;
}

export interface PatientState {
  patients: Patient[];
  selectedPatient: Patient | null;
  loading: boolean;
  error: string | null;
}

export interface MedicationState {
  medications: Medication[];
  administrations: MedicationAdministration[];
  orders: MedicationOrder[];
  loading: boolean;
  error: string | null;
}

export interface MessagingState {
  conversations: Message[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}

export type RootState = {
  auth: AuthState;
  patients: PatientState;
  medications: MedicationState;
  messaging: MessagingState;
  notifications: NotificationState;
};
