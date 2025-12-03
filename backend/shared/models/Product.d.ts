/**
 * Product Entity
 * E-commerce product catalog for OTC medications, parapharmacy items
 * Based on: /specs/002-metapharm-platform/data-model.md
 * T3-029: E-Commerce Database Schema
 */
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
    /**
     * Check if product is in stock
     */
    isInStock(): boolean;
    /**
     * Check if product is low on stock
     */
    isLowStock(): boolean;
    /**
     * Check if product is out of stock
     */
    isOutOfStock(): boolean;
    /**
     * Check if product is on sale
     */
    isOnSale(): boolean;
    /**
     * Get discount percentage if on sale
     */
    getDiscountPercentage(): number;
    /**
     * Check if product is available for purchase
     */
    isAvailable(): boolean;
    /**
     * Decrease stock by quantity
     */
    decreaseStock(quantity: number): void;
    /**
     * Increase stock by quantity
     */
    increaseStock(quantity: number): void;
    /**
     * Update rating with new review
     */
    addReview(newRating: number): void;
}
//# sourceMappingURL=Product.d.ts.map