/**
 * UserSession Entity
 * Tracks active user sessions for session management and security
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

@Entity('user_sessions')
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('idx_user_sessions_user_id')
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index('idx_user_sessions_token')
  token: string;

  @Column({ type: 'timestamp' })
  @Index('idx_user_sessions_expires_at')
  expires_at: Date;

  @Column({ type: 'boolean', default: true })
  @Index('idx_user_sessions_is_active')
  is_active: boolean;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address: string | null;

  @Column({ type: 'text', nullable: true })
  user_agent: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  last_activity_at: Date;

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Check if session is expired
   */
  isExpired(): boolean {
    return new Date() > this.expires_at;
  }

  /**
   * Check if session is valid (active and not expired)
   */
  isValid(): boolean {
    return this.is_active && !this.isExpired();
  }

  /**
   * Deactivate session (logout)
   */
  deactivate(): void {
    this.is_active = false;
  }

  /**
   * Update last activity timestamp
   */
  updateActivity(): void {
    this.last_activity_at = new Date();
  }

  /**
   * Get session duration in seconds
   */
  getDuration(): number {
    const now = new Date();
    return Math.floor((now.getTime() - this.created_at.getTime()) / 1000);
  }

  /**
   * Get device/browser info from user agent
   */
  getDeviceInfo(): { browser: string; os: string } {
    if (!this.user_agent) {
      return { browser: 'Unknown', os: 'Unknown' };
    }

    // Simple parsing (could be enhanced with ua-parser-js library)
    const ua = this.user_agent.toLowerCase();

    let browser = 'Unknown';
    if (ua.includes('chrome')) browser = 'Chrome';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('safari')) browser = 'Safari';
    else if (ua.includes('edge')) browser = 'Edge';

    let os = 'Unknown';
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('mac')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

    return { browser, os };
  }
}
