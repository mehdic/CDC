/**
 * Analytics Route
 * GET /inventory/analytics - Stock analytics and insights
 */

import { Router, Request, Response } from 'express';
import { AppDataSource } from '../index';
import { InventoryItem } from '../../../../shared/models/InventoryItem';
import { InventoryTransaction } from '../../../../shared/models/InventoryTransaction';
import { InventoryAlert } from '../../../../shared/models/InventoryAlert';

export const analyticsRouter = Router();

// ============================================================================
// GET /inventory/analytics - Stock analytics
// ============================================================================

analyticsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { pharmacy_id } = req.query;

    if (!pharmacy_id) {
      return res.status(400).json({ error: 'pharmacy_id query parameter is required' });
    }

    // Set RLS context
    await AppDataSource.query(`SET app.current_pharmacy_id = '${pharmacy_id}'`);

    const itemRepository = AppDataSource.getRepository(InventoryItem);
    const transactionRepository = AppDataSource.getRepository(InventoryTransaction);
    const alertRepository = AppDataSource.getRepository(InventoryAlert);

    // Total inventory value
    const totalValue = await itemRepository
      .createQueryBuilder('item')
      .select('SUM(item.quantity * item.cost_per_unit)', 'total')
      .where('item.pharmacy_id = :pharmacy_id', { pharmacy_id })
      .getRawOne();

    // Total items
    const totalItems = await itemRepository.count({
      where: { pharmacy_id: pharmacy_id as string },
    });

    // Low stock items
    const lowStockItems = await itemRepository
      .createQueryBuilder('item')
      .where('item.pharmacy_id = :pharmacy_id', { pharmacy_id })
      .andWhere('item.quantity <= item.reorder_threshold')
      .getCount();

    // Out of stock items
    const outOfStockItems = await itemRepository.count({
      where: {
        pharmacy_id: pharmacy_id as string,
        quantity: 0,
      },
    });

    // Expiring soon (within 60 days)
    const expiringSoonItems = await itemRepository
      .createQueryBuilder('item')
      .where('item.pharmacy_id = :pharmacy_id', { pharmacy_id })
      .andWhere("item.expiry_date <= CURRENT_DATE + INTERVAL '60 days'")
      .andWhere('item.expiry_date > CURRENT_DATE')
      .getCount();

    // Expired items
    const expiredItems = await itemRepository
      .createQueryBuilder('item')
      .where('item.pharmacy_id = :pharmacy_id', { pharmacy_id })
      .andWhere('item.expiry_date < CURRENT_DATE')
      .getCount();

    // Controlled substances count
    const controlledSubstances = await itemRepository.count({
      where: {
        pharmacy_id: pharmacy_id as string,
        is_controlled: true,
      },
    });

    // Active alerts by severity
    const alertsBySeverity = await alertRepository
      .createQueryBuilder('alert')
      .select('alert.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .where('alert.pharmacy_id = :pharmacy_id', { pharmacy_id })
      .andWhere("alert.status = 'active'")
      .groupBy('alert.severity')
      .getRawMany();

    // Recent transactions (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentTransactions = await transactionRepository
      .createQueryBuilder('transaction')
      .select('transaction.transaction_type', 'type')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(ABS(transaction.quantity_change))', 'total_quantity')
      .where('transaction.pharmacy_id = :pharmacy_id', { pharmacy_id })
      .andWhere('transaction.created_at >= :sevenDaysAgo', { sevenDaysAgo })
      .groupBy('transaction.transaction_type')
      .getRawMany();

    // Top 10 most dispensed items (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const topDispensedItems = await transactionRepository
      .createQueryBuilder('transaction')
      .select('item.medication_name', 'medication_name')
      .addSelect('SUM(ABS(transaction.quantity_change))', 'total_dispensed')
      .leftJoin('transaction.inventory_item', 'item')
      .where('transaction.pharmacy_id = :pharmacy_id', { pharmacy_id })
      .andWhere("transaction.transaction_type = 'dispense'")
      .andWhere('transaction.created_at >= :thirtyDaysAgo', { thirtyDaysAgo })
      .groupBy('item.medication_name')
      .orderBy('total_dispensed', 'DESC')
      .limit(10)
      .getRawMany();

    // Inventory turnover rate (items dispensed / average stock)
    const avgStock = await itemRepository
      .createQueryBuilder('item')
      .select('AVG(item.quantity)', 'avg_quantity')
      .where('item.pharmacy_id = :pharmacy_id', { pharmacy_id })
      .getRawOne();

    const totalDispensed = await transactionRepository
      .createQueryBuilder('transaction')
      .select('SUM(ABS(transaction.quantity_change))', 'total')
      .where('transaction.pharmacy_id = :pharmacy_id', { pharmacy_id })
      .andWhere("transaction.transaction_type = 'dispense'")
      .andWhere('transaction.created_at >= :thirtyDaysAgo', { thirtyDaysAgo })
      .getRawOne();

    const turnoverRate = avgStock.avg_quantity > 0
      ? (totalDispensed.total / avgStock.avg_quantity / 30 * 100).toFixed(2)
      : '0';

    // Return analytics
    res.json({
      overview: {
        total_items: totalItems,
        total_inventory_value: parseFloat(totalValue.total || '0').toFixed(2),
        low_stock_items: lowStockItems,
        out_of_stock_items: outOfStockItems,
        expiring_soon_items: expiringSoonItems,
        expired_items: expiredItems,
        controlled_substances: controlledSubstances,
        turnover_rate_percent: turnoverRate,
      },
      alerts: {
        by_severity: alertsBySeverity,
      },
      recent_activity: {
        transactions_last_7_days: recentTransactions,
        top_dispensed_items_last_30_days: topDispensedItems,
      },
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
