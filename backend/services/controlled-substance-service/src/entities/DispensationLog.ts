import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { DispensationStatus } from '../types/controlled.types';

/**
 * Dispensation Log Entity
 * Mandatory audit trail for all controlled substance dispensations
 * Required for Swiss pharmaceutical regulations compliance
 */
@Entity('dispensation_logs')
@Index(['patientId', 'createdAt'])
@Index(['pharmacyId', 'createdAt'])
@Index(['substanceId', 'createdAt'])
export class DispensationLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  prescriptionId!: string;

  @Column({ type: 'uuid' })
  patientId!: string;

  @Column({ type: 'uuid' })
  pharmacyId!: string;

  @Column({ type: 'uuid' })
  pharmacistId!: string; // Pharmacist who dispensed

  @Column({ type: 'uuid' })
  substanceId!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  quantityDispensed!: number;

  @Column({ type: 'varchar', length: 50 })
  unit!: string; // mg, ml, tablets, etc.

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  dosagePerUnit!: number; // e.g., 10mg per tablet

  @Column({ type: 'int' })
  daysSupply!: number;

  @Column({ name: 'dispensed_date', type: 'timestamp' })
  dispensedDate!: Date;

  @Column({
    type: 'enum',
    enum: DispensationStatus,
    default: DispensationStatus.DISPENSED,
  })
  status!: DispensationStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  batchNumber?: string; // For product traceability

  @Column({ type: 'timestamp', nullable: true })
  expirationDate?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  specialFormNumber?: string; // Special prescription form number (Liste A/B)

  @Column({ type: 'text', nullable: true })
  notes?: string; // Pharmacist notes

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    prescriptionVerified?: boolean;
    patientIdVerified?: boolean;
    quantityVerified?: boolean;
    [key: string]: any;
  };

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
