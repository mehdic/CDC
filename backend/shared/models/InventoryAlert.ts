/**
 * InventoryAlert Entity
 * Low stock and expiration alerts with AI-powered reorder suggestions
 * Based on: /specs/002-metapharm-platform/data-model.md
 * User Story 3 (P3): Real-Time Inventory Management (FR-034 to FR-036)
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
import { Pharmacy } from './Pharmacy';
import { InventoryItem } from './InventoryItem';
import { User } from './User';

export enum AlertType {
  LOW_STOCK = 'low_stock',
  EXPIRING_SOON = 'expiring_soon',
  EXPIRED = 'expired',
  REORDER_SUGGESTED = 'reorder_suggested',
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

@Entity('inventory_alerts')
export class InventoryAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // Multi-Tenant Isolation
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_inventory_alerts_pharmacy')
  pharmacy_id: string;

  @ManyToOne(() => Pharmacy, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'pharmacy_id' })
  pharmacy: Pharmacy;

  // ============================================================================
  // Inventory Item
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_inventory_alerts_item')
  inventory_item_id: string;

  @ManyToOne(() => InventoryItem, (item) => item.alerts, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'inventory_item_id' })
  inventory_item: InventoryItem;

  // ============================================================================
  // Alert
  // ============================================================================

  @Column({
    type: 'varchar',
    length: 50,
  })
  @Index('idx_inventory_alerts_type')
  alert_type: AlertType;

  @Column({
    type: 'varchar',
    length: 50,
    default: AlertSeverity.MEDIUM,
  })
  @Index('idx_inventory_alerts_severity')
  severity: AlertSeverity;

  @Column({ type: 'text' })
  message: string;

  // ============================================================================
  // AI Recommendation
  // ============================================================================

  @Column({ type: 'text', nullable: true })
  ai_suggested_action: string | null; // "Reorder 500 units based on 30-day demand forecast"

  @Column({ type: 'integer', nullable: true })
  ai_suggested_quantity: number | null;

  // ============================================================================
  // Status
  // ============================================================================

  @Column({
    type: 'varchar',
    length: 50,
    default: AlertStatus.ACTIVE,
  })
  @Index('idx_inventory_alerts_status')
  status: AlertStatus;

  @Column({ type: 'uuid', nullable: true })
  acknowledged_by_user_id: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'acknowledged_by_user_id' })
  acknowledged_by_user: User | null;

  @Column({ type: 'datetime', nullable: true })
  acknowledged_at: Date | null;

  // ============================================================================
  // Metadata
  // ============================================================================

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'datetime', nullable: true })
  resolved_at: Date | null;

  // ============================================================================
  // Virtual Getters
  // ============================================================================

  /**
   * Check if alert is active and needs attention
   */
  get isActive(): boolean {
    return this.status === AlertStatus.ACTIVE;
  }

  /**
   * Check if alert has AI recommendation
   */
  get hasAiRecommendation(): boolean {
    return this.ai_suggested_action !== null && this.ai_suggested_quantity !== null;
  }

  /**
   * Check if alert is high priority (high or critical severity)
   */
  get isHighPriority(): boolean {
    return this.severity === AlertSeverity.HIGH || this.severity === AlertSeverity.CRITICAL;
  }

  /**
   * Get age of alert in hours
   */
  get ageInHours(): number {
    const now = new Date();
    const diffMs = now.getTime() - this.created_at.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60));
  }
}
