/**
 * Review Entity
 * Product reviews with ratings, comments, and helpfulness voting
 * T3-047 to T3-050: Product Reviews System
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
import { Product } from './Product';
import { User } from './User';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // Relationships
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_reviews_product')
  product_id: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'uuid' })
  @Index('idx_reviews_user')
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // ============================================================================
  // Review Content
  // ============================================================================

  @Column({ type: 'integer', default: 0 })
  rating: number; // 1-5 stars

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  // ============================================================================
  // Review Metadata
  // ============================================================================

  @Column({ type: 'boolean', default: false })
  @Index('idx_reviews_verified')
  verified_purchase: boolean; // User purchased this product

  @Column({ type: 'integer', default: 0 })
  helpful_count: number; // Number of users who found this helpful

  @Column({ type: 'integer', default: 0 })
  unhelpful_count: number; // Number of users who found this unhelpful

  // ============================================================================
  // Moderation
  // ============================================================================

  @Column({ type: 'boolean', default: true })
  @Index('idx_reviews_approved')
  is_approved: boolean; // Whether review is visible (moderation status)

  @Column({ type: 'boolean', default: false })
  is_flagged: boolean; // Flagged for inappropriate content

  @Column({ type: 'text', nullable: true })
  flag_reason: string | null; // Reason for flagging

  @Column({ type: 'varchar', length: 255, nullable: true })
  flagged_by: string | null; // User ID who flagged

  // ============================================================================
  // Images
  // ============================================================================

  @Column({ type: 'simple-array', nullable: true })
  image_urls: string[] | null; // URLs to review images

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
   * Check if review is valid (not flagged/moderated out)
   */
  isValid(): boolean {
    return this.is_approved && !this.is_flagged;
  }

  /**
   * Get helpfulness ratio (0 to 1)
   */
  getHelpfulnessRatio(): number {
    const total = this.helpful_count + this.unhelpful_count;
    if (total === 0) return 0;
    return this.helpful_count / total;
  }

  /**
   * Get total helpfulness votes
   */
  getTotalHelpfulVotes(): number {
    return this.helpful_count + this.unhelpful_count;
  }

  /**
   * Mark review as helpful
   */
  markHelpful(): void {
    this.helpful_count += 1;
  }

  /**
   * Unmark review as helpful
   */
  unmarkHelpful(): void {
    if (this.helpful_count > 0) {
      this.helpful_count -= 1;
    }
  }

  /**
   * Mark review as unhelpful
   */
  markUnhelpful(): void {
    this.unhelpful_count += 1;
  }

  /**
   * Unmark review as unhelpful
   */
  unmarkUnhelpful(): void {
    if (this.unhelpful_count > 0) {
      this.unhelpful_count -= 1;
    }
  }

  /**
   * Flag review for inappropriate content
   */
  flag(reason: string, flaggedBy: string): void {
    this.is_flagged = true;
    this.flag_reason = reason;
    this.flagged_by = flaggedBy;
  }

  /**
   * Unflag review
   */
  unflag(): void {
    this.is_flagged = false;
    this.flag_reason = null;
    this.flagged_by = null;
  }

  /**
   * Approve review (make it visible)
   */
  approve(): void {
    this.is_approved = true;
  }

  /**
   * Reject review (hide it)
   */
  reject(): void {
    this.is_approved = false;
  }
}
