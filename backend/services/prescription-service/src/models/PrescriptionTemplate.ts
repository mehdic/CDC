/**
 * Prescription Template Database Model
 * TypeORM entity for storing doctor's frequently used prescription templates
 * Task: T3-102 - Implement prescription templates
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export interface Templatemedication {
  drugName: string;
  dosage: string;
  quantity: number;
  instructions: string;
}

@Entity('prescription_templates')
@Index(['doctorId', 'createdAt'])
@Index(['doctorId', 'name'])
export class PrescriptionTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  doctorId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb' })
  medications!: Templatemedication[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
