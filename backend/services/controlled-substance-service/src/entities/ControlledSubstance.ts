import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DrugSchedule } from '../types/controlled.types';

/**
 * Controlled Substance Entity
 * Represents narcotic and psychotropic drugs under Swiss Swissmedic regulations
 * Includes drugs from Liste A through E with specific handling requirements
 */
@Entity('controlled_substances')
export class ControlledSubstance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  scientificName!: string;

  @Column({
    type: 'enum',
    enum: DrugSchedule,
  })
  schedule!: DrugSchedule;

  @Column({ type: 'int', default: 30 })
  maxSupplyDays!: number; // Maximum days supply per prescription

  @Column({ type: 'boolean', default: false })
  requiresSpecialForm!: boolean; // Special prescription form required (Liste A/B)

  @Column({ type: 'boolean', default: false })
  crossPharmacyCheck!: boolean; // Must check across all pharmacies

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  swissmedic?: {
    number?: string; // Swissmedic registration number
    atc?: string;    // ATC classification (e.g., N02AA01)
  };

  @Column({ type: 'int', nullable: true })
  maxDailyDosageMg?: number; // Maximum recommended daily dosage in mg

  @Column({ type: 'int', nullable: true })
  warningDailyDosageMg?: number; // Dosage that triggers warning

  @Column({ type: 'boolean', default: true })
  active!: boolean; // Whether substance is actively monitored

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
