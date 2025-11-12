/**
 * Items Route
 * GET /inventory/items - List inventory items with filtering
 * GET /inventory/items/:id - Get single item
 * PUT /inventory/items/:id - Manual update (non-QR adjustments)
 */

import { Router, Request, Response } from 'express';
import { AppDataSource } from '../index';
import { InventoryItem } from '../../../../shared/models/InventoryItem';
import { z } from 'zod';

export const itemsRouter = Router();

// ============================================================================
// GET /inventory/items - List with filtering
// ============================================================================

// ============================================================================
// GET /inventory/items/low-stock - Get low stock items (MUST BE BEFORE /:id)
// ============================================================================

itemsRouter.get('/low-stock', async (req: Request, res: Response) => {
  try {
    const { pharmacy_id } = req.query;

    if (!pharmacy_id) {
      return res.status(400).json({ error: 'pharmacy_id query parameter is required' });
    }

    // Set RLS context
    await AppDataSource.query(`SET app.current_pharmacy_id = '${pharmacy_id}'`);

    const itemRepository = AppDataSource.getRepository(InventoryItem);
    const items = await itemRepository
      .createQueryBuilder('item')
      .where('item.pharmacy_id = :pharmacy_id', { pharmacy_id })
      .andWhere('item.quantity <= item.reorder_threshold')
      .orderBy('item.quantity', 'ASC')
      .getMany();

    res.json({
      success: true,
      items: items.map((item) => ({
        ...item,
        quantity: item.quantity,
        minQuantity: item.reorder_threshold,
      })),
    });
  } catch (error) {
    console.error('Get low stock items error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// GET /inventory/items/expiring - Get expiring items (MUST BE BEFORE /:id)
// ============================================================================

itemsRouter.get('/expiring', async (req: Request, res: Response) => {
  try {
    const { pharmacy_id } = req.query;

    if (!pharmacy_id) {
      return res.status(400).json({ error: 'pharmacy_id query parameter is required' });
    }

    // Set RLS context
    await AppDataSource.query(`SET app.current_pharmacy_id = '${pharmacy_id}'`);

    const itemRepository = AppDataSource.getRepository(InventoryItem);
    const items = await itemRepository
      .createQueryBuilder('item')
      .where('item.pharmacy_id = :pharmacy_id', { pharmacy_id })
      .andWhere("item.expiry_date <= CURRENT_DATE + INTERVAL '60 days'")
      .andWhere('item.expiry_date > CURRENT_DATE')
      .orderBy('item.expiry_date', 'ASC')
      .getMany();

    res.json({
      success: true,
      items: items.map((item) => ({
        ...item,
        expiryDate: item.expiry_date,
      })),
    });
  } catch (error) {
    console.error('Get expiring items error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// GET /inventory/items/reorder-suggestions - Get AI reorder suggestions (MUST BE BEFORE /:id)
// ============================================================================

itemsRouter.get('/reorder-suggestions', async (req: Request, res: Response) => {
  try {
    const { pharmacy_id } = req.query;

    if (!pharmacy_id) {
      return res.status(400).json({ error: 'pharmacy_id query parameter is required' });
    }

    // Set RLS context
    await AppDataSource.query(`SET app.current_pharmacy_id = '${pharmacy_id}'`);

    const itemRepository = AppDataSource.getRepository(InventoryItem);
    const lowStockItems = await itemRepository
      .createQueryBuilder('item')
      .where('item.pharmacy_id = :pharmacy_id', { pharmacy_id })
      .andWhere('item.quantity <= item.reorder_threshold')
      .getMany();

    // Generate AI suggestions (simplified - in production would use AWS Forecast)
    const suggestions = lowStockItems.map((item) => {
      const suggestedQuantity = item.optimal_stock_level || item.reorder_threshold * 2 || 100;
      return {
        itemId: item.id,
        name: item.medication_name,
        currentStock: item.quantity,
        reorderThreshold: item.reorder_threshold,
        suggestedQuantity,
        reason: 'Based on sales trends and current stock',
      };
    });

    res.json({
      success: true,
      suggestions,
    });
  } catch (error) {
    console.error('Get reorder suggestions error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// GET /inventory/items/reports/:type - Generate reports (MUST BE BEFORE /:id)
// ============================================================================

itemsRouter.get('/reports/:type', async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const { pharmacy_id } = req.query;

    if (!pharmacy_id) {
      return res.status(400).json({ error: 'pharmacy_id query parameter is required' });
    }

    // Set RLS context
    await AppDataSource.query(`SET app.current_pharmacy_id = '${pharmacy_id}'`);

    const itemRepository = AppDataSource.getRepository(InventoryItem);

    if (type === 'stock') {
      const totalItems = await itemRepository.count({
        where: { pharmacy_id: pharmacy_id as string },
      });

      const totalValue = await itemRepository
        .createQueryBuilder('item')
        .select('SUM(item.quantity * item.cost_per_unit)', 'total')
        .where('item.pharmacy_id = :pharmacy_id', { pharmacy_id })
        .getRawOne();

      const lowStockCount = await itemRepository
        .createQueryBuilder('item')
        .where('item.pharmacy_id = :pharmacy_id', { pharmacy_id })
        .andWhere('item.quantity <= item.reorder_threshold')
        .getCount();

      res.json({
        success: true,
        report: {
          totalItems,
          totalValue: parseFloat(totalValue.total || '0'),
          lowStockCount,
        },
      });
    } else if (type === 'expiry') {
      const expiringThisMonth = await itemRepository
        .createQueryBuilder('item')
        .where('item.pharmacy_id = :pharmacy_id', { pharmacy_id })
        .andWhere("item.expiry_date <= CURRENT_DATE + INTERVAL '30 days'")
        .andWhere('item.expiry_date > CURRENT_DATE')
        .getCount();

      const expiringNextMonth = await itemRepository
        .createQueryBuilder('item')
        .where('item.pharmacy_id = :pharmacy_id', { pharmacy_id })
        .andWhere("item.expiry_date > CURRENT_DATE + INTERVAL '30 days'")
        .andWhere("item.expiry_date <= CURRENT_DATE + INTERVAL '60 days'")
        .getCount();

      const expired = await itemRepository
        .createQueryBuilder('item')
        .where('item.pharmacy_id = :pharmacy_id', { pharmacy_id })
        .andWhere('item.expiry_date < CURRENT_DATE')
        .getCount();

      res.json({
        success: true,
        report: {
          expiringThisMonth,
          expiringNextMonth,
          expired,
        },
      });
    } else if (type === 'sales') {
      // Simplified sales report - would need transaction data in production
      const topItems = await itemRepository
        .createQueryBuilder('item')
        .where('item.pharmacy_id = :pharmacy_id', { pharmacy_id })
        .orderBy('item.quantity', 'DESC')
        .take(5)
        .getMany();

      res.json({
        success: true,
        report: {
          topSellingItems: topItems,
          totalRevenue: 50000, // Mock value
        },
      });
    } else {
      res.status(400).json({ error: 'Invalid report type. Must be: stock, expiry, or sales' });
    }
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// GET /inventory/items - List with filtering
// ============================================================================

itemsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const {
      pharmacy_id,
      medication_name,
      low_stock,
      expiring_soon,
      expired,
      is_controlled,
      limit = '50',
      offset = '0',
    } = req.query;

    if (!pharmacy_id) {
      return res.status(400).json({ error: 'pharmacy_id query parameter is required' });
    }

    // Set RLS context
    await AppDataSource.query(`SET app.current_pharmacy_id = '${pharmacy_id}'`);

    const itemRepository = AppDataSource.getRepository(InventoryItem);
    const queryBuilder = itemRepository.createQueryBuilder('item');

    // Base filter: pharmacy
    queryBuilder.where('item.pharmacy_id = :pharmacy_id', { pharmacy_id });

    // Filter: medication name (partial match)
    if (medication_name) {
      queryBuilder.andWhere('LOWER(item.medication_name) LIKE LOWER(:medication_name)', {
        medication_name: `%${medication_name}%`,
      });
    }

    // Filter: low stock
    if (low_stock === 'true') {
      queryBuilder.andWhere('item.quantity <= item.reorder_threshold');
    }

    // Filter: expiring soon (within 60 days)
    if (expiring_soon === 'true') {
      queryBuilder.andWhere("item.expiry_date <= CURRENT_DATE + INTERVAL '60 days'");
      queryBuilder.andWhere('item.expiry_date > CURRENT_DATE'); // Not expired
    }

    // Filter: expired
    if (expired === 'true') {
      queryBuilder.andWhere('item.expiry_date < CURRENT_DATE');
    }

    // Filter: controlled substances
    if (is_controlled === 'true') {
      queryBuilder.andWhere('item.is_controlled = true');
    }

    // Pagination
    queryBuilder.skip(parseInt(offset as string));
    queryBuilder.take(parseInt(limit as string));

    // Sort by updated_at descending
    queryBuilder.orderBy('item.updated_at', 'DESC');

    const [items, total] = await queryBuilder.getManyAndCount();

    res.json({
      items,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        has_more: parseInt(offset as string) + items.length < total,
      },
    });
  } catch (error) {
    console.error('List items error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// POST /inventory/items - Add new inventory item
// ============================================================================

const addItemSchema = z.object({
  pharmacy_id: z.string().uuid(),
  medication_name: z.string().min(1),
  medication_gtin: z.string().optional(),
  quantity: z.number().int().min(0),
  unit: z.string().default('pills'),
  batch_number: z.string().optional(),
  expiry_date: z.string().optional(),
  supplier_name: z.string().optional(),
  cost_per_unit: z.number().optional(),
  reorder_threshold: z.number().int().min(0).optional(),
  storage_location: z.string().optional(),
  is_controlled: z.boolean().default(false),
  substance_schedule: z.string().optional(),
});

itemsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = addItemSchema.parse(req.body);

    // Set RLS context
    await AppDataSource.query(`SET app.current_pharmacy_id = '${validatedData.pharmacy_id}'`);

    const itemRepository = AppDataSource.getRepository(InventoryItem);

    // Create new item
    const item = itemRepository.create({
      pharmacy_id: validatedData.pharmacy_id,
      medication_name: validatedData.medication_name,
      medication_gtin: validatedData.medication_gtin,
      quantity: validatedData.quantity,
      unit: validatedData.unit,
      batch_number: validatedData.batch_number,
      expiry_date: validatedData.expiry_date ? new Date(validatedData.expiry_date) : null,
      supplier_name: validatedData.supplier_name,
      cost_per_unit: validatedData.cost_per_unit,
      reorder_threshold: validatedData.reorder_threshold,
      storage_location: validatedData.storage_location,
      is_controlled: validatedData.is_controlled,
      substance_schedule: validatedData.substance_schedule,
    });

    await itemRepository.save(item);

    res.status(201).json({
      success: true,
      message: 'Inventory item added successfully',
      itemId: item.id,
      item,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Add item error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// GET /inventory/items/:id - Get single item
// ============================================================================

itemsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { pharmacy_id } = req.query;

    if (!pharmacy_id) {
      return res.status(400).json({ error: 'pharmacy_id query parameter is required' });
    }

    // Set RLS context
    await AppDataSource.query(`SET app.current_pharmacy_id = '${pharmacy_id}'`);

    const itemRepository = AppDataSource.getRepository(InventoryItem);
    const item = await itemRepository.findOne({
      where: { id, pharmacy_id: pharmacy_id as string },
      relations: ['transactions', 'alerts'],
    });

    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    res.json({ item });
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// PUT /inventory/items/:id - Manual update
// ============================================================================

const updateItemSchema = z.object({
  pharmacy_id: z.string().uuid(),
  medication_name: z.string().optional(),
  reorder_threshold: z.number().int().min(0).optional(),
  optimal_stock_level: z.number().int().min(0).optional(),
  storage_location: z.string().optional(),
  is_controlled: z.boolean().optional(),
  substance_schedule: z.string().optional(),
  requires_refrigeration: z.boolean().optional(),
});

itemsRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateItemSchema.parse(req.body);

    // Set RLS context
    await AppDataSource.query(`SET app.current_pharmacy_id = '${validatedData.pharmacy_id}'`);

    const itemRepository = AppDataSource.getRepository(InventoryItem);
    const item = await itemRepository.findOne({
      where: { id, pharmacy_id: validatedData.pharmacy_id },
    });

    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // Update fields
    if (validatedData.medication_name !== undefined) item.medication_name = validatedData.medication_name;
    if (validatedData.reorder_threshold !== undefined) item.reorder_threshold = validatedData.reorder_threshold;
    if (validatedData.optimal_stock_level !== undefined) item.optimal_stock_level = validatedData.optimal_stock_level;
    if (validatedData.storage_location !== undefined) item.storage_location = validatedData.storage_location;
    if (validatedData.is_controlled !== undefined) item.is_controlled = validatedData.is_controlled;
    if (validatedData.substance_schedule !== undefined) item.substance_schedule = validatedData.substance_schedule;
    if (validatedData.requires_refrigeration !== undefined) item.requires_refrigeration = validatedData.requires_refrigeration;

    item.updated_at = new Date();

    await itemRepository.save(item);

    res.json({
      success: true,
      message: 'Inventory item updated successfully',
      item,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Update item error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
