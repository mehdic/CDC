/**
 * Message Model
 * Represents a single message in the multi-channel messaging system
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Conversation } from './Conversation';

export enum MessageChannel {
  IN_APP = 'in_app',
  WHATSAPP = 'whatsapp',
  EMAIL = 'email',
  FAX = 'fax',
}

export enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

export enum MessageDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

@Entity('messages')
@Index(['conversationId', 'createdAt'])
@Index(['senderId', 'createdAt'])
@Index(['recipientId', 'createdAt'])
@Index(['status'])
@Index(['channel'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'conversation_id' })
  conversationId!: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: Conversation;

  @Column({ name: 'sender_id' })
  @Index()
  senderId!: string;

  @Column({ name: 'sender_role' })
  senderRole!: string; // pharmacist, doctor, nurse, patient, delivery, system

  @Column({ name: 'recipient_id' })
  @Index()
  recipientId!: string;

  @Column({ name: 'recipient_role' })
  recipientRole!: string;

  @Column({
    type: 'enum',
    enum: MessageChannel,
    default: MessageChannel.IN_APP,
  })
  channel!: MessageChannel;

  @Column({
    type: 'enum',
    enum: MessageDirection,
    default: MessageDirection.OUTBOUND,
  })
  direction!: MessageDirection;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'jsonb', nullable: true })
  attachments?: {
    id: string;
    type: string; // image, document, audio, video
    url: string;
    filename: string;
    size: number;
    mimeType: string;
  }[];

  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.PENDING,
  })
  status!: MessageStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    externalId?: string; // WhatsApp message ID, email message ID, etc.
    templateId?: string; // WhatsApp template ID
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    deliveryAttempts?: number;
    lastAttemptAt?: Date;
    errorMessage?: string;
    [key: string]: unknown;
  };

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt?: Date;

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  deliveredAt?: Date;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt?: Date;

  @Column({ name: 'failed_at', type: 'timestamp', nullable: true })
  failedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Helper methods
  markAsSent(): void {
    this.status = MessageStatus.SENT;
    this.sentAt = new Date();
  }

  markAsDelivered(): void {
    this.status = MessageStatus.DELIVERED;
    this.deliveredAt = new Date();
  }

  markAsRead(): void {
    this.status = MessageStatus.READ;
    this.readAt = new Date();
  }

  markAsFailed(errorMessage: string): void {
    this.status = MessageStatus.FAILED;
    this.failedAt = new Date();
    this.metadata = {
      ...this.metadata,
      errorMessage,
    };
  }

  incrementDeliveryAttempt(): void {
    const attempts = this.metadata?.deliveryAttempts || 0;
    this.metadata = {
      ...this.metadata,
      deliveryAttempts: attempts + 1,
      lastAttemptAt: new Date(),
    };
  }
}
