/**
 * Medication Database Model
 * TypeORM entity for medication storage (part of prescription)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Prescription } from './Prescription';

@Entity('medications')
export class Medication {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 100 })
  dosage!: string;

  @Column({ type: 'integer' })
  quantity!: number;

  @Column({ type: 'text' })
  instructions!: string;

  @ManyToOne(() => Prescription, (prescription) => prescription.medications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'prescriptionId' })
  prescription!: Prescription;

  @Column({ type: 'varchar', length: 255 })
  prescriptionId!: string;
}
