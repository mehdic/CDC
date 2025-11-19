/**
 * Prescription Database Model
 * TypeORM entity for prescription storage
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Medication } from './Medication';

export type PrescriptionStatus = 'pending' | 'dispensed' | 'cancelled';

@Entity('prescriptions')
export class Prescription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  patientId!: string;

  @Column({ type: 'varchar', length: 255 })
  doctorId!: string;

  @Column({ type: 'varchar', length: 255 })
  pharmacyId!: string;

  @OneToMany(() => Medication, (medication) => medication.prescription, {
    cascade: true,
    eager: true,
  })
  medications!: Medication[];

  @Column({
    type: 'enum',
    enum: ['pending', 'dispensed', 'cancelled'],
    default: 'pending',
  })
  status!: PrescriptionStatus;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  dispensedAt?: Date;
}
