/**
 * Prescription API Type Definitions
 * Shared types for prescription-related API requests and responses
 */

export enum PrescriptionStatus {
  PENDING = 'pending',
  TRANSCRIBING = 'transcribing',
  VALIDATING = 'validating',
  AWAITING_APPROVAL = 'awaiting_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum ConfidenceLevel {
  HIGH = 'high',      // >= 95%
  MEDIUM = 'medium',  // 80-94%
  LOW = 'low',        // < 80%
}

export enum SafetyWarningLevel {
  CRITICAL = 'critical',
  WARNING = 'warning',
  INFO = 'info',
}

export interface PrescriptionItem {
  id: string;
  medicationName: string;
  medicationId?: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity?: number;
  instructions?: string;
  confidenceScore?: number;
  confidenceLevel?: ConfidenceLevel;
}

export interface SafetyWarning {
  id: string;
  type: 'drug_interaction' | 'allergy' | 'contraindication' | 'dosage';
  level: SafetyWarningLevel;
  message: string;
  details?: string;
  medications?: string[];
}

export interface TranscriptionData {
  medications: PrescriptionItem[];
  prescribingDoctor?: {
    name: string;
    licenseNumber?: string;
    confidenceScore?: number;
  };
  patientInfo?: {
    name: string;
    confidenceScore?: number;
  };
  prescriptionDate?: string;
  overallConfidence: number;
  lowConfidenceFields: string[];
}

export interface Prescription {
  id: string;
  patientId: string;
  status: PrescriptionStatus;
  imageUrl: string;
  thumbnailUrl?: string;
  transcriptionData?: TranscriptionData;
  safetyWarnings?: SafetyWarning[];
  prescribingDoctorId?: string;
  prescribingDoctorName?: string;
  pharmacyId?: string;
  pharmacistId?: string;
  pharmacistName?: string;
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  notes?: string;
}

export interface CreatePrescriptionRequest {
  patientId: string;
  imageBase64: string;
  imageMimeType: string;
}

export interface CreatePrescriptionResponse {
  prescription: Prescription;
  uploadUrl?: string;
}

export interface TranscribePrescriptionRequest {
  prescriptionId: string;
}

export interface TranscribePrescriptionResponse {
  prescription: Prescription;
  transcriptionData: TranscriptionData;
}

export interface ListPrescriptionsRequest {
  patientId?: string;
  status?: PrescriptionStatus[];
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface ListPrescriptionsResponse {
  prescriptions: Prescription[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface GetPrescriptionRequest {
  prescriptionId: string;
}

export interface GetPrescriptionResponse {
  prescription: Prescription;
}

export interface ApprovePrescriptionRequest {
  prescriptionId: string;
  notes?: string;
}

export interface ApprovePrescriptionResponse {
  prescription: Prescription;
  treatmentPlan?: {
    id: string;
    prescriptionId: string;
    medications: PrescriptionItem[];
    startDate: string;
    endDate?: string;
  };
}

export interface RejectPrescriptionRequest {
  prescriptionId: string;
  reason: string;
  notes?: string;
}

export interface RejectPrescriptionResponse {
  prescription: Prescription;
}
