/**
 * InventoryItem Entity
 * Medication stock tracking in pharmacies with QR traceability and AI-powered alerts
 * Based on: /specs/002-metapharm-platform/data-model.md
 * User Story 3 (P3): Real-Time Inventory Management (FR-031 to FR-040)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Pharmacy } from './Pharmacy';
import { InventoryTransaction } from './InventoryTransaction';
import { InventoryAlert } from './InventoryAlert';

@Entity('inventory_items')
export class InventoryItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // Multi-Tenant Isolation
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_inventory_items_pharmacy')
  pharmacy_id: string;

  @ManyToOne(() => Pharmacy, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'pharmacy_id' })
  pharmacy: Pharmacy;

  // ============================================================================
  // Medication
  // ============================================================================

  @Column({ type: 'varchar', length: 255 })
  medication_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @Index('idx_inventory_items_medication')
  medication_rxnorm_code: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @Index('idx_inventory_items_gtin')
  medication_gtin: string | null; // Global Trade Item Number (QR code)

  // ============================================================================
  // Stock
  // ============================================================================

  @Column({ type: 'integer', default: 0 })
  quantity: number;

  @Column({ type: 'varchar', length: 50 })
  unit: string; // "pills", "bottles", "boxes"

  @Column({ type: 'integer', nullable: true })
  reorder_threshold: number | null;

  @Column({ type: 'integer', nullable: true })
  optimal_stock_level: number | null; // AI-recommended based on demand

  // ============================================================================
  // Batch Info
  // ============================================================================

  @Column({ type: 'varchar', length: 100, nullable: true })
  batch_number: string | null;

  @Column({ type: 'date', nullable: true })
  expiry_date: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  supplier_name: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost_per_unit: number | null;

  // ============================================================================
  // Controlled Substance
  // ============================================================================

  @Column({ type: 'boolean', default: false })
  is_controlled: boolean;

  @Column({ type: 'varchar', length: 10, nullable: true })
  substance_schedule: string | null; // I, II, III, IV, V (Swiss narcotics classification)

  // ============================================================================
  // Location
  // ============================================================================

  @Column({ type: 'varchar', length: 100, nullable: true })
  storage_location: string | null; // Shelf/bin location

  @Column({ type: 'boolean', default: false })
  requires_refrigeration: boolean;

  // ============================================================================
  // Metadata
  // ============================================================================

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_restocked_at: Date | null;

  // ============================================================================
  // Relations
  // ============================================================================

  @OneToMany(() => InventoryTransaction, (transaction) => transaction.inventory_item)
  transactions: InventoryTransaction[];

  @OneToMany(() => InventoryAlert, (alert) => alert.inventory_item)
  alerts: InventoryAlert[];

  // ============================================================================
  // Virtual Getters
  // ============================================================================

  /**
   * Check if item is low stock (quantity <= reorder_threshold)
   */
  get isLowStock(): boolean {
    return this.reorder_threshold !== null && this.quantity <= this.reorder_threshold;
  }

  /**
   * Check if item is critical stock (quantity <= reorder_threshold / 2)
   */
  get isCriticalStock(): boolean {
    return this.reorder_threshold !== null && this.quantity <= Math.floor(this.reorder_threshold / 2);
  }

  /**
   * Check if item is out of stock
   */
  get isOutOfStock(): boolean {
    return this.quantity === 0;
  }

  /**
   * Check if item is expiring soon (within 60 days)
   */
  get isExpiringSoon(): boolean {
    if (!this.expiry_date) return false;
    const today = new Date();
    const sixtyDaysFromNow = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
    return this.expiry_date <= sixtyDaysFromNow;
  }

  /**
   * Check if item is expired
   */
  get isExpired(): boolean {
    if (!this.expiry_date) return false;
    return this.expiry_date < new Date();
  }
}
