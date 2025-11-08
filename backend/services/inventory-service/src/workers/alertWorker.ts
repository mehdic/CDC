/**
 * Alert Worker
 * Background jobs for automated alert generation
 *
 * Jobs:
 * - Low stock alert generation (runs every 30 minutes)
 * - Expiration alert generation (runs daily at 6 AM)
 * - AI reorder suggestions (runs daily at 8 AM)
 */

import Queue from 'bull';
import { AppDataSource } from '../index';
import { InventoryItem } from '../../../../shared/models/InventoryItem';
import { InventoryAlert, AlertType, AlertSeverity, AlertStatus } from '../../../../shared/models/InventoryAlert';
import { getForecastedDemand } from '../integrations/forecast';

// ============================================================================
// Queue Configuration
// ============================================================================

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create queues
export const lowStockQueue = new Queue('low-stock-alerts', REDIS_URL);
export const expirationQueue = new Queue('expiration-alerts', REDIS_URL);
export const reorderQueue = new Queue('reorder-suggestions', REDIS_URL);

// ============================================================================
// Low Stock Alert Job
// ============================================================================

lowStockQueue.process(async (job) => {
  console.log('[Low Stock Worker] Starting low stock alert scan...');

  try {
    const itemRepository = AppDataSource.getRepository(InventoryItem);
    const alertRepository = AppDataSource.getRepository(InventoryAlert);

    // Find all items below reorder threshold
    const lowStockItems = await itemRepository
      .createQueryBuilder('item')
      .where('item.quantity <= item.reorder_threshold')
      .andWhere('item.reorder_threshold IS NOT NULL')
      .getMany();

    console.log(`[Low Stock Worker] Found ${lowStockItems.length} low stock items`);

    for (const item of lowStockItems) {
      // Check if alert already exists
      const existingAlert = await alertRepository.findOne({
        where: {
          inventory_item_id: item.id,
          alert_type: AlertType.LOW_STOCK,
          status: AlertStatus.ACTIVE,
        },
      });

      if (!existingAlert) {
        const severity = item.isCriticalStock ? AlertSeverity.HIGH : AlertSeverity.MEDIUM;

        const alert = alertRepository.create({
          pharmacy_id: item.pharmacy_id,
          inventory_item_id: item.id,
          alert_type: AlertType.LOW_STOCK,
          severity,
          message: `Low stock alert: ${item.medication_name} is below reorder threshold. Current: ${item.quantity} ${item.unit}, Threshold: ${item.reorder_threshold}`,
          ai_suggested_action: `Reorder recommended based on current stock levels`,
          status: AlertStatus.ACTIVE,
        });

        await alertRepository.save(alert);
        console.log(`[Low Stock Worker] Created alert for ${item.medication_name}`);
      }
    }

    console.log('[Low Stock Worker] Completed low stock alert scan');
  } catch (error) {
    console.error('[Low Stock Worker] Error:', error);
    throw error;
  }
});

// ============================================================================
// Expiration Alert Job
// ============================================================================

