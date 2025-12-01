/**
 * Campaign Entity
 * Represents a marketing campaign with targeting rules, scheduling, and status
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export enum CampaignType {
  EMAIL = 'email',
  SMS = 'sms',
  IN_APP = 'in_app',
  PUSH = 'push',
}

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TargetAudience {
  ALL_CUSTOMERS = 'all_customers',
  NEW_CUSTOMERS = 'new_customers',
  LOYAL_CUSTOMERS = 'loyal_customers',
  INACTIVE_CUSTOMERS = 'inactive_customers',
  GEOGRAPHIC = 'geographic',
  DEMOGRAPHIC = 'demographic',
  BEHAVIORAL = 'behavioral',
  VIP_MEMBERS = 'vip_members',
}

@Entity('campaigns')
@Index(['pharmacyId', 'status'])
@Index(['scheduledAt'])
@Index(['createdAt'])
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  pharmacyId!: string;

  @Column('varchar', { length: 255 })
  name!: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('enum', { enum: CampaignType })
  type!: CampaignType;

  @Column('enum', { enum: CampaignStatus, default: CampaignStatus.DRAFT })
  status: CampaignStatus = CampaignStatus.DRAFT;

  @Column('varchar', { array: true, default: [TargetAudience.ALL_CUSTOMERS] })
  targetAudience: string[] = [TargetAudience.ALL_CUSTOMERS];

  @Column('jsonb', { nullable: true })
  targetingRules?: {
    locations?: string[];
    minAge?: number;
    maxAge?: number;
    gender?: string[];
    productCategories?: string[];
    minPurchaseAmount?: number;
    maxPurchaseAmount?: number;
  };

  @Column('varchar', { length: 500 })
  subject!: string;

  @Column('text')
  content!: string;

  @Column('uuid', { nullable: true })
  templateId?: string;

  @Column('timestamp', { nullable: true })
  scheduledAt?: Date;

  @Column('timestamp', { nullable: true })
  startDate?: Date;

  @Column('timestamp', { nullable: true })
  endDate?: Date;

  @Column('boolean', { default: false })
  isRecurring = false;

  @Column('varchar', { length: 50, nullable: true })
  recurringPattern?: string; // 'daily', 'weekly', 'monthly'

  @Column('uuid', { nullable: true })
  promotionId?: string;

  @Column('jsonb', { nullable: true })
  aBTestConfig?: {
    enabled: boolean;
    variants: Array<{
      id: string;
      name: string;
      subject?: string;
      content: string;
      percentage: number;
    }>;
  };

  @Column('integer', { default: 0 })
  totalRecipients = 0;

  @Column('integer', { default: 0 })
  sentCount = 0;

  @Column('integer', { default: 0 })
  failedCount = 0;

  @Column('integer', { default: 0 })
  openCount = 0;

  @Column('integer', { default: 0 })
  clickCount = 0;

  @Column('integer', { default: 0 })
  conversionCount = 0;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  openRate = 0;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  clickRate = 0;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  conversionRate = 0;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
