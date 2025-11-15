import { User } from './User';
import { Pharmacy } from './Pharmacy';
export declare enum OrderStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    PROCESSING = "processing",
    READY_FOR_PICKUP = "ready_for_pickup",
    OUT_FOR_DELIVERY = "out_for_delivery",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    REFUNDED = "refunded"
}
export declare enum PaymentStatus {
    PENDING = "pending",
    PAID = "paid",
    FAILED = "failed",
    REFUNDED = "refunded"
}
export declare class Order {
    id: string;
    pharmacy_id: string;
    pharmacy: Pharmacy;
    user_id: string;
    user: User;
    status: OrderStatus;
    items: Array<{
        product_id: string;
        product_name: string;
        quantity: number;
        unit_price: number;
        total_price: number;
    }>;
    subtotal: number;
    tax_amount: number;
    shipping_cost: number;
    discount_amount: number;
    total_amount: number;
    payment_status: PaymentStatus;
    payment_method: string | null;
    payment_transaction_id: string | null;
    paid_at: Date | null;
    shipping_address_encrypted: Buffer | null;
    shipping_notes_encrypted: Buffer | null;
    delivery_method: string | null;
    delivery_id: string | null;
    notes: string | null;
    cancellation_reason: string | null;
    created_at: Date;
    updated_at: Date;
    confirmed_at: Date | null;
    completed_at: Date | null;
    cancelled_at: Date | null;
    isPending(): boolean;
    isConfirmed(): boolean;
    isProcessing(): boolean;
    isCompleted(): boolean;
    isCancelled(): boolean;
    isPaid(): boolean;
    canBeCancelled(): boolean;
    getTotalItemsCount(): number;
    confirm(): void;
    process(): void;
    complete(): void;
    cancel(reason?: string): void;
    markAsPaid(transactionId: string): void;
}
//# sourceMappingURL=Order.d.ts.map