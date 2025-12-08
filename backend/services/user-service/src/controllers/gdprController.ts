/**
 * GDPR Controller
 * Implements GDPR Article 15 (Right to Access) and Article 17 (Right to Erasure)
 * Also complies with Swiss Federal Act on Data Protection (FADP)
 *
 * Features:
 * - Data export (Right to Access)
 * - Right to be forgotten (Right to Erasure)
 * - Audit trail logging
 * - Cross-service data aggregation
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../../../../shared/middleware/auth';
import * as crypto from 'crypto';

// Helper to check if user has admin role
function isAdminUser(user: AuthenticatedRequest['user']): boolean {
  if (!user) return false;
  // Check role directly
  if (user.role === 'ADMIN' || user.role === 'admin') return true;
  // Check tokenPayload for additional roles
  const payload = user.tokenPayload as any;
  if (payload?.roles?.includes('admin')) return true;
  return false;
}

// ============================================================================
// Types and Interfaces
// ============================================================================

// Removed: GDPRExportRequest interface (not used in current implementation)
// If needed in the future, this interface would define the structure for export requests

interface GDPRExportResponse {
  requestId: string;
  userId: string;
  exportedAt: string;
  format: string;
  data: {
    userData: any;
    prescriptionData: any[];
    orderData: any[];
    messageData: any[];
    appointmentData: any[];
    medicalRecordData: any[];
    deliveryData: any[];
    paymentData: any[];
    teleconsultationData: any[];
  };
  dataRetentionPolicy: string;
  exportVersion: string;
}

// Removed: GDPRErasureRequest interface (not used in current implementation)
// If needed in the future, this interface would define the structure for erasure requests

interface GDPRErasureResponse {
  requestId: string;
  userId: string;
  erasedAt: string;
  status: 'completed' | 'partial' | 'failed';
  servicesProcessed: {
    service: string;
    status: 'erased' | 'anonymized' | 'retained_legal' | 'failed';
    recordsAffected: number;
    message?: string;
  }[];
  legalRecordsRetained: string[];
  verificationHash: string;
}

interface AuditLogEntry {
  id: string;
  userId: string;
  action: 'data_export' | 'data_erasure' | 'export_downloaded';
  requestId: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure' | 'partial';
  details?: any;
}

// ============================================================================
// In-Memory Storage (Replace with database in production)
// ============================================================================

const gdprAuditLog: Map<string, AuditLogEntry> = new Map();
const gdprExportRequests: Map<string, GDPRExportResponse> = new Map();
const gdprErasureRequests: Map<string, GDPRErasureResponse> = new Map();

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
  return `gdpr-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

function createAuditLogEntry(
  userId: string,
  action: AuditLogEntry['action'],
  requestId: string,
  status: AuditLogEntry['status'],
  req: Request,
  details?: any
): AuditLogEntry {
  const id = `audit-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

  const entry: AuditLogEntry = {
    id,
    userId,
    action,
    requestId,
    timestamp: new Date().toISOString(),
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    status,
    details,
  };

  gdprAuditLog.set(id, entry);
  console.log(`📝 GDPR Audit: ${action} for user ${hashForLogging(userId)} - ${status}`);

  return entry;
}

async function aggregateUserData(userId: string): Promise<any> {
  // In production, this would make HTTP calls to each microservice
  // For now, we'll return mock data or empty arrays

  return {
    userData: mockUserData.get(userId) || null,
    prescriptionData: mockPrescriptionData.get(userId) || [],
    orderData: mockOrderData.get(userId) || [],
    messageData: mockMessageData.get(userId) || [],
    appointmentData: mockAppointmentData.get(userId) || [],
    medicalRecordData: mockMedicalRecordData.get(userId) || [],
    deliveryData: mockDeliveryData.get(userId) || [],
    paymentData: mockPaymentData.get(userId) || [],
    teleconsultationData: mockTeleconsultationData.get(userId) || [],
  };
}

async function eraseUserDataAcrossServices(
  userId: string,
  keepLegalRecords: boolean
): Promise<GDPRErasureResponse['servicesProcessed']> {
  // In production, this would make HTTP DELETE/PATCH calls to each microservice
  // Each service would either:
  // 1. Delete the data completely
  // 2. Anonymize the data (replace PII with anonymized values)
  // 3. Retain legal records if required by law

  const results: GDPRErasureResponse['servicesProcessed'] = [];

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

  // Appointment Service (delete appointments older than current)
  const appointments = mockAppointmentData.get(userId) || [];
  mockAppointmentData.delete(userId);
  results.push({
    service: 'appointment-service',
    status: 'erased',
    recordsAffected: appointments.length,
  });

  // Medical Records Service (retain per healthcare law)
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

function generateVerificationHash(erasureResponse: any): string {
  const content = JSON.stringify(erasureResponse);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Hash patient/user ID for safe logging (GDPR compliance)
 * Never log raw user IDs to prevent PII leakage
 */
