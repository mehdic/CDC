/**
 * Category Entity
 * Product categories for organizing e-commerce catalog
 * Based on: /specs/002-metapharm-platform/data-model.md
 * T3-029: E-Commerce Database Schema
 */
import { Product } from './Product';
export declare class Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon_url: string | null;
    parent_id: string | null;
    parent: Category | null;
    children: Category[];
    display_order: number;
    is_active: boolean;
    products: Product[];
    created_at: Date;
    updated_at: Date;
    /**
     * Check if category is root (top-level)
     */
    isRoot(): boolean;
    /**
     * Check if category has children
     */
    hasChildren(): boolean;
    /**
     * Check if category is active
     */
    isActiveCategory(): boolean;
    /**
     * Get full path of category (e.g., "Health > Pain Relief > Headache")
     */
    getFullPath(): Promise<string>;
}
//# sourceMappingURL=Category.d.ts.map