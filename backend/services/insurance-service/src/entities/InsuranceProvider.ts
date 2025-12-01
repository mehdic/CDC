/**
 * InsuranceProvider Entity
 * Represents Swiss insurance companies
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('insurance_providers')
@Index(['code'], { unique: true })
@Index(['isActive'])
export class InsuranceProvider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    unique: true,
    comment: 'Insurance provider code (CSS, Helsana, Swica, etc.)',
  })
  code: string;

  @Column({
    type: 'varchar',
    comment: 'Insurance provider name',
  })
  name: string;

  @Column({
    type: 'varchar',
    default: 'CH',
    comment: 'Country code (ISO 3166-1 alpha-2)',
  })
  country: string;

  @Column({
    type: 'varchar',
    enum: ['LAMal', 'LCA', 'PRIVATE'],
    comment: 'Insurance type: LAMal (mandatory), LCA (complementary), or PRIVATE',
  })
  insuranceType: 'LAMal' | 'LCA' | 'PRIVATE';

  @Column({
    type: 'simple-array',
    nullable: true,
    comment: 'Coverage types provided',
  })
  coverageTypes: string[];

  @Column({
    type: 'varchar',
    nullable: true,
    comment: 'Contact email for claims submission',
  })
  contactEmail: string;

  @Column({
    type: 'varchar',
    nullable: true,
    comment: 'Contact phone number',
  })
  contactPhone: string;

  @Column({
    type: 'varchar',
    nullable: true,
    comment: 'Contact website',
  })
  website: string;

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Whether this provider is currently active',
  })
  isActive: boolean;

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
