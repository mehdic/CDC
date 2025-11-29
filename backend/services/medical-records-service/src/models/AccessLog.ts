/**
 * Access Log Entity
 * GDPR/HIPAA compliance - track all access to medical records
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum AccessAction {
  VIEW = 'view',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  EXPORT = 'export',
  SHARE = 'share',
}

@Entity('access_logs')
@Index(['recordId', 'accessedAt'])
@Index(['patientId', 'accessedAt'])
@Index(['userId'])
export class AccessLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  recordId!: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  patientId!: string;

  @Column({ type: 'varchar', length: 255 })
  userId!: string;

  @Column({ type: 'varchar', length: 50 })
  userRole!: string;

  @Column({
    type: 'enum',
    enum: AccessAction,
  })
  action!: AccessAction;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @CreateDateColumn()
  accessedAt!: Date;
}
