/**
 * InventoryTransaction Entity
 * QR scan events for traceability (receive, dispense, transfer, adjustments)
 * Based on: /specs/002-metapharm-platform/data-model.md
 * User Story 3 (P3): Real-Time Inventory Management (FR-031 to FR-040)
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

export enum TransactionType {
  RECEIVE = 'receive',       // Incoming from supplier
  DISPENSE = 'dispense',     // Outgoing to patient (linked to prescription)
  TRANSFER = 'transfer',     // Transfer to another pharmacy location
  RETURN = 'return',         // Returned from patient
  ADJUSTMENT = 'adjustment', // Manual stock adjustment
  EXPIRED = 'expired',       // Expired medication disposal
}

@Entity('inventory_transactions')
export class InventoryTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // Multi-Tenant Isolation
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_inventory_transactions_pharmacy')
  pharmacy_id: string;

  @ManyToOne(() => Pharmacy, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'pharmacy_id' })
  pharmacy: Pharmacy;

  // ============================================================================
  // Inventory Item
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_inventory_transactions_item')
  inventory_item_id: string;

  @ManyToOne(() => InventoryItem, (item) => item.transactions, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'inventory_item_id' })
  inventory_item: InventoryItem;

  // ============================================================================
  // Transaction
  // ============================================================================

  @Column({
    type: 'varchar',
    length: 50,
  })
  @Index('idx_inventory_transactions_type')
  transaction_type: TransactionType;

  @Column({ type: 'integer' })
  quantity_change: number; // Positive for receive, negative for dispense

  @Column({ type: 'integer' })
  quantity_after: number; // Snapshot of total quantity after this transaction

  // ============================================================================
  // Links
  // ============================================================================

  @Column({ type: 'uuid', nullable: true })
  @Index('idx_inventory_transactions_prescription')
  prescription_id: string | null; // FK to prescriptions (for dispensing transactions)

  @Column({ type: 'uuid' })
  user_id: string; // Pharmacist performing action

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // ============================================================================
  // QR Code
  // ============================================================================

  @Column({ type: 'varchar', length: 255, nullable: true })
  qr_code_scanned: string | null; // GTIN or internal QR

  // ============================================================================
  // Metadata
  // ============================================================================

  @CreateDateColumn({ type: 'datetime' })
  @Index('idx_inventory_transactions_created')
  created_at: Date;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // ============================================================================
  // Virtual Getters
  // ============================================================================

  /**
   * Check if this is an incoming transaction (positive quantity change)
   */
  get isIncoming(): boolean {
    return this.quantity_change > 0;
  }

  /**
   * Check if this is an outgoing transaction (negative quantity change)
   */
  get isOutgoing(): boolean {
    return this.quantity_change < 0;
  }

  /**
   * Check if transaction is linked to a prescription
   */
  get isLinkedToPrescription(): boolean {
    return this.prescription_id !== null;
  }
}
