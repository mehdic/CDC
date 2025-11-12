import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

/**
 * Operating Hours Entity
 * Stores pharmacy operating hours by day of week
 */
@Entity('operating_hours')
export class OperatingHours {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'pharmacy_id', type: 'uuid' })
  pharmacyId!: string;

  @Column({ name: 'day_of_week', type: 'int' })
  dayOfWeek!: number; // 0=Sunday, 1=Monday, ..., 6=Saturday

  @Column({ name: 'open_time', type: 'time', nullable: true })
  openTime!: string | null;

  @Column({ name: 'close_time', type: 'time', nullable: true })
  closeTime!: string | null;

  @Column({ name: 'is_closed', type: 'boolean', default: false })
  isClosed!: boolean;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
