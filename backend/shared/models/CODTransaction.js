"use strict";
/**
 * COD Transaction Entity
 * Cash on Delivery payment transactions
 * Tracks payment collection and driver settlement
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
exports.CODTransaction = exports.CODPaymentMethod = exports.CODStatus = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
var CODStatus;
(function (CODStatus) {
    CODStatus["PENDING"] = "pending";
    CODStatus["COLLECTED"] = "collected";
    CODStatus["SETTLED"] = "settled";
    CODStatus["CANCELLED"] = "cancelled";
})(CODStatus || (exports.CODStatus = CODStatus = {}));
var CODPaymentMethod;
(function (CODPaymentMethod) {
    CODPaymentMethod["CASH"] = "cash";
    CODPaymentMethod["CARD"] = "card";
})(CODPaymentMethod || (exports.CODPaymentMethod = CODPaymentMethod = {}));
let CODTransaction = class CODTransaction {
    // ============================================================================
    // Business Logic Methods
    // ============================================================================
    /**
     * Mark as collected
     */
    markAsCollected(collectedAmount, paymentMethod, changeGiven = 0, notes) {
        this.status = CODStatus.COLLECTED;
        this.collected_amount = collectedAmount;
        this.payment_method = paymentMethod;
        this.change_given = changeGiven;
        this.collected_at = new Date();
        if (notes) {
            this.collection_notes = notes;
        }
    }
    /**
     * Mark as settled
     */
    markAsSettled(settlementId, settledBy) {
        this.status = CODStatus.SETTLED;
        this.settlement_id = settlementId;
        this.settled_at = new Date();
        this.settled_by = settledBy;
    }
    /**
     * Cancel transaction
     */
    cancel(reason) {
        this.status = CODStatus.CANCELLED;
        this.cancellation_reason = reason;
    }
    /**
     * Check if collected
     */
    isCollected() {
        return this.status === CODStatus.COLLECTED || this.status === CODStatus.SETTLED;
    }
    /**
     * Check if settled
     */
    isSettled() {
        return this.status === CODStatus.SETTLED;
    }
    /**
     * Check if pending
     */
    isPending() {
        return this.status === CODStatus.PENDING;
    }
    /**
     * Get variance (difference between expected and collected)
     */
    getVariance() {
        if (this.collected_amount === null) {
            return 0;
        }
        return this.collected_amount - this.amount;
    }
    /**
     * Validate COD amount limits (business rule: max CHF 500)
     */
    validateAmount() {
        const MAX_COD_AMOUNT = 500;
        if (this.amount <= 0) {
            return { valid: false, error: 'COD amount must be greater than 0' };
        }
        if (this.amount > MAX_COD_AMOUNT) {
            return {
                valid: false,
                error: `COD amount exceeds maximum limit of CHF ${MAX_COD_AMOUNT}`,
            };
        }
        return { valid: true };
    }
};
exports.CODTransaction = CODTransaction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CODTransaction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)('idx_cod_transactions_order'),
    __metadata("design:type", String)
], CODTransaction.prototype, "order_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)('idx_cod_transactions_delivery'),
    __metadata("design:type", String)
], CODTransaction.prototype, "delivery_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)('idx_cod_transactions_driver'),
    __metadata("design:type", String)
], CODTransaction.prototype, "driver_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'driver_id' }),
    __metadata("design:type", User_1.User)
], CODTransaction.prototype, "driver", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], CODTransaction.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], CODTransaction.prototype, "collected_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: CODStatus,
        default: CODStatus.PENDING,
    }),
    (0, typeorm_1.Index)('idx_cod_transactions_status'),
    __metadata("design:type", String)
], CODTransaction.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: CODPaymentMethod,
        nullable: true,
    }),
    __metadata("design:type", Object)
], CODTransaction.prototype, "payment_method", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], CODTransaction.prototype, "collected_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], CODTransaction.prototype, "change_given", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], CODTransaction.prototype, "collection_notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    (0, typeorm_1.Index)('idx_cod_transactions_settlement'),
    __metadata("design:type", Object)
], CODTransaction.prototype, "settlement_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], CODTransaction.prototype, "settled_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], CODTransaction.prototype, "settled_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], CODTransaction.prototype, "cancellation_reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], CODTransaction.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    (0, typeorm_1.Index)('idx_cod_transactions_created'),
    __metadata("design:type", Date)
], CODTransaction.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], CODTransaction.prototype, "updated_at", void 0);
exports.CODTransaction = CODTransaction = __decorate([
    (0, typeorm_1.Entity)('cod_transactions')
], CODTransaction);
//# sourceMappingURL=CODTransaction.js.map