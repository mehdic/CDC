/**
 * Transcription Entity
 * Represents a transcribed text from a voice recording
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { SupportedLanguage, TranscriptionStatus } from '../types/voice.types';

@Entity('transcriptions')
@Index(['recordingId'])
@Index(['userId', 'createdAt'])
@Index(['status'])
@Index(['language'])
export class Transcription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  recordingId: string;

  @Column()
  userId: string;

  @Column()
  userRole: string;

  @Column({
    type: 'varchar',
    default: TranscriptionStatus.PENDING,
  })
  status: TranscriptionStatus;

  @Column({
    type: 'text',
    nullable: true,
  })
  text?: string;

  @Column({
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 0,
  })
  confidence: number;

  @Column({
    type: 'enum',
    enum: SupportedLanguage,
    nullable: true,
  })
  requestedLanguage?: SupportedLanguage;

  @Column({
    type: 'enum',
    enum: SupportedLanguage,
    nullable: true,
  })
  detectedLanguage?: SupportedLanguage;

  @Column({ default: false })
  hasDoctor: boolean;

  @Column({ default: false })
  hasPharmaTerms: boolean;

  @Column({
    type: 'simple-array',
    nullable: true,
  })
  keywords?: string[];

  @Column({ nullable: true })
  error?: string;

  @Column({ nullable: true })
  processingTime?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  completedAt?: Date;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  metadata?: Record<string, any>;
}
