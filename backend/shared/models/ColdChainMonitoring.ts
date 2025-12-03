/**
 * Cold Chain Monitoring Entity
 * Tracks temperature-sensitive medication deliveries
 * Swissmedic compliance for pharmaceutical cold chain requirements
 * Based on: COLD-CHAIN (T6-022)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Delivery } from './Delivery';
import { Product } from './Product';

export enum ColdChainStatus {
  NORMAL = 'normal',
  WARNING = 'warning',
  CRITICAL = 'critical',
  BREACH = 'breach',
}

export interface TemperatureReading {
  timestamp: Date;
  temperature: number; // Celsius
  humidity?: number; // Percentage
  sensorId: string;
}

@Entity('cold_chain_monitoring')
@Index('idx_cold_chain_delivery', ['delivery_id'])
@Index('idx_cold_chain_product', ['product_id'])
@Index('idx_cold_chain_status', ['status'])
@Index('idx_cold_chain_sensor', ['sensor_id'])
export class ColdChainMonitoring {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  delivery_id: string;

  @ManyToOne(() => Delivery, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'delivery_id' })
  delivery: Delivery;

  @Column({ type: 'varchar', length: 36 })
  product_id: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'varchar', length: 36 })
  sensor_id: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  min_temperature: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  max_temperature: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  current_temperature: number | null;

  @Column({ type: 'timestamp', nullable: true })
  last_reading_at: Date | null;

  @Column({ type: 'simple-json', nullable: true })
  readings: TemperatureReading[] | null;

  @Column({ type: 'varchar', length: 50, default: ColdChainStatus.NORMAL })
  status: ColdChainStatus;

  @Column({ type: 'integer', default: 0 })
  breach_count: number;

  @Column({ type: 'timestamp', nullable: true })
  last_breach_at: Date | null;

  @Column({ type: 'text', nullable: true })
  last_breach_details: string | null;

  @Column({ type: 'text', nullable: true })
  compliance_notes: string | null;

  @Column({ type: 'boolean', default: false })
  integrity_compromised: boolean;

  @Column({ type: 'timestamp', nullable: true })
  integrity_check_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date | null;

  isTemperatureWithinRange(): boolean {
    if (this.current_temperature === null) return true;
    return this.current_temperature >= this.min_temperature &&
           this.current_temperature <= this.max_temperature;
  }

  hasActiveBreach(): boolean {
    return this.status === ColdChainStatus.BREACH;
  }

  getOverTemperatureMargin(): number {
    if (this.current_temperature === null) return 0;
    return Math.max(0, this.current_temperature - this.max_temperature);
  }

  getUnderTemperatureMargin(): number {
    if (this.current_temperature === null) return 0;
    return Math.max(0, this.min_temperature - this.current_temperature);
  }

  getTemperatureStatus(): ColdChainStatus {
    if (!this.isTemperatureWithinRange()) return ColdChainStatus.BREACH;
    if (this.current_temperature === null) return ColdChainStatus.NORMAL;

    const warningMargin = 1;
    const isNearMin = this.current_temperature < this.min_temperature + warningMargin;
    const isNearMax = this.current_temperature > this.max_temperature - warningMargin;

    if (isNearMin || isNearMax) return ColdChainStatus.WARNING;
    return ColdChainStatus.NORMAL;
  }

  isActive(): boolean {
    return this.completed_at === null;
  }

  static create(params: {
    deliveryId: string;
    productId: string;
    sensorId: string;
    minTemperature: number;
    maxTemperature: number;
  }): ColdChainMonitoring {
    const monitoring = new ColdChainMonitoring();
    monitoring.delivery_id = params.deliveryId;
    monitoring.product_id = params.productId;
    monitoring.sensor_id = params.sensorId;
    monitoring.min_temperature = params.minTemperature;
    monitoring.max_temperature = params.maxTemperature;
    monitoring.current_temperature = null;
    monitoring.last_reading_at = null;
    monitoring.readings = [];
    monitoring.status = ColdChainStatus.NORMAL;
    monitoring.breach_count = 0;
    monitoring.last_breach_at = null;
    monitoring.last_breach_details = null;
    monitoring.integrity_compromised = false;
    monitoring.completed_at = null;
    return monitoring;
  }
}
