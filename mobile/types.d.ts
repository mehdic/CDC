/**
 * Type Declarations for Third-Party Libraries
 * Provides type definitions for libraries without @types support
 */

declare module 'react-native-vector-icons/MaterialCommunityIcons' {
  import { Component } from 'react';
  import { TextProps } from 'react-native';

  interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
    allowFontScaling?: boolean;
  }

  class Icon extends Component<IconProps> {}
  export = Icon;
}

/**
 * @metapharm/api-types module declaration
 * Re-exports types from the local packages/api-types
 */
declare module '@metapharm/api-types' {
  // Prescription Status Enum
  export enum PrescriptionStatus {
    PENDING = 'pending',
    TRANSCRIBING = 'transcribing',
    VALIDATING = 'validating',
    AWAITING_APPROVAL = 'awaiting_approval',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    EXPIRED = 'expired',
  }

  // Confidence Level Enum
  export enum ConfidenceLevel {
    HIGH = 'high',
    MEDIUM = 'medium',
    LOW = 'low',
  }

  // Safety Warning Level Enum
  export enum SafetyWarningLevel {
    CRITICAL = 'critical',
    WARNING = 'warning',
    INFO = 'info',
  }

  // Prescription Item Interface
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

  // Safety Warning Interface
  export interface SafetyWarning {
    id: string;
    type: 'drug_interaction' | 'allergy' | 'contraindication' | 'dosage';
    level: SafetyWarningLevel;
    message: string;
    details?: string;
    medications?: string[];
  }

  // Transcription Data Interface
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

  // Prescription Interface
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

  // API Request/Response Types
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

  // Common API Response Type
  export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
      code: string;
      message: string;
    };
  }
}
