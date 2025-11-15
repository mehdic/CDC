"use strict";
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
exports.Order = exports.PaymentStatus = exports.OrderStatus = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const Pharmacy_1 = require("./Pharmacy");
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["CONFIRMED"] = "confirmed";
    OrderStatus["PROCESSING"] = "processing";
    OrderStatus["READY_FOR_PICKUP"] = "ready_for_pickup";
    OrderStatus["OUT_FOR_DELIVERY"] = "out_for_delivery";
    OrderStatus["COMPLETED"] = "completed";
    OrderStatus["CANCELLED"] = "cancelled";
    OrderStatus["REFUNDED"] = "refunded";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PAID"] = "paid";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
let Order = class Order {
    id;
    pharmacy_id;
    pharmacy;
    user_id;
    user;
    status;
    items;
    subtotal;
    tax_amount;
    shipping_cost;
    discount_amount;
    total_amount;
    payment_status;
    payment_method;
    payment_transaction_id;
    paid_at;
    shipping_address_encrypted;
    shipping_notes_encrypted;
    delivery_method;
    delivery_id;
    notes;
    cancellation_reason;
    created_at;
    updated_at;
    confirmed_at;
    completed_at;
    cancelled_at;
    isPending() {
        return this.status === OrderStatus.PENDING;
    }
    isConfirmed() {
        return this.status === OrderStatus.CONFIRMED;
    }
    isProcessing() {
        return this.status === OrderStatus.PROCESSING;
    }
    isCompleted() {
        return this.status === OrderStatus.COMPLETED;
    }
    isCancelled() {
        return this.status === OrderStatus.CANCELLED;
    }
    isPaid() {
        return this.payment_status === PaymentStatus.PAID;
    }
    canBeCancelled() {
        return (this.status === OrderStatus.PENDING ||
            this.status === OrderStatus.CONFIRMED);
    }
    getTotalItemsCount() {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    }
    confirm() {
        this.status = OrderStatus.CONFIRMED;
        this.confirmed_at = new Date();
    }
    process() {
        this.status = OrderStatus.PROCESSING;
    }
    complete() {
        this.status = OrderStatus.COMPLETED;
        this.completed_at = new Date();
    }
    cancel(reason) {
        this.status = OrderStatus.CANCELLED;
        this.cancelled_at = new Date();
        if (reason) {
            this.cancellation_reason = reason;
        }
    }
    markAsPaid(transactionId) {
        this.payment_status = PaymentStatus.PAID;
        this.payment_transaction_id = transactionId;
        this.paid_at = new Date();
    }
};
exports.Order = Order;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Order.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)('idx_orders_pharmacy'),
    __metadata("design:type", String)
], Order.prototype, "pharmacy_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Pharmacy_1.Pharmacy, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'pharmacy_id' }),
    __metadata("design:type", Pharmacy_1.Pharmacy)
], Order.prototype, "pharmacy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)('idx_orders_user'),
    __metadata("design:type", String)
], Order.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", User_1.User)
], Order.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: OrderStatus,
        default: OrderStatus.PENDING,
    }),
    (0, typeorm_1.Index)('idx_orders_status'),
    __metadata("design:type", String)
], Order.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Array)
], Order.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Order.prototype, "subtotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Order.prototype, "tax_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Order.prototype, "shipping_cost", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Order.prototype, "discount_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Order.prototype, "total_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PENDING,
    }),
    (0, typeorm_1.Index)('idx_orders_payment_status'),
    __metadata("design:type", String)
], Order.prototype, "payment_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "payment_method", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "payment_transaction_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Order.prototype, "paid_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bytea', nullable: true }),
    __metadata("design:type", Buffer)
], Order.prototype, "shipping_address_encrypted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bytea', nullable: true }),
    __metadata("design:type", Buffer)
], Order.prototype, "shipping_notes_encrypted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "delivery_method", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    (0, typeorm_1.Index)('idx_orders_delivery'),
    __metadata("design:type", String)
], Order.prototype, "delivery_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "cancellation_reason", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    (0, typeorm_1.Index)('idx_orders_created'),
    __metadata("design:type", Date)
], Order.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Order.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Order.prototype, "confirmed_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Order.prototype, "completed_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Order.prototype, "cancelled_at", void 0);
exports.Order = Order = __decorate([
    (0, typeorm_1.Entity)('orders')
], Order);
//# sourceMappingURL=Order.js.map