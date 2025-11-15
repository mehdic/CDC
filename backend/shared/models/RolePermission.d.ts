export declare class RolePermission {
    id: string;
    role: string;
    display_name: string;
    description: string | null;
    permissions: string[];
    created_at: Date;
    hasPermission(permission: string): boolean;
    hasAnyPermission(permissions: string[]): boolean;
    hasAllPermissions(permissions: string[]): boolean;
    getPermissionsByCategory(category: string): string[];
    getCategories(): string[];
}
//# sourceMappingURL=RolePermission.d.ts.map