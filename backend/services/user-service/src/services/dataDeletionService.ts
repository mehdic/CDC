/**
 * Data Deletion Service
 * Manages GDPR Right to Be Forgotten with 30-day cooling-off period
 *
 * Features:
 * - 30-day cooling-off period before deletion
 * - Cancellation during cooling-off period
 * - Cascading deletion across all services
 * - Preserves anonymized audit trail for compliance
 * - Legal records retention (Swiss healthcare law)
 *
 * Status Flow:
 * pending → (30 days) → processing → completed/failed
 * pending → (user cancels) → cancelled
 */

import * as crypto from 'crypto';
import { AuthenticatedRequest } from '../../../../shared/middleware/auth';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface DeletionRequest {
  requestId: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed';
  reason: string;
  createdAt: string;
  scheduledDeletionDate: string;
  processedAt: string | null;
  cancelledAt: string | null;
  servicesProcessed?: ServiceDeletionResult[];
  legalRecordsRetained?: string[];
  verificationHash?: string;
  errorMessage?: string;
}

export interface ServiceDeletionResult {
  service: string;
  status: 'erased' | 'anonymized' | 'retained_legal' | 'failed';
  recordsAffected: number;
  message?: string;
}

interface AuditLogEntry {
  id: string;
  userId: string;
  action: 'deletion_requested' | 'deletion_cancelled' | 'deletion_executed' | 'deletion_failed';
  requestId: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure';
  details?: any;
}

// ============================================================================
// In-Memory Storage (Replace with database in production)
// ============================================================================

const deletionRequests: Map<string, DeletionRequest> = new Map();
const deletionAuditLog: Map<string, AuditLogEntry> = new Map();

// Mock data stores (same as gdprController for consistency)
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
  return `forget-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

function hashForLogging(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex').substring(0, 8);
}

function createAuditLogEntry(
  userId: string,
  action: AuditLogEntry['action'],
  requestId: string,
  status: AuditLogEntry['status'],
  req: AuthenticatedRequest,
  details?: any
): AuditLogEntry {
  const id = `audit-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

  const entry: AuditLogEntry = {
    id,
    userId,
    action,
    requestId,
    timestamp: new Date().toISOString(),
    ipAddress: req.ip || (req.socket ? req.socket.remoteAddress : undefined),
    userAgent: req.get('user-agent'),
    status,
    details,
  };

  deletionAuditLog.set(id, entry);
  console.log(`📝 GDPR Forget Audit: ${action} for user ${hashForLogging(userId)} - ${status}`);

  return entry;
}

function generateVerificationHash(deletionRequest: DeletionRequest): string {
  const content = JSON.stringify(deletionRequest);
  return crypto.createHash('sha256').update(content).digest('hex');
}

// ============================================================================
// Data Deletion Service Functions
// ============================================================================

/**
 * Create deletion request with 30-day cooling-off period
 */
export async function createDeletionRequest(
  userId: string,
  reason: string,
  req: AuthenticatedRequest
): Promise<DeletionRequest> {
  const requestId = generateRequestId();
  const now = new Date();
  const scheduledDeletionDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const deletionRequest: DeletionRequest = {
    requestId,
    userId,
    status: 'pending',
    reason,
    createdAt: now.toISOString(),
    scheduledDeletionDate: scheduledDeletionDate.toISOString(),
    processedAt: null,
    cancelledAt: null,
  };

  // Store deletion request
  deletionRequests.set(requestId, deletionRequest);
  deletionRequests.set(`user-${userId}`, deletionRequest); // Index by userId for quick lookup

  // Create audit log
  createAuditLogEntry(userId, 'deletion_requested', requestId, 'success', req, {
    reason,
    scheduledDeletionDate: scheduledDeletionDate.toISOString(),
  });

  return deletionRequest;
}

/**
 * Get deletion request status by requestId or userId
 */
export async function getDeletionRequestStatus(
  identifier: string
): Promise<DeletionRequest | null> {
  // Try as requestId first
  let request = deletionRequests.get(identifier);

  // If not found, try as userId
  if (!request && identifier.startsWith('user-')) {
    request = deletionRequests.get(identifier);
  } else if (!request) {
    request = deletionRequests.get(`user-${identifier}`);
  }

  return request || null;
}

/**
 * Cancel deletion request during cooling-off period
 */
