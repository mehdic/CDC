/**
 * Patient Medical Records Types
 * Type definitions for medical records dashboard and related entities
 * Task: T8-041 - Patient Medical Records Dashboard
 */

export enum RecordType {
  ALLERGY = 'allergy',
  MEDICATION = 'medication',
  CONDITION = 'condition',
  PROCEDURE = 'procedure',
  IMMUNIZATION = 'immunization',
  LAB_RESULT = 'lab_result',
  VITAL_SIGNS = 'vital_signs',
  DIAGNOSIS = 'diagnosis',
  PRESCRIPTION = 'prescription',
  CONSULTATION = 'consultation',
  HOSPITALIZATION = 'hospitalization',
  IMAGING = 'imaging',
  OTHER = 'other',
}

export enum RecordSource {
  PATIENT_REPORTED = 'patient_reported',
  DOCTOR_ENTERED = 'doctor_entered',
  PHARMACIST_ENTERED = 'pharmacist_entered',
  NURSE_ENTERED = 'nurse_entered',
  E_SANTE_API = 'e_sante_api',
  HIN_SYSTEM = 'hin_system',
  IMPORTED = 'imported',
  TELECONSULTATION = 'teleconsultation',
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  recordType: RecordType;
  title: string;
  description: string | null;
  data: Record<string, unknown> | null;
  source: RecordSource;
  sourceId: string | null;
  recordedBy: string | null;
  recordedAt: string | null;
  consentGiven: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionData {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  prescribedBy: string;
  startDate: string;
  endDate: string | null;
  refillsAllowed: number;
  refillsRemaining: number;
  pharmacyNotes: string | null;
}

export interface LabResultData {
  testName: string;
  testCode: string;
  result: string;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'abnormal' | 'critical';
  orderedBy: string;
  performedAt: string;
  laboratory: string;
  notes: string | null;
}

export interface MedicationData {
  name: string;
  dosage: string;
  frequency: string;
  route: 'oral' | 'injection' | 'topical' | 'inhalation' | 'other';
  startDate: string;
  endDate: string | null;
  prescribedBy: string;
  pharmacy: string | null;
  refillDate: string | null;
  sideEffects: string | null;
}

export interface AllergyData {
  allergen: string;
  allergyType: 'drug' | 'food' | 'environmental' | 'other';
  severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  reaction: string;
  onsetDate: string | null;
  reportedBy: string;
  notes: string | null;
}

export interface ConditionData {
  condition: string;
  icd10Code: string | null;
  diagnosedDate: string;
  diagnosedBy: string;
  status: 'active' | 'resolved' | 'chronic' | 'in_remission';
  severity: 'mild' | 'moderate' | 'severe';
  treatment: string | null;
  notes: string | null;
}

export interface DocumentData {
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string;
  documentType: 'report' | 'image' | 'prescription' | 'lab_result' | 'other';
  url: string;
}

export interface AccessLog {
  id: string;
  recordId: string;
  patientId: string;
  userId: string;
  userRole: string;
  action: 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE' | 'SHARE';
  ipAddress: string | null;
  reason: string | null;
  timestamp: string;
}

export interface RecordCounts {
  allergy: number;
  medication: number;
  condition: number;
  procedure: number;
  immunization: number;
  lab_result: number;
  vital_signs: number;
  diagnosis: number;
  prescription: number;
  consultation: number;
  hospitalization: number;
  imaging: number;
  other: number;
  total: number;
}

export interface ShareRecordRequest {
  recordIds: string[];
  recipientId: string;
  recipientType: 'doctor' | 'pharmacist' | 'nurse' | 'healthcare_provider';
  expiresAt: string | null;
  message: string | null;
}

export interface ShareRecordResponse {
  shareId: string;
  accessToken: string;
  expiresAt: string | null;
  recordIds: string[];
  recipientId: string;
}

export interface MedicalRecordsFilters {
  recordType?: RecordType;
  activeOnly?: boolean;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface DocumentUploadRequest {
  file: File;
  recordType: RecordType;
  title: string;
  description: string | null;
}

export interface DocumentUploadResponse {
  recordId: string;
  documentUrl: string;
  uploadedAt: string;
}
