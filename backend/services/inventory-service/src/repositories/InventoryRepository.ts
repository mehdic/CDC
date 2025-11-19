/**
 * Inventory Repository
 * Data access layer for inventory operations (items, transactions, alerts)
 * Provides abstraction over TypeORM for inventory management
 */

import { DataSource, Repository, FindOptionsWhere } from 'typeorm';
import { InventoryItem } from '../../../../shared/models/InventoryItem';
import { InventoryTransaction, TransactionType } from '../../../../shared/models/InventoryTransaction';
import { InventoryAlert, AlertType, AlertSeverity, AlertStatus } from '../../../../shared/models/InventoryAlert';

// ============================================================================
// DTOs and Interfaces
// ============================================================================

export interface CreateInventoryItemDTO {
  pharmacy_id: string;
  medication_name: string;
  medication_rxnorm_code?: string | null;
  medication_gtin?: string | null;
  quantity: number;
  unit: string;
  reorder_threshold?: number | null;
  optimal_stock_level?: number | null;
  batch_number?: string | null;
  expiry_date?: Date | null;
  supplier_name?: string | null;
  cost_per_unit?: number | null;
  is_controlled?: boolean;
  substance_schedule?: string | null;
  storage_location?: string | null;
  requires_refrigeration?: boolean;
}

export interface UpdateInventoryItemDTO {
  medication_name?: string;
  reorder_threshold?: number | null;
  optimal_stock_level?: number | null;
  storage_location?: string | null;
  is_controlled?: boolean;
  substance_schedule?: string | null;
  requires_refrigeration?: boolean;
}

export interface CreateTransactionDTO {
  pharmacy_id: string;
  inventory_item_id: string;
  transaction_type: TransactionType;
  quantity_change: number;
  quantity_after: number;
  user_id: string;
  prescription_id?: string | null;
  qr_code_scanned?: string | null;
  notes?: string | null;
}

export interface CreateAlertDTO {
  pharmacy_id: string;
  inventory_item_id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  message: string;
  ai_suggested_action?: string | null;
  ai_suggested_quantity?: number | null;
  status?: AlertStatus;
}

export interface InventoryItemFilter {
  pharmacy_id: string;
  medication_name?: string;
  low_stock?: boolean;
  expiring_soon?: boolean;
  expired?: boolean;
  is_controlled?: boolean;
  limit?: number;
  offset?: number;
}

export interface AlertFilter {
  pharmacy_id: string;
  alert_type?: AlertType;
  severity?: AlertSeverity;
  status?: AlertStatus;
  limit?: number;
  offset?: number;
}

export interface PaginationResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// ============================================================================
// Repository Class
// ============================================================================

export class InventoryRepository {
  private itemRepo: Repository<InventoryItem>;
  private transactionRepo: Repository<InventoryTransaction>;
  private alertRepo: Repository<InventoryAlert>;

  constructor(dataSource: DataSource) {
    this.itemRepo = dataSource.getRepository(InventoryItem);
    this.transactionRepo = dataSource.getRepository(InventoryTransaction);
    this.alertRepo = dataSource.getRepository(InventoryAlert);
  }

  // ==========================================================================
  // Inventory Item Operations
  // ==========================================================================

