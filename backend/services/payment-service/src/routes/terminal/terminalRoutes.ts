/**
 * Terminal Routes
 * API endpoints for mobile payment terminal operations
 */

import { Router } from 'express';
import { DataSource } from 'typeorm';
import { TerminalController } from '../../controllers/terminal/terminalController';

export function createTerminalRoutes(dataSource: DataSource): Router {
  const router = Router();
  const terminalController = new TerminalController(dataSource);

  // ============================================================================
  // Terminal Management Endpoints
  // ============================================================================

  /**
   * POST /api/v1/terminals/pair
   * Pair terminal to driver with Bluetooth
   */
  router.post('/terminals/pair', terminalController.pairTerminal);

  /**
   * POST /api/v1/terminals/{serial}/confirm-pairing
   * Confirm terminal pairing after Bluetooth connection
   */
  router.post('/terminals/:serial/confirm-pairing', terminalController.confirmPairing);

  /**
   * GET /api/v1/terminals/{serial}
   * Get terminal details
   */
  router.get('/terminals/:serial', terminalController.getTerminal);

  /**
   * POST /api/v1/terminals/{serial}/status
   * Update terminal battery and connectivity status
   */
  router.post('/terminals/:serial/status', terminalController.updateTerminalStatus);

  /**
   * POST /api/v1/terminals/{serial}/disable
   * Disable terminal
   */
  router.post('/terminals/:serial/disable', terminalController.disableTerminal);

  // ============================================================================
  // Driver Terminals Endpoints
  // ============================================================================

  /**
   * GET /api/v1/drivers/{driver_id}/terminals
   * Get all terminals for a driver
   */
  router.get('/drivers/:driver_id/terminals', terminalController.getDriverTerminals);

  // ============================================================================
  // Card Payment Endpoints
  // ============================================================================

  /**
   * POST /api/v1/deliveries/{delivery_id}/card-payment
   * Initiate card payment for COD delivery
   */
  router.post('/deliveries/:delivery_id/card-payment', terminalController.initiateCardPayment);

  /**
   * POST /api/v1/terminals/{serial}/transactions/{transaction_id}/process
   * Process payment on terminal
   */
  router.post(
    '/terminals/:serial/transactions/:transaction_id/process',
    terminalController.processPayment
  );

  /**
   * GET /api/v1/terminals/{serial}/transactions/{transaction_id}
   * Get terminal transaction details
   */
  router.get(
    '/terminals/:serial/transactions/:transaction_id',
    terminalController.getTransaction
  );

  /**
   * GET /api/v1/terminals/{serial}/transactions
   * Get transaction history for terminal
   */
  router.get('/terminals/:serial/transactions', terminalController.getTransactionHistory);

  /**
   * POST /api/v1/terminals/{serial}/transactions/{transaction_id}/refund
   * Refund terminal transaction
   */
  router.post(
    '/terminals/:serial/transactions/:transaction_id/refund',
    terminalController.refundTransaction
  );

  // ============================================================================
  // Reporting Endpoints
  // ============================================================================

  /**
   * GET /api/v1/reports/terminals/daily
   * Get daily terminal report
   */
  router.get('/reports/terminals/daily', terminalController.getDailyTerminalReport);

  return router;
}
