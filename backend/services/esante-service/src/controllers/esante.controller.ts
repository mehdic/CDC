/**
 * e-Santé Controller
 * Handles HTTP requests for e-Santé integration endpoints
 */

import { Request, Response } from 'express';
import { HINAuthService } from '../services/hin-auth.service';
import { EPDService } from '../services/epd.service';
import { ConsentService } from '../services/consent.service';
import {
  HINAuthRequest,
  EPDDocumentType,
  DocumentFilters,
  DocumentUploadRequest,
  SwissCanton,
} from '../types/esante.types';
import { AuthenticatedUser, AuthenticatedRequest as SharedAuthRequest } from '../../../../shared/middleware/auth';

// Extend shared AuthenticatedRequest with e-Santé specific fields
export interface AuthenticatedRequest extends SharedAuthRequest {
  user?: AuthenticatedUser & {
    hinId?: string;
    canton?: SwissCanton;
  };
  token?: string;
}

export class ESanteController {
  private hinAuthService: HINAuthService;
  private epdService: EPDService;
  private consentService: ConsentService;

  constructor(epdService: EPDService, hinAuthService: HINAuthService, consentService: ConsentService) {
    this.epdService = epdService;
    this.hinAuthService = hinAuthService;
    this.consentService = consentService;
  }

