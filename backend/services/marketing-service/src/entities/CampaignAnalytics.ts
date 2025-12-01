/**
 * Campaign Analytics Entity
 * Track campaign performance metrics (opens, clicks, conversions)
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

@Entity('campaign_analytics')
@Index(['campaignId', 'timestamp'])
@Index(['recipientId'])
export class CampaignAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  campaignId!: string;

  @Column('uuid')
  recipientId!: string;

  @Column('varchar', { length: 500, nullable: true })
  recipientEmail?: string;

  @Column('varchar', { length: 20, nullable: true })
  recipientPhoneNumber?: string;

  @Column('boolean', { default: false })
  sent = false;

  @Column('timestamp', { nullable: true })
  sentAt?: Date;

  @Column('text', { nullable: true })
  sentError?: string;

  @Column('boolean', { default: false })
  opened = false;

  @Column('timestamp', { nullable: true })
  openedAt?: Date;

  @Column('integer', { default: 0 })
  openCount = 0;

  @Column('boolean', { default: false })
  clicked = false;

  @Column('timestamp', { nullable: true })
  clickedAt?: Date;

  @Column('integer', { default: 0 })
  clickCount = 0;

  @Column('varchar', { array: true, nullable: true })
  clickedLinks?: string[];

  @Column('boolean', { default: false })
  converted = false;

  @Column('timestamp', { nullable: true })
  convertedAt?: Date;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  conversionValue?: number;

  @Column('varchar', { length: 255, nullable: true })
  conversionType?: string; // 'purchase', 'signup', 'subscription', 'inquiry'

  @Column('boolean', { default: false })
  bounced = false;

  @Column('varchar', { length: 50, nullable: true })
  bounceType?: string; // 'hard', 'soft'

  @Column('timestamp', { nullable: true })
  bouncedAt?: Date;

  @Column('boolean', { default: false })
  unsubscribed = false;

  @Column('timestamp', { nullable: true })
  unsubscribedAt?: Date;

  @Column('boolean', { default: false })
  complained = false; // Spam complaint

  @Column('timestamp', { nullable: true })
  complainedAt?: Date;

  @Column('varchar', { length: 100, nullable: true })
  deviceType?: string; // 'mobile', 'desktop', 'tablet'

  @Column('varchar', { length: 100, nullable: true })
  browser?: string;

  @Column('varchar', { length: 100, nullable: true })
  operatingSystem?: string;

  @Column('varchar', { length: 100, nullable: true })
  country?: string;

  @Column('varchar', { length: 100, nullable: true })
  city?: string;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  timestamp!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
