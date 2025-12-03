/**
 * COD Controller
 * REST API endpoints for Cash on Delivery payment operations
 */

import { Request, Response } from 'express';
import { DataSource } from 'typeorm';
import { CODService } from '../../services/cod/CODService';
import { SettlementService } from '../../services/cod/SettlementService';

export class CODController {
  private codService: CODService;
  private settlementService: SettlementService;

  constructor(dataSource: DataSource) {
    this.codService = new CODService(dataSource);
    this.settlementService = new SettlementService(dataSource);
  }

  /**
   * POST /api/v1/orders/:id/cod
   * Mark order as COD at checkout
   */
  markOrderAsCOD = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        res.status(400).json({
          error: 'Invalid amount',
          message: 'Amount must be greater than 0',
        });
        return;
      }

      await this.codService.markOrderAsCOD(id, amount);

      res.status(200).json({
        message: 'Order marked as COD successfully',
        order_id: id,
        amount,
      });
    } catch (error: any) {
      console.error('[COD Controller] Mark order as COD error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to mark order as COD',
      });
    }
  };

  /**
   * GET /api/v1/orders/:id/cod/status
   * Get COD status for an order
   */
  getCODStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const status = await this.codService.getCODStatus(id);

      if (!status) {
        res.status(404).json({
          error: 'Not Found',
          message: 'COD transaction not found for this order',
        });
        return;
      }

      res.status(200).json(status);
    } catch (error: any) {
      console.error('[COD Controller] Get COD status error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to get COD status',
      });
    }
  };

  /**
   * POST /api/v1/deliveries/:id/collect-payment
   * Collect COD payment from customer
   */
  collectPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id: deliveryId } = req.params;
      const { transaction_id, collected_amount, payment_method, change_given, notes } = req.body;

      if (!transaction_id) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'transaction_id is required',
        });
        return;
      }

      if (!collected_amount || collected_amount <= 0) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'collected_amount must be greater than 0',
        });
        return;
      }

      if (!payment_method || !['cash', 'card'].includes(payment_method)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'payment_method must be either "cash" or "card"',
        });
        return;
      }

      const transaction = await this.codService.collectPayment(transaction_id, {
        collected_amount,
        payment_method,
        change_given,
        notes,
      });

      res.status(200).json({
        message: 'Payment collected successfully',
        transaction,
      });
    } catch (error: any) {
      console.error('[COD Controller] Collect payment error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to collect payment',
      });
    }
  };

  /**
   * POST /api/v1/drivers/:id/settlement
   * Create driver settlement
   */
  createSettlement = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id: driverId } = req.params;
      const { settlement_date, total_settled, driver_notes } = req.body;

      if (!settlement_date) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'settlement_date is required',
        });
        return;
      }

      if (total_settled === undefined || total_settled < 0) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'total_settled must be provided and >= 0',
        });
        return;
      }

      const settlement = await this.settlementService.createSettlement({
        driver_id: driverId,
        settlement_date: new Date(settlement_date),
        total_settled,
        driver_notes,
      });

      res.status(201).json({
        message: 'Settlement created successfully',
        settlement,
      });
    } catch (error: any) {
      console.error('[COD Controller] Create settlement error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to create settlement',
      });
    }
  };

  /**
   * GET /api/v1/drivers/:id/cod-balance
   * Get driver's COD balance (unsettled transactions)
   */
  getDriverCODBalance = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id: driverId } = req.params;

      const balance = await this.codService.getDriverCODBalance(driverId);

      res.status(200).json(balance);
    } catch (error: any) {
      console.error('[COD Controller] Get driver balance error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to get driver balance',
      });
    }
  };

  /**
   * GET /api/v1/reports/cod/daily
   * Get daily COD revenue report
   */
  getDailyCODReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const { date } = req.query;

      if (!date) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'date query parameter is required',
        });
        return;
      }

      const reportDate = new Date(date as string);
      const report = await this.codService.getDailyCODRevenue(reportDate);

      res.status(200).json(report);
    } catch (error: any) {
      console.error('[COD Controller] Get daily report error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to get daily report',
      });
    }
  };

  /**
   * GET /api/v1/reports/cod/reconciliation
   * Get COD reconciliation report for date range
   */
  getReconciliationReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const { start_date, end_date } = req.query;

      if (!start_date || !end_date) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'start_date and end_date query parameters are required',
        });
        return;
      }

      const startDate = new Date(start_date as string);
      const endDate = new Date(end_date as string);

      const report = await this.settlementService.getReconciliationReport(startDate, endDate);

      res.status(200).json(report);
    } catch (error: any) {
      console.error('[COD Controller] Get reconciliation report error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to get reconciliation report',
      });
    }
  };

  /**
   * GET /api/v1/settlements/:id
   * Get settlement by ID
   */
  getSettlement = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const settlement = await this.settlementService.getSettlement(id);

      if (!settlement) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Settlement not found',
        });
        return;
      }

      res.status(200).json(settlement);
    } catch (error: any) {
      console.error('[COD Controller] Get settlement error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to get settlement',
      });
    }
  };

  /**
   * PUT /api/v1/settlements/:id/approve
   * Approve driver settlement
   */
  approveSettlement = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { approved_by, manager_notes } = req.body;

      if (!approved_by) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'approved_by is required',
        });
        return;
      }

      const settlement = await this.settlementService.approveSettlement(id, {
        approved_by,
        manager_notes,
      });

      res.status(200).json({
        message: 'Settlement approved successfully',
        settlement,
      });
    } catch (error: any) {
      console.error('[COD Controller] Approve settlement error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to approve settlement',
      });
    }
  };

  /**
   * PUT /api/v1/settlements/:id/dispute
   * Dispute driver settlement
   */
  disputeSettlement = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { disputed_by, reason } = req.body;

      if (!disputed_by || !reason) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'disputed_by and reason are required',
        });
        return;
      }

      const settlement = await this.settlementService.disputeSettlement(id, {
        disputed_by,
        reason,
      });

      res.status(200).json({
        message: 'Settlement disputed successfully',
        settlement,
      });
    } catch (error: any) {
      console.error('[COD Controller] Dispute settlement error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to dispute settlement',
      });
    }
  };
}
