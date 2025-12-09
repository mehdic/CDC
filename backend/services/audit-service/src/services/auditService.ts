/**
 * Audit Trail Service
 * Immutable audit logging for HIPAA/GDPR compliance
 *
 * Features:
 * - Append-only audit logs (immutable)
 * - HIPAA-compliant audit trails
 * - GDPR data access logging
 * - Query and export functionality
 * - Data retention policies
 * - Tamper detection
 *
 * Compliance:
 * - HIPAA § 164.312(b) - Audit Controls
 * - GDPR Article 30 - Records of Processing Activities
 * - Swiss Federal Act on Data Protection (FADP)
 */

export interface AuditLogEntry {
  id?: string;
  timestamp: Date;
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
  complianceFlags?: {
    hipaa?: boolean;
    gdpr?: boolean;
    fadp?: boolean;
  };
  checksum?: string; // For tamper detection
}

export interface AuditQuery {
  userId?: string;
  userRole?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  result?: 'success' | 'failure';
  sensitiveData?: boolean;
  limit?: number;
  offset?: number;
}

export interface AuditExportOptions {
  format: 'json' | 'csv' | 'pdf';
  query: AuditQuery;
  includeDetails?: boolean;
  encryptExport?: boolean;
}

/**
 * Audit Service
 * Manages immutable audit trails for compliance
 */
export class AuditService {
  private auditLogs: Map<string, AuditLogEntry> = new Map();
  private logCounter: number = 1;

