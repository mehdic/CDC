/**
 * User Behavior Event Entity
 * Tracks user interactions and patterns for AI recommendations
 * T5-031: Behavioral Tracking Service
 * Privacy-first: GDPR compliant with user consent tracking
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from './User';
import { Product } from './Product';

export enum EventType {
  PAGE_VIEW = 'page_view',
  PRODUCT_VIEW = 'product_view',
  PRODUCT_SEARCH = 'product_search',
  ADD_TO_CART = 'add_to_cart',
  REMOVE_FROM_CART = 'remove_from_cart',
  CHECKOUT_START = 'checkout_start',
  CHECKOUT_COMPLETE = 'checkout_complete',
  PRESCRIPTION_UPLOAD = 'prescription_upload',
  TELECONSULTATION_REQUEST = 'teleconsultation_request',
  APPOINTMENT_BOOK = 'appointment_book',
  REVIEW_SUBMIT = 'review_submit',
}

@Entity('user_behavior_events')
export class UserBehaviorEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // User Reference
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_behavior_user')
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // ============================================================================
  // Event Details
  // ============================================================================

  @Column({ type: 'varchar', length: 100 })
  @Index('idx_behavior_event_type')
  event_type: EventType;

  @Column({ type: 'uuid', nullable: true })
  @Index('idx_behavior_product')
  product_id: string | null;

  @ManyToOne(() => Product, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'product_id' })
  product: Product | null;

  // ============================================================================
  // Event Metadata
  // ============================================================================

  @Column({ type: 'simple-json', nullable: true })
  event_data: Record<string, any> | null; // Additional contextual data

  @Column({ type: 'varchar', length: 255, nullable: true })
  page_url: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  referrer: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  device_type: string | null; // mobile, tablet, desktop

  @Column({ type: 'varchar', length: 100, nullable: true })
  browser: string | null;

  // ============================================================================
  // Session & Consent
  // ============================================================================

  @Column({ type: 'varchar', length: 100 })
  @Index('idx_behavior_session')
  session_id: string; // Track session-based behavior

  @Column({ type: 'boolean', default: true })
  consent_given: boolean; // GDPR compliance: user must consent to tracking

  // ============================================================================
  // Timestamps
  // ============================================================================

  @CreateDateColumn({ type: 'timestamp' })
  @Index('idx_behavior_created_at')
  created_at: Date;

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Check if event involves a product
   */
  hasProduct(): boolean {
    return this.product_id !== null;
  }

  /**
   * Check if tracking consent was given
   */
  hasConsent(): boolean {
    return this.consent_given;
  }

  /**
   * Get days since event
   */
  getDaysSinceEvent(): number {
    const now = new Date();
    const diff = now.getTime() - this.created_at.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}
