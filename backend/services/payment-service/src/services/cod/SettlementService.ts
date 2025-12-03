/**
 * Settlement Service
 * Business logic for driver COD settlement and reconciliation
 */

import { DataSource, Repository, Between } from 'typeorm';
import { CODTransaction, CODStatus } from '../../../../../shared/models/CODTransaction';
import { DriverSettlement, SettlementStatus } from '../../../../../shared/models/DriverSettlement';

export interface CreateSettlementDTO {
  driver_id: string;
  settlement_date: Date;
  total_settled: number;
  driver_notes?: string;
}

export interface ApproveSettlementDTO {
  approved_by: string;
  manager_notes?: string;
}

export interface DisputeSettlementDTO {
  disputed_by: string;
  reason: string;
}

export interface ResolveDisputeDTO {
  resolved_by: string;
  resolution: string;
}

export class SettlementService {
  private codTransactionRepo: Repository<CODTransaction>;
  private settlementRepo: Repository<DriverSettlement>;

  constructor(private dataSource: DataSource) {
    this.codTransactionRepo = dataSource.getRepository(CODTransaction);
    this.settlementRepo = dataSource.getRepository(DriverSettlement);
  }

  /**
   * Create driver settlement for a specific date
   */
  async createSettlement(dto: CreateSettlementDTO): Promise<DriverSettlement> {
    // Check if settlement already exists for this driver and date
    const existing = await this.settlementRepo.findOne({
      where: {
        driver_id: dto.driver_id,
        settlement_date: dto.settlement_date,
      },
    });

    if (existing) {
      throw new Error('Settlement already exists for this driver and date');
    }

    // Get all collected transactions for this driver on this date
    const startOfDay = new Date(dto.settlement_date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dto.settlement_date);
    endOfDay.setHours(23, 59, 59, 999);

    const transactions = await this.codTransactionRepo.find({
      where: {
        driver_id: dto.driver_id,
        status: CODStatus.COLLECTED,
        collected_at: Between(startOfDay, endOfDay),
      },
    });

    if (transactions.length === 0) {
      throw new Error('No collected transactions found for this driver on this date');
    }

    // Calculate totals
    const totalExpected = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalCollected = transactions.reduce((sum, t) => sum + Number(t.collected_amount || 0), 0);

    // Calculate cash vs card breakdown
    const cashTransactions = transactions.filter(t => t.payment_method === 'cash');
    const cardTransactions = transactions.filter(t => t.payment_method === 'card');

    const cashAmount = cashTransactions.reduce((sum, t) => sum + Number(t.collected_amount || 0), 0);
    const cardAmount = cardTransactions.reduce((sum, t) => sum + Number(t.collected_amount || 0), 0);

    // Create settlement
    const settlement = this.settlementRepo.create({
      driver_id: dto.driver_id,
      settlement_date: dto.settlement_date,
      total_expected: totalExpected,
      total_collected: totalCollected,
      total_settled: dto.total_settled,
      variance: dto.total_settled - totalExpected,
      transaction_count: transactions.length,
      cash_amount: cashAmount,
      card_amount: cardAmount,
      driver_notes: dto.driver_notes,
      status: SettlementStatus.PENDING,
    });

    settlement.calculateVariance();

    await this.settlementRepo.save(settlement);

    // Update all transactions to reference this settlement
    for (const transaction of transactions) {
      transaction.settlement_id = settlement.id;
      transaction.status = CODStatus.SETTLED;
      transaction.settled_at = new Date();
    }

    await this.codTransactionRepo.save(transactions);

    return settlement;
  }

  /**
   * Get settlement by ID
   */
  async getSettlement(id: string): Promise<DriverSettlement | null> {
    return this.settlementRepo.findOne({
      where: { id },
      relations: ['driver'],
    });
  }

  /**
   * Get all settlements for a driver
   */
  async getDriverSettlements(driverId: string): Promise<DriverSettlement[]> {
    return this.settlementRepo.find({
      where: { driver_id: driverId },
      order: { settlement_date: 'DESC' },
    });
  }

