import { Cart } from './Cart';
export declare class CartItem {
    id: string;
    cart: Cart;
    cartId: string;
    productId: string;
    name: string;
    description: string;
    category: string;
    price: number;
    quantity: number;
    subtotal: number;
    requiresPrescription: boolean;
    imageUrl: string;
    availableStock: number;
    options: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=CartItem.d.ts.map