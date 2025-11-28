import { Category } from './Category';
export declare class Product {
    id: string;
    name: string;
    description: string | null;
    sku: string;
    manufacturer: string | null;
    category_id: string;
    category: Category;
    price: number;
    original_price: number | null;
    stock: number;
    low_stock_threshold: number;
    requires_prescription: boolean;
    image_url: string | null;
    expiry_date: Date | null;
    rating: number;
    review_count: number;
    is_active: boolean;
    is_featured: boolean;
    created_at: Date;
    updated_at: Date;
    isInStock(): boolean;
    isLowStock(): boolean;
    isOutOfStock(): boolean;
    isOnSale(): boolean;
    getDiscountPercentage(): number;
    isAvailable(): boolean;
    decreaseStock(quantity: number): void;
    increaseStock(quantity: number): void;
    addReview(newRating: number): void;
}
//# sourceMappingURL=Product.d.ts.map