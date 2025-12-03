/**
 * Temperature Sensor Entity
 * Represents IoT temperature sensors on delivery vehicles
 * Swissmedic-compliant sensor calibration and maintenance tracking
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
import { User } from './User';

export enum SensorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  CALIBRATION_DUE = 'calibration_due',
  FAILED = 'failed',
}

export interface SensorCalibrationRecord {
  date: Date;
  calibratedBy: string;
  calibrationMethod: string;
  referenceTemperatures: number[];
  deviations: number[];
  certificateUrl?: string;
  expiresAt: Date;
}

@Entity('temperature_sensors')
@Index('idx_sensor_driver', ['driver_id'])
@Index('idx_sensor_vehicle', ['vehicle_id'])
@Index('idx_sensor_status', ['status'])
@Index('idx_sensor_serial', ['serial_number'])
export class TemperatureSensor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  serial_number: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  model: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  manufacturer: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  driver_id: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver: User | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  vehicle_id: string | null;

  @Column({ type: 'varchar', length: 50, default: SensorStatus.ACTIVE })
  status: SensorStatus;

  @Column({ type: 'timestamp', nullable: true })
  deployed_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  withdrawn_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  last_calibration_date: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  calibration_due_date: Date | null;

  @Column({ type: 'simple-json', nullable: true })
  calibration_records: SensorCalibrationRecord[] | null;

  @Column({ type: 'text', nullable: true })
  calibration_certificate_url: string | null;

  @Column({ type: 'text', nullable: true })
  calibration_deviation_details: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  battery_level: number | null;

  @Column({ type: 'timestamp', nullable: true })
  battery_check_at: Date | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  connectivity_status: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  last_reading_temperature: number | null;

  @Column({ type: 'timestamp', nullable: true })
  last_reading_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  last_sync_at: Date | null;

  @Column({ type: 'integer', default: 0 })
  failed_readings_count: number;

  @Column({ type: 'integer', default: 0 })
  total_readings: number;

  @Column({ type: 'integer', default: 0 })
  error_count: number;

  @Column({ type: 'timestamp', nullable: true })
  last_error_at: Date | null;

  @Column({ type: 'text', nullable: true })
  last_error_message: string | null;

  @Column({ type: 'timestamp', nullable: true })
  last_maintenance_date: Date | null;

  @Column({ type: 'text', nullable: true })
  last_maintenance_notes: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  isCalibrationCurrent(): boolean {
    if (!this.calibration_due_date) return false;
    return this.calibration_due_date > new Date();
  }

  isOperational(): boolean {
    return this.status === SensorStatus.ACTIVE || this.status === SensorStatus.CALIBRATION_DUE;
  }

  isBatteryLow(): boolean {
    if (this.battery_level === null || this.battery_level === undefined) return false;
    return this.battery_level < 15;
  }

  isRecentlySynced(): boolean {
    if (!this.last_sync_at) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.last_sync_at > fiveMinutesAgo;
  }

  needsAttention(): boolean {
    return this.status === SensorStatus.CALIBRATION_DUE ||
           this.status === SensorStatus.MAINTENANCE ||
           this.status === SensorStatus.FAILED ||
           (this.isBatteryLow() && this.isOperational()) ||
           !this.isRecentlySynced();
  }

  getHealthStatus(): 'healthy' | 'warning' | 'critical' {
    if (this.status === SensorStatus.FAILED) return 'critical';
    if (!this.isCalibrationCurrent() || this.isBatteryLow() ||
        this.status === SensorStatus.MAINTENANCE) return 'warning';
    return 'healthy';
  }

  daysUntilCalibrationDue(): number | null {
    if (!this.calibration_due_date) return null;
    const daysMs = this.calibration_due_date.getTime() - new Date().getTime();
    return Math.ceil(daysMs / (1000 * 60 * 60 * 24));
  }

  static create(params: {
    serialNumber: string;
    model?: string;
    manufacturer?: string;
    driverId?: string | null;
    vehicleId?: string | null;
    calibrationDueDate?: Date;
  }): TemperatureSensor {
    const sensor = new TemperatureSensor();
    sensor.serial_number = params.serialNumber;
    sensor.model = params.model || null;
    sensor.manufacturer = params.manufacturer || null;
    sensor.driver_id = params.driverId || null;
    sensor.vehicle_id = params.vehicleId || null;
    sensor.status = SensorStatus.ACTIVE;
    sensor.deployed_at = new Date();
    sensor.calibration_due_date = params.calibrationDueDate || null;
    sensor.battery_level = 100;
    sensor.last_reading_temperature = null;
    sensor.last_reading_at = null;
    sensor.total_readings = 0;
    sensor.error_count = 0;
    sensor.failed_readings_count = 0;
    return sensor;
  }
}