export async function cancelDeletionRequest(
  requestId: string,
  req: AuthenticatedRequest
): Promise<DeletionRequest> {
  const deletionRequest = deletionRequests.get(requestId);

  if (!deletionRequest) {
    throw new Error(`Deletion request ${requestId} not found`);
  }

  if (deletionRequest.status !== 'pending') {
    throw new Error(`Cannot cancel deletion request with status: ${deletionRequest.status}`);
  }

  // Update status to cancelled
  deletionRequest.status = 'cancelled';
  deletionRequest.cancelledAt = new Date().toISOString();

  deletionRequests.set(requestId, deletionRequest);

  // Create audit log
  createAuditLogEntry(
    deletionRequest.userId,
    'deletion_cancelled',
    requestId,
    'success',
    req
  );

  return deletionRequest;
}

/**
 * Confirm and execute deletion (called manually or by scheduler)
 */
export async function confirmDeletionRequest(
  requestId: string,
  req: AuthenticatedRequest
): Promise<DeletionRequest> {
  const deletionRequest = deletionRequests.get(requestId);

  if (!deletionRequest) {
    throw new Error(`Deletion request ${requestId} not found`);
  }

  if (deletionRequest.status !== 'pending') {
    throw new Error(`Cannot execute deletion request with status: ${deletionRequest.status}`);
  }

  // Update status to processing
  deletionRequest.status = 'processing';
  deletionRequests.set(requestId, deletionRequest);

  try {
    // Execute cascading deletion across services
    const servicesProcessed = await eraseUserDataAcrossServices(deletionRequest.userId, true);

    // Determine overall status
    const hasFailed = servicesProcessed.some((s) => s.status === 'failed');
    const hasPartial = servicesProcessed.some((s) => s.status === 'retained_legal');
    const overallStatus = hasFailed ? 'failed' : 'completed';

    // Identify legal records retained
    const legalRecordsRetained = servicesProcessed
      .filter((s) => s.status === 'retained_legal')
      .map((s) => `${s.service}: ${s.message || 'Retained per legal requirements'}`);

    // Update deletion request
    deletionRequest.status = overallStatus;
    deletionRequest.processedAt = new Date().toISOString();
    deletionRequest.servicesProcessed = servicesProcessed;
    deletionRequest.legalRecordsRetained = legalRecordsRetained;
    deletionRequest.verificationHash = generateVerificationHash(deletionRequest);

    deletionRequests.set(requestId, deletionRequest);

    // Create audit log
    createAuditLogEntry(
      deletionRequest.userId,
      'deletion_executed',
      requestId,
      'success',
      req,
      {
        status: overallStatus,
        servicesProcessed: servicesProcessed.length,
        legalRecordsRetained: legalRecordsRetained.length,
      }
    );

    return deletionRequest;
  } catch (error) {
    // Mark as failed
    deletionRequest.status = 'failed';
    deletionRequest.processedAt = new Date().toISOString();
    deletionRequest.errorMessage = (error as Error).message;

    deletionRequests.set(requestId, deletionRequest);

    // Create audit log
    createAuditLogEntry(
      deletionRequest.userId,
      'deletion_failed',
      requestId,
      'failure',
      req,
      {
        error: (error as Error).message,
      }
    );

    throw error;
  }
}

/**
 * Get all pending deletion requests ready for processing (cooling-off period expired)
 * Used by scheduler
 */
export async function getPendingDeletionsReadyForProcessing(): Promise<DeletionRequest[]> {
  const now = new Date();
  const readyRequests: DeletionRequest[] = [];

  for (const [key, request] of deletionRequests.entries()) {
    // Skip user-index entries
    if (key.startsWith('user-')) {continue;}

    if (
      request.status === 'pending' &&
      new Date(request.scheduledDeletionDate) <= now
    ) {
      readyRequests.push(request);
    }
  }

  return readyRequests;
}

// ============================================================================
// Data Erasure Functions (Cascading Deletion)
// ============================================================================

/**
 * Erase user data across all services
 * Implements cascading deletion with legal record retention
 */
