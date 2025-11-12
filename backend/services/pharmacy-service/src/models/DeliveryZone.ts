import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

/**
 * Delivery Zone Entity
 * Stores pharmacy delivery zones with pricing and coverage
 */
@Entity('delivery_zones')
export class DeliveryZone {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'pharmacy_id', type: 'uuid' })
  pharmacyId!: string;

  @Column({ name: 'zone_name', type: 'varchar', length: 255, nullable: true })
  zoneName!: string | null;

  @Column({ name: 'postal_codes', type: 'text', array: true, nullable: true })
  postalCodes!: string[] | null;

  @Column({ name: 'delivery_fee', type: 'decimal', precision: 10, scale: 2, nullable: true })
  deliveryFee!: number | null;

  @Column({ name: 'min_order', type: 'decimal', precision: 10, scale: 2, nullable: true })
  minOrder!: number | null;

  @Column({ name: 'max_distance_km', type: 'decimal', precision: 5, scale: 2, nullable: true })
  maxDistanceKm!: number | null;

  @Column({ name: 'polygon_geojson', type: 'jsonb', nullable: true })
  polygonGeojson!: any | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
