/**
 * Refill Routes
 * Express router for refill endpoints
 */

import { Router } from 'express';
import { RefillController } from '../controllers/refill.controller';
import { RefillService } from '../services/RefillService';
import { EligibilityService } from '../services/EligibilityService';
import { DataSource } from 'typeorm';

export function createRefillRoutes(dataSource: DataSource): Router {
  const router = Router();

  // Initialize services
  const eligibilityService = new EligibilityService();
  const refillService = new RefillService(dataSource, eligibilityService);
  const refillController = new RefillController(refillService, eligibilityService);

  // Patient routes
  /**
   * POST /api/refills
   * Create a new refill request
   */
  router.post('/', (req, res) => refillController.createRefillRequest(req, res));

  /**
   * GET /api/refills
   * List refill requests for patient or pharmacy
   */
  router.get('/', (req, res) => refillController.getRefillRequests(req, res));

  /**
   * GET /api/refills/:id
   * Get refill request details
   */
  router.get('/:id', (req, res) => refillController.getRefillRequest(req, res));

  // Pharmacist routes
  /**
   * PUT /api/refills/:id/approve
   * Approve refill request
   */
  router.put('/:id/approve', (req, res) => refillController.approveRefill(req, res));

  /**
   * PUT /api/refills/:id/deny
   * Deny refill request
   */
  router.put('/:id/deny', (req, res) => refillController.denyRefill(req, res));

  /**
   * PUT /api/refills/:id/fill
   * Mark refill as filled
   */
  router.put('/:id/fill', (req, res) => refillController.fillRefill(req, res));

  // History and analytics routes
  /**
   * GET /api/refills/:prescriptionId/history
   * Get refill history for prescription
   */
  router.get('/:prescriptionId/history', (req, res) =>
    refillController.getRefillHistory(req, res)
  );

  // Admin/scheduled task routes
  /**
   * POST /api/refills/expire-old
   * Expire old refill requests
   */
  router.post('/expire-old', (req, res) => refillController.expireOldRefills(req, res));

  return router;
}

export { RefillController, RefillService, EligibilityService };
