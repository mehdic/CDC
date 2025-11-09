/**
 * Scan Route
 * POST /inventory/scan
 * QR code scanning endpoint for real-time stock updates
 *
 * Supported transaction types:
 * - receive: Incoming stock from supplier
 * - dispense: Outgoing to patient (linked to prescription)
 * - transfer: Transfer between pharmacy locations
 * - return: Returned from patient
 * - adjustment: Manual stock correction
 * - expired: Dispose expired medication
 */

import { Router, Request, Response } from 'express';
import { AppDataSource } from '../index';
import { InventoryItem } from '../../../../shared/models/InventoryItem';
import { InventoryTransaction, TransactionType } from '../../../../shared/models/InventoryTransaction';
import { InventoryAlert, AlertType, AlertSeverity, AlertStatus } from '../../../../shared/models/InventoryAlert';
import { parseGS1QRCode, isValidGS1QRCode } from '../utils/qrParser';
import { z } from 'zod';

export const scanRouter = Router();

// ============================================================================
// Request Validation Schema
// ============================================================================

const scanRequestSchema = z.object({
  qr_code: z.string().min(1, 'QR code is required'),
  transaction_type: z.enum(['receive', 'dispense', 'transfer', 'return', 'adjustment', 'expired']),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  pharmacy_id: z.string().uuid('Invalid pharmacy ID'),
  user_id: z.string().uuid('Invalid user ID'),
  prescription_id: z.string().uuid().optional(),
  notes: z.string().optional(),
  // For 'receive' transactions: batch info
  batch_number: z.string().optional(),
  supplier_name: z.string().optional(),
  cost_per_unit: z.number().optional(),
});

type ScanRequest = z.infer<typeof scanRequestSchema>;

// ============================================================================
// POST /inventory/scan
// ============================================================================

scanRouter.post('/', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = scanRequestSchema.parse(req.body);

    // Validate QR code format
    if (!isValidGS1QRCode(validatedData.qr_code)) {
      return res.status(400).json({
        error: 'Invalid QR code format',
        message: 'QR code must be in GS1 DataMatrix format with GTIN (AI 01)',
      });
    }

    // Parse QR code
    const parsedQR = parseGS1QRCode(validatedData.qr_code);

    // Set RLS context for multi-tenant isolation
    await AppDataSource.query(`SET app.current_pharmacy_id = '${validatedData.pharmacy_id}'`);

    // Find or create inventory item
    const itemRepository = AppDataSource.getRepository(InventoryItem);
    let inventoryItem = await itemRepository.findOne({
      where: {
        pharmacy_id: validatedData.pharmacy_id,
        medication_gtin: parsedQR.gtin!,
      },
    });

    if (!inventoryItem) {
      // Create new inventory item if not exists (for 'receive' transactions)
      if (validatedData.transaction_type !== 'receive') {
        return res.status(404).json({
          error: 'Inventory item not found',
          message: 'Cannot dispense/transfer item that does not exist in inventory',
        });
      }

      inventoryItem = itemRepository.create({
        pharmacy_id: validatedData.pharmacy_id,
        medication_gtin: parsedQR.gtin!,
        medication_name: 'Unknown', // TODO: Look up from drug database
        quantity: 0,
        unit: 'pills', // Default unit
        batch_number: parsedQR.batchNumber || validatedData.batch_number,
        expiry_date: parsedQR.expiryDate,
        supplier_name: validatedData.supplier_name,
        cost_per_unit: validatedData.cost_per_unit,
      });
    }

    // Calculate quantity change
    const quantityChange =
      validatedData.transaction_type === 'receive'
        ? validatedData.quantity // Positive for incoming
        : -validatedData.quantity; // Negative for outgoing

    // Update stock quantity
    const newQuantity = inventoryItem.quantity + quantityChange;

    if (newQuantity < 0) {
      return res.status(400).json({
        error: 'Insufficient stock',
        message: `Cannot ${validatedData.transaction_type} ${validatedData.quantity} units. Current stock: ${inventoryItem.quantity}`,
      });
    }

    inventoryItem.quantity = newQuantity;
    inventoryItem.updated_at = new Date();

    if (validatedData.transaction_type === 'receive') {
      inventoryItem.last_restocked_at = new Date();
      // Update batch info if provided
      if (validatedData.batch_number) inventoryItem.batch_number = validatedData.batch_number;
      if (parsedQR.expiryDate) inventoryItem.expiry_date = parsedQR.expiryDate;
      if (validatedData.supplier_name) inventoryItem.supplier_name = validatedData.supplier_name;
      if (validatedData.cost_per_unit) inventoryItem.cost_per_unit = validatedData.cost_per_unit;
    }

    // Save inventory item
    await itemRepository.save(inventoryItem);

    // Create transaction record
    const transactionRepository = AppDataSource.getRepository(InventoryTransaction);
    const transaction = transactionRepository.create({
      pharmacy_id: validatedData.pharmacy_id,
      inventory_item_id: inventoryItem.id,
      transaction_type: validatedData.transaction_type as TransactionType,
      quantity_change: quantityChange,
      quantity_after: newQuantity,
      user_id: validatedData.user_id,
      prescription_id: validatedData.prescription_id,
      qr_code_scanned: validatedData.qr_code,
      notes: validatedData.notes,
    });

    await transactionRepository.save(transaction);

    // Check if we need to generate alerts
    await checkAndGenerateAlerts(inventoryItem);

    // Return success response
    res.status(200).json({
      success: true,
      message: `Successfully ${validatedData.transaction_type}d ${validatedData.quantity} units`,
      inventory_item: {
        id: inventoryItem.id,
        medication_name: inventoryItem.medication_name,
        gtin: inventoryItem.medication_gtin,
        quantity: inventoryItem.quantity,
        unit: inventoryItem.unit,
        batch_number: inventoryItem.batch_number,
        expiry_date: inventoryItem.expiry_date,
      },
      transaction: {
        id: transaction.id,
        type: transaction.transaction_type,
        quantity_change: transaction.quantity_change,
        quantity_after: transaction.quantity_after,
        created_at: transaction.created_at,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Scan error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// Helper: Check and Generate Alerts
// ============================================================================

async function checkAndGenerateAlerts(item: InventoryItem): Promise<void> {
  const alertRepository = AppDataSource.getRepository(InventoryAlert);

  // Check low stock
  if (item.isLowStock) {
    const existingLowStockAlert = await alertRepository.findOne({
      where: {
        inventory_item_id: item.id,
        alert_type: AlertType.LOW_STOCK,
        status: AlertStatus.ACTIVE,
      },
    });

    if (!existingLowStockAlert) {
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
    }
  }

  // Check expiring soon (within 60 days)
  if (item.isExpiringSoon && !item.isExpired) {
    const existingExpiryAlert = await alertRepository.findOne({
      where: {
        inventory_item_id: item.id,
        alert_type: AlertType.EXPIRING_SOON,
        status: AlertStatus.ACTIVE,
      },
    });

    if (!existingExpiryAlert) {
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
    }
  }

  // Check expired
  if (item.isExpired) {
    const existingExpiredAlert = await alertRepository.findOne({
      where: {
        inventory_item_id: item.id,
        alert_type: AlertType.EXPIRED,
        status: AlertStatus.ACTIVE,
      },
    });

    if (!existingExpiredAlert) {
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
    }
  }
}