  /**
   * HIN Authentication endpoint
   * POST /api/esante/hin/authenticate
   */
  authenticateWithHIN = async (req: Request, res: Response) => {
    try {
      const { hinId, password, canton } = req.body as HINAuthRequest;

      if (!hinId || !password || !canton) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Missing required fields: hinId, password, canton',
          statusCode: 400,
        });
      }

      const result = await this.hinAuthService.authenticate({
        hinId,
        password,
        canton: canton as SwissCanton,
      });

      if (!result.success) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: result.error,
          statusCode: 401,
        });
      }

      res.status(200).json({
        success: true,
        token: result.token,
        expiresIn: result.expiresIn,
        credential: {
          hinId: result.credential?.hinId,
          email: result.credential?.email,
          role: result.credential?.role,
          canton: result.credential?.canton,
          organizationName: result.credential?.organizationName,
        },
      });
    } catch (error) {
      console.error('HIN authentication error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'HIN authentication failed',
        statusCode: 500,
      });
    }
  };

  /**
   * List EPD documents for a patient
   * GET /api/esante/epd/:patientId/documents
   */
  listDocuments = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { patientId } = req.params;
      const { canton, documentType, from, to } = req.query;

      if (!patientId || !canton) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Missing required parameters: patientId, canton',
          statusCode: 400,
        });
      }

      // Verify authentication
      if (!req.token) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'No valid token provided',
          statusCode: 401,
        });
      }

      const filters: DocumentFilters = {};

      if (documentType) {
        filters.documentTypes = [documentType as EPDDocumentType];
      }

      if (from) {
        filters.createdSince = new Date(from as string);
      }

      if (to) {
        filters.createdUntil = new Date(to as string);
      }

      const documents = await this.epdService.listDocuments(
        patientId,
        canton as string,
        req.token,
        filters
      );

      res.json({
        success: true,
        patientId,
        canton,
        documentCount: documents.length,
        documents,
      });
      return;
    } catch (error) {
      console.error('Error listing documents:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to list documents',
        statusCode: 500,
      });
    }
  };

  /**
   * Get a specific document
   * GET /api/esante/epd/documents/:documentId
   */
  getDocument = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { documentId } = req.params;
      const { canton } = req.query;

      if (!documentId || !canton) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Missing required parameters: documentId, canton',
          statusCode: 400,
        });
      }

      if (!req.token) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'No valid token provided',
          statusCode: 401,
        });
      }

      const content = await this.epdService.getDocument(documentId, canton as string, req.token);

      res.set('Content-Type', content.contentType);
      res.set('Content-Disposition', `attachment; filename="${content.title}"`);
      res.send(content.data);
    } catch (error) {
      console.error('Error retrieving document:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve document',
        statusCode: 500,
      });
    }
  };

  /**
   * Upload a document to EPD
   * POST /api/esante/epd/documents
   */
  uploadDocument = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { patientId, canton, title, description, documentType, formatCode, data } = req.body;

      if (!patientId || !canton || !title || !documentType || !formatCode || !data) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Missing required fields',
          statusCode: 400,
        });
      }

      if (!req.token || !req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'No valid token or user provided',
          statusCode: 401,
        });
      }

      // Convert base64 data to Buffer if needed
      const documentData = Buffer.isBuffer(data) ? data : Buffer.from(data, 'base64');

      const uploadRequest: DocumentUploadRequest = {
        title,
        description,
        documentType: documentType as EPDDocumentType,
        formatCode,
        contentType: req.body.contentType || 'application/pdf',
        data: documentData,
        createdBy: req.user.hinId,
        createdByOrganization: req.body.createdByOrganization || 'Unknown Organization',
      };

      const uploadedDoc = await this.epdService.uploadDocument(patientId, canton, uploadRequest, req.token);

      res.status(201).json({
        success: true,
        document: uploadedDoc,
      });
      return;
    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to upload document',
        statusCode: 500,
      });
    }
  };

  /**
   * Get patient consent status
   * GET /api/esante/consent/:patientId
   */
  getConsent = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { patientId } = req.params;
      const { pharmacyId, canton } = req.query;

      if (!patientId || !pharmacyId || !canton) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Missing required parameters: patientId, pharmacyId, canton',
          statusCode: 400,
        });
      }

      if (!req.token) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'No valid token provided',
          statusCode: 401,
        });
      }

      const consent = await this.consentService.getConsent(
        patientId,
        pharmacyId as string,
        canton as string,
        req.token
      );

      if (!consent) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Consent not found',
          statusCode: 404,
        });
      }

      res.json({
        success: true,
        consent,
      });
    } catch (error) {
      console.error('Error fetching consent:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch consent',
        statusCode: 500,
      });
    }
  };

  /**
   * Update patient consent
   * PUT /api/esante/consent/:patientId
   */
  updateConsent = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { patientId } = req.params;
      const { pharmacyId, action, documentTypes, canton, expiresIn } = req.body;

      if (!patientId || !pharmacyId || !action || !canton) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Missing required fields: patientId, pharmacyId, action, canton',
          statusCode: 400,
        });
      }

      if (!req.token) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'No valid token provided',
          statusCode: 401,
        });
      }

      let consent: any = null;

      if (action === 'grant') {
        consent = await this.consentService.grantConsent(
          patientId,
          pharmacyId,
          (documentTypes || [EPDDocumentType.PRESCRIPTION]) as EPDDocumentType[],
          canton,
          req.token,
          expiresIn
        );
      } else if (action === 'revoke') {
        const success = await this.consentService.revokeConsent(patientId, pharmacyId, canton, req.token);

        if (!success) {
          return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to revoke consent',
            statusCode: 500,
          });
        }

        consent = await this.consentService.getConsent(patientId, pharmacyId, canton, req.token);
      } else {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid action. Must be "grant" or "revoke"',
          statusCode: 400,
        });
      }

      res.json({
        success: true,
        consent,
      });
    } catch (error) {
      console.error('Error updating consent:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update consent',
        statusCode: 500,
      });
    }
  };

  /**
   * Validate consent for document access
   * GET /api/esante/consent/:patientId/validate
   */
  validateConsent = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { patientId } = req.params;
      const { pharmacyId, documentType, canton } = req.query;

      if (!patientId || !pharmacyId || !documentType || !canton) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Missing required parameters: patientId, pharmacyId, documentType, canton',
          statusCode: 400,
        });
      }

      if (!req.token) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'No valid token provided',
          statusCode: 401,
        });
      }

      const isValid = await this.consentService.validateConsent(
        patientId,
        pharmacyId as string,
        documentType as EPDDocumentType,
        canton as string,
        req.token
      );

      res.json({
        success: true,
        isValid,
        patientId,
        pharmacyId,
        documentType,
      });
    } catch (error) {
      console.error('Error validating consent:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to validate consent',
        statusCode: 500,
      });
    }
  };

  /**
   * Health check endpoint
   * GET /api/esante/health
   */
  healthCheck = (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'esante-service',
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * Get service statistics
   * GET /api/esante/stats
   */
  getStats = (req: Request, res: Response) => {
    try {
      const consentStats = this.consentService.getStats();
      const cacheStats = this.epdService.getCacheStats();

      res.json({
        success: true,
        stats: {
          consent: consentStats,
          cache: cacheStats,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch stats',
        statusCode: 500,
      });
    }
  };
}
