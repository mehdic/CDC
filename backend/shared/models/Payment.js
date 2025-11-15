"use strict";
/**
 * Payment Entity
 * PCI-DSS compliant payment processing with tokenization
 * HIPAA/GDPR compliant with audit logging
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payment = exports.Currency = exports.PaymentMethod = exports.PaymentStatus = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PROCESSING"] = "processing";
    PaymentStatus["COMPLETED"] = "completed";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
    PaymentStatus["PARTIALLY_REFUNDED"] = "partially_refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CARD"] = "card";
    PaymentMethod["BANK_TRANSFER"] = "bank_transfer";
    PaymentMethod["INSURANCE"] = "insurance";
    PaymentMethod["CASH"] = "cash";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var Currency;
(function (Currency) {
    Currency["CHF"] = "CHF";
    Currency["EUR"] = "EUR";
    Currency["USD"] = "USD";
})(Currency || (exports.Currency = Currency = {}));
let Payment = class Payment {
    // ============================================================================
    // Helper Methods
    // ============================================================================
    /**
     * Mark payment as processing
     */
    markAsProcessing() {
        this.status = PaymentStatus.PROCESSING;
    }
    /**
     * Mark payment as completed
     */
    markAsCompleted() {
        this.status = PaymentStatus.COMPLETED;
        this.processed_at = new Date();
    }
    /**
     * Mark payment as failed
     */
    markAsFailed(errorMessage) {
        this.status = PaymentStatus.FAILED;
        this.error_message = errorMessage;
    }
    /**
     * Process refund (full or partial)
     */
    processRefund(amount, reason) {
        if (amount > this.amount - this.refunded_amount) {
            throw new Error('Refund amount exceeds remaining payment amount');
        }
        this.refunded_amount += amount;
        this.refund_reason = reason;
        this.refunded_at = new Date();
        if (this.refunded_amount >= this.amount) {
            this.status = PaymentStatus.REFUNDED;
        }
        else {
            this.status = PaymentStatus.PARTIALLY_REFUNDED;
        }
    }
    /**
     * Check if payment is completed
     */
    isCompleted() {
        return this.status === PaymentStatus.COMPLETED;
    }
    /**
     * Check if payment is pending
     */
    isPending() {
        return this.status === PaymentStatus.PENDING;
    }
    /**
     * Check if payment failed
     */
    isFailed() {
        return this.status === PaymentStatus.FAILED;
    }
    /**
     * Check if payment is refunded (fully or partially)
     */
    isRefunded() {
        return this.status === PaymentStatus.REFUNDED || this.status === PaymentStatus.PARTIALLY_REFUNDED;
    }
    /**
     * Get remaining refundable amount
     */
    getRemainingRefundableAmount() {
        return this.amount - this.refunded_amount;
    }
    /**
     * PCI-DSS: Get masked card number for display
     */
    getMaskedCardNumber() {
        if (!this.card_last_four) {
            return null;
        }
        return `**** **** **** ${this.card_last_four}`;
    }
};
exports.Payment = Payment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Payment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)('idx_payments_user'),
    __metadata("design:type", String)
], Payment.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", User_1.User)
], Payment.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    (0, typeorm_1.Index)('idx_payments_order'),
    __metadata("design:type", Object)
], Payment.prototype, "order_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Payment.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: Currency,
        default: Currency.CHF,
    }),
    __metadata("design:type", String)
], Payment.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PENDING,
    }),
    (0, typeorm_1.Index)('idx_payments_status'),
    __metadata("design:type", String)
], Payment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: PaymentMethod,
    }),
    (0, typeorm_1.Index)('idx_payments_method'),
    __metadata("design:type", String)
], Payment.prototype, "payment_method", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], Payment.prototype, "payment_token", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 4, nullable: true }),
    __metadata("design:type", Object)
], Payment.prototype, "card_last_four", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], Payment.prototype, "card_brand", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], Payment.prototype, "gateway_transaction_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], Payment.prototype, "insurance_provider", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], Payment.prototype, "insurance_policy_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], Payment.prototype, "insurance_coverage_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], Payment.prototype, "patient_copay_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Payment.prototype, "refunded_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], Payment.prototype, "refund_reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Payment.prototype, "refunded_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Payment.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Payment.prototype, "processed_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], Payment.prototype, "error_message", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    (0, typeorm_1.Index)('idx_payments_created'),
    __metadata("design:type", Date)
], Payment.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Payment.prototype, "updated_at", void 0);
exports.Payment = Payment = __decorate([
    (0, typeorm_1.Entity)('payments')
], Payment);
//# sourceMappingURL=Payment.js.map