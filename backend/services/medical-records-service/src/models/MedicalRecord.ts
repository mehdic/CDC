/**
 * Medical Record Database Model
 * TypeORM entity for patient medical records storage
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type RecordType = 'diagnosis' | 'allergy' | 'medication' | 'procedure' | 'lab_result' | 'immunization' | 'condition';
export type RecordSource = 'manual' | 'e-sante' | 'import' | 'prescription';

@Entity('medical_records')
@Index(['patientId'])
@Index(['patientId', 'recordType'])
export class MedicalRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  patientId!: string;

  @Column({
    type: 'enum',
    enum: ['diagnosis', 'allergy', 'medication', 'procedure', 'lab_result', 'immunization', 'condition'],
  })
  recordType!: RecordType;

  @Column({ type: 'varchar', length: 500 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  data?: Record<string, any>; // Flexible data storage for different record types

  @Column({
    type: 'enum',
    enum: ['manual', 'e-sante', 'import', 'prescription'],
    default: 'manual',
  })
  source!: RecordSource;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sourceId?: string; // ID from external system (e-santé, prescription, etc.)

  @Column({ type: 'varchar', length: 255, nullable: true })
  recordedBy?: string; // Healthcare professional ID who recorded this

  @Column({ type: 'timestamp', nullable: true })
  recordedAt?: Date;

  @Column({ type: 'boolean', default: true })
  active!: boolean; // Can be set to false for historical records

  @Column({ type: 'boolean', default: false })
  consentGiven!: boolean; // Patient consent for sharing with pharmacist/nurse

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
