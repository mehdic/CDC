/**
 * COD Transaction Entity
 * Cash on Delivery payment transactions
 * Tracks payment collection and driver settlement
 */
import { User } from './User';
export declare enum CODStatus {
    PENDING = "pending",
    COLLECTED = "collected",
    SETTLED = "settled",
    CANCELLED = "cancelled"
}
export declare enum CODPaymentMethod {
    CASH = "cash",
    CARD = "card"
}
export declare class CODTransaction {
    id: string;
    order_id: string;
    delivery_id: string;
    driver_id: string;
    driver: User;
    amount: number;
    collected_amount: number | null;
    status: CODStatus;
    payment_method: CODPaymentMethod | null;
    collected_at: Date | null;
    change_given: number;
    collection_notes: string | null;
    settlement_id: string | null;
    settled_at: Date | null;
    settled_by: string | null;
    cancellation_reason: string | null;
    metadata: Record<string, any> | null;
    created_at: Date;
    updated_at: Date;
    /**
     * Mark as collected
     */
    markAsCollected(collectedAmount: number, paymentMethod: CODPaymentMethod, changeGiven?: number, notes?: string): void;
    /**
     * Mark as settled
     */
    markAsSettled(settlementId: string, settledBy: string): void;
    /**
     * Cancel transaction
     */
    cancel(reason: string): void;
    /**
     * Check if collected
     */
    isCollected(): boolean;
    /**
     * Check if settled
     */
    isSettled(): boolean;
    /**
     * Check if pending
     */
    isPending(): boolean;
    /**
     * Get variance (difference between expected and collected)
     */
    getVariance(): number;
    /**
     * Validate COD amount limits (business rule: max CHF 500)
     */
    validateAmount(): {
        valid: boolean;
        error?: string;
    };
}
//# sourceMappingURL=CODTransaction.d.ts.map