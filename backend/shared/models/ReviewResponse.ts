/**
 * ReviewResponse Entity
 * Pharmacy responses to customer reviews
 * T6-018: Service Reviews Implementation
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Review } from './Review';

@Entity('review_responses')
export class ReviewResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('idx_review_responses_review')
  review_id: string;

  @ManyToOne(() => Review, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'review_id' })
  review: Review;

  @Column({ type: 'uuid' })
  @Index('idx_review_responses_pharmacy')
  pharmacy_id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'uuid' })
  responded_by: string;

  @CreateDateColumn({ type: 'timestamp' })
  responded_at: Date;

  getSummary(): string {
    return this.content.substring(0, 100) + (this.content.length > 100 ? '...' : '');
  }
}
