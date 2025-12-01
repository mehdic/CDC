/**
 * CoverageDetails Entity
 * Represents specific coverage details for a patient's insurance
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('coverage_details')
@Index(['patientInsuranceId'])
@Index(['coverageType'])
export class CoverageDetails {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'uuid',
    comment: 'Reference to patient insurance record',
  })
  patientInsuranceId: string;

  @Column({
    type: 'varchar',
    enum: ['basic', 'complementary', 'dental', 'accident'],
    comment: 'Type of coverage',
  })
  coverageType: string;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Whether this coverage is approved',
  })
  isApproved: boolean;

  @Column({
    type: 'integer',
    default: 100,
    comment: 'Reimbursement percentage',
  })
  maxReimbursementPercentage: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    comment: 'Annual maximum reimbursement limit in CHF',
  })
  annualLimit: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    comment: 'Amount spent this year',
  })
  currentYearSpent: number;

  @Column({
    type: 'date',
    nullable: true,
    comment: 'Year start date for annual limit',
  })
  yearStart: Date;

  @Column({
    type: 'date',
    nullable: true,
    comment: 'Year end date for annual limit',
  })
  yearEnd: Date;

  @Column({
    type: 'varchar',
    nullable: true,
    comment: 'Additional conditions or restrictions',
  })
  conditions: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Metadata and additional details',
  })
  metadata: Record<string, any>;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
