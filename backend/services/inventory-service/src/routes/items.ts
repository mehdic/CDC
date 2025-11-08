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
