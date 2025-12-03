/**
 * Terminal Device Entity
 * Mobile payment terminal for driver COD collection
 * SumUp terminal integration for card payments
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
  OneToMany,
  Relation,
} from 'typeorm';
import { User } from './User';
import { TerminalTransaction } from './TerminalTransaction';

export enum TerminalStatus {
  UNPAIRED = 'unpaired',
  PAIRING_PENDING = 'pairing_pending',
  PAIRED = 'paired',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OFFLINE = 'offline',
  ERROR = 'error',
}

export enum TerminalBatteryLevel {
  CRITICAL = 'critical', // 0-10%
  LOW = 'low', // 10-30%
  MEDIUM = 'medium', // 30-70%
  HIGH = 'high', // 70-100%
  CHARGING = 'charging',
}

@Entity('terminal_devices')
export class TerminalDevice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ============================================================================
  // Terminal Identification
  // ============================================================================

  @Column({ type: 'varchar', length: 50, unique: true })
  @Index('idx_terminal_serial_number')
  serial_number!: string; // SumUp serial number

  @Column({ type: 'varchar', length: 100 })
  sumup_device_id!: string; // SumUp unique device ID

  @Column({ type: 'varchar', length: 50, nullable: true })
  imei!: string | null; // Device IMEI for Bluetooth pairing

  @Column({ type: 'varchar', length: 50, nullable: true })
  model!: string | null; // e.g., 'SumUp 3G', 'SumUp Air'

  // ============================================================================
  // Driver Assignment
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_terminal_driver')
  driver_id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'driver_id' })
  driver!: Relation<User>;

  // ============================================================================
  // Terminal Status
  // ============================================================================

  @Column({
    type: 'enum',
    enum: TerminalStatus,
    default: TerminalStatus.UNPAIRED,
  })
  @Index('idx_terminal_status')
  status!: TerminalStatus;

  @Column({
    type: 'enum',
    enum: TerminalBatteryLevel,
    default: TerminalBatteryLevel.MEDIUM,
  })
  battery_level!: TerminalBatteryLevel;

  @Column({ type: 'integer', default: 50 })
  battery_percentage!: number; // 0-100

  @Column({ type: 'boolean', default: false })
  is_charging!: boolean;

  @Column({ type: 'boolean', default: true })
  is_connected!: boolean; // Bluetooth or network connectivity

  @Column({ type: 'timestamp', nullable: true })
  last_heartbeat!: Date | null; // Last device ping

  // ============================================================================
  // Pairing Information
  // ============================================================================

  @Column({ type: 'uuid', nullable: true })
  pairing_requested_by!: string | null; // User who initiated pairing

  @Column({ type: 'timestamp', nullable: true })
  pairing_requested_at!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  paired_at!: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  pairing_code!: string | null; // 6-digit code for Bluetooth pairing

  @Column({ type: 'timestamp', nullable: true })
  pairing_code_expires_at!: Date | null;

  // ============================================================================
  // Connection Details
  // ============================================================================

  @Column({ type: 'varchar', length: 50, nullable: true })
  mac_address!: string | null; // Bluetooth MAC address

  @Column({ type: 'varchar', length: 30, nullable: true })
  network_type!: string | null; // '4G', '5G', 'WiFi'

  @Column({ type: 'integer', default: 0 })
  signal_strength!: number; // -100 to 0 dBm

  // ============================================================================
  // Configuration
  // ============================================================================

  @Column({ type: 'jsonb', nullable: true })
  config!: {
    receipt_language?: string;
    auto_print?: boolean;
    signature_required?: boolean;
    offline_mode_enabled?: boolean;
  } | null;

  // ============================================================================
  // Transactions
  // ============================================================================

  @OneToMany(() => TerminalTransaction, (trans) => trans.terminal)
  transactions!: Relation<TerminalTransaction[]>;

  @Column({ type: 'integer', default: 0 })
  total_transactions!: number;

  @Column({ type: 'timestamp', nullable: true })
  last_transaction_at!: Date | null;

  // ============================================================================
  // Metadata
  // ============================================================================

  @Column({ type: 'varchar', length: 100, nullable: true })
  firmware_version!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  firmware_last_updated!: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any> | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  @Index('idx_terminal_created')
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  // ============================================================================
  // Business Logic Methods
  // ============================================================================

  /**
   * Mark as paired and active
   */
  markAsPaired(macAddress: string, firmwareVersion?: string): void {
    this.status = TerminalStatus.PAIRED;
    this.paired_at = new Date();
    this.mac_address = macAddress;
    if (firmwareVersion) {
      this.firmware_version = firmwareVersion;
      this.firmware_last_updated = new Date();
    }
  }

  /**
   * Activate terminal for payment collection
   */
  activate(): void {
    this.status = TerminalStatus.ACTIVE;
    this.is_connected = true;
    this.last_heartbeat = new Date();
  }

  /**
   * Deactivate terminal
   */
  deactivate(): void {
    this.status = TerminalStatus.INACTIVE;
  }

  /**
   * Update battery status
   */
  updateBattery(percentage: number, isCharging: boolean): void {
    this.battery_percentage = percentage;
    this.is_charging = isCharging;

    if (isCharging) {
      this.battery_level = TerminalBatteryLevel.CHARGING;
    } else if (percentage <= 10) {
      this.battery_level = TerminalBatteryLevel.CRITICAL;
    } else if (percentage <= 30) {
      this.battery_level = TerminalBatteryLevel.LOW;
    } else if (percentage <= 70) {
      this.battery_level = TerminalBatteryLevel.MEDIUM;
    } else {
      this.battery_level = TerminalBatteryLevel.HIGH;
    }
  }

  /**
   * Update connectivity status
   */
  updateConnectivity(isConnected: boolean, networkType?: string, signalStrength?: number): void {
    this.is_connected = isConnected;
    this.last_heartbeat = new Date();

    if (networkType) {
      this.network_type = networkType;
    }

    if (signalStrength !== undefined) {
      this.signal_strength = signalStrength;
    }

    if (isConnected && this.status !== TerminalStatus.PAIRED && this.status !== TerminalStatus.ACTIVE) {
      this.status = TerminalStatus.PAIRED;
    } else if (!isConnected) {
      this.status = TerminalStatus.OFFLINE;
    }
  }

  /**
   * Generate pairing code (6 digits)
   */
  generatePairingCode(): string {
    const code = Math.random().toString().substring(2, 8).padStart(6, '0');
    this.pairing_code = code;
    this.pairing_code_expires_at = new Date(Date.now() + 15 * 60 * 1000); // 15 min expiry
    return code;
  }

  /**
   * Check if pairing code is valid
   */
  isPairingCodeValid(): boolean {
    if (!this.pairing_code || !this.pairing_code_expires_at) {
      return false;
    }
    return this.pairing_code_expires_at.getTime() > Date.now();
  }

  /**
   * Check if terminal is ready for payment
   */
  isReadyForPayment(): boolean {
    return (
      (this.status === TerminalStatus.ACTIVE || this.status === TerminalStatus.PAIRED) &&
      this.is_connected &&
      this.battery_level !== TerminalBatteryLevel.CRITICAL
    );
  }

  /**
   * Check if battery is low
   */
  isBatteryLow(): boolean {
    return this.battery_level === TerminalBatteryLevel.LOW || this.battery_level === TerminalBatteryLevel.CRITICAL;
  }

  /**
   * Get status display name
   */
  getStatusDisplay(): string {
    const displays: Record<TerminalStatus, string> = {
      [TerminalStatus.UNPAIRED]: 'Not Paired',
      [TerminalStatus.PAIRING_PENDING]: 'Pairing...',
      [TerminalStatus.PAIRED]: 'Paired',
      [TerminalStatus.ACTIVE]: 'Ready',
      [TerminalStatus.INACTIVE]: 'Inactive',
      [TerminalStatus.OFFLINE]: 'Offline',
      [TerminalStatus.ERROR]: 'Error',
    };
    return displays[this.status];
  }
}
