/**
 * RolePermission Entity
 * Reference table for default permissions by user role
 * Read-only data for UI display
 */
export declare class RolePermission {
    id: string;
    role: string;
    display_name: string;
    description: string | null;
    permissions: string[];
    created_at: Date;
    /**
     * Check if role has a specific permission
     */
    hasPermission(permission: string): boolean;
    /**
     * Check if role has any of the specified permissions
     */
    hasAnyPermission(permissions: string[]): boolean;
    /**
     * Check if role has all of the specified permissions
     */
    hasAllPermissions(permissions: string[]): boolean;
    /**
     * Get permissions by category
     */
    getPermissionsByCategory(category: string): string[];
    /**
     * Get unique permission categories
     */
    getCategories(): string[];
}
//# sourceMappingURL=RolePermission.d.ts.map