import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Controlled Prescription Entity
 * Validation and tracking for controlled substance prescriptions
 * Maintains Swiss compliance with special prescription forms
 */
@Entity('controlled_prescriptions')
@Index(['patientId', 'createdAt'])
@Index(['substanceId', 'createdAt'])
@Index(['specialFormNumber'])
export class ControlledPrescription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  prescriptionId!: string;

  @Column({ type: 'uuid' })
  patientId!: string;

  @Column({ type: 'uuid' })
  prescriberId!: string;

  @Column({ type: 'uuid' })
  pharmacyId!: string;

  @Column({ type: 'uuid' })
  substanceId!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  quantity!: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  dosagePerUnit!: number;

  @Column({ type: 'varchar', length: 50 })
  unit!: string; // mg, ml, tablets, etc.

  @Column({ type: 'int' })
  daysSupply!: number;

  @Column({ type: 'timestamp' })
  prescriptionDate!: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  specialFormNumber?: string; // Required for Liste A/B

  @Column({ type: 'boolean', default: false })
  validationPassed!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  validationErrors?: string[];

  @Column({ type: 'jsonb', nullable: true })
  validationWarnings?: string[];

  @Column({ type: 'boolean', default: false })
  requiresPharmacistReview!: boolean;

  @Column({ type: 'uuid', nullable: true })
  reviewedByPharmacistId?: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt?: Date;

  @Column({ type: 'text', nullable: true })
  reviewNotes?: string;

  @Column({ type: 'jsonb', nullable: true })
  detectedAlerts?: Array<{
    type: string;
    severity: string;
    message: string;
  }>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
