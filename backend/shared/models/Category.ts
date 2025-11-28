/**
 * Category Entity
 * Product categories for organizing e-commerce catalog
 * Based on: /specs/002-metapharm-platform/data-model.md
 * T3-029: E-Commerce Database Schema
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
import { Product } from './Product';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // Basic Information
  // ============================================================================

  @Column({ type: 'varchar', length: 255 })
  @Index('idx_categories_name')
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  @Index('idx_categories_slug')
  slug: string; // URL-friendly name (e.g., "pain-relief")

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  icon_url: string | null; // Category icon/image

  // ============================================================================
  // Hierarchy (Self-referencing for parent/child categories)
  // ============================================================================

  @Column({ type: 'uuid', nullable: true })
  @Index('idx_categories_parent')
  parent_id: string | null;

  @ManyToOne(() => Category, (category) => category.children, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'parent_id' })
  parent: Category | null;

  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];

  // ============================================================================
  // Display Order
  // ============================================================================

  @Column({ type: 'integer', default: 0 })
  display_order: number; // For sorting categories

  // ============================================================================
  // Status
  // ============================================================================

  @Column({ type: 'boolean', default: true })
  @Index('idx_categories_active')
  is_active: boolean;

  // ============================================================================
  // Relationships
  // ============================================================================

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];

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
   * Check if category is root (top-level)
   */
  isRoot(): boolean {
    return this.parent_id === null;
  }

  /**
   * Check if category has children
   */
  hasChildren(): boolean {
    return this.children && this.children.length > 0;
  }

  /**
   * Check if category is active
   */
  isActiveCategory(): boolean {
    return this.is_active;
  }

  /**
   * Get full path of category (e.g., "Health > Pain Relief > Headache")
   */
  async getFullPath(): Promise<string> {
    const path: string[] = [this.name];
    let current = this.parent;

    while (current) {
      path.unshift(current.name);
      current = current.parent;
    }

    return path.join(' > ');
  }
}
