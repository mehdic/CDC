/**
 * Cart Model
 * Represents a shopping cart for e-commerce orders
 * Batch 3 - E-commerce feature
 */
import { User } from './User';
import { CartItem } from './CartItem';
export declare class Cart {
    id: string;
    user: User;
    userId: string;
    items: CartItem[];
    subtotal: number;
    tax: number;
    discount: number;
    discountCode: string;
    total: number;
    itemCount: number;
    totalQuantity: number;
    status: 'active' | 'abandoned' | 'completed';
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    abandonedAt: Date;
}
//# sourceMappingURL=Cart.d.ts.map