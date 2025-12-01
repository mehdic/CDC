/**
 * ThirdPartyPayment Entity
 * Represents third-party payment arrangements (tiers garant vs tiers payant)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('third_party_payments')
@Index(['claimId'])
@Index(['status'])
export class ThirdPartyPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'uuid',
    comment: 'Reference to insurance claim',
  })
  claimId: string;

  @Column({
    type: 'varchar',
    enum: ['tiers_garant', 'tiers_payant', 'mixed'],
    comment: 'Payment model: tiers_garant (patient pays then claims), tiers_payant (pharmacy bills insurance)',
  })
  paymentModel: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    comment: 'Amount that insurance company is responsible for',
  })
  insuranceResponsibility: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    comment: 'Amount that patient is responsible for (franchise + quote-part)',
  })
  patientResponsibility: number;

  @Column({
    type: 'varchar',
    enum: ['pending', 'in_progress', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    comment: 'Payment status',
  })
  status: string;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Payment completion date',
  })
  completionDate: Date;

  @Column({
    type: 'varchar',
    nullable: true,
    comment: 'Payment transaction ID',
  })
  transactionId: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Failure reason if status is failed',
  })
  failureReason: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Additional payment details',
  })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
