/**
 * MedicationEffectiveness Entity
 * Patient reports on medication effectiveness
 * T6-018: Service Reviews Implementation
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum TimeToEffect {
  IMMEDIATE = 'immediate',
  HOURS = 'hours',
  DAYS = 'days',
  WEEKS = 'weeks',
  NO_EFFECT = 'no_effect',
}

@Entity('medication_effectiveness')
export class MedicationEffectiveness {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('idx_med_eff_product')
  product_id: string;

  @Column({ type: 'uuid' })
  @Index('idx_med_eff_patient')
  patient_id: string;

  @Column({ type: 'uuid', nullable: true })
  prescription_id: string;

  @Column({ type: 'varchar', length: 255 })
  condition_treated: string;

  @Column({ type: 'integer' })
  effectiveness_rating: number;

  @Column({ type: 'enum', enum: TimeToEffect })
  time_to_effect: TimeToEffect;

  @Column({ type: 'varchar', length: 100, nullable: true })
  duration_of_use: string;

  @Column({ type: 'boolean', default: false })
  side_effects_experienced: boolean;

  @Column({ type: 'boolean', default: false })
  would_use_again: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  report_date: Date;

  isRecommended(): boolean {
    return this.effectiveness_rating >= 3 && this.would_use_again;
  }

  getEffectivenessDescription(): string {
    const descriptions: Record<number, string> = {
      1: 'Not effective',
      2: 'Slightly effective',
      3: 'Moderately effective',
      4: 'Very effective',
      5: 'Extremely effective',
    };
    return descriptions[this.effectiveness_rating] || 'Unknown';
  }
}
