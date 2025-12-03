/**
 * Product Recommendation Entity
 * AI-generated personalized product recommendations
 * T5-032: AI Recommendation Engine
 * Healthcare-appropriate recommendations with A/B testing support
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
import { User } from './User';
import { Product } from './Product';

export enum RecommendationType {
  COLLABORATIVE_FILTERING = 'collaborative_filtering', // Users who bought X also bought Y
  CONTENT_BASED = 'content_based', // Similar products based on attributes
  HEALTH_PROFILE = 'health_profile', // Based on user's health conditions
  PURCHASE_HISTORY = 'purchase_history', // Reorder suggestions
  TRENDING = 'trending', // Popular products
  PERSONALIZED = 'personalized', // ML-based personalization
}

export enum RecommendationStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  DISMISSED = 'dismissed',
  CONVERTED = 'converted', // User purchased the recommended product
}

@Entity('product_recommendations')
export class ProductRecommendation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // User & Product References
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_recommendation_user')
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid' })
  @Index('idx_recommendation_product')
  product_id: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  // ============================================================================
  // Recommendation Details
  // ============================================================================

  @Column({ type: 'varchar', length: 100 })
  @Index('idx_recommendation_type')
  recommendation_type: RecommendationType;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  confidence_score: number; // 0.0000 to 1.0000

  @Column({ type: 'varchar', length: 500, nullable: true })
  reason: string | null; // Human-readable explanation

  @Column({ type: 'simple-json', nullable: true })
  features: Record<string, any> | null; // Features used for recommendation

  // ============================================================================
  // Status & Lifecycle
  // ============================================================================

  @Column({
    type: 'varchar',
    length: 50,
    default: RecommendationStatus.ACTIVE,
  })
  @Index('idx_recommendation_status')
  status: RecommendationStatus;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date | null; // Recommendations can have expiry

  @Column({ type: 'timestamp', nullable: true })
  viewed_at: Date | null; // When user saw the recommendation

  @Column({ type: 'timestamp', nullable: true })
  clicked_at: Date | null; // When user clicked on recommendation

  @Column({ type: 'timestamp', nullable: true })
  converted_at: Date | null; // When user purchased the product

  // ============================================================================
  // A/B Testing Support
  // ============================================================================

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Index('idx_recommendation_variant')
  ab_test_variant: string | null; // e.g., 'control', 'variant_a', 'variant_b'

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Index('idx_recommendation_experiment')
  experiment_id: string | null; // Track which experiment this belongs to

  // ============================================================================
  // Healthcare Context
  // ============================================================================

  @Column({ type: 'boolean', default: true })
  health_appropriate: boolean; // Verified safe for user's health profile

  @Column({ type: 'text', nullable: true })
  health_warnings: string | null; // Any health-related warnings

  // ============================================================================
  // Timestamps
  // ============================================================================

  @CreateDateColumn({ type: 'timestamp' })
  @Index('idx_recommendation_created_at')
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Check if recommendation is still active
   */
  isActive(): boolean {
    if (this.status !== RecommendationStatus.ACTIVE) {
      return false;
    }
    if (this.expires_at && new Date() > this.expires_at) {
      return false;
    }
    return true;
  }

  /**
   * Check if recommendation was viewed
   */
  wasViewed(): boolean {
    return this.viewed_at !== null;
  }

  /**
   * Check if recommendation was clicked
   */
  wasClicked(): boolean {
    return this.clicked_at !== null;
  }

  /**
   * Check if recommendation led to conversion
   */
  wasConverted(): boolean {
    return this.converted_at !== null;
  }

  /**
   * Get click-through rate (CTR) indicator
   */
  getEngagementLevel(): 'none' | 'viewed' | 'clicked' | 'converted' {
    if (this.wasConverted()) return 'converted';
    if (this.wasClicked()) return 'clicked';
    if (this.wasViewed()) return 'viewed';
    return 'none';
  }

  /**
   * Mark as viewed
   */
  markViewed(): void {
    if (!this.viewed_at) {
      this.viewed_at = new Date();
    }
  }

  /**
   * Mark as clicked
   */
  markClicked(): void {
    if (!this.clicked_at) {
      this.clicked_at = new Date();
    }
    this.markViewed(); // Clicked implies viewed
  }

  /**
   * Mark as converted (purchased)
   */
  markConverted(): void {
    this.converted_at = new Date();
    this.status = RecommendationStatus.CONVERTED;
    this.markClicked(); // Converted implies clicked
  }

  /**
   * Mark as dismissed by user
   */
  markDismissed(): void {
    this.status = RecommendationStatus.DISMISSED;
  }

  /**
   * Check if recommendation is part of A/B test
   */
  isABTest(): boolean {
    return this.experiment_id !== null && this.ab_test_variant !== null;
  }
}
