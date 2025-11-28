/**
 * Product Entity
 * E-commerce product catalog for OTC medications, parapharmacy items
 * Based on: /specs/002-metapharm-platform/data-model.md
 * T3-029: E-Commerce Database Schema
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Category } from './Category';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // Basic Information
  // ============================================================================

  @Column({ type: 'varchar', length: 255 })
  @Index('idx_products_name')
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 100, unique: true })
  @Index('idx_products_sku')
  sku: string; // Stock Keeping Unit

  @Column({ type: 'varchar', length: 255, nullable: true })
  manufacturer: string | null;

  // ============================================================================
  // Category
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_products_category')
  category_id: string;

  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  // ============================================================================
  // Pricing
  // ============================================================================

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  original_price: number | null; // For showing discounts

  // ============================================================================
  // Stock Management
  // ============================================================================

  @Column({ type: 'integer', default: 0 })
  stock: number;

  @Column({ type: 'integer', default: 10 })
  low_stock_threshold: number; // Alert when stock falls below this

  // ============================================================================
  // Product Details
  // ============================================================================

  @Column({ type: 'boolean', default: false })
  @Index('idx_products_requires_prescription')
  requires_prescription: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image_url: string | null;

  @Column({ type: 'date', nullable: true })
  expiry_date: Date | null; // For perishable items

  // ============================================================================
  // Ratings & Reviews
  // ============================================================================

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number; // 0.00 to 5.00

  @Column({ type: 'integer', default: 0 })
  review_count: number;

  // ============================================================================
  // Status
  // ============================================================================

  @Column({ type: 'boolean', default: true })
  @Index('idx_products_active')
  is_active: boolean; // For soft delete / hiding products

  @Column({ type: 'boolean', default: false })
  is_featured: boolean; // Featured on homepage

  // ============================================================================
  // Metadata
  // ============================================================================

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Check if product is in stock
   */
  isInStock(): boolean {
    return this.stock > 0;
  }

  /**
   * Check if product is low on stock
   */
  isLowStock(): boolean {
    return this.stock > 0 && this.stock <= this.low_stock_threshold;
  }

  /**
   * Check if product is out of stock
   */
  isOutOfStock(): boolean {
    return this.stock === 0;
  }

  /**
   * Check if product is on sale
   */
  isOnSale(): boolean {
    return (
      this.original_price !== null && this.original_price > this.price
    );
  }

  /**
   * Get discount percentage if on sale
   */
  getDiscountPercentage(): number {
    if (!this.isOnSale() || !this.original_price) {
      return 0;
    }
    return Math.round(
      ((this.original_price - this.price) / this.original_price) * 100
    );
  }

  /**
   * Check if product is available for purchase
   */
  isAvailable(): boolean {
    return this.is_active && this.isInStock();
  }

  /**
   * Decrease stock by quantity
   */
  decreaseStock(quantity: number): void {
    if (quantity > this.stock) {
      throw new Error('Insufficient stock');
    }
    this.stock -= quantity;
  }

  /**
   * Increase stock by quantity
   */
  increaseStock(quantity: number): void {
    this.stock += quantity;
  }

  /**
   * Update rating with new review
   */
  addReview(newRating: number): void {
    const totalRating = this.rating * this.review_count + newRating;
    this.review_count += 1;
    this.rating = totalRating / this.review_count;
  }
}
