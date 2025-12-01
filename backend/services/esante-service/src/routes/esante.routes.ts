/**
 * e-Santé Routes
 * API routes for e-Santé integration endpoints
 */

import express, { Router, Request, Response, NextFunction } from 'express';
import { ESanteController, AuthenticatedRequest } from '../controllers/esante.controller';
import { HINAuthService } from '../services/hin-auth.service';
import { EPDService } from '../services/epd.service';
import { ConsentService } from '../services/consent.service';

/**
 * Authentication middleware
 * Verifies JWT token from HIN auth service
 */
const authMiddleware = (hinAuthService: HINAuthService) => {
  return (req: any, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization token',
        statusCode: 401,
      });
    }

    const token = authHeader.substring(7);
    const payload = hinAuthService.verifyToken(token);

    if (!payload) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
        statusCode: 401,
      });
    }

    req.user = {
      hinId: payload.hinId,
      role: payload.role,
      canton: payload.canton,
    };
    req.token = token;

    next();
    return;
  };
};

/**
 * Create e-Santé router
 */
export function createESanteRouter(
  epdService: EPDService,
  hinAuthService: HINAuthService,
  consentService: ConsentService
): Router {
  const router = express.Router();
  const controller = new ESanteController(epdService, hinAuthService, consentService);
  const authenticate = authMiddleware(hinAuthService) as any;

  // ===== HIN Authentication =====

  /**
   * POST /api/esante/hin/authenticate
   * Authenticate with HIN credentials
   * Body: { hinId, password, canton }
   * Returns: { success, token, expiresIn, credential }
   */
  router.post('/hin/authenticate', controller.authenticateWithHIN);

  // ===== EPD Document Management =====

  /**
   * GET /api/esante/epd/:patientId/documents
   * List EPD documents for a patient
   * Query params: canton, documentType?, from?, to?
   * Returns: { success, patientId, canton, documentCount, documents }
   */
  router.get('/epd/:patientId/documents', authenticate, controller.listDocuments as any);

  /**
   * GET /api/esante/epd/documents/:documentId
   * Retrieve a specific EPD document
   * Query params: canton
   * Returns: Document content (binary)
   */
  router.get('/epd/documents/:documentId', authenticate, controller.getDocument as any);

  /**
   * POST /api/esante/epd/documents
   * Upload a document to EPD
   * Body: { patientId, canton, title, description?, documentType, formatCode, contentType?, data, createdByOrganization? }
   * Returns: { success, document }
   */
  router.post('/epd/documents', authenticate, controller.uploadDocument as any);

  // ===== Consent Management =====

  /**
   * GET /api/esante/consent/:patientId
   * Get consent status for patient-pharmacy pair
   * Query params: pharmacyId, canton
   * Returns: { success, consent }
   */
  router.get('/consent/:patientId', authenticate, controller.getConsent as any);

  /**
   * PUT /api/esante/consent/:patientId
   * Update consent (grant or revoke)
   * Body: { pharmacyId, canton, action (grant|revoke), documentTypes?, expiresIn? }
   * Returns: { success, consent }
   */
  router.put('/consent/:patientId', authenticate, controller.updateConsent as any);

  /**
   * GET /api/esante/consent/:patientId/validate
   * Validate consent for specific document access
   * Query params: pharmacyId, documentType, canton
   * Returns: { success, isValid, patientId, pharmacyId, documentType }
   */
  router.get('/consent/:patientId/validate', authenticate, controller.validateConsent as any);

  // ===== Health & Statistics =====

  /**
   * GET /api/esante/health
   * Health check endpoint
   * Returns: { status, service, timestamp }
   */
  router.get('/health', controller.healthCheck);

  /**
   * GET /api/esante/stats
   * Get service statistics
   * Returns: { success, stats }
   */
  router.get('/stats', controller.getStats);

  return router;
}
