import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

/**
 * Pharmacy Photo Entity
 * Stores photos for pharmacy galleries
 */
@Entity('pharmacy_photos')
export class PharmacyPhoto {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'pharmacy_id', type: 'uuid' })
  pharmacyId!: string;

  @Column({ type: 'varchar', length: 500 })
  url!: string;

  @Column({ type: 'text', nullable: true })
  caption!: string | null;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary!: boolean;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
