/**
 * Terminal Service
 * Business logic for mobile payment terminal management and transactions
 */

import { DataSource, Repository } from 'typeorm';
import { TerminalDevice, TerminalStatus, TerminalBatteryLevel } from '../../../../../shared/models/TerminalDevice';
import { TerminalTransaction, TerminalTransactionStatus, TerminalPaymentType } from '../../../../../shared/models/TerminalTransaction';
import { CODTransaction, CODStatus } from '../../../../../shared/models/CODTransaction';
import { SumUpClient, SumUpPaymentRequest } from './sumup-client';

export interface PairTerminalDTO {
  driver_id: string;
  serial_number: string;
  device_name: string;
}

export interface ConfirmPairingDTO {
  pairing_code: string;
  mac_address: string;
}

export interface InitiatePaymentDTO {
  amount: number; // in CHF
  delivery_id: string;
  location?: {
    address: string;
    latitude: number;
    longitude: number;
  };
}

export interface PaymentStatusDTO {
  terminal_id: string;
  cod_transaction_id: string;
}

export class TerminalService {
  private terminalRepo: Repository<TerminalDevice>;
  private transactionRepo: Repository<TerminalTransaction>;
  private codTransactionRepo: Repository<CODTransaction>;
  private sumupClient: SumUpClient;

  constructor(
    private dataSource: DataSource,
    sumupApiKey: string,
    sumupMerchantId: string
  ) {
    this.terminalRepo = dataSource.getRepository(TerminalDevice);
    this.transactionRepo = dataSource.getRepository(TerminalTransaction);
    this.codTransactionRepo = dataSource.getRepository(CODTransaction);
    this.sumupClient = new SumUpClient(sumupApiKey, sumupMerchantId);
  }

  /**
   * Pair terminal to driver
   */
  async pairTerminal(dto: PairTerminalDTO): Promise<{ pairing_code: string; expires_at: string }> {
    // Check if serial number already exists
    const existing = await this.terminalRepo.findOne({
      where: { serial_number: dto.serial_number },
    });

    if (existing && existing.status !== TerminalStatus.UNPAIRED) {
      throw new Error('Terminal already paired to another driver');
    }

    // Get device info from SumUp
    const sumupDeviceInfo = await this.sumupClient.getDeviceInfo(dto.serial_number);

    // Create or update terminal device
    let terminal = existing || this.terminalRepo.create({
      serial_number: dto.serial_number,
      sumup_device_id: sumupDeviceInfo.id,
      driver_id: dto.driver_id,
    });

    terminal.driver_id = dto.driver_id;
    terminal.model = sumupDeviceInfo.model;
    terminal.status = TerminalStatus.PAIRING_PENDING;
    terminal.pairing_requested_by = dto.driver_id;
    terminal.pairing_requested_at = new Date();

    // Initiate pairing with SumUp
    const pairingResponse = await this.sumupClient.initiateDevicePairing(
      dto.serial_number,
      dto.device_name
    );

    terminal.pairing_code = pairingResponse.pairing_code;
    terminal.pairing_code_expires_at = new Date(pairingResponse.expires_at);

    await this.terminalRepo.save(terminal);

    return {
      pairing_code: pairingResponse.pairing_code,
      expires_at: pairingResponse.expires_at,
    };
  }

  /**
   * Confirm terminal pairing
   */
  async confirmPairing(
    serialNumber: string,
    dto: ConfirmPairingDTO
  ): Promise<TerminalDevice> {
    const terminal = await this.terminalRepo.findOne({
      where: { serial_number: serialNumber },
    });

    if (!terminal) {
      throw new Error('Terminal not found');
    }

    // Verify pairing code
    if (!terminal.isPairingCodeValid() || terminal.pairing_code !== dto.pairing_code) {
      throw new Error('Invalid or expired pairing code');
    }

    // Confirm pairing with SumUp
    const confirmResponse = await this.sumupClient.confirmDevicePairing(
      serialNumber,
      dto.pairing_code
    );

    // Update terminal
    terminal.markAsPaired(dto.mac_address);
    terminal.pairing_code = null;
    terminal.pairing_code_expires_at = null;
    terminal.status = TerminalStatus.PAIRED;

    // Activate if online
    const status = await this.sumupClient.getTerminalStatus(serialNumber);
    if (status.is_online) {
      terminal.activate();
    }

    await this.terminalRepo.save(terminal);

    return terminal;
  }

