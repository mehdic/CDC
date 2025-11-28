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
    isRoot(): boolean;
    hasChildren(): boolean;
    isActiveCategory(): boolean;
    getFullPath(): Promise<string>;
}
//# sourceMappingURL=Category.d.ts.map