/**
 * GDPR Deletion Service
 * Implements Right to Be Forgotten (GDPR Article 17) with 30-day cooling-off period
 *
 * Features:
 * - 30-day cooling-off period before deletion execution
 * - Confirmation workflow (patient must confirm after 30 days)
 * - Cancellation support
 * - Legal data retention (Swiss law compliance)
 * - Audit trail with anonymized IDs
 */

import * as crypto from 'crypto';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface DeletionRequest {
  requestId: string;
  patientId: string;
  requestedAt: Date;
  scheduledFor: Date; // 30 days after request
  status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
  confirmedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  deletionReport?: DeletionReport;
}

export interface DeletionReport {
  servicesProcessed: string[];
  recordsDeleted: number;
  recordsAnonymized: number;
  retainedCategories: string[]; // Legal retention requirements
  completedAt: Date;
}

// Legal retention requirements (Swiss law)
export const RETENTION_REQUIREMENTS = {
  prescriptions: { years: 10, action: 'anonymize' as const },
  controlled_substances: { years: 10, action: 'anonymize' as const },
  financial_records: { years: 7, action: 'anonymize' as const },
  medical_records: { years: 20, action: 'anonymize' as const },
  audit_logs: { years: 5, action: 'anonymize' as const },
};

export interface ServiceDeletionResult {
  service: string;
  status: 'deleted' | 'anonymized' | 'retained_legal' | 'failed';
  recordsAffected: number;
  message?: string;
}

// ============================================================================
// In-Memory Storage (Replace with database in production)
// ============================================================================

const deletionRequests: Map<string, DeletionRequest> = new Map();

// Mock data stores (these would be actual service calls in production)
const mockUserData = new Map<string, any>();
const mockPrescriptionData = new Map<string, any[]>();
const mockOrderData = new Map<string, any[]>();
const mockMessageData = new Map<string, any[]>();
const mockAppointmentData = new Map<string, any[]>();
const mockMedicalRecordData = new Map<string, any[]>();
const mockDeliveryData = new Map<string, any[]>();
const mockPaymentData = new Map<string, any[]>();
const mockTeleconsultationData = new Map<string, any[]>();

// ============================================================================
// Helper Functions
// ============================================================================