  /**
   * Update terminal status from device
   */
  async updateTerminalStatus(
    serialNumber: string,
    statusData: {
      battery_percentage: number;
      is_charging: boolean;
      is_connected: boolean;
      network_type?: string;
      signal_strength?: number;
    }
  ): Promise<TerminalDevice> {
    const terminal = await this.terminalRepo.findOne({
      where: { serial_number: serialNumber },
    });

    if (!terminal) {
      throw new Error('Terminal not found');
    }

    terminal.updateBattery(statusData.battery_percentage, statusData.is_charging);
    terminal.updateConnectivity(
      statusData.is_connected,
      statusData.network_type,
      statusData.signal_strength
    );

    await this.terminalRepo.save(terminal);

    return terminal;
  }

  /**
   * Initiate card payment transaction
   */
  async initiatePayment(
    serialNumber: string,
    codTransactionId: string,
    dto: InitiatePaymentDTO
  ): Promise<TerminalTransaction> {
    // Get terminal
    const terminal = await this.terminalRepo.findOne({
      where: { serial_number: serialNumber },
    });

    if (!terminal) {
      throw new Error('Terminal not found');
    }

    if (!terminal.isReadyForPayment()) {
      throw new Error(`Terminal not ready for payment. Status: ${terminal.getStatusDisplay()}`);
    }

    // Get COD transaction
    const codTransaction = await this.codTransactionRepo.findOne({
      where: { id: codTransactionId },
    });

    if (!codTransaction) {
      throw new Error('COD transaction not found');
    }

    if (codTransaction.status !== CODStatus.PENDING) {
      throw new Error('COD transaction is not pending');
    }

    // Create terminal transaction
    const transaction = this.transactionRepo.create({
      terminal_id: terminal.id,
      cod_transaction_id: codTransactionId,
      driver_id: terminal.driver_id,
      delivery_id: dto.delivery_id,
      amount: dto.amount,
      payment_type: TerminalPaymentType.CARD_PRESENT,
    });

    if (dto.location) {
      transaction.location_address = dto.location.address;
      transaction.location_latitude = dto.location.latitude;
      transaction.location_longitude = dto.location.longitude;
    }

    transaction.markAsProcessing();
    await this.transactionRepo.save(transaction);

    return transaction;
  }