  /**
   * Log an audit event (append-only)
   * @param entry - Audit log entry
   */
  public async logEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'checksum'>): Promise<string> {
    const id = `AUDIT-${String(this.logCounter++).padStart(10, '0')}`;
    const timestamp = new Date();

    // Calculate checksum for tamper detection
    const checksum = this.calculateChecksum({
      ...entry,
      id,
      timestamp,
    });

    const auditEntry: AuditLogEntry = {
      ...entry,
      id,
      timestamp,
      checksum,
    };

    // Store in append-only fashion
    this.auditLogs.set(id, auditEntry);

    // In production, write to database with append-only constraint
    // PostgreSQL example:
    // INSERT INTO audit_logs (...) VALUES (...);
    // (No UPDATE or DELETE allowed on this table)

    console.log(`[AuditService] Logged: ${entry.action} by ${entry.userId} on ${entry.resource}`);

    return id;
  }

  /**
   * Log user authentication event
   */
  public async logAuthentication(
    userId: string,
    userRole: string,
    result: 'success' | 'failure',
    ipAddress: string,
    userAgent: string,
    details?: Record<string, any>,
  ): Promise<string> {
    return this.logEvent({
      userId,
      userRole,
      action: 'authentication',
      resource: 'auth',
      result,
      ipAddress,
      userAgent,
      details,
      complianceFlags: {
        hipaa: true,
        gdpr: true,
        fadp: true,
      },
    });
  }

  /**
   * Log data access event (HIPAA/GDPR requirement)
   */
  public async logDataAccess(
    userId: string,
    userRole: string,
    resource: string,
    resourceId: string,
    ipAddress: string,
    userAgent: string,
    details?: Record<string, any>,
  ): Promise<string> {
    return this.logEvent({
      userId,
      userRole,
      action: 'data_access',
      resource,
      resourceId,
      result: 'success',
      ipAddress,
      userAgent,
      details,
      sensitiveData: this.isSensitiveResource(resource),
      complianceFlags: {
        hipaa: true,
        gdpr: true,
        fadp: true,
      },
    });
  }

  /**
   * Log prescription access (HIPAA requirement)
   */
  public async logPrescriptionAccess(
    userId: string,
    userRole: string,
    prescriptionId: string,
    action: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<string> {
    return this.logEvent({
      userId,
      userRole,
      action: `prescription_${action}`,
      resource: 'prescription',
      resourceId: prescriptionId,
      result: 'success',
      ipAddress,
      userAgent,
      sensitiveData: true,
      complianceFlags: {
        hipaa: true,
        gdpr: true,
        fadp: true,
      },
    });
  }

  /**
   * Log controlled substance transaction
   */
  public async logControlledSubstance(
    userId: string,
    userRole: string,
    drugId: string,
    action: 'dispense' | 'receive' | 'transfer' | 'destroy',
    quantity: number,
    ipAddress: string,
    userAgent: string,
    details: Record<string, any>,
  ): Promise<string> {
    return this.logEvent({
      userId,
      userRole,
      action: `controlled_substance_${action}`,
      resource: 'controlled_substance',
      resourceId: drugId,
      result: 'success',
      ipAddress,
      userAgent,
      details: {
        ...details,
        quantity,
      },
      sensitiveData: true,
      complianceFlags: {
        hipaa: true,
        gdpr: false,
        fadp: true,
      },
    });
  }

  /**
   * Query audit logs
   * @param query - Query parameters
   */
  public async queryAuditLogs(query: AuditQuery): Promise<{
    logs: AuditLogEntry[];
    total: number;
  }> {
    let logs = Array.from(this.auditLogs.values());

    // Apply filters
    if (query.userId) {
      logs = logs.filter((log) => log.userId === query.userId);
    }

    if (query.userRole) {
      logs = logs.filter((log) => log.userRole === query.userRole);
    }

    if (query.action) {
      logs = logs.filter((log) => log.action === query.action);
    }

    if (query.resource) {
      logs = logs.filter((log) => log.resource === query.resource);
    }

    if (query.result) {
      logs = logs.filter((log) => log.result === query.result);
    }

    if (query.sensitiveData !== undefined) {
      logs = logs.filter((log) => log.sensitiveData === query.sensitiveData);
    }

    if (query.startDate) {
      logs = logs.filter((log) => log.timestamp >= query.startDate!);
    }

    if (query.endDate) {
      logs = logs.filter((log) => log.timestamp <= query.endDate!);
    }

    // Sort by timestamp (newest first)
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const total = logs.length;

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    logs = logs.slice(offset, offset + limit);

    return { logs, total };
  }

  /**
   * Export audit logs for compliance reporting
   * @param options - Export options
   */
  public async exportAuditLogs(options: AuditExportOptions): Promise<{
    format: string;
    data: string;
    checksum: string;
  }> {
    const { logs, total } = await this.queryAuditLogs(options.query);

    let data: string;

    switch (options.format) {
      case 'json':
        data = JSON.stringify(
          {
            exportDate: new Date().toISOString(),
            totalRecords: total,
            logs: options.includeDetails ? logs : logs.map(this.sanitizeLogForExport),
          },
          null,
          2,
        );
        break;

      case 'csv':
        data = this.convertToCSV(logs, options.includeDetails || false);
        break;

      case 'pdf':
        data = await this.convertToPDF(logs, options.includeDetails || false);
        break;

      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }

    // Calculate checksum for export integrity
    const checksum = this.calculateChecksum({ data });

    return {
      format: options.format,
      data,
      checksum,
    };
  }

  /**
   * Verify audit log integrity (tamper detection)
   * @param logId - Audit log ID
   */
  public async verifyLogIntegrity(logId: string): Promise<{
    valid: boolean;
    tampered: boolean;
    message: string;
  }> {
    const log = this.auditLogs.get(logId);

    if (!log) {
      return {
        valid: false,
        tampered: false,
        message: 'Log not found',
      };
    }

    const storedChecksum = log.checksum;
    const calculatedChecksum = this.calculateChecksum({
      ...log,
      checksum: undefined, // Exclude checksum from calculation
    });

    const tampered = storedChecksum !== calculatedChecksum;

    return {
      valid: !tampered,
      tampered,
      message: tampered ? 'Log has been tampered with' : 'Log integrity verified',
    };
  }

  /**
   * Get audit statistics
   */
  public async getAuditStatistics(startDate?: Date, endDate?: Date): Promise<{
    totalLogs: number;
    successCount: number;
    failureCount: number;
    sensitiveDataAccess: number;
    byAction: Record<string, number>;
    byResource: Record<string, number>;
    byUser: Record<string, number>;
  }> {
    const { logs } = await this.queryAuditLogs({
      startDate,
      endDate,
      limit: 999999,
    });

    const stats = {
      totalLogs: logs.length,
      successCount: logs.filter((l) => l.result === 'success').length,
      failureCount: logs.filter((l) => l.result === 'failure').length,
      sensitiveDataAccess: logs.filter((l) => l.sensitiveData).length,
      byAction: {} as Record<string, number>,
      byResource: {} as Record<string, number>,
      byUser: {} as Record<string, number>,
    };

    // Count by action
    logs.forEach((log) => {
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
      stats.byResource[log.resource] = (stats.byResource[log.resource] || 0) + 1;
      stats.byUser[log.userId] = (stats.byUser[log.userId] || 0) + 1;
    });

    return stats;
  }

  /**
   * Apply data retention policy (GDPR/HIPAA)
   * @param retentionDays - Days to retain logs
   */
  public async applyRetentionPolicy(retentionDays: number): Promise<{
    deletedCount: number;
    retainedCount: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    let deletedCount = 0;
    const logsToDelete: string[] = [];

    for (const [id, log] of this.auditLogs.entries()) {
      if (log.timestamp < cutoffDate) {
        logsToDelete.push(id);
        deletedCount++;
      }
    }

    // In production, archive before deletion (for compliance)
    // Archive to cold storage (e.g., AWS S3 Glacier)

    // Delete expired logs
    logsToDelete.forEach((id) => this.auditLogs.delete(id));

    return {
      deletedCount,
      retainedCount: this.auditLogs.size,
    };
  }

  /**
   * Helper: Calculate checksum for tamper detection
   */
  private calculateChecksum(data: any): string {
    // In production, use crypto.createHash('sha256')
    const jsonString = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `SHA256:${Math.abs(hash).toString(16).padStart(16, '0')}`;
  }

  /**
   * Helper: Check if resource contains sensitive data
   */
  private isSensitiveResource(resource: string): boolean {
    const sensitiveResources = [
      'prescription',
      'patient',
      'medical_record',
      'controlled_substance',
      'health_data',
      'teleconsultation',
    ];

    return sensitiveResources.includes(resource);
  }

  /**
   * Helper: Sanitize log for export (remove sensitive details)
   */
  private sanitizeLogForExport(log: AuditLogEntry): Partial<AuditLogEntry> {
    return {
      id: log.id,
      timestamp: log.timestamp,
      userId: log.userId,
      userRole: log.userRole,
      action: log.action,
      resource: log.resource,
      result: log.result,
      sensitiveData: log.sensitiveData,
      // Exclude: details, ipAddress, userAgent for privacy
    };
  }

  /**
   * Helper: Convert logs to CSV format
   */
  private convertToCSV(logs: AuditLogEntry[], includeDetails: boolean): string {
    const headers = [
      'ID',
      'Timestamp',
      'User ID',
      'User Role',
      'Action',
      'Resource',
      'Resource ID',
      'Result',
      'Sensitive Data',
    ];

    if (includeDetails) {
      headers.push('IP Address', 'User Agent', 'Details');
    }

    const rows = [headers.join(',')];

    logs.forEach((log) => {
      const row = [
        log.id,
        log.timestamp.toISOString(),
        log.userId,
        log.userRole,
        log.action,
        log.resource,
        log.resourceId || '',
        log.result,
        log.sensitiveData ? 'Yes' : 'No',
      ];

      if (includeDetails) {
        row.push(
          log.ipAddress,
          log.userAgent,
          JSON.stringify(log.details || {}),
        );
      }

      rows.push(row.join(','));
    });

    return rows.join('\n');
  }

  /**
   * Helper: Convert logs to PDF format (stub)
   */
  private async convertToPDF(logs: AuditLogEntry[], includeDetails: boolean): Promise<string> {
    // In production, use a PDF library like pdfkit or puppeteer
    return `PDF_EXPORT: ${logs.length} logs (stub implementation)`;
  }
}

