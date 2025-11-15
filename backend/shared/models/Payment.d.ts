/**
 * Payment Entity
 * PCI-DSS compliant payment processing with tokenization
 * HIPAA/GDPR compliant with audit logging
 */
import { User } from './User';
export declare enum PaymentStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    COMPLETED = "completed",
    FAILED = "failed",
    REFUNDED = "refunded",
    PARTIALLY_REFUNDED = "partially_refunded"
}
export declare enum PaymentMethod {
    CARD = "card",
    BANK_TRANSFER = "bank_transfer",
    INSURANCE = "insurance",
    CASH = "cash"
}
export declare enum Currency {
    CHF = "CHF",// Swiss Franc
    EUR = "EUR",
    USD = "USD"
}
export declare class Payment {
    id: string;
    user_id: string;
    user: User;
    order_id: string | null;
    amount: number;
    currency: Currency;
    status: PaymentStatus;
    payment_method: PaymentMethod;
    /**
     * PCI-DSS: Payment token from payment gateway (Stripe, Adyen, etc.)
     * This is NOT the raw card number
     */
    payment_token: string | null;
    /**
     * PCI-DSS: Last 4 digits of card (safe to store per PCI-DSS SAQ A)
     * For display purposes only
     */
    card_last_four: string | null;
    /**
     * Card brand (Visa, Mastercard, etc.)
     */
    card_brand: string | null;
    /**
     * Gateway transaction ID (from Stripe, Adyen, etc.)
     */
    gateway_transaction_id: string | null;
    insurance_provider: string | null;
    insurance_policy_number: string | null;
    insurance_coverage_amount: number | null;
    patient_copay_amount: number | null;
    refunded_amount: number;
    refund_reason: string | null;
    refunded_at: Date | null;
    metadata: Record<string, any> | null;
    processed_at: Date | null;
    error_message: string | null;
    created_at: Date;
    updated_at: Date;
    /**
     * Mark payment as processing
     */
    markAsProcessing(): void;
    /**
     * Mark payment as completed
     */
    markAsCompleted(): void;
    /**
     * Mark payment as failed
     */
    markAsFailed(errorMessage: string): void;
    /**
     * Process refund (full or partial)
     */
    processRefund(amount: number, reason: string): void;
    /**
     * Check if payment is completed
     */
    isCompleted(): boolean;
    /**
     * Check if payment is pending
     */
    isPending(): boolean;
    /**
     * Check if payment failed
     */
    isFailed(): boolean;
    /**
     * Check if payment is refunded (fully or partially)
     */
    isRefunded(): boolean;
    /**
     * Get remaining refundable amount
     */
    getRemainingRefundableAmount(): number;
    /**
     * PCI-DSS: Get masked card number for display
     */
    getMaskedCardNumber(): string | null;
}
//# sourceMappingURL=Payment.d.ts.map