expirationQueue.process(async (job) => {
  console.log('[Expiration Worker] Starting expiration alert scan...');

  try {
    const itemRepository = AppDataSource.getRepository(InventoryItem);
    const alertRepository = AppDataSource.getRepository(InventoryAlert);

    // Find items expiring within 60 days
    const expiringSoonItems = await itemRepository
      .createQueryBuilder('item')
      .where("item.expiry_date <= CURRENT_DATE + INTERVAL '60 days'")
      .andWhere('item.expiry_date > CURRENT_DATE')
      .andWhere('item.expiry_date IS NOT NULL')
      .getMany();

    console.log(`[Expiration Worker] Found ${expiringSoonItems.length} expiring soon items`);

    for (const item of expiringSoonItems) {
      const existingAlert = await alertRepository.findOne({
        where: {
          inventory_item_id: item.id,
          alert_type: AlertType.EXPIRING_SOON,
          status: AlertStatus.ACTIVE,
        },
      });

      if (!existingAlert) {
        const daysUntilExpiry = Math.floor(
          (item.expiry_date!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        const alert = alertRepository.create({
          pharmacy_id: item.pharmacy_id,
          inventory_item_id: item.id,
          alert_type: AlertType.EXPIRING_SOON,
          severity: daysUntilExpiry <= 7 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
          message: `Expiration alert: ${item.medication_name} (Batch: ${item.batch_number}) expires in ${daysUntilExpiry} days`,
          ai_suggested_action: `Consider promoting near-expiry items or transferring to high-demand location`,
          status: AlertStatus.ACTIVE,
        });

        await alertRepository.save(alert);
        console.log(`[Expiration Worker] Created alert for ${item.medication_name} expiring in ${daysUntilExpiry} days`);
      }
    }

    // Find expired items
    const expiredItems = await itemRepository
      .createQueryBuilder('item')
      .where('item.expiry_date < CURRENT_DATE')
      .andWhere('item.expiry_date IS NOT NULL')
      .getMany();

    console.log(`[Expiration Worker] Found ${expiredItems.length} expired items`);

    for (const item of expiredItems) {
      const existingAlert = await alertRepository.findOne({
        where: {
          inventory_item_id: item.id,
          alert_type: AlertType.EXPIRED,
          status: AlertStatus.ACTIVE,
        },
      });

      if (!existingAlert) {
        const alert = alertRepository.create({
          pharmacy_id: item.pharmacy_id,
          inventory_item_id: item.id,
          alert_type: AlertType.EXPIRED,
          severity: AlertSeverity.CRITICAL,
          message: `EXPIRED: ${item.medication_name} (Batch: ${item.batch_number}) expired on ${item.expiry_date?.toLocaleDateString()}`,
          ai_suggested_action: `Remove from active inventory and dispose according to regulations`,
          status: AlertStatus.ACTIVE,
        });

        await alertRepository.save(alert);
        console.log(`[Expiration Worker] Created alert for expired ${item.medication_name}`);
      }
    }

    console.log('[Expiration Worker] Completed expiration alert scan');
  } catch (error) {
    console.error('[Expiration Worker] Error:', error);
    throw error;
  }
});

// ============================================================================
// AI Reorder Suggestion Job
// ============================================================================

reorderQueue.process(async (job) => {
  console.log('[Reorder Worker] Starting AI reorder suggestions...');

  try {
    const itemRepository = AppDataSource.getRepository(InventoryItem);
    const alertRepository = AppDataSource.getRepository(InventoryAlert);

    // Find items that need reorder suggestions (low stock or below optimal level)
    const items = await itemRepository
      .createQueryBuilder('item')
      .where('item.quantity <= item.optimal_stock_level')
      .andWhere('item.optimal_stock_level IS NOT NULL')
      .andWhere('item.medication_rxnorm_code IS NOT NULL')
      .getMany();

    console.log(`[Reorder Worker] Analyzing ${items.length} items for reorder suggestions`);

    for (const item of items) {
      try {
        // Get AI forecasted demand for next 30 days
        const forecastedDemand = await getForecastedDemand(
          item.pharmacy_id,
          item.medication_rxnorm_code!,
          30
        );

        if (forecastedDemand && forecastedDemand.suggested_quantity > 0) {
          // Check if reorder suggestion alert already exists
          const existingAlert = await alertRepository.findOne({
            where: {
              inventory_item_id: item.id,
              alert_type: AlertType.REORDER_SUGGESTED,
              status: AlertStatus.ACTIVE,
            },
          });

          if (!existingAlert) {
            const alert = alertRepository.create({
              pharmacy_id: item.pharmacy_id,
              inventory_item_id: item.id,
              alert_type: AlertType.REORDER_SUGGESTED,
              severity: AlertSeverity.LOW,
              message: `AI recommends reordering ${item.medication_name}. Current: ${item.quantity}, Forecast demand (30d): ${forecastedDemand.forecasted_demand}`,
              ai_suggested_action: `Reorder ${forecastedDemand.suggested_quantity} units based on 30-day demand forecast`,
              ai_suggested_quantity: forecastedDemand.suggested_quantity,
              status: AlertStatus.ACTIVE,
            });

            await alertRepository.save(alert);
            console.log(`[Reorder Worker] Created reorder suggestion for ${item.medication_name}: ${forecastedDemand.suggested_quantity} units`);
          }
        }
      } catch (error) {
        console.error(`[Reorder Worker] Error forecasting for ${item.medication_name}:`, error);
        // Continue with next item
      }
    }

    console.log('[Reorder Worker] Completed AI reorder suggestions');
  } catch (error) {
    console.error('[Reorder Worker] Error:', error);
    throw error;
  }
});

// ============================================================================
// Start Workers
// ============================================================================

export function startAlertWorkers() {
  // Schedule low stock alerts every 30 minutes
  lowStockQueue.add({}, {
    repeat: {
      every: 30 * 60 * 1000, // 30 minutes in ms
    },
  });

  // Schedule expiration alerts daily at 6 AM
  expirationQueue.add({}, {
    repeat: {
      cron: '0 6 * * *', // 6 AM daily
    },
  });

  // Schedule reorder suggestions daily at 8 AM
  reorderQueue.add({}, {
    repeat: {
      cron: '0 8 * * *', // 8 AM daily
    },
  });

  console.log('✅ Alert workers scheduled:');
  console.log('   - Low stock alerts: every 30 minutes');
  console.log('   - Expiration alerts: daily at 6 AM');
  console.log('   - AI reorder suggestions: daily at 8 AM');
}
