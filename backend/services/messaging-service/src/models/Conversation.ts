/**
 * Conversation Model
 * Represents a conversation thread between participants
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Message } from './Message';

export enum ConversationType {
  DIRECT = 'direct', // 1-on-1
  GROUP = 'group', // Multiple participants
  BROADCAST = 'broadcast', // One-to-many (notifications)
}

@Entity('conversations')
@Index(['createdAt'])
@Index(['updatedAt'])
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: ConversationType,
    default: ConversationType.DIRECT,
  })
  type!: ConversationType;

  @Column({ type: 'jsonb' })
  participants!: {
    userId: string;
    role: string; // pharmacist, doctor, nurse, patient, delivery
    joinedAt: Date;
    lastReadAt?: Date;
    unreadCount?: number;
  }[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  subject?: string;

  @Column({ name: 'last_message_id', nullable: true })
  lastMessageId?: string;

  @Column({ name: 'last_message_at', type: 'timestamp', nullable: true })
  @Index()
  lastMessageAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    prescriptionId?: string;
    orderId?: string;
    deliveryId?: string;
    consultationId?: string;
    tags?: string[];
    archived?: boolean;
    [key: string]: unknown;
  };

  @OneToMany(() => Message, (message) => message.conversation, {
    cascade: true,
  })
  messages!: Message[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Helper methods
  addParticipant(userId: string, role: string): void {
    const existingParticipant = this.participants.find(
      (p) => p.userId === userId
    );

    if (!existingParticipant) {
      this.participants.push({
        userId,
        role,
        joinedAt: new Date(),
        unreadCount: 0,
      });
    }
  }

  removeParticipant(userId: string): void {
    this.participants = this.participants.filter((p) => p.userId !== userId);
  }

  updateLastMessage(messageId: string): void {
    this.lastMessageId = messageId;
    this.lastMessageAt = new Date();
  }

  markAsRead(userId: string): void {
    const participant = this.participants.find((p) => p.userId === userId);
    if (participant) {
      participant.lastReadAt = new Date();
      participant.unreadCount = 0;
    }
  }

  incrementUnreadCount(userId: string): void {
    const participant = this.participants.find((p) => p.userId === userId);
    if (participant) {
      participant.unreadCount = (participant.unreadCount || 0) + 1;
    }
  }

  getParticipantIds(): string[] {
    return this.participants.map((p) => p.userId);
  }

  isParticipant(userId: string): boolean {
    return this.participants.some((p) => p.userId === userId);
  }
}
