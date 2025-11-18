/**
 * Repository Layer for Inventory Items
 * Provides data access methods with in-memory fallback
 */

import { InventoryItem, InventoryStatus } from '../models/InventoryItem';

/**
 * Calculate inventory status based on quantity and expiration
 */
export function calculateStatus(
  quantity: number,
  minQuantity: number,
  expirationDate?: string
): InventoryStatus {
  // Check expiration first
  if (expirationDate && new Date(expirationDate) < new Date()) {
    return 'expired';
  }

  // Then check quantity levels
  if (quantity === 0) return 'out_of_stock';
  if (quantity < minQuantity) return 'low_stock';
  return 'in_stock';
}

/**
 * In-Memory Repository Implementation
 * Simulates database operations using a Map
 */
export class InMemoryInventoryRepository {
  private inventory: Map<string, InventoryItem>;
  private nextId: number;

  constructor() {
    this.inventory = new Map<string, InventoryItem>();
    this.nextId = 1;
  }

  /**
   * Create a new inventory item
   */
  async create(data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<InventoryItem> {
    // Check for duplicate SKU in same pharmacy
    const existingItem = Array.from(this.inventory.values()).find(
      (item) => item.sku === data.sku && item.pharmacyId === data.pharmacyId
    );

    if (existingItem) {
      throw new Error('DUPLICATE_SKU');
    }

    const itemId = String(this.nextId++);
    const now = new Date();

    const newItem: InventoryItem = {
      id: itemId,
      pharmacyId: data.pharmacyId,
      productName: data.productName,
      sku: data.sku,
      quantity: data.quantity,
      minQuantity: data.minQuantity,
      maxQuantity: data.maxQuantity,
      unitPrice: data.unitPrice,
      expirationDate: data.expirationDate,
      status: calculateStatus(data.quantity, data.minQuantity, data.expirationDate),
      createdAt: now,
      updatedAt: now,
    };

    this.inventory.set(itemId, newItem);
    return newItem;
  }

  /**
   * Find all inventory items, optionally filtered by pharmacy
   */
  async findAll(pharmacyId?: string): Promise<InventoryItem[]> {
    let items = Array.from(this.inventory.values());

    if (pharmacyId) {
      items = items.filter((item) => item.pharmacyId === pharmacyId);
    }

    return items;
  }

  /**
   * Find inventory item by ID
   */
  async findById(id: string): Promise<InventoryItem | null> {
    return this.inventory.get(id) || null;
  }

  /**
   * Update inventory item quantity
   */
  async updateQuantity(id: string, quantity: number): Promise<InventoryItem | null> {
    const item = this.inventory.get(id);

    if (!item) {
      return null;
    }

    // Update quantity and recalculate status
    item.quantity = quantity;
    item.status = calculateStatus(quantity, item.minQuantity, item.expirationDate);
    item.updatedAt = new Date();

    return item;
  }

  /**
   * Delete inventory item
   */
  async delete(id: string): Promise<InventoryItem | null> {
    const item = this.inventory.get(id);

    if (!item) {
      return null;
    }

    this.inventory.delete(id);
    return item;
  }

  /**
   * Clear all inventory (for testing)
   */
  async clear(): Promise<void> {
    this.inventory.clear();
    this.nextId = 1;
  }
}

/**
 * Singleton instance
 */
export const inventoryRepository = new InMemoryInventoryRepository();
