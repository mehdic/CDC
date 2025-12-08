/**
 * GDPR Controller
 * Handles GDPR data export requests with security and rate limiting
 * SECURITY: PII-safe logging, audit trail, authentication required
 */

import { Request, Response } from 'express';
import { DataSource, Repository } from 'typeorm';
import { AuditTrailEntry, AuditAction } from '@shared/models/AuditTrailEntry';
import crypto from 'crypto';
import { promisify } from 'util';
import { ExportService } from './services/export.service.js';
import { PDFGeneratorService } from './services/pdf-generator.service.js';
import { ExportFormat } from './interfaces/export.interface.js';

const randomBytes = promisify(crypto.randomBytes);

// Extended Request interface with authenticated user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

export class GDPRController {
  private exportService: ExportService;
  private auditRepository: Repository<AuditTrailEntry>;

  constructor(private dataSource: DataSource) {
    this.exportService = new ExportService(dataSource);
    this.auditRepository = dataSource.getRepository(AuditTrailEntry);
  }

  /**
   * POST /gdpr/export
   * Request a GDPR data export
   * SECURITY: Rate limited to 1 request per 24 hours
   */
  requestExport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { format = 'json' } = req.body;
      const patientId = req.user?.id;

      if (!patientId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }

      // Verify patient role
      if (req.user?.role !== 'patient') {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Only patients can request GDPR exports',
        });
        return;
      }

      // Validate format
      if (format !== 'json' && format !== 'pdf') {
        res.status(400).json({
          error: 'Invalid format',
          message: 'Format must be either "json" or "pdf"',
        });
        return;
      }

      // Check rate limiting (1 export per 24 hours)
      const rateLimitCheck = await this.exportService.canRequestExport(patientId);

      if (!rateLimitCheck.allowed) {
        // Log rate limit violation
        await this.logAuditEvent(patientId, 'gdpr.export.rate_limited', req);

        res.status(429).json({
          error: 'Too many requests',
          message: rateLimitCheck.reason,
        });
        return;
      }

      // Log export request
      await this.logAuditEvent(patientId, 'gdpr.export.requested', req);

      // Collect patient data
      const exportData = await this.exportService.collectPatientData(
        patientId,
        format as ExportFormat
      );

      // Note: Secure download token generation reserved for async processing
      // const _downloadToken = await this.generateSecureToken();
      // const _expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

      // For JSON format, return data directly
      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="gdpr-export-${patientId}.json"`);

        await this.logAuditEvent(patientId, 'gdpr.export.downloaded', req);

        res.status(200).json(exportData);
        return;
      }

      // For PDF format, generate and stream PDF
      if (format === 'pdf') {
        const pdfDoc = PDFGeneratorService.generateGDPRExportPDF(exportData);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="gdpr-export-${patientId}.pdf"`);

        pdfDoc.pipe(res);

        pdfDoc.on('end', () => {
          void this.logAuditEvent(patientId, 'gdpr.export.downloaded', req);
        });

        return;
      }
    } catch (error) {
      console.error('GDPR export error:', error);

      // SECURITY: Don't expose error details to client
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to generate export. Please contact support.',
      });
    }
  };

  /**
   * GET /gdpr/export/status
   * Check if user can request an export (rate limit status)
   */
  checkExportStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const patientId = req.user?.id;

      if (!patientId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }

      const rateLimitCheck = await this.exportService.canRequestExport(patientId);

      res.status(200).json({
        canExport: rateLimitCheck.allowed,
        message: rateLimitCheck.reason || 'You can request an export',
      });
    } catch (error) {
      console.error('Export status check error:', error);

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to check export status',
      });
    }
  };

  /**
   * Log audit event for GDPR actions
   * SECURITY: No PII in logs, only IDs and event types
   */
  private async logAuditEvent(
    patientId: string,
    eventType: string,
    req: AuthenticatedRequest
  ): Promise<void> {
    try {
      const auditEntry = AuditTrailEntry.create({
        userId: patientId,
        pharmacyId: null, // Global event
        eventType,
        action: AuditAction.READ,
        resourceType: 'gdpr_export',
        resourceId: patientId,
        ipAddress: this.getClientIP(req),
        userAgent: req.headers['user-agent'] as string | null || null,
      });

      await this.auditRepository.save(auditEntry) as AuditTrailEntry;
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw - audit failure shouldn't block export
    }
  }

  /**
   * Get client IP address from request
   */
  private getClientIP(req: Request): string | null {
    const forwarded = req.headers['x-forwarded-for'];

    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }

    return req.socket.remoteAddress || null;
  }

  /**
   * Generate cryptographically secure random token
   */
  private async generateSecureToken(): Promise<string> {
    const buffer = await randomBytes(32);
    return buffer.toString('hex');
  }
}
