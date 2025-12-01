/**
 * PatientInsurance Entity
 * Represents a patient's insurance relationship with a provider
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('patient_insurance')
@Index(['patientId', 'insuranceProviderId'], { unique: true, where: 'is_active = true' })
@Index(['patientId'])
@Index(['insuranceProviderId'])
@Index(['isActive'])
export class PatientInsurance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'uuid',
    comment: 'Reference to patient user ID',
  })
  patientId: string;

  @Column({
    type: 'uuid',
    comment: 'Reference to insurance provider',
  })
  insuranceProviderId: string;

  @Column({
    type: 'varchar',
    comment: 'Insurance policy number',
  })
  policyNumber: string;

  @Column({
    type: 'varchar',
    nullable: true,
    comment: 'Insurance member ID',
  })
  memberId: string;

  @Column({
    type: 'integer',
    enum: [300, 500, 1000, 1500, 2000, 2500],
    comment: 'Annual franchise level in CHF',
  })
  franchiseLevel: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    comment: 'Amount of franchise already spent in current year',
  })
  currentFranchiseSpent: number;

  @Column({
    type: 'date',
    nullable: true,
    comment: 'Franchise year start date',
  })
  franchiseYearStart: Date;

  @Column({
    type: 'date',
    nullable: true,
    comment: 'Franchise year end date',
  })
  franchiseYearEnd: Date;

  @Column({
    type: 'integer',
    default: 10,
    comment: 'Quote-part percentage (typically 10% after franchise)',
  })
  quotePartPercentage: number;

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Whether this insurance relationship is active',
  })
  isActive: boolean;

  @Column({
    type: 'date',
    comment: 'Insurance coverage start date',
  })
  startDate: Date;

  @Column({
    type: 'date',
    nullable: true,
    comment: 'Insurance coverage end date',
  })
  endDate: Date;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Additional coverage details',
  })
  additionalCoverage: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
