/**
 * GDPR Data Export Interfaces
 * Defines types for GDPR Article 20 "Right to Data Portability"
 */

export enum ExportFormat {
  JSON = 'json',
  PDF = 'pdf',
}

export enum ExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

export interface ExportRequest {
  patientId: string;
  format: ExportFormat;
  requestedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface ExportJob {
  id: string;
  patientId: string;
  format: ExportFormat;
  status: ExportStatus;
  requestedAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  expiresAt?: Date;
  errorMessage?: string;
}

export interface PatientExportData {
  exportMetadata: {
    exportId: string;
    exportDate: string;
    patientId: string;
    format: ExportFormat;
    dataSubject: string; // "Patient's rights under GDPR Article 20"
  };

  personalInformation: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: string;
    status: string;
    emailVerified: boolean;
    mfaEnabled: boolean;
    createdAt: string;
    updatedAt: string;
    lastLoginAt?: string;
  };

  prescriptions: Array<{
    id: string;
    pharmacyId: string;
    source: string;
    status: string;
    prescribedDate?: string;
    expiryDate?: string;
    approvedAt?: string;
    createdAt: string;
    items: Array<{
      medicationName: string;
      dosage?: string;
      quantity: number;
      instructions?: string;
    }>;
  }>;

  orders: Array<{
    id: string;
    pharmacyId: string;
    status: string;
    totalAmount: string;
    paymentStatus: string;
    orderDate: string;
    items: Array<{
      productName: string;
      quantity: number;
      price: string;
    }>;
  }>;

  teleconsultations: Array<{
    id: string;
    pharmacyId: string;
    pharmacistId?: string;
    status: string;
    scheduledAt?: string;
    startedAt?: string;
    endedAt?: string;
    duration?: number;
    notes?: string;
  }>;

  appointments: Array<{
    id: string;
    pharmacyId: string;
    type: string;
    status: string;
    scheduledAt: string;
    notes?: string;
  }>;

  auditTrail: Array<{
    id: string;
    eventType: string;
    action: string;
    resourceType: string;
    resourceId: string;
    timestamp: string;
    ipAddress?: string;
  }>;

  communications: Array<{
    id: string;
    type: string;
    subject?: string;
    sentAt: string;
    status: string;
  }>;

  consents: Array<{
    id: string;
    consentType: string;
    granted: boolean;
    grantedAt?: string;
    revokedAt?: string;
  }>;

  payments: Array<{
    id: string;
    amount: string;
    currency: string;
    paymentMethod: string; // Anonymized (last 4 digits only)
    status: string;
    processedAt: string;
  }>;

  vipMembership?: {
    tier: string;
    points: number;
    joinedAt: string;
    expiresAt?: string;
  };
}
