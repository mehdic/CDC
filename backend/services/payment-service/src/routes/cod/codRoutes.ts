/**
 * COD Routes
 * API endpoints for Cash on Delivery operations
 */

import { Router } from 'express';
import { DataSource } from 'typeorm';
import { CODController } from '../../controllers/cod/codController';

export function createCODRoutes(dataSource: DataSource): Router {
  const router = Router();
  const codController = new CODController(dataSource);

  // ============================================================================
  // Order COD Endpoints
  // ============================================================================

  /**
   * POST /api/v1/orders/:id/cod
   * Mark order as COD at checkout
   */
  router.post('/orders/:id/cod', codController.markOrderAsCOD);

  /**
   * GET /api/v1/orders/:id/cod/status
   * Get COD status for an order
   */
  router.get('/orders/:id/cod/status', codController.getCODStatus);

  // ============================================================================
  // Delivery Payment Collection Endpoints
  // ============================================================================

  /**
   * POST /api/v1/deliveries/:id/collect-payment
   * Collect COD payment from customer
   */
  router.post('/deliveries/:id/collect-payment', codController.collectPayment);

  // ============================================================================
  // Driver Settlement Endpoints
  // ============================================================================

  /**
   * POST /api/v1/drivers/:id/settlement
   * Create driver settlement
   */
  router.post('/drivers/:id/settlement', codController.createSettlement);

  /**
   * GET /api/v1/drivers/:id/cod-balance
   * Get driver's unsettled COD balance
   */
  router.get('/drivers/:id/cod-balance', codController.getDriverCODBalance);

  /**
   * GET /api/v1/settlements/:id
   * Get settlement by ID
   */
  router.get('/settlements/:id', codController.getSettlement);

  /**
   * PUT /api/v1/settlements/:id/approve
   * Approve driver settlement
   */
  router.put('/settlements/:id/approve', codController.approveSettlement);

  /**
   * PUT /api/v1/settlements/:id/dispute
   * Dispute driver settlement
   */
  router.put('/settlements/:id/dispute', codController.disputeSettlement);

  // ============================================================================
  // Reporting Endpoints
  // ============================================================================

  /**
   * GET /api/v1/reports/cod/daily
   * Get daily COD revenue report
   */
  router.get('/reports/cod/daily', codController.getDailyCODReport);

  /**
   * GET /api/v1/reports/cod/reconciliation
   * Get COD reconciliation report for date range
   */
  router.get('/reports/cod/reconciliation', codController.getReconciliationReport);

  return router;
}
