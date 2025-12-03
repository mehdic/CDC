/**
 * Terminal Controller
 * API endpoints for mobile payment terminal operations
 */

import { Request, Response } from 'express';
import { DataSource } from 'typeorm';
import { TerminalService } from '../../services/terminal/terminal-service';
import { SumUpPaymentRequest } from '../../services/terminal/sumup-client';

export class TerminalController {
  private terminalService: TerminalService;

  constructor(dataSource: DataSource) {
    const sumupApiKey = process.env.SUMUP_API_KEY || '';
    const sumupMerchantId = process.env.SUMUP_MERCHANT_ID || '';
    this.terminalService = new TerminalService(dataSource, sumupApiKey, sumupMerchantId);
  }

  /**
   * POST /api/v1/terminals/pair
   * Pair terminal to driver with Bluetooth
   */
  pairTerminal = async (req: Request, res: Response): Promise<void> => {
    try {
      const { driver_id, serial_number, device_name } = req.body;

      if (!driver_id || !serial_number || !device_name) {
        res.status(400).json({
          error: 'Missing required fields: driver_id, serial_number, device_name',
        });
        return;
      }

      const result = await this.terminalService.pairTerminal({
        driver_id,
        serial_number,
        device_name,
      });

      res.status(200).json({
        success: true,
        pairing_code: result.pairing_code,
        expires_at: result.expires_at,
        message: 'Pairing initiated. Enter the code on your device.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  };

  /**
   * POST /api/v1/terminals/{serial}/confirm-pairing
   * Confirm terminal pairing after Bluetooth connection
   */
  confirmPairing = async (req: Request, res: Response): Promise<void> => {
    try {
      const { serial } = req.params;
      const { pairing_code, mac_address } = req.body;

      if (!pairing_code || !mac_address) {
        res.status(400).json({
          error: 'Missing required fields: pairing_code, mac_address',
        });
        return;
      }

      const terminal = await this.terminalService.confirmPairing(serial, {
        pairing_code,
        mac_address,
      });

      res.status(200).json({
        success: true,
        terminal: {
          id: terminal.id,
          serial_number: terminal.serial_number,
          status: terminal.status,
          paired_at: terminal.paired_at,
          mac_address: terminal.mac_address,
        },
        message: 'Terminal successfully paired',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  };

  /**
   * POST /api/v1/terminals/{serial}/status
   * Update terminal battery and connectivity status
   */
  updateTerminalStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { serial } = req.params;
      const { battery_percentage, is_charging, is_connected, network_type, signal_strength } = req.body;

      if (battery_percentage === undefined || is_connected === undefined) {
        res.status(400).json({
          error: 'Missing required fields: battery_percentage, is_connected',
        });
        return;
      }

      const terminal = await this.terminalService.updateTerminalStatus(serial, {
        battery_percentage,
        is_charging: is_charging || false,
        is_connected,
        network_type,
        signal_strength,
      });

      res.status(200).json({
        success: true,
        terminal: {
          id: terminal.id,
          status: terminal.getStatusDisplay(),
          battery_level: terminal.battery_level,
          battery_percentage: terminal.battery_percentage,
          is_connected: terminal.is_connected,
          network_type: terminal.network_type,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  };

  /**
   * GET /api/v1/terminals/{serial}
   * Get terminal details
   */
  getTerminal = async (req: Request, res: Response): Promise<void> => {
    try {
      const { serial } = req.params;

      const terminal = await this.terminalService.getTerminal(serial);

      if (!terminal) {
        res.status(404).json({ error: 'Terminal not found' });
        return;
      }

      res.status(200).json({
        success: true,
        terminal: {
          id: terminal.id,
          serial_number: terminal.serial_number,
          status: terminal.getStatusDisplay(),
          battery_level: terminal.battery_level,
          battery_percentage: terminal.battery_percentage,
          is_connected: terminal.is_connected,
          is_charging: terminal.is_charging,
          network_type: terminal.network_type,
          paired_at: terminal.paired_at,
          last_heartbeat: terminal.last_heartbeat,
          total_transactions: terminal.total_transactions,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  };

  /**
   * GET /api/v1/drivers/{driver_id}/terminals
   * Get all terminals for a driver
   */
  getDriverTerminals = async (req: Request, res: Response): Promise<void> => {
    try {
      const { driver_id } = req.params;

      const terminals = await this.terminalService.getDriverTerminals(driver_id);

      res.status(200).json({
        success: true,
        terminals: terminals.map((t) => ({
          id: t.id,
          serial_number: t.serial_number,
          status: t.getStatusDisplay(),
          battery_level: t.battery_level,
          battery_percentage: t.battery_percentage,
          is_connected: t.is_connected,
          total_transactions: t.total_transactions,
          last_transaction_at: t.last_transaction_at,
        })),
        count: terminals.length,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  };

  /**
   * POST /api/v1/deliveries/{delivery_id}/card-payment
   * Initiate card payment for COD delivery
   */
  initiateCardPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { delivery_id } = req.params;
      const { serial_number, cod_transaction_id, amount, location } = req.body;

      if (!serial_number || !cod_transaction_id || !amount) {
        res.status(400).json({
          error: 'Missing required fields: serial_number, cod_transaction_id, amount',
        });
        return;
      }

      const transaction = await this.terminalService.initiatePayment(
        serial_number,
        cod_transaction_id,
        {
          amount,
          delivery_id,
          location,
        }
      );

      res.status(200).json({
        success: true,
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          status: transaction.getStatusDisplay(),
          payment_type: transaction.payment_type,
        },
        message: 'Payment transaction initiated. Processing...',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  };

  /**
   * POST /api/v1/terminals/{serial}/transactions/{transaction_id}/process
   * Process payment on terminal
   */
  processPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { serial, transaction_id } = req.params;
      const { description, skip_screen } = req.body;

      const terminalTransaction = await this.terminalService.getTerminalTransaction(
        transaction_id
      );

      if (!terminalTransaction) {
        res.status(404).json({ error: 'Terminal transaction not found' });
        return;
      }

      const paymentRequest: SumUpPaymentRequest = {
        amount: Math.round(terminalTransaction.amount * 100), // Convert to cents
        currency: 'CHF',
        description: description || 'COD Payment',
        reference_id: terminalTransaction.id,
        customer_reference: terminalTransaction.delivery_id,
        skip_screen: skip_screen || false,
      };

      const result = await this.terminalService.processPayment(
        transaction_id,
        serial,
        paymentRequest
      );

      res.status(200).json({
        success: result.isApproved(),
        transaction: {
          id: result.id,
          amount: result.amount,
          status: result.getStatusDisplay(),
          card_last4: result.card_last4,
          card_scheme: result.card_scheme,
          auth_code: result.auth_code,
          receipt_id: result.sumup_receipt_id,
        },
        message: result.isApproved()
          ? 'Payment approved successfully'
          : 'Payment processing failed',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  };

  /**
   * GET /api/v1/terminals/{serial}/transactions/{transaction_id}
   * Get terminal transaction details
   */
  getTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
      const { transaction_id } = req.params;

      const transaction = await this.terminalService.getTerminalTransaction(transaction_id);

      if (!transaction) {
        res.status(404).json({ error: 'Terminal transaction not found' });
        return;
      }

      res.status(200).json({
        success: true,
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          payment_type: transaction.payment_type,
          status: transaction.getStatusDisplay(),
          card_last4: transaction.card_last4,
          card_scheme: transaction.card_scheme,
          card_holder_name: transaction.card_holder_name,
          auth_code: transaction.auth_code,
          rrn: transaction.rrn,
          receipt_id: transaction.sumup_receipt_id,
          created_at: transaction.created_at,
          updated_at: transaction.updated_at,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  };

  /**
   * GET /api/v1/terminals/{serial}/transactions
   * Get transaction history for terminal
   */
  getTransactionHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { serial } = req.params;
      const { limit } = req.query;

      const transactions = await this.terminalService.getTerminalTransactionHistory(
        serial,
        parseInt(limit as string) || 50
      );

      res.status(200).json({
        success: true,
        transactions: transactions.map((t) => ({
          id: t.id,
          amount: t.amount,
          status: t.getStatusDisplay(),
          payment_type: t.payment_type,
          card_last4: t.card_last4,
          created_at: t.created_at,
        })),
        count: transactions.length,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  };

  /**
   * POST /api/v1/terminals/{serial}/transactions/{transaction_id}/refund
   * Refund terminal transaction
   */
  refundTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
      const { serial, transaction_id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        res.status(400).json({ error: 'Missing required field: reason' });
        return;
      }

      const result = await this.terminalService.refundTransaction(
        transaction_id,
        serial,
        reason
      );

      res.status(200).json({
        success: true,
        transaction: {
          id: result.id,
          status: result.getStatusDisplay(),
          refunded_amount: result.refunded_amount,
          refunded_at: result.refunded_at,
        },
        message: 'Transaction refunded successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  };

  /**
   * POST /api/v1/terminals/{serial}/disable
   * Disable terminal
   */
  disableTerminal = async (req: Request, res: Response): Promise<void> => {
    try {
      const { serial } = req.params;

      const terminal = await this.terminalService.disableTerminal(serial);

      res.status(200).json({
        success: true,
        terminal: {
          id: terminal.id,
          serial_number: terminal.serial_number,
          status: terminal.getStatusDisplay(),
        },
        message: 'Terminal disabled successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  };

  /**
   * GET /api/v1/reports/terminals/daily
   * Get daily terminal report
   */
  getDailyTerminalReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const { date } = req.query;

      const reportDate = date ? new Date(date as string) : new Date();

      const report = await this.terminalService.getDailyTerminalReport(reportDate);

      res.status(200).json({
        success: true,
        report: {
          date: report.date,
          total_transactions: report.total_transactions,
          approved: report.approved,
          declined: report.declined,
          failed: report.failed,
          total_amount: report.total_amount.toFixed(2),
          average_amount: report.average_amount.toFixed(2),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  };
}
