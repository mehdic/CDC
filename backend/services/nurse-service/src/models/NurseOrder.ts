/**
 * NurseOrder Model
 * Represents medication orders placed by nurses for their patients
 *
 * Order Workflow:
 * pending → approved → preparing → ready → delivered
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '@shared/models/User';

export enum OrderStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  PREPARING = 'preparing',
  READY = 'ready',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum OrderUrgency {
  ROUTINE = 'routine',
  URGENT = 'urgent',
  STAT = 'stat', // Immediate/Emergency
}

@Entity('nurse_orders')
export class NurseOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Relationships
  @Column({ type: 'varchar', name: 'nurse_id' })
  nurseId!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'nurse_id' })
  nurse?: User;

  @Column({ type: 'varchar', name: 'patient_id' })
  patientId!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'patient_id' })
  patient?: User;

  @Column({ type: 'varchar', name: 'pharmacy_id', nullable: true })
  pharmacyId?: string;

  @Column({ type: 'varchar', name: 'delivery_id', nullable: true })
  deliveryId?: string;

  // Order Details
  @Column({ type: 'varchar', length: 500 })
  medication!: string;

  @Column({ type: 'varchar', length: 200 })
  dosage!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ type: 'text', nullable: true })
  instructions?: string;

  // Urgency
  @Column({
    type: 'varchar',
    length: 20,
    default: OrderUrgency.ROUTINE,
  })
  urgency!: OrderUrgency;

  // Status
  @Column({
    type: 'varchar',
    length: 20,
    default: OrderStatus.PENDING,
  })
  status!: OrderStatus;

  // Notes
  @Column({ type: 'text', nullable: true })
  nurseNotes?: string;

  @Column({ type: 'text', nullable: true })
  pharmacistNotes?: string;

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ type: 'timestamp', name: 'approved_at', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'timestamp', name: 'delivered_at', nullable: true })
  deliveredAt?: Date;

  @Column({ type: 'timestamp', name: 'cancelled_at', nullable: true })
  cancelledAt?: Date;

  // Stock Validation
  @Column({ type: 'boolean', name: 'stock_validated', default: false })
  stockValidated!: boolean;

  @Column({ type: 'boolean', name: 'prescription_validated', default: false })
  prescriptionValidated!: boolean;
}
