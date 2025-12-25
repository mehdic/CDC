/**
 * Renewal Prediction Database Model
 * TypeORM entity for AI-powered prescription renewal predictions
 * Task: T8-055
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type PredictionStatus = 'pending' | 'approved' | 'rejected' | 'expired';
export type ConfidenceLevel = 'low' | 'medium' | 'high';

@Entity('renewal_predictions')
@Index(['prescriptionId'])
@Index(['patientId'])
@Index(['status'])
@Index(['predictedDate'])
export class RenewalPrediction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  prescriptionId!: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  patientId!: string;

  @Column({ type: 'varchar', length: 255 })
  pharmacyId!: string;

  @Column({ type: 'timestamp' })
  predictedDate!: Date;

  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  })
  confidence!: ConfidenceLevel;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  confidenceScore!: number; // 0-100

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected', 'expired'],
    default: 'pending',
  })
  status!: PredictionStatus;

  @Column({ type: 'jsonb', nullable: true })
  predictionFactors?: {
    adherenceRate: number;
    refillHistory: number[];
    averageDaysBetweenRefills: number;
    medicationType: string;
    chronicCondition: boolean;
  };

  @Column({ type: 'varchar', length: 255, nullable: true })
  approvedBy?: string; // pharmacist ID

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