async function eraseUserDataAcrossServices(
  userId: string,
  keepLegalRecords: boolean
): Promise<ServiceDeletionResult[]> {
  const results: ServiceDeletionResult[] = [];

  // User Service (anonymize basic profile)
  if (mockUserData.has(userId)) {
    const user = mockUserData.get(userId);
    mockUserData.set(userId, {
      ...user,
      email: `anonymized-${userId}@deleted.local`,
      firstName: 'ANONYMIZED',
      lastName: 'ANONYMIZED',
      phone: null,
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
      status: 'erased',
      recordsAffected: 0,
    });
  }

  // Prescription Service (retain for legal compliance - 10 years in Switzerland)
  const prescriptions = mockPrescriptionData.get(userId) || [];
  if (keepLegalRecords && prescriptions.length > 0) {
    results.push({
      service: 'prescription-service',
      status: 'retained_legal',
      recordsAffected: prescriptions.length,
      message: 'Retained per Swiss healthcare law (10-year retention)',
    });
  } else {
    mockPrescriptionData.delete(userId);
    results.push({
      service: 'prescription-service',
      status: 'erased',
      recordsAffected: prescriptions.length,
    });
  }

  // Order Service (anonymize after legal retention period - 7 years for invoices)
  const orders = mockOrderData.get(userId) || [];
  if (keepLegalRecords && orders.length > 0) {
    results.push({
      service: 'order-service',
      status: 'retained_legal',
      recordsAffected: orders.length,
      message: 'Retained per Swiss tax law (7-year retention for invoices)',
    });
  } else {
    mockOrderData.delete(userId);
    results.push({
      service: 'order-service',
      status: 'erased',
      recordsAffected: orders.length,
    });
  }

  // Message Service (delete all messages)
  const messages = mockMessageData.get(userId) || [];
  mockMessageData.delete(userId);
  results.push({
    service: 'messaging-service',
    status: 'erased',
    recordsAffected: messages.length,
  });

  // Appointment Service (delete appointments)
  const appointments = mockAppointmentData.get(userId) || [];
  mockAppointmentData.delete(userId);
  results.push({
    service: 'appointment-service',
    status: 'erased',
    recordsAffected: appointments.length,
  });

  // Medical Records Service (retain per healthcare law - 20 years)
  const medicalRecords = mockMedicalRecordData.get(userId) || [];
  if (keepLegalRecords && medicalRecords.length > 0) {
    results.push({
      service: 'medical-records-service',
      status: 'retained_legal',
      recordsAffected: medicalRecords.length,
      message: 'Retained per Swiss healthcare law (20-year retention)',
    });
  } else {
    mockMedicalRecordData.delete(userId);
    results.push({
      service: 'medical-records-service',
      status: 'erased',
      recordsAffected: medicalRecords.length,
    });
  }

  // Delivery Service (delete delivery history)
  const deliveries = mockDeliveryData.get(userId) || [];
  mockDeliveryData.delete(userId);
  results.push({
    service: 'delivery-service',
    status: 'erased',
    recordsAffected: deliveries.length,
  });

  // Payment Service (retain per tax law - 7 years)
  const payments = mockPaymentData.get(userId) || [];
  if (keepLegalRecords && payments.length > 0) {
    results.push({
      service: 'payment-service',
      status: 'retained_legal',
      recordsAffected: payments.length,
      message: 'Retained per Swiss tax law (7-year retention)',
    });
  } else {
    mockPaymentData.delete(userId);
    results.push({
      service: 'payment-service',
      status: 'erased',
      recordsAffected: payments.length,
    });
  }

  // Teleconsultation Service (delete consultation history)
  const teleconsultations = mockTeleconsultationData.get(userId) || [];
  mockTeleconsultationData.delete(userId);
  results.push({
    service: 'teleconsultation-service',
    status: 'erased',
    recordsAffected: teleconsultations.length,
  });

  return results;
}

// ============================================================================
// Export Service Class (for dependency injection if needed)
// ============================================================================

export class DataDeletionService {
  async createRequest(
    userId: string,
    reason: string,
    req: AuthenticatedRequest
  ): Promise<DeletionRequest> {
    return createDeletionRequest(userId, reason, req);
  }

  async getStatus(identifier: string): Promise<DeletionRequest | null> {
    return getDeletionRequestStatus(identifier);
  }

  async cancel(requestId: string, req: AuthenticatedRequest): Promise<DeletionRequest> {
    return cancelDeletionRequest(requestId, req);
  }

  async confirm(requestId: string, req: AuthenticatedRequest): Promise<DeletionRequest> {
    return confirmDeletionRequest(requestId, req);
  }

  async getPendingDeletions(): Promise<DeletionRequest[]> {
    return getPendingDeletionsReadyForProcessing();
  }
}
