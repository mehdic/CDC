/**
 * COD Service
 * Business logic for Cash on Delivery payment processing
 */

import { DataSource, Repository } from 'typeorm';
import { CODTransaction, CODStatus, CODPaymentMethod } from '../../../../../shared/models/CODTransaction';
import { DriverSettlement } from '../../../../../shared/models/DriverSettlement';
import { Order, OrderStatus } from '../../../../../shared/models/Order';

export interface CreateCODTransactionDTO {
  order_id: string;
  delivery_id: string;
  driver_id: string;
  amount: number;
}

export interface CollectPaymentDTO {
  collected_amount: number;
  payment_method: CODPaymentMethod;
  change_given?: number;
  notes?: string;
}

export interface CODLimitsConfig {
  maxAmount: number; // CHF 500
  minAmount: number; // CHF 0
  requiresManagerApproval: number; // CHF 50 variance
}

export class CODService {
  private codTransactionRepo: Repository<CODTransaction>;
  private settlementRepo: Repository<DriverSettlement>;
  private orderRepo: Repository<Order>;

  // Business rules configuration
  private limits: CODLimitsConfig = {
    maxAmount: 500,
    minAmount: 0,
    requiresManagerApproval: 50,
  };

  constructor(private dataSource: DataSource) {
    this.codTransactionRepo = dataSource.getRepository(CODTransaction);
    this.settlementRepo = dataSource.getRepository(DriverSettlement);
    this.orderRepo = dataSource.getRepository(Order);
  }

  /**
   * Create COD transaction for an order
   */
  async createCODTransaction(dto: CreateCODTransactionDTO): Promise<CODTransaction> {
    // Validate amount
    if (dto.amount <= this.limits.minAmount) {
      throw new Error('COD amount must be greater than 0');
    }

    if (dto.amount > this.limits.maxAmount) {
      throw new Error(`COD amount exceeds maximum limit of CHF ${this.limits.maxAmount}`);
    }

    // Check if COD transaction already exists for this order
    const existing = await this.codTransactionRepo.findOne({
      where: { order_id: dto.order_id },
    });

    if (existing) {
      throw new Error('COD transaction already exists for this order');
    }

    // Create transaction
    const transaction = this.codTransactionRepo.create({
      order_id: dto.order_id,
      delivery_id: dto.delivery_id,
      driver_id: dto.driver_id,
      amount: dto.amount,
      status: CODStatus.PENDING,
    });

    await this.codTransactionRepo.save(transaction);

    return transaction;
  }

