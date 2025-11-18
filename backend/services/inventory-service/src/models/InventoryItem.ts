/**
 * Database Model for Inventory Item
 * Uses TypeORM for database mapping
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired';

@Entity('inventory_items')
@Index(['pharmacyId', 'sku'], { unique: true })
export class InventoryItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'pharmacy_id', type: 'varchar', length: 255 })
  @Index()
  pharmacyId!: string;

  @Column({ name: 'product_name', type: 'varchar', length: 500 })
  productName!: string;

  @Column({ type: 'varchar', length: 255, unique: false })
  @Index()
  sku!: string;

  @Column({ type: 'int', default: 0 })
  quantity!: number;

  @Column({ name: 'min_quantity', type: 'int', default: 10 })
  minQuantity!: number;

  @Column({ name: 'max_quantity', type: 'int', default: 1000 })
  maxQuantity!: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice!: number;

  @Column({ name: 'expiration_date', type: 'varchar', length: 50, nullable: true })
  expirationDate?: string;

  @Column({ type: 'varchar', length: 50, default: 'in_stock' })
  status!: InventoryStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
