/**
 * VoiceRecording Entity
 * Represents a voice recording (teleconsultation, voice note, dictation)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { RecordingStatus, SupportedLanguage, VoiceRecordingMetadata } from '../types/voice.types';

@Entity('voice_recordings')
@Index(['userId', 'createdAt'])
@Index(['conversationId'])
@Index(['appointmentId'])
@Index(['status'])
export class VoiceRecording {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  userRole: 'pharmacist' | 'doctor' | 'nurse' | 'patient';

  @Column({ nullable: true })
  conversationId?: string;

  @Column({ nullable: true })
  appointmentId?: string;

  @Column()
  consultationType: 'teleconsultation' | 'voice_note' | 'dictation';

  @Column({
    type: 'enum',
    enum: SupportedLanguage,
    default: SupportedLanguage.FRENCH,
  })
  language: SupportedLanguage;

  @Column({
    type: 'varchar',
    default: RecordingStatus.PENDING,
  })
  status: RecordingStatus;

  @Column()
  fileUrl: string;

  @Column({ nullable: true })
  fileName: string;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  metadata?: VoiceRecordingMetadata;

  @Column({
    type: 'simple-array',
    nullable: true,
  })
  tags?: string[];

  @Column({ nullable: true })
  error?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  completedAt?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
