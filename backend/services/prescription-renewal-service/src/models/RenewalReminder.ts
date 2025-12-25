/**
 * Renewal Reminder Database Model
 * TypeORM entity for scheduled prescription renewal reminders
 * Task: T8-055
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RenewalPrediction } from './RenewalPrediction';

export type ReminderStatus = 'scheduled' | 'sent' | 'failed' | 'cancelled';
export type ReminderChannel = 'email' | 'sms' | 'push' | 'in_app';

@Entity('renewal_reminders')
@Index(['predictionId'])
@Index(['patientId'])
@Index(['status'])
@Index(['scheduledFor'])
export class RenewalReminder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  predictionId!: string;

  @ManyToOne(() => RenewalPrediction)
  @JoinColumn({ name: 'predictionId' })
  prediction?: RenewalPrediction;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  patientId!: string;

  @Column({ type: 'timestamp' })
  scheduledFor!: Date;

  @Column({
    type: 'enum',
    enum: ['scheduled', 'sent', 'failed', 'cancelled'],
    default: 'scheduled',
  })
  status!: ReminderStatus;

  @Column({
    type: 'enum',
    enum: ['email', 'sms', 'push', 'in_app'],
  })
  channel!: ReminderChannel;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'timestamp', nullable: true })
  sentAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  deliveryMetadata?: {
    provider?: string; // 'twilio', 'sendgrid', etc.
    messageId?: string;
    deliveryStatus?: string;
    errorMessage?: string;
  };

  @Column({ type: 'integer', default: 0 })
  retryCount!: number;

  @Column({ type: 'integer', default: 3 })
  maxRetries!: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
