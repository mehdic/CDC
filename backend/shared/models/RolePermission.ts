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

  @Column({ type: 'varchar', length: 50, unique: true })
  role: string;

  @Column({ type: 'varchar', length: 100 })
  display_name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', default: [] })
  permissions: string[];

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