  /**
   * Collect payment from customer
   */
  async collectPayment(
    transactionId: string,
    dto: CollectPaymentDTO
  ): Promise<CODTransaction> {
    const transaction = await this.codTransactionRepo.findOne({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new Error('COD transaction not found');
    }

    if (transaction.status !== CODStatus.PENDING) {
      throw new Error(`Cannot collect payment for transaction with status: ${transaction.status}`);
    }

    // Validate collected amount
    if (dto.collected_amount < transaction.amount) {
      throw new Error('Collected amount is less than expected amount');
    }

    // Calculate change
    const changeGiven = dto.change_given ?? (dto.collected_amount - transaction.amount);

    // Mark as collected
    transaction.markAsCollected(
      dto.collected_amount,
      dto.payment_method,
      changeGiven,
      dto.notes
    );

    await this.codTransactionRepo.save(transaction);

    return transaction;
  }

  /**
   * Get COD transaction by ID
   */
  async getCODTransaction(id: string): Promise<CODTransaction | null> {
    return this.codTransactionRepo.findOne({
      where: { id },
      relations: ['driver'],
    });
  }

  /**
   * Get COD transaction by order ID
   */
  async getCODTransactionByOrderId(orderId: string): Promise<CODTransaction | null> {
    return this.codTransactionRepo.findOne({
      where: { order_id: orderId },
      relations: ['driver'],
    });
  }

  /**
   * Get COD transaction status
   */
  async getCODStatus(orderId: string): Promise<{ status: CODStatus; details: any } | null> {
    const transaction = await this.getCODTransactionByOrderId(orderId);

    if (!transaction) {
      return null;
    }

    return {
      status: transaction.status,
      details: {
        amount: transaction.amount,
        collected_amount: transaction.collected_amount,
        payment_method: transaction.payment_method,
        collected_at: transaction.collected_at,
        settled_at: transaction.settled_at,
      },
    };
  }

  /**
   * Get driver's COD balance (unsettled transactions)
   */
  async getDriverCODBalance(driverId: string): Promise<{
    pending_count: number;
    collected_count: number;
    total_pending: number;
    total_collected: number;
    total_unsettled: number;
  }> {
    const pending = await this.codTransactionRepo.find({
      where: { driver_id: driverId, status: CODStatus.PENDING },
    });

    const collected = await this.codTransactionRepo.find({
      where: { driver_id: driverId, status: CODStatus.COLLECTED },
    });

    const totalPending = pending.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalCollected = collected.reduce((sum, t) => sum + Number(t.collected_amount || 0), 0);

    return {
      pending_count: pending.length,
      collected_count: collected.length,
      total_pending: totalPending,
      total_collected: totalCollected,
      total_unsettled: totalCollected,
    };
  }

  /**
   * Get all unsettled transactions for a driver
   */
  async getUnsettledTransactions(driverId: string): Promise<CODTransaction[]> {
    return this.codTransactionRepo.find({
      where: { driver_id: driverId, status: CODStatus.COLLECTED },
      order: { collected_at: 'ASC' },
    });
  }

  /**
   * Cancel COD transaction
   */
  async cancelCODTransaction(id: string, reason: string): Promise<CODTransaction> {
    const transaction = await this.codTransactionRepo.findOne({
      where: { id },
    });

    if (!transaction) {
      throw new Error('COD transaction not found');
    }

    if (transaction.status !== CODStatus.PENDING) {
      throw new Error(`Cannot cancel transaction with status: ${transaction.status}`);
    }

    transaction.cancel(reason);
    await this.codTransactionRepo.save(transaction);

    return transaction;
  }

  /**
   * Mark order as COD at checkout
   */
  async markOrderAsCOD(orderId: string, amount: number): Promise<void> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CONFIRMED) {
      throw new Error('Cannot set COD for order in current status');
    }

    // Update order payment method
    order.payment_method = 'cod';
    order.payment_status = 'pending' as any;

    await this.orderRepo.save(order);
  }

  /**
   * Check if COD is available for region (business rule)
   */
  async isCODAvailableForRegion(region: string): Promise<boolean> {
    // Business logic: COD available everywhere except certain regions
    const restrictedRegions = ['international']; // Add restricted regions
    return !restrictedRegions.includes(region.toLowerCase());
  }

  /**
   * Get daily COD revenue tracking
   */
  async getDailyCODRevenue(date: Date): Promise<{
    date: Date;
    total_transactions: number;
    total_expected: number;
    total_collected: number;
    cash_collected: number;
    card_collected: number;
    pending_count: number;
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const transactions = await this.codTransactionRepo
      .createQueryBuilder('cod')
      .where('cod.created_at >= :start', { start: startOfDay })
      .andWhere('cod.created_at <= :end', { end: endOfDay })
      .getMany();

    const collected = transactions.filter(t => t.status === CODStatus.COLLECTED);
    const pending = transactions.filter(t => t.status === CODStatus.PENDING);

    const cashTransactions = collected.filter(t => t.payment_method === CODPaymentMethod.CASH);
    const cardTransactions = collected.filter(t => t.payment_method === CODPaymentMethod.CARD);

    return {
      date,
      total_transactions: transactions.length,
      total_expected: transactions.reduce((sum, t) => sum + Number(t.amount), 0),
      total_collected: collected.reduce((sum, t) => sum + Number(t.collected_amount || 0), 0),
      cash_collected: cashTransactions.reduce((sum, t) => sum + Number(t.collected_amount || 0), 0),
      card_collected: cardTransactions.reduce((sum, t) => sum + Number(t.collected_amount || 0), 0),
      pending_count: pending.length,
    };
  }
}
