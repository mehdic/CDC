/**
 * InsuranceClaim Entity
 * Represents insurance claims for reimbursement
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('insurance_claims')
@Index(['patientId'])
@Index(['patientInsuranceId'])
@Index(['status'])
@Index(['claimDate'])
export class InsuranceClaim {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'uuid',
    comment: 'Reference to patient',
  })
  patientId: string;

  @Column({
    type: 'uuid',
    comment: 'Reference to patient insurance record',
  })
  patientInsuranceId: string;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'Reference to prescription if claim is prescription-related',
  })
  prescriptionId: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    comment: 'Total claim amount in CHF',
  })
  amount: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    comment: 'Amount deducted for franchise in CHF',
  })
  franchiseDeduction: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    comment: 'Quote-part amount (patient responsibility) in CHF',
  })
  quotePartAmount: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    comment: 'Reimbursable amount (insurance responsibility) in CHF',
  })
  reimbursableAmount: number;

  @Column({
    type: 'varchar',
    enum: ['draft', 'submitted', 'processing', 'approved', 'rejected', 'paid'],
    default: 'draft',
    comment: 'Current claim status',
  })
  status: string;

  @Column({
    type: 'date',
    comment: 'Date of the service/purchase',
  })
  claimDate: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Date claim was submitted to insurance',
  })
  submissionDate: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Date response was received from insurance',
  })
  responseDate: Date;

  @Column({
    type: 'varchar',
    nullable: true,
    comment: 'Insurance reference or tracking number',
  })
  reference: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Notes or description',
  })
  notes: string;

  @Column({
    type: 'simple-array',
    nullable: true,
    comment: 'File paths or URLs of attachments',
  })
  attachments: string[];

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Additional metadata',
  })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