  /**
   * Process payment with SumUp
   */
  async processPayment(
    transactionId: string,
    serialNumber: string,
    paymentRequest: SumUpPaymentRequest
  ): Promise<TerminalTransaction> {
    const transaction = await this.transactionRepo.findOne({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new Error('Terminal transaction not found');
    }

    try {
      // Process with SumUp
      const sumupResponse = await this.sumupClient.processPayment(
        serialNumber,
        paymentRequest
      );

      // Update transaction based on response
      if (sumupResponse.status === 'APPROVED' || sumupResponse.status === 'approved') {
        transaction.markAsApproved(
          sumupResponse.id,
          sumupResponse.auth_code || 'N/A',
          sumupResponse.rrn,
          {
            sumup_receipt_id: sumupResponse.receipt_id,
            sumup_receipt_url: sumupResponse.receipt_url,
          }
        );

        // Update terminal transaction
        transaction.card_scheme = this.sumupClient.parseCardScheme(
          sumupResponse.card.scheme
        );
        transaction.card_last4 = sumupResponse.card.last4;
        transaction.card_holder_name = sumupResponse.card.name;
        transaction.sumup_receipt_id = sumupResponse.receipt_id;

        // Update COD transaction
        const codTransaction = await this.codTransactionRepo.findOne({
          where: { id: transaction.cod_transaction_id },
        });

        if (codTransaction) {
          codTransaction.markAsCollected(
            transaction.amount,
            'card' as any,
            0,
            `Card payment via terminal: ${transaction.card_scheme} ${transaction.card_last4}`
          );
          await this.codTransactionRepo.save(codTransaction);
        }
      } else if (sumupResponse.status === 'DECLINED' || sumupResponse.status === 'declined') {
        const errorMessage = sumupResponse.status;
        transaction.markAsDeclined(sumupResponse.id || '01', errorMessage);
      } else {
        transaction.markAsFailed(`Unknown response status: ${sumupResponse.status}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      transaction.markAsFailed(errorMessage);
    }

    await this.transactionRepo.save(transaction);

    return transaction;
  }

  /**
   * Get terminal by serial number
   */
  async getTerminal(serialNumber: string): Promise<TerminalDevice | null> {
    return this.terminalRepo.findOne({
      where: { serial_number: serialNumber },
      relations: ['driver'],
    });
  }

  /**
   * Get driver's terminals
   */
  async getDriverTerminals(driverId: string): Promise<TerminalDevice[]> {
    return this.terminalRepo.find({
      where: { driver_id: driverId },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Get terminal transaction
   */
  async getTerminalTransaction(transactionId: string): Promise<TerminalTransaction | null> {
    return this.transactionRepo.findOne({
      where: { id: transactionId },
      relations: ['terminal', 'driver', 'cod_transaction'],
    });
  }

  /**
   * Get transaction history for terminal
   */
  async getTerminalTransactionHistory(
    serialNumber: string,
    limit: number = 50
  ): Promise<TerminalTransaction[]> {
    const terminal = await this.terminalRepo.findOne({
      where: { serial_number: serialNumber },
    });

    if (!terminal) {
      throw new Error('Terminal not found');
    }

    return this.transactionRepo.find({
      where: { terminal_id: terminal.id },
      order: { created_at: 'DESC' },
      take: limit,
      relations: ['cod_transaction'],
    });
  }

  /**
   * Refund terminal transaction
   */
  async refundTransaction(
    transactionId: string,
    serialNumber: string,
    reason: string
  ): Promise<TerminalTransaction> {
    const transaction = await this.transactionRepo.findOne({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new Error('Terminal transaction not found');
    }

    if (!transaction.canBeRefunded()) {
      throw new Error('Transaction cannot be refunded');
    }

    try {
      // Refund with SumUp
      const refundResponse = await this.sumupClient.refundTransaction(
        transaction.sumup_transaction_id!,
        Math.round(transaction.amount * 100), // Convert to cents
        reason
      );

      // Update transaction
      transaction.markAsRefunded(transaction.amount, reason);
      transaction.refund_transaction_id = refundResponse.id;

      // Reverse COD collection if needed
      const codTransaction = await this.codTransactionRepo.findOne({
        where: { id: transaction.cod_transaction_id },
      });

      if (codTransaction && codTransaction.status === CODStatus.COLLECTED) {
        codTransaction.cancel(`Refunded: ${reason}`);
        await this.codTransactionRepo.save(codTransaction);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Refund failed: ${errorMessage}`);
    }

    await this.transactionRepo.save(transaction);

    return transaction;
  }

  /**
   * Get daily terminal report
   */
  async getDailyTerminalReport(date: Date): Promise<{
    date: Date;
    total_transactions: number;
    approved: number;
    declined: number;
    failed: number;
    total_amount: number;
    average_amount: number;
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const transactions = await this.transactionRepo
      .createQueryBuilder('tt')
      .where('tt.created_at >= :start', { start: startOfDay })
      .andWhere('tt.created_at <= :end', { end: endOfDay })
      .getMany();

    const approved = transactions.filter(
      (t) => t.status === TerminalTransactionStatus.APPROVED
    );
    const declined = transactions.filter(
      (t) => t.status === TerminalTransactionStatus.DECLINED
    );
    const failed = transactions.filter(
      (t) => t.status === TerminalTransactionStatus.FAILED
    );

    const totalAmount = approved.reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      date,
      total_transactions: transactions.length,
      approved: approved.length,
      declined: declined.length,
      failed: failed.length,
      total_amount: totalAmount,
      average_amount: approved.length > 0 ? totalAmount / approved.length : 0,
    };
  }

  /**
   * Sync offline transactions
   */
  async syncOfflineTransactions(
    serialNumber: string
  ): Promise<TerminalTransaction[]> {
    const terminal = await this.terminalRepo.findOne({
      where: { serial_number: serialNumber },
    });

    if (!terminal) {
      throw new Error('Terminal not found');
    }

    // Get unsynced offline transactions
    const unsyncedTransactions = await this.transactionRepo.find({
      where: {
        terminal_id: terminal.id,
        was_offline_transaction: true,
        is_synced: false,
      },
    });

    for (const transaction of unsyncedTransactions) {
      transaction.markAssynced();
      await this.transactionRepo.save(transaction);
    }

    return unsyncedTransactions;
  }

  /**
   * Disable terminal
   */
  async disableTerminal(serialNumber: string): Promise<TerminalDevice> {
    const terminal = await this.terminalRepo.findOne({
      where: { serial_number: serialNumber },
    });

    if (!terminal) {
      throw new Error('Terminal not found');
    }

    // Disable with SumUp
    await this.sumupClient.disableDevice(serialNumber);

    terminal.deactivate();
    terminal.status = TerminalStatus.INACTIVE;

    await this.terminalRepo.save(terminal);

    return terminal;
  }
}
