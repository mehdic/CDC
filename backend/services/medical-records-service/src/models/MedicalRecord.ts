/**
 * Medical Record Entity
 * Represents a patient's medical record with HIPAA/GDPR compliance
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum RecordType {
  ALLERGY = 'allergy',
  MEDICATION = 'medication',
  CONDITION = 'condition',
  PROCEDURE = 'procedure',
  IMMUNIZATION = 'immunization',
  LAB_RESULT = 'lab_result',
  VITAL_SIGNS = 'vital_signs',
  DIAGNOSIS = 'diagnosis',
  PRESCRIPTION = 'prescription',
  CONSULTATION = 'consultation',
  HOSPITALIZATION = 'hospitalization',
  IMAGING = 'imaging',
  OTHER = 'other',
}

export enum RecordSource {
  PATIENT_REPORTED = 'patient_reported',
  DOCTOR_ENTERED = 'doctor_entered',
  PHARMACIST_ENTERED = 'pharmacist_entered',
  NURSE_ENTERED = 'nurse_entered',
  E_SANTE_API = 'e_sante_api',
  HIN_SYSTEM = 'hin_system',
  IMPORTED = 'imported',
  TELECONSULTATION = 'teleconsultation',
}

@Entity('medical_records')
@Index(['patientId', 'recordType'])
@Index(['patientId', 'active'])
@Index(['recordedAt'])
export class MedicalRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  patientId!: string;

  @Column({
    type: 'enum',
    enum: RecordType,
  })
  recordType!: RecordType;

  @Column({ type: 'varchar', length: 500 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  data?: Record<string, any>;

  @Column({
    type: 'enum',
    enum: RecordSource,
    default: RecordSource.PATIENT_REPORTED,
  })
  source!: RecordSource;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sourceId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recordedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  recordedAt?: Date;

  @Column({ type: 'boolean', default: false })
  consentGiven!: boolean;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