function generateRequestId(): string {
  return `deletion-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Hash patient/user ID for safe logging (GDPR compliance)
 * Never log raw user IDs to prevent PII leakage
 */
export function hashForLogging(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex').substring(0, 8);
}

function calculateScheduledDate(): Date {
  const now = new Date();
  const scheduledDate = new Date(now);
  scheduledDate.setDate(scheduledDate.getDate() + 30); // 30-day cooling-off period
  return scheduledDate;
}

// ============================================================================
// Deletion Service Functions
// ============================================================================

/**
 * Create a new deletion request with 30-day cooling-off period
 */
export function createDeletionRequest(patientId: string): DeletionRequest {
  const requestId = generateRequestId();
  const now = new Date();
  const scheduledFor = calculateScheduledDate();

  const request: DeletionRequest = {
    requestId,
    patientId,
    requestedAt: now,
    scheduledFor,
    status: 'pending',
  };

  deletionRequests.set(requestId, request);

  console.log(
    `📝 GDPR Deletion: Created request ${requestId} for user ${hashForLogging(patientId)} - scheduled for ${scheduledFor.toISOString()}`
  );

  return request;
}

/**
 * Get deletion request by ID
 */
export function getDeletionRequest(requestId: string): DeletionRequest | undefined {
  return deletionRequests.get(requestId);
}

/**
 * Get all deletion requests for a patient
 */
export function getPatientDeletionRequests(patientId: string): DeletionRequest[] {
  return Array.from(deletionRequests.values()).filter((req) => req.patientId === patientId);
}

/**
 * Confirm a deletion request (after cooling-off period)
 */
export function confirmDeletionRequest(requestId: string): DeletionRequest {
  const request = deletionRequests.get(requestId);

  if (!request) {
    throw new Error(`Deletion request ${requestId} not found`);
  }

  if (request.status !== 'pending') {
    throw new Error(`Deletion request ${requestId} is not in pending status (current: ${request.status})`);
  }

  // Check if cooling-off period has passed
  const now = new Date();
  if (now < request.scheduledFor) {
    const remainingDays = Math.ceil((request.scheduledFor.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    throw new Error(`Cooling-off period not complete. Please wait ${remainingDays} more day(s)`);
  }

  request.status = 'confirmed';
  request.confirmedAt = now;

  console.log(`✅ GDPR Deletion: Confirmed request ${requestId} for user ${hashForLogging(request.patientId)}`);

  return request;
}

/**
 * Cancel a deletion request (before execution)
 */
export function cancelDeletionRequest(requestId: string): DeletionRequest {
  const request = deletionRequests.get(requestId);

  if (!request) {
    throw new Error(`Deletion request ${requestId} not found`);
  }

  if (request.status === 'completed') {
    throw new Error('Cannot cancel a completed deletion request');
  }

  if (request.status === 'processing') {
    throw new Error('Cannot cancel a deletion request that is currently processing');
  }

  request.status = 'cancelled';
  request.cancelledAt = new Date();

  console.log(`❌ GDPR Deletion: Cancelled request ${requestId} for user ${hashForLogging(request.patientId)}`);

  return request;
}

/**
 * Execute deletion across all services (anonymize where legally required)
 */
export async function executeDeletion(requestId: string): Promise<DeletionRequest> {
  const request = deletionRequests.get(requestId);

  if (!request) {
    throw new Error(`Deletion request ${requestId} not found`);
  }

  if (request.status !== 'confirmed') {
    throw new Error(`Deletion request ${requestId} must be confirmed before execution (current: ${request.status})`);
  }

  request.status = 'processing';

  console.log(`⚙️ GDPR Deletion: Processing request ${requestId} for user ${hashForLogging(request.patientId)}`);

  // Process deletion across all services
  const results = await deleteUserDataAcrossServices(request.patientId);

  // Calculate statistics
  const recordsDeleted = results
    .filter((r) => r.status === 'deleted')
    .reduce((sum, r) => sum + r.recordsAffected, 0);

  const recordsAnonymized = results
    .filter((r) => r.status === 'anonymized' || r.status === 'retained_legal')
    .reduce((sum, r) => sum + r.recordsAffected, 0);

  const retainedCategories = results
    .filter((r) => r.status === 'retained_legal')
    .map((r) => `${r.service}: ${r.message || 'Retained per legal requirements'}`);

  // Create deletion report
  const deletionReport: DeletionReport = {
    servicesProcessed: results.map((r) => r.service),
    recordsDeleted,
    recordsAnonymized,
    retainedCategories,
    completedAt: new Date(),
  };

  request.deletionReport = deletionReport;
  request.status = 'completed';
  request.completedAt = new Date();

  console.log(
    `✅ GDPR Deletion: Completed request ${requestId} for user ${hashForLogging(request.patientId)} - deleted: ${recordsDeleted}, anonymized: ${recordsAnonymized}`
  );

  return request;
}

/**
 * Delete/anonymize user data across all services
 * Follows Swiss legal retention requirements
 */
async function deleteUserDataAcrossServices(patientId: string): Promise<ServiceDeletionResult[]> {
  const results: ServiceDeletionResult[] = [];

  // User Service - Anonymize basic profile
  if (mockUserData.has(patientId)) {
    const user = mockUserData.get(patientId);
    mockUserData.set(patientId, {
      ...user,
      email: `anonymized-${patientId}@deleted.local`,
      firstName: 'ANONYMIZED',
      lastName: 'ANONYMIZED',
      phone: null,
      address: null,
      status: 'deleted',
    });
    results.push({
      service: 'user-service',
      status: 'anonymized',
      recordsAffected: 1,
      message: 'User profile anonymized',
    });
  } else {
    results.push({
      service: 'user-service',
      status: 'deleted',
      recordsAffected: 0,
      message: 'No user data found',
    });
  }

  // Prescription Service - Anonymize (10-year retention per Swiss law)
  const prescriptions = mockPrescriptionData.get(patientId) || [];
  if (prescriptions.length > 0) {
    // Anonymize prescriptions while keeping medical data for legal compliance
    mockPrescriptionData.set(
      patientId,
      prescriptions.map((p) => ({
        ...p,
        patientName: 'ANONYMIZED',
        patientId: `anon-${crypto.randomBytes(8).toString('hex')}`,
      }))
    );
    results.push({
      service: 'prescription-service',
      status: 'retained_legal',
      recordsAffected: prescriptions.length,
      message: `Anonymized per Swiss healthcare law (${RETENTION_REQUIREMENTS.prescriptions.years}-year retention)`,
    });
  } else {
    mockPrescriptionData.delete(patientId);
    results.push({
      service: 'prescription-service',
      status: 'deleted',
      recordsAffected: 0,
    });
  }

  // Order Service - Anonymize (7-year retention for invoices per Swiss tax law)
  const orders = mockOrderData.get(patientId) || [];
  if (orders.length > 0) {
    mockOrderData.set(
      patientId,
      orders.map((o) => ({
        ...o,
        customerName: 'ANONYMIZED',
        customerId: `anon-${crypto.randomBytes(8).toString('hex')}`,
        deliveryAddress: 'ANONYMIZED',
      }))
    );
    results.push({
      service: 'order-service',
      status: 'retained_legal',
      recordsAffected: orders.length,
      message: `Anonymized per Swiss tax law (${RETENTION_REQUIREMENTS.financial_records.years}-year retention for invoices)`,
    });
  } else {
    mockOrderData.delete(patientId);
    results.push({
      service: 'order-service',
      status: 'deleted',
      recordsAffected: 0,
    });
  }

  // Message Service - Delete all messages
  const messages = mockMessageData.get(patientId) || [];
  mockMessageData.delete(patientId);
  results.push({
    service: 'messaging-service',
    status: 'deleted',
    recordsAffected: messages.length,
  });

  // Appointment Service - Delete appointments
  const appointments = mockAppointmentData.get(patientId) || [];
  mockAppointmentData.delete(patientId);
  results.push({
    service: 'appointment-service',
    status: 'deleted',
    recordsAffected: appointments.length,
  });

  // Medical Records Service - Anonymize (20-year retention per Swiss healthcare law)
  const medicalRecords = mockMedicalRecordData.get(patientId) || [];
  if (medicalRecords.length > 0) {
    mockMedicalRecordData.set(
      patientId,
      medicalRecords.map((m) => ({
        ...m,
        patientName: 'ANONYMIZED',
        patientId: `anon-${crypto.randomBytes(8).toString('hex')}`,
      }))
    );
    results.push({
      service: 'medical-records-service',
      status: 'retained_legal',
      recordsAffected: medicalRecords.length,
      message: `Anonymized per Swiss healthcare law (${RETENTION_REQUIREMENTS.medical_records.years}-year retention)`,
    });
  } else {
    mockMedicalRecordData.delete(patientId);
    results.push({
      service: 'medical-records-service',
      status: 'deleted',
      recordsAffected: 0,
    });
  }

  // Delivery Service - Delete delivery history
  const deliveries = mockDeliveryData.get(patientId) || [];
  mockDeliveryData.delete(patientId);
  results.push({
    service: 'delivery-service',
    status: 'deleted',
    recordsAffected: deliveries.length,
  });

  // Payment Service - Anonymize (7-year retention per Swiss tax law)
  const payments = mockPaymentData.get(patientId) || [];
  if (payments.length > 0) {
    mockPaymentData.set(
      patientId,
      payments.map((p) => ({
        ...p,
        customerName: 'ANONYMIZED',
        customerId: `anon-${crypto.randomBytes(8).toString('hex')}`,
        billingAddress: 'ANONYMIZED',
      }))
    );
    results.push({
      service: 'payment-service',
      status: 'retained_legal',
      recordsAffected: payments.length,
      message: `Anonymized per Swiss tax law (${RETENTION_REQUIREMENTS.financial_records.years}-year retention)`,
    });
  } else {
    mockPaymentData.delete(patientId);
    results.push({
      service: 'payment-service',
      status: 'deleted',
      recordsAffected: 0,
    });
  }

  // Teleconsultation Service - Delete consultation history
  const teleconsultations = mockTeleconsultationData.get(patientId) || [];
  mockTeleconsultationData.delete(patientId);
  results.push({
    service: 'teleconsultation-service',
    status: 'deleted',
    recordsAffected: teleconsultations.length,
  });

  return results;
}