  /**
   * Create a new inventory item
   */
  async createItem(data: CreateInventoryItemDTO): Promise<InventoryItem> {
    const item = this.itemRepo.create({
      ...data,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return this.itemRepo.save(item);
  }

  /**
   * Find inventory item by ID
   */
  async findItemById(
    id: string,
    pharmacy_id: string,
    includeRelations = false
  ): Promise<InventoryItem | null> {
    const options: any = {
      where: { id, pharmacy_id },
    };

    if (includeRelations) {
      options.relations = ['transactions', 'alerts'];
    }

    return this.itemRepo.findOne(options);
  }

  /**
   * Find inventory item by GTIN (for QR code scanning)
   */
  async findItemByGTIN(
    gtin: string,
    pharmacy_id: string
  ): Promise<InventoryItem | null> {
    return this.itemRepo.findOne({
      where: {
        medication_gtin: gtin,
        pharmacy_id,
      },
    });
  }

  /**
   * List inventory items with filtering and pagination
   */
  async listItems(filter: InventoryItemFilter): Promise<PaginationResult<InventoryItem>> {
    const queryBuilder = this.itemRepo.createQueryBuilder('item');

    // Base filter: pharmacy
    queryBuilder.where('item.pharmacy_id = :pharmacy_id', { pharmacy_id: filter.pharmacy_id });

    // Filter: medication name (partial match)
    if (filter.medication_name) {
      queryBuilder.andWhere('LOWER(item.medication_name) LIKE LOWER(:medication_name)', {
        medication_name: `%${filter.medication_name}%`,
      });
    }

    // Filter: low stock
    if (filter.low_stock) {
      queryBuilder.andWhere('item.quantity <= item.reorder_threshold');
    }

    // Filter: expiring soon (within 60 days)
    if (filter.expiring_soon) {
      queryBuilder.andWhere("item.expiry_date <= CURRENT_DATE + INTERVAL '60 days'");
      queryBuilder.andWhere('item.expiry_date > CURRENT_DATE');
    }

    // Filter: expired
    if (filter.expired) {
      queryBuilder.andWhere('item.expiry_date < CURRENT_DATE');
    }

    // Filter: controlled substances
    if (filter.is_controlled) {
      queryBuilder.andWhere('item.is_controlled = true');
    }

    // Pagination
    const limit = filter.limit || 50;
    const offset = filter.offset || 0;
    queryBuilder.skip(offset);
    queryBuilder.take(limit);

    // Sort by updated_at descending
    queryBuilder.orderBy('item.updated_at', 'DESC');

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      limit,
      offset,
      has_more: offset + items.length < total,
    };
  }

  /**
   * Update inventory item
   */
  async updateItem(
    id: string,
    pharmacy_id: string,
    data: UpdateInventoryItemDTO
  ): Promise<InventoryItem | null> {
    const item = await this.findItemById(id, pharmacy_id);

    if (!item) {
      return null;
    }

    // Update fields
    Object.assign(item, data);
    item.updated_at = new Date();

    return this.itemRepo.save(item);
  }

  /**
   * Update item quantity (used during transactions)
   */
  async updateItemQuantity(
    id: string,
    pharmacy_id: string,
    newQuantity: number,
    batchInfo?: {
      batch_number?: string;
      expiry_date?: Date;
      supplier_name?: string;
      cost_per_unit?: number;
    }
  ): Promise<InventoryItem | null> {
    const item = await this.findItemById(id, pharmacy_id);

    if (!item) {
      return null;
    }

    item.quantity = newQuantity;
    item.updated_at = new Date();

    // Update batch info if provided
    if (batchInfo) {
      if (batchInfo.batch_number !== undefined) item.batch_number = batchInfo.batch_number;
      if (batchInfo.expiry_date !== undefined) item.expiry_date = batchInfo.expiry_date;
      if (batchInfo.supplier_name !== undefined) item.supplier_name = batchInfo.supplier_name;
      if (batchInfo.cost_per_unit !== undefined) item.cost_per_unit = batchInfo.cost_per_unit;
    }

    return this.itemRepo.save(item);
  }

  /**
   * Delete inventory item (for testing)
   */
  async deleteItem(id: string, pharmacy_id: string): Promise<boolean> {
    const result = await this.itemRepo.delete({ id, pharmacy_id });
    return (result.affected ?? 0) > 0;
  }

  /**
   * Count inventory items
   */
  async countItems(pharmacy_id: string, filters?: Partial<FindOptionsWhere<InventoryItem>>): Promise<number> {
    return this.itemRepo.count({
      where: {
        pharmacy_id,
        ...filters,
      },
    });
  }

  /**
   * Get inventory value (sum of quantity * cost_per_unit)
   */
  async getInventoryValue(pharmacy_id: string): Promise<number> {
    const result = await this.itemRepo
      .createQueryBuilder('item')
      .select('SUM(item.quantity * item.cost_per_unit)', 'total')
      .where('item.pharmacy_id = :pharmacy_id', { pharmacy_id })
      .getRawOne();

    return parseFloat(result?.total || '0');
  }

  // ==========================================================================
  // Transaction Operations
  // ==========================================================================

  /**
   * Create a new transaction
   */
  async createTransaction(data: CreateTransactionDTO): Promise<InventoryTransaction> {
    const transaction = this.transactionRepo.create({
      ...data,
      created_at: new Date(),
    });

    return this.transactionRepo.save(transaction);
  }

  /**
   * Find transaction by ID
   */
  async findTransactionById(id: string, pharmacy_id: string): Promise<InventoryTransaction | null> {
    return this.transactionRepo.findOne({
      where: { id, pharmacy_id },
      relations: ['inventory_item', 'user'],
    });
  }

  /**
   * List transactions for an item
   */
  async listTransactionsForItem(
    inventory_item_id: string,
    pharmacy_id: string,
    limit = 50,
    offset = 0
  ): Promise<PaginationResult<InventoryTransaction>> {
    const [items, total] = await this.transactionRepo.findAndCount({
      where: {
        inventory_item_id,
        pharmacy_id,
      },
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      items,
      total,
      limit,
      offset,
      has_more: offset + items.length < total,
    };
  }

  /**
   * Get recent transactions (last N days)
   */
  async getRecentTransactions(
    pharmacy_id: string,
    days: number,
    transaction_type?: TransactionType
  ): Promise<InventoryTransaction[]> {
    const queryBuilder = this.transactionRepo
      .createQueryBuilder('transaction')
      .where('transaction.pharmacy_id = :pharmacy_id', { pharmacy_id });

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    queryBuilder.andWhere('transaction.created_at >= :daysAgo', { daysAgo });

    if (transaction_type) {
      queryBuilder.andWhere('transaction.transaction_type = :transaction_type', { transaction_type });
    }

    queryBuilder.orderBy('transaction.created_at', 'DESC');

    return queryBuilder.getMany();
  }

  /**
   * Get transaction statistics grouped by type
   */
  async getTransactionStats(pharmacy_id: string, days: number): Promise<any[]> {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    return this.transactionRepo
      .createQueryBuilder('transaction')
      .select('transaction.transaction_type', 'type')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(ABS(transaction.quantity_change))', 'total_quantity')
      .where('transaction.pharmacy_id = :pharmacy_id', { pharmacy_id })
      .andWhere('transaction.created_at >= :daysAgo', { daysAgo })
      .groupBy('transaction.transaction_type')
      .getRawMany();
  }

  /**
   * Get top dispensed items
   */
  async getTopDispensedItems(pharmacy_id: string, days: number, limit = 10): Promise<any[]> {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    return this.transactionRepo
      .createQueryBuilder('transaction')
      .select('item.medication_name', 'medication_name')
      .addSelect('SUM(ABS(transaction.quantity_change))', 'total_dispensed')
      .leftJoin('transaction.inventory_item', 'item')
      .where('transaction.pharmacy_id = :pharmacy_id', { pharmacy_id })
      .andWhere("transaction.transaction_type = 'dispense'")
      .andWhere('transaction.created_at >= :daysAgo', { daysAgo })
      .groupBy('item.medication_name')
      .orderBy('total_dispensed', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  // ==========================================================================
  // Alert Operations
  // ==========================================================================

  /**
   * Create a new alert
   */
  async createAlert(data: CreateAlertDTO): Promise<InventoryAlert> {
    const alert = this.alertRepo.create({
      ...data,
      status: data.status || AlertStatus.ACTIVE,
      created_at: new Date(),
    });

    return this.alertRepo.save(alert);
  }

  /**
   * Find alert by ID
   */
  async findAlertById(id: string, pharmacy_id: string): Promise<InventoryAlert | null> {
    return this.alertRepo.findOne({
      where: { id, pharmacy_id },
      relations: ['inventory_item'],
    });
  }

  /**
   * Find existing active alert (to avoid duplicates)
   */
  async findActiveAlert(
    inventory_item_id: string,
    alert_type: AlertType
  ): Promise<InventoryAlert | null> {
    return this.alertRepo.findOne({
      where: {
        inventory_item_id,
        alert_type,
        status: AlertStatus.ACTIVE,
      },
    });
  }

  /**
   * List alerts with filtering and pagination
   */
  async listAlerts(filter: AlertFilter): Promise<PaginationResult<InventoryAlert>> {
    const queryBuilder = this.alertRepo.createQueryBuilder('alert');

    // Join inventory item for display
    queryBuilder.leftJoinAndSelect('alert.inventory_item', 'item');

    // Base filter: pharmacy
    queryBuilder.where('alert.pharmacy_id = :pharmacy_id', { pharmacy_id: filter.pharmacy_id });

    // Filter: alert type
    if (filter.alert_type) {
      queryBuilder.andWhere('alert.alert_type = :alert_type', { alert_type: filter.alert_type });
    }

    // Filter: severity
    if (filter.severity) {
      queryBuilder.andWhere('alert.severity = :severity', { severity: filter.severity });
    }

    // Filter: status
    if (filter.status) {
      queryBuilder.andWhere('alert.status = :status', { status: filter.status });
    }

    // Pagination
    const limit = filter.limit || 50;
    const offset = filter.offset || 0;
    queryBuilder.skip(offset);
    queryBuilder.take(limit);

    // Sort by severity (critical first) then created_at
    queryBuilder.orderBy({
      'alert.severity': 'DESC',
      'alert.created_at': 'DESC',
    });

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      limit,
      offset,
      has_more: offset + items.length < total,
    };
  }

  /**
   * Update alert status
   */
  async updateAlertStatus(
    id: string,
    pharmacy_id: string,
    status: AlertStatus,
    user_id?: string
  ): Promise<InventoryAlert | null> {
    const alert = await this.findAlertById(id, pharmacy_id);

    if (!alert) {
      return null;
    }

    alert.status = status;

    if (status === AlertStatus.ACKNOWLEDGED && user_id) {
      alert.acknowledged_by_user_id = user_id;
      alert.acknowledged_at = new Date();
    }

    if (status === AlertStatus.RESOLVED) {
      alert.resolved_at = new Date();
    }

    return this.alertRepo.save(alert);
  }

  /**
   * Get alert statistics by severity
   */
  async getAlertStatsBySeverity(pharmacy_id: string, status: AlertStatus = AlertStatus.ACTIVE): Promise<any[]> {
    return this.alertRepo
      .createQueryBuilder('alert')
      .select('alert.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .where('alert.pharmacy_id = :pharmacy_id', { pharmacy_id })
      .andWhere('alert.status = :status', { status })
      .groupBy('alert.severity')
      .getRawMany();
  }

  /**
   * Delete alert (for testing)
   */
  async deleteAlert(id: string, pharmacy_id: string): Promise<boolean> {
    const result = await this.alertRepo.delete({ id, pharmacy_id });
    return (result.affected ?? 0) > 0;
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Clear all data (for testing only)
   */
  async clearAll(): Promise<void> {
    await this.alertRepo.clear();
    await this.transactionRepo.clear();
    await this.itemRepo.clear();
  }
}
