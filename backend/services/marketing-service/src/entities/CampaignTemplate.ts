/**
 * Campaign Template Entity
 * Email and SMS message templates for campaigns
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

export enum TemplateChannel {
  EMAIL = 'email',
  SMS = 'sms',
  IN_APP = 'in_app',
  PUSH = 'push',
}

@Entity('campaign_templates')
@Index(['pharmacyId', 'channel'])
@Index(['createdAt'])
export class CampaignTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  pharmacyId!: string;

  @Column('varchar', { length: 255 })
  name!: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('enum', { enum: TemplateChannel })
  channel!: TemplateChannel;

  @Column('varchar', { length: 500, nullable: true })
  subject?: string; // For email and push notifications

  @Column('text')
  body!: string;

  @Column('text', { nullable: true })
  htmlContent?: string; // For HTML emails

  @Column('varchar', { array: true })
  variables: string[] = []; // ['{{firstName}}', '{{discount}}', '{{expiryDate}}']

  @Column('jsonb', { nullable: true })
  metadata?: {
    previewText?: string;
    senderName?: string;
    senderEmail?: string;
    replyTo?: string;
    unsubscribeLink?: boolean;
    trackingPixel?: boolean;
  };

  @Column('integer', { default: 0 })
  usageCount = 0;

  @Column('boolean', { default: false })
  isActive = false;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