  /**
   * Get pending settlements (requiring approval)
   */
  async getPendingSettlements(): Promise<DriverSettlement[]> {
    return this.settlementRepo.find({
      where: { status: SettlementStatus.PENDING },
      relations: ['driver'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Approve settlement
   */
  async approveSettlement(id: string, dto: ApproveSettlementDTO): Promise<DriverSettlement> {
    const settlement = await this.settlementRepo.findOne({
      where: { id },
    });

    if (!settlement) {
      throw new Error('Settlement not found');
    }

    if (settlement.status !== SettlementStatus.PENDING) {
      throw new Error(`Cannot approve settlement with status: ${settlement.status}`);
    }

    settlement.approve(dto.approved_by, dto.manager_notes);
    await this.settlementRepo.save(settlement);

    return settlement;
  }

  /**
   * Dispute settlement
   */
  async disputeSettlement(id: string, dto: DisputeSettlementDTO): Promise<DriverSettlement> {
    const settlement = await this.settlementRepo.findOne({
      where: { id },
    });

    if (!settlement) {
      throw new Error('Settlement not found');
    }

    if (settlement.status !== SettlementStatus.PENDING) {
      throw new Error(`Cannot dispute settlement with status: ${settlement.status}`);
    }

    settlement.dispute(dto.disputed_by, dto.reason);
    await this.settlementRepo.save(settlement);

    return settlement;
  }

  /**
   * Resolve dispute
   */
  async resolveDispute(id: string, dto: ResolveDisputeDTO): Promise<DriverSettlement> {
    const settlement = await this.settlementRepo.findOne({
      where: { id },
    });

    if (!settlement) {
      throw new Error('Settlement not found');
    }

    if (settlement.status !== SettlementStatus.DISPUTED) {
      throw new Error('Settlement is not in disputed status');
    }

    settlement.resolve(dto.resolved_by, dto.resolution);
    await this.settlementRepo.save(settlement);

    return settlement;
  }

  /**
   * Get daily settlement summary for a driver
   */
  async getDailySettlementSummary(driverId: string, date: Date): Promise<{
    has_settlement: boolean;
    settlement_id?: string;
    transactions_count: number;
    total_expected: number;
    total_collected: number;
    status?: SettlementStatus;
    variance?: number;
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Check if settlement exists
    const settlement = await this.settlementRepo.findOne({
      where: {
        driver_id: driverId,
        settlement_date: Between(startOfDay, endOfDay),
      },
    });

    // Get collected transactions
    const transactions = await this.codTransactionRepo.find({
      where: {
        driver_id: driverId,
        status: CODStatus.COLLECTED,
        collected_at: Between(startOfDay, endOfDay),
      },
    });

    const totalExpected = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalCollected = transactions.reduce((sum, t) => sum + Number(t.collected_amount || 0), 0);

    if (settlement) {
      return {
        has_settlement: true,
        settlement_id: settlement.id,
        transactions_count: transactions.length,
        total_expected: totalExpected,
        total_collected: totalCollected,
        status: settlement.status,
        variance: settlement.variance,
      };
    }

    return {
      has_settlement: false,
      transactions_count: transactions.length,
      total_expected: totalExpected,
      total_collected: totalCollected,
    };
  }

  /**
   * Get reconciliation report for a date range
   */
  async getReconciliationReport(startDate: Date, endDate: Date): Promise<{
    total_settlements: number;
    total_expected: number;
    total_settled: number;
    total_variance: number;
    pending_approvals: number;
    disputed_count: number;
    by_driver: Array<{
      driver_id: string;
      settlements_count: number;
      total_expected: number;
      total_settled: number;
      variance: number;
    }>;
  }> {
    const settlements = await this.settlementRepo.find({
      where: {
        settlement_date: Between(startDate, endDate),
      },
      relations: ['driver'],
    });

    const totalExpected = settlements.reduce((sum, s) => sum + Number(s.total_expected), 0);
    const totalSettled = settlements.reduce((sum, s) => sum + Number(s.total_settled), 0);
    const totalVariance = settlements.reduce((sum, s) => sum + Number(s.variance), 0);

    const pendingApprovals = settlements.filter(s => s.status === SettlementStatus.PENDING).length;
    const disputedCount = settlements.filter(s => s.status === SettlementStatus.DISPUTED).length;

    // Group by driver
    const byDriver = new Map<string, {
      driver_id: string;
      settlements_count: number;
      total_expected: number;
      total_settled: number;
      variance: number;
    }>();

    for (const settlement of settlements) {
      const existing = byDriver.get(settlement.driver_id);
      if (existing) {
        existing.settlements_count++;
        existing.total_expected += Number(settlement.total_expected);
        existing.total_settled += Number(settlement.total_settled);
        existing.variance += Number(settlement.variance);
      } else {
        byDriver.set(settlement.driver_id, {
          driver_id: settlement.driver_id,
          settlements_count: 1,
          total_expected: Number(settlement.total_expected),
          total_settled: Number(settlement.total_settled),
          variance: Number(settlement.variance),
        });
      }
    }

    return {
      total_settlements: settlements.length,
      total_expected: totalExpected,
      total_settled: totalSettled,
      total_variance: totalVariance,
      pending_approvals: pendingApprovals,
      disputed_count: disputedCount,
      by_driver: Array.from(byDriver.values()),
    };
  }
}
