import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

/**
 * Pharmacy Profile Entity
 * Stores public-facing pharmacy information for patient discovery
 */
@Entity('pharmacy_profiles')
export class PharmacyProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'pharmacy_id', type: 'uuid' })
  pharmacyId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  address!: {
    street?: string;
    city?: string;
    postalCode?: string;
    canton?: string;
    country?: string;
  } | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  fax!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  whatsapp!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  services!: {
    teleconsultation?: boolean;
    delivery?: boolean;
    prescription_upload?: boolean;
    emergency?: boolean;
    [key: string]: any;
  } | null;

  @Column({ type: 'boolean', default: false })
  published!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