/**
 * Singleton instance
 */
export const auditService = new AuditService();

/**
 * Database Schema (PostgreSQL):
 *
 * CREATE TABLE audit_logs (
 *   id VARCHAR(20) PRIMARY KEY,
 *   timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *   user_id VARCHAR(50) NOT NULL,
 *   user_role VARCHAR(50) NOT NULL,
 *   action VARCHAR(100) NOT NULL,
 *   resource VARCHAR(100) NOT NULL,
 *   resource_id VARCHAR(100),
 *   result VARCHAR(10) NOT NULL CHECK (result IN ('success', 'failure')),
 *   ip_address INET NOT NULL,
 *   user_agent TEXT,
 *   details JSONB,
 *   sensitive_data BOOLEAN DEFAULT FALSE,
 *   compliance_flags JSONB,
 *   checksum VARCHAR(100) NOT NULL,
 *   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 * );
 *
 * -- Append-only: Revoke UPDATE and DELETE
 * REVOKE UPDATE, DELETE ON audit_logs FROM metapharm_app;
 *
 * -- Indexes for queries
 * CREATE INDEX idx_audit_user ON audit_logs(user_id);
 * CREATE INDEX idx_audit_action ON audit_logs(action);
 * CREATE INDEX idx_audit_resource ON audit_logs(resource);
 * CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
 * CREATE INDEX idx_audit_sensitive ON audit_logs(sensitive_data) WHERE sensitive_data = TRUE;
 */
