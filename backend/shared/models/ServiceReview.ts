/**
 * ServiceReview Entity
 * Reviews for services (teleconsultation, delivery, pharmacy visit)
 * T6-018: Service Reviews Implementation
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum ServiceType {
  TELECONSULTATION = 'teleconsultation',
  DELIVERY = 'delivery',
  PHARMACY_VISIT = 'pharmacy_visit',
  VACCINATION = 'vaccination',
}

export enum ServiceReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('service_reviews')
export class ServiceReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ServiceType })
  @Index('idx_service_reviews_type')
  service_type: ServiceType;

  @Column({ type: 'uuid' })
  @Index('idx_service_reviews_reference')
  reference_id: string;

  @Column({ type: 'uuid' })
  @Index('idx_service_reviews_patient')
  patient_id: string;

  @Column({ type: 'uuid' })
  @Index('idx_service_reviews_pharmacy')
  pharmacy_id: string;

  @Column({ type: 'uuid', nullable: true })
  provider_id: string;

  @Column({ type: 'integer' })
  overall_rating: number;

  @Column({ type: 'simple-json' })
  aspect_ratings: Array<{ aspect: string; rating: number }>;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ type: 'boolean', nullable: true })
  would_recommend: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  issue_resolved: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  delivered_on_time: boolean | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  package_condition: 'perfect' | 'minor_damage' | 'damaged' | null;

  @Column({ type: 'enum', enum: ServiceReviewStatus, default: ServiceReviewStatus.PENDING })
  @Index('idx_service_reviews_status')
  status: ServiceReviewStatus;

  @Column({ type: 'boolean', default: false })
  is_flagged: boolean;

  @Column({ type: 'text', nullable: true })
  flag_reason: string | null;

  @Column({ type: 'uuid', nullable: true })
  moderated_by: string | null;

  @Column({ type: 'timestamp', nullable: true })
  moderated_at: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  isVisible(): boolean {
    return this.status === ServiceReviewStatus.APPROVED && !this.is_flagged;
  }

  getAspectRating(aspect: string): number | undefined {
    const found = this.aspect_ratings.find((ar) => ar.aspect === aspect);
    return found?.rating;
  }

  setAspectRating(aspect: string, rating: number): void {
    const index = this.aspect_ratings.findIndex((ar) => ar.aspect === aspect);
    if (index >= 0) {
      this.aspect_ratings[index].rating = rating;
    } else {
      this.aspect_ratings.push({ aspect, rating });
    }
  }

  approve(moderatedBy: string): void {
    this.status = ServiceReviewStatus.APPROVED;
    this.moderated_by = moderatedBy;
    this.moderated_at = new Date();
  }

  reject(moderatedBy: string): void {
    this.status = ServiceReviewStatus.REJECTED;
    this.moderated_by = moderatedBy;
    this.moderated_at = new Date();
  }

  flag(reason: string): void {
    this.is_flagged = true;
    this.flag_reason = reason;
  }

  unflag(): void {
    this.is_flagged = false;
    this.flag_reason = null;
  }
}
