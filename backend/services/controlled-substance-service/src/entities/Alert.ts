import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { AlertType, AlertSeverity } from '../types/controlled.types';

/**
 * Alert Entity
 * Detects and tracks potential abuse patterns and compliance issues
 */
@Entity('controlled_alerts')
@Index(['patientId', 'createdAt'])
@Index(['severity', 'resolvedAt'])
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: AlertType,
  })
  type!: AlertType;

  @Column({
    type: 'enum',
    enum: AlertSeverity,
  })
  severity!: AlertSeverity;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'uuid' })
  patientId!: string;

  @Column({ type: 'uuid', nullable: true })
  substanceId?: string;

  @Column({ type: 'uuid', nullable: true })
  pharmacyId?: string;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  resolvedBy?: string; // Pharmacist or admin who resolved

  @Column({ type: 'text', nullable: true })
  resolutionNotes?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    frequencyPerMonth?: number;
    lastDispensedDate?: Date;
    pharmacyCount?: number;
    totalQuantity?: number;
    [key: string]: any;
  };

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
