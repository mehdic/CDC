/**
 * Access Log Database Model
 * TypeORM entity for tracking medical record access (GDPR compliance)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type AccessAction = 'view' | 'create' | 'update' | 'delete' | 'export';

@Entity('access_logs')
@Index(['recordId'])
@Index(['userId'])
@Index(['patientId'])
export class AccessLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  recordId!: string; // Medical record ID

  @Column({ type: 'varchar', length: 255 })
  patientId!: string;

  @Column({ type: 'varchar', length: 255 })
  userId!: string; // User who accessed the record

  @Column({ type: 'varchar', length: 50 })
  userRole!: string; // pharmacist, nurse, doctor, patient

  @Column({
    type: 'enum',
    enum: ['view', 'create', 'update', 'delete', 'export'],
  })
  action!: AccessAction;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ipAddress?: string;

  @Column({ type: 'text', nullable: true })
  reason?: string; // Optional reason for access

  @CreateDateColumn({ type: 'timestamp' })
  accessedAt!: Date;
}
