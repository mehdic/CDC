/**
 * SideEffectReport Entity
 * Patient reports of adverse reactions to medications
 * T6-018: Service Reviews Implementation
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum SeverityLevel {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
}

export enum OnsetTiming {
  IMMEDIATE = 'immediate',
  WITHIN_HOURS = 'within_hours',
  WITHIN_DAYS = 'within_days',
  WITHIN_WEEKS = 'within_weeks',
}

export enum ActionTaken {
  NONE = 'none',
  REDUCED_DOSE = 'reduced_dose',
  STOPPED_MEDICATION = 'stopped_medication',
  SOUGHT_MEDICAL_HELP = 'sought_medical_help',
}

export enum OutcomeStatus {
  RESOLVED = 'resolved',
  ONGOING = 'ongoing',
  UNKNOWN = 'unknown',
}

@Entity('side_effect_reports')
export class SideEffectReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('idx_side_effect_product')
  product_id: string;

  @Column({ type: 'uuid' })
  @Index('idx_side_effect_patient')
  patient_id: string;

  @Column({ type: 'varchar', length: 255 })
  side_effect: string;

  @Column({ type: 'enum', enum: SeverityLevel })
  severity: SeverityLevel;

  @Column({ type: 'enum', enum: OnsetTiming })
  onset: OnsetTiming;

  @Column({ type: 'varchar', length: 100, nullable: true })
  duration: string;

  @Column({ type: 'enum', enum: ActionTaken })
  action_taken: ActionTaken;

  @Column({ type: 'enum', enum: OutcomeStatus })
  outcome: OutcomeStatus;

  @Column({ type: 'boolean', default: false })
  reported_to_doctor: boolean;

  @Column({ type: 'text', nullable: true })
  additional_notes: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  report_date: Date;

  requiresMedicalAttention(): boolean {
    return this.severity === SeverityLevel.SEVERE || this.action_taken === ActionTaken.SOUGHT_MEDICAL_HELP;
  }

  getSeverityBadge(): string {
    const badges: Record<SeverityLevel, string> = {
      [SeverityLevel.MILD]: '🟡',
      [SeverityLevel.MODERATE]: '🟠',
      [SeverityLevel.SEVERE]: '🔴',
    };
    return badges[this.severity];
  }

  isResolved(): boolean {
    return this.outcome === OutcomeStatus.RESOLVED;
  }
}
