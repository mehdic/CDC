/**
 * Audit Service Client
 * Integration with Audit Service for compliance logging
 * Task: T8-009 - Audit Service Integration
 *
 * Features:
 * - Log prescription actions (create, modify, dispense, reject)
 * - Log QR code scans
 * - Log drug interaction warnings acknowledged
 * - Async logging with retry logic
 * - Structured audit entries with before/after state
 */

import axios, { AxiosInstance } from 'axios';

export interface AuditLogRequest {
  userId: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  result: 'success' | 'failure';
  ipAddress: string;
  userAgent: string;
  details?: Record<string, any>;
  sensitiveData?: boolean;
}

export interface AuditLogResponse {
  id: string;
  timestamp: Date;
  message: string;
  success: boolean;
}

/**
 * Audit Service Client
 * Handles all audit logging operations
 */
export class AuditClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private serviceKey: string;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000; // milliseconds
  private queue: AuditLogRequest[] = [];
  private isProcessingQueue: boolean = false;

  constructor(baseUrl?: string, serviceKey?: string) {
    this.baseUrl = baseUrl || process.env.AUDIT_SERVICE_URL || 'http://audit-service:4003';
    this.serviceKey = serviceKey || process.env.SERVICE_KEY || '';

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        ...(this.serviceKey && { Authorization: `Bearer ${this.serviceKey}` }),
      },
    });
  }

  /**
   * Log a generic audit event
   * Non-blocking async logging
   */
  public async logEvent(request: AuditLogRequest): Promise<AuditLogResponse | null> {
    try {
      const response = await this.executeWithRetry(() =>
        this.client.post('/audit/events', request)
      );

      return {
        id: response.data.id || `audit-${Date.now()}`,
        timestamp: new Date(response.data.timestamp || new Date()),
        message: 'Audit event logged successfully',
        success: true,
      };
    } catch (error) {
      // Log to console but don't throw - audit failures shouldn't block operations
      console.error('[AuditClient] Failed to log event:', error);
      return null;
    }
  }

  /**
   * Log prescription creation
   */
  public async logPrescriptionCreation(
    userId: string,
    prescriptionId: string,
    details: Record<string, any>,
    ipAddress: string,
    userAgent: string,
  ): Promise<AuditLogResponse | null> {
    return this.logEvent({
      userId,
      userRole: 'pharmacist',
      action: 'prescription_creation',
      resource: 'prescription',
      resourceId: prescriptionId,
      result: 'success',
      ipAddress,
      userAgent,
      details,
      sensitiveData: true,
    });
  }

  /**
   * Log prescription modification
   */
  public async logPrescriptionModification(
    userId: string,
    prescriptionId: string,
    changes: {
      field: string;
      oldValue: any;
      newValue: any;
    }[],
    ipAddress: string,
    userAgent: string,
  ): Promise<AuditLogResponse | null> {
    return this.logEvent({
      userId,
      userRole: 'pharmacist',
      action: 'prescription_modification',
      resource: 'prescription',
      resourceId: prescriptionId,
      result: 'success',
      ipAddress,
      userAgent,
      details: {
        changes: changes.map(c => ({
          field: c.field,
          old: c.oldValue,
          new: c.newValue,
        })),
      },
      sensitiveData: true,
    });
  }

  /**
   * Log prescription dispensing
   */
  public async logPrescriptionDispensing(
    userId: string,
    prescriptionId: string,
    details: Record<string, any>,
    ipAddress: string,
    userAgent: string,
  ): Promise<AuditLogResponse | null> {
    return this.logEvent({
      userId,
      userRole: 'pharmacist',
      action: 'prescription_dispensing',
      resource: 'prescription',
      resourceId: prescriptionId,
      result: 'success',
      ipAddress,
      userAgent,
      details,
      sensitiveData: true,
    });
  }

  /**
   * Log prescription rejection
   */
  public async logPrescriptionRejection(
    userId: string,
    prescriptionId: string,
    reason: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<AuditLogResponse | null> {
    return this.logEvent({
      userId,
      userRole: 'pharmacist',
      action: 'prescription_rejection',
      resource: 'prescription',
      resourceId: prescriptionId,
      result: 'success',
      ipAddress,
      userAgent,
      details: {
        rejection_reason: reason,
      },
      sensitiveData: true,
    });
  }

  /**
   * Log QR code scan
   */
  public async logQRCodeScan(
    userId: string,
    prescriptionId: string,
    patientId: string,
    scanResult: 'success' | 'failure',
    ipAddress: string,
    userAgent: string,
    details?: Record<string, any>,
  ): Promise<AuditLogResponse | null> {
    return this.logEvent({
      userId,
      userRole: 'pharmacist',
      action: 'qr_code_scan',
      resource: 'qr_scan',
      resourceId: prescriptionId,
      result: scanResult,
      ipAddress,
      userAgent,
      details: {
        prescription_id: prescriptionId,
        patient_id: patientId,
        ...details,
      },
      sensitiveData: true,
    });
  }

  /**
   * Log drug interaction warning acknowledged
   */
  public async logDrugInteractionAcknowledgment(
    userId: string,
    prescriptionId: string,
    warningType: string,
    ipAddress: string,
    userAgent: string,
    details?: Record<string, any>,
  ): Promise<AuditLogResponse | null> {
    return this.logEvent({
      userId,
      userRole: 'pharmacist',
      action: 'drug_interaction_acknowledged',
      resource: 'prescription',
      resourceId: prescriptionId,
      result: 'success',
      ipAddress,
      userAgent,
      details: {
        warning_type: warningType,
        ...details,
      },
      sensitiveData: true,
    });
  }

  /**
   * Log authentication event
   */
  public async logAuthentication(
    userId: string,
    result: 'success' | 'failure',
    ipAddress: string,
    userAgent: string,
    details?: Record<string, any>,
  ): Promise<AuditLogResponse | null> {
    return this.logEvent({
      userId,
      userRole: 'pharmacist',
      action: 'authentication',
      resource: 'auth',
      result,
      ipAddress,
      userAgent,
      details,
      sensitiveData: false,
    });
  }

  /**
   * Query audit logs
   */
  public async queryAuditLogs(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{
    logs: AuditLogRequest[];
    total: number;
  } | null> {
    try {
      const response = await this.executeWithRetry(() =>
        this.client.get('/audit/logs/query', { params: filters })
      );

      return {
        logs: response.data.logs || [],
        total: response.data.total || 0,
      };
    } catch (error) {
      console.error('[AuditClient] Failed to query audit logs:', error);
      return null;
    }
  }

  /**
   * Export audit logs for compliance
   */
  public async exportAuditLogs(filters: {
    userId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    format: 'json' | 'csv' | 'pdf';
  }): Promise<string | null> {
    try {
      const response = await this.executeWithRetry(() =>
        this.client.get('/audit/logs/export', { params: filters })
      );

      return response.data.data || null;
    } catch (error) {
      console.error('[AuditClient] Failed to export audit logs:', error);
      return null;
    }
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', { timeout: 3000 });
      return response.status === 200;
    } catch (error) {
      console.warn('[AuditClient] Health check failed:', error);
      return false;
    }
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry(
    fn: () => Promise<any>,
    attempt: number = 0,
  ): Promise<any> {
    try {
      return await fn();
    } catch (error: any) {
      if (attempt < this.retryAttempts && this.isRetryableError(error)) {
        const delay = this.retryDelay * Math.pow(2, attempt); // Exponential backoff
        console.log(`[AuditClient] Retrying in ${delay}ms... (attempt ${attempt + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.executeWithRetry(fn, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Retry on network errors, timeouts, and 5xx server errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return true;
    }

    if (error.response?.status >= 500) {
      return true;
    }

    if (error.message?.includes('ECONNRESET')) {
      return true;
    }

    return false;
  }
}

// Singleton instance
export const auditClient = new AuditClient();

export default AuditClient;
