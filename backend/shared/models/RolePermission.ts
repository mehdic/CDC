/**
 * RolePermission Entity
 * Reference table for default permissions by user role
 * Read-only data for UI display
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('role_permissions')
export class RolePermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // Role Definition
  // ============================================================================

  @Column({ type: 'varchar', length: 50, unique: true })
  role: string; // 'pharmacist', 'doctor', 'nurse', 'delivery', 'patient'

  @Column({ type: 'varchar', length: 100 })
  display_name: string; // 'Pharmacist', 'Doctor', etc.

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // ============================================================================
  // Permissions (JSONB array)
  // ============================================================================

  @Column({ type: 'jsonb', default: [] })
  permissions: string[]; // Array of permission strings (e.g., ['prescriptions.view', 'inventory.manage'])

  // ============================================================================
  // Timestamp
  // ============================================================================

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Check if role has a specific permission
   */
  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  /**
   * Check if role has any of the specified permissions
   */
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(p => this.permissions.includes(p));
  }

  /**
   * Check if role has all of the specified permissions
   */
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(p => this.permissions.includes(p));
  }

  /**
   * Get permissions by category
   */
  getPermissionsByCategory(category: string): string[] {
    return this.permissions.filter(p => p.startsWith(`${category}.`));
  }

  /**
   * Get unique permission categories
   */
  getCategories(): string[] {
    const categories = new Set<string>();
    this.permissions.forEach(p => {
      const [category] = p.split('.');
      if (category) categories.add(category);
    });
    return Array.from(categories);
  }
}