function hashForLogging(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex').substring(0, 8);
}

// ============================================================================
// Controller Functions
// ============================================================================

/**
 * POST /api/gdpr/export
 * Request data export (GDPR Article 15 - Right to Access)
 */
export async function requestDataExport(req: AuthenticatedRequest, res: Response): Promise<Response> {
  try {
    const { userId, format = 'json' } = req.body;
    // Note: includeServices parameter can be added in future for selective exports

    // Validate required fields
    if (!userId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'userId is required',
        timestamp: new Date().toISOString(),
      });
    }

    // SECURITY: Authorization check - user can only access their own data
    const authenticatedUserId = req.user?.userId;
    const isAdmin = isAdminUser(req.user);

    if (!isAdmin && authenticatedUserId !== userId) {
      console.warn(`⚠️ SECURITY: Unauthorized data export attempt - User ${hashForLogging(authenticatedUserId || 'unknown')} tried to access data of ${hashForLogging(userId)}`);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only request export of your own data',
        timestamp: new Date().toISOString(),
      });
    }

    // Validate format
    if (format !== 'json' && format !== 'csv') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'format must be either "json" or "csv"',
        timestamp: new Date().toISOString(),
      });
    }

    const requestId = generateRequestId();

    // Aggregate data from all services
    const aggregatedData = await aggregateUserData(userId);

    // Create export response
    const exportResponse: GDPRExportResponse = {
      requestId,
      userId,
      exportedAt: new Date().toISOString(),
      format,
      data: aggregatedData,
      dataRetentionPolicy: 'Data retained per GDPR and Swiss FADP requirements',
      exportVersion: '1.0.0',
    };

    // Store export for download
    gdprExportRequests.set(requestId, exportResponse);

    // Create audit log
    createAuditLogEntry(userId, 'data_export', requestId, 'success', req, {
      format,
      servicesIncluded: Object.keys(aggregatedData),
    });

    console.log(`✅ GDPR Data Export: Created export ${requestId} for user ${hashForLogging(userId)}`);

    return res.status(200).json({
      message: 'Data export created successfully',
      requestId,
      downloadUrl: `/api/gdpr/export/${requestId}/download`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error creating data export:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create data export',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * GET /api/gdpr/export/:requestId/download
 * Download data export file
 */
export async function downloadDataExport(req: AuthenticatedRequest, res: Response): Promise<Response> {
  try {
    const { requestId } = req.params;

    const exportData = gdprExportRequests.get(requestId);

    if (!exportData) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Export request ${requestId} not found or expired`,
        timestamp: new Date().toISOString(),
      });
    }

    // SECURITY: Authorization check - user can only download their own data
    const authenticatedUserId = req.user?.userId;
    const isAdmin = isAdminUser(req.user);

    if (!isAdmin && authenticatedUserId !== exportData.userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only download your own data exports',
        timestamp: new Date().toISOString(),
      });
    }

    // Create audit log for download
    createAuditLogEntry(
      exportData.userId,
      'export_downloaded',
      requestId,
      'success',
      req
    );

    console.log(`📥 GDPR Data Export: Download ${requestId} for user ${hashForLogging(exportData.userId)}`);

    // Return JSON export
    if (exportData.format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="gdpr-export-${requestId}.json"`);
      return res.status(200).json(exportData);
    }

    // Return CSV export (simplified)
    if (exportData.format === 'csv') {
      const csvContent = convertToCSV(exportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="gdpr-export-${requestId}.csv"`);
      return res.status(200).send(csvContent);
    }

    return res.status(400).json({
      error: 'Bad Request',
      message: 'Unsupported export format',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error downloading data export:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to download data export',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * POST /api/gdpr/erasure
 * Request right to be forgotten (GDPR Article 17 - Right to Erasure)
 */
export async function requestDataErasure(req: AuthenticatedRequest, res: Response): Promise<Response> {
  try {
    const { userId, reason, keepLegalRecords = true } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'userId is required',
        timestamp: new Date().toISOString(),
      });
    }

    // SECURITY: Authorization check - user can only erase their own data
    const authenticatedUserId = req.user?.userId;
    const isAdmin = isAdminUser(req.user);

    if (!isAdmin && authenticatedUserId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only request erasure of your own data',
        timestamp: new Date().toISOString(),
      });
    }

    const requestId = generateRequestId();

    // Process erasure across all services
    const servicesProcessed = await eraseUserDataAcrossServices(userId, keepLegalRecords);

    // Determine overall status
    const hasFailed = servicesProcessed.some(s => s.status === 'failed');
    const hasPartial = servicesProcessed.some(s => s.status === 'retained_legal');
    const overallStatus: GDPRErasureResponse['status'] = hasFailed ? 'failed' :
                         hasPartial ? 'partial' : 'completed';

    // Identify legal records retained
    const legalRecordsRetained = servicesProcessed
      .filter(s => s.status === 'retained_legal')
      .map(s => `${s.service}: ${s.message || 'Retained per legal requirements'}`);

    const erasureResponse: GDPRErasureResponse = {
      requestId,
      userId,
      erasedAt: new Date().toISOString(),
      status: overallStatus,
      servicesProcessed,
      legalRecordsRetained,
      verificationHash: '', // Will be set after hash generation
    };

    // Generate verification hash
    erasureResponse.verificationHash = generateVerificationHash(erasureResponse);

    // Store erasure request
    gdprErasureRequests.set(requestId, erasureResponse);

    // Create audit log
    createAuditLogEntry(userId, 'data_erasure', requestId, 'success', req, {
      reason,
      keepLegalRecords,
      status: overallStatus,
      servicesProcessed: servicesProcessed.length,
    });

    console.log(`✅ GDPR Data Erasure: Processed request ${requestId} for user ${hashForLogging(userId)} - ${overallStatus}`);

    return res.status(200).json({
      message: 'Data erasure request processed',
      requestId,
      status: overallStatus,
      servicesProcessed,
      legalRecordsRetained,
      verificationHash: erasureResponse.verificationHash,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error processing data erasure:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process data erasure',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * GET /api/gdpr/erasure/:requestId
 * Get erasure request status
 */
export async function getErasureStatus(req: AuthenticatedRequest, res: Response): Promise<Response> {
  try {
    const { requestId } = req.params;

    const erasureData = gdprErasureRequests.get(requestId);

    if (!erasureData) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Erasure request ${requestId} not found`,
        timestamp: new Date().toISOString(),
      });
    }

    // SECURITY: Authorization check - user can only access their own erasure status
    const authenticatedUserId = req.user?.userId;
    const isAdmin = isAdminUser(req.user);

    if (!isAdmin && authenticatedUserId !== erasureData.userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only view status of your own erasure requests',
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      ...erasureData,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching erasure status:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch erasure status',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * GET /api/gdpr/audit/:userId
 * Get GDPR audit trail for a user (admin only)
 */
export async function getAuditTrail(req: AuthenticatedRequest, res: Response): Promise<Response> {
  try {
    const { userId } = req.params;

    // SECURITY: Authorization check - only admin or the user themselves can access audit trail
    const authenticatedUserId = req.user?.userId;
    const isAdmin = isAdminUser(req.user);

    if (!isAdmin && authenticatedUserId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only view your own audit trail',
        timestamp: new Date().toISOString(),
      });
    }

    const userAuditLogs = Array.from(gdprAuditLog.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return res.status(200).json({
      userId,
      auditLogs: userAuditLogs,
      count: userAuditLogs.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching audit trail:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch audit trail',
      timestamp: new Date().toISOString(),
    });
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

function convertToCSV(data: GDPRExportResponse): string {
  // Simplified CSV conversion
  const lines: string[] = [];

  lines.push('GDPR Data Export');
  lines.push(`Request ID: ${data.requestId}`);
  lines.push(`User ID: ${data.userId}`);
  lines.push(`Exported At: ${data.exportedAt}`);
  lines.push('');

  // User Data
  lines.push('User Data:');
  if (data.data.userData) {
    Object.entries(data.data.userData).forEach(([key, value]) => {
      lines.push(`${key},${value}`);
    });
  }
  lines.push('');

  // Service Data Counts
  lines.push('Service,Record Count');
  lines.push(`Prescriptions,${data.data.prescriptionData.length}`);
  lines.push(`Orders,${data.data.orderData.length}`);
  lines.push(`Messages,${data.data.messageData.length}`);
  lines.push(`Appointments,${data.data.appointmentData.length}`);
  lines.push(`Medical Records,${data.data.medicalRecordData.length}`);
  lines.push(`Deliveries,${data.data.deliveryData.length}`);
  lines.push(`Payments,${data.data.paymentData.length}`);
  lines.push(`Teleconsultations,${data.data.teleconsultationData.length}`);

  return lines.join('\n');
}
