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
exports.Delivery = exports.DeliveryStatus = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
var DeliveryStatus;
(function (DeliveryStatus) {
    DeliveryStatus["PENDING"] = "pending";
    DeliveryStatus["ASSIGNED"] = "assigned";
    DeliveryStatus["IN_TRANSIT"] = "in_transit";
    DeliveryStatus["DELIVERED"] = "delivered";
    DeliveryStatus["FAILED"] = "failed";
    DeliveryStatus["CANCELLED"] = "cancelled";
})(DeliveryStatus || (exports.DeliveryStatus = DeliveryStatus = {}));
let Delivery = class Delivery {
    id;
    user_id;
    user;
    order_id;
    delivery_personnel_id;
    delivery_personnel;
    status;
    delivery_address_encrypted;
    delivery_notes_encrypted;
    tracking_info;
    tracking_number;
    scheduled_at;
    picked_up_at;
    delivered_at;
    failed_at;
    failure_reason;
    created_at;
    updated_at;
    isPending() {
        return this.status === DeliveryStatus.PENDING;
    }
    isAssigned() {
        return this.status === DeliveryStatus.ASSIGNED;
    }
    isInTransit() {
        return this.status === DeliveryStatus.IN_TRANSIT;
    }
    isDelivered() {
        return this.status === DeliveryStatus.DELIVERED;
    }
    isFailed() {
        return this.status === DeliveryStatus.FAILED;
    }
    isCancelled() {
        return this.status === DeliveryStatus.CANCELLED;
    }
    assign(deliveryPersonnelId) {
        this.status = DeliveryStatus.ASSIGNED;
        this.delivery_personnel_id = deliveryPersonnelId;
    }
    pickUp() {
        this.status = DeliveryStatus.IN_TRANSIT;
        this.picked_up_at = new Date();
    }
    deliver() {
        this.status = DeliveryStatus.DELIVERED;
        this.delivered_at = new Date();
    }
    fail(reason) {
        this.status = DeliveryStatus.FAILED;
        this.failed_at = new Date();
        this.failure_reason = reason;
    }
    cancel() {
        this.status = DeliveryStatus.CANCELLED;
    }
};
exports.Delivery = Delivery;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Delivery.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)('idx_deliveries_user'),
    __metadata("design:type", String)
], Delivery.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", User_1.User)
], Delivery.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    (0, typeorm_1.Index)('idx_deliveries_order'),
    __metadata("design:type", String)
], Delivery.prototype, "order_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    (0, typeorm_1.Index)('idx_deliveries_delivery_personnel'),
    __metadata("design:type", String)
], Delivery.prototype, "delivery_personnel_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'delivery_personnel_id' }),
    __metadata("design:type", User_1.User)
], Delivery.prototype, "delivery_personnel", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: DeliveryStatus,
        default: DeliveryStatus.PENDING,
    }),
    (0, typeorm_1.Index)('idx_deliveries_status'),
    __metadata("design:type", String)
], Delivery.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bytea' }),
    __metadata("design:type", Buffer)
], Delivery.prototype, "delivery_address_encrypted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bytea', nullable: true }),
    __metadata("design:type", Buffer)
], Delivery.prototype, "delivery_notes_encrypted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Delivery.prototype, "tracking_info", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Delivery.prototype, "tracking_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Delivery.prototype, "scheduled_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Delivery.prototype, "picked_up_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Delivery.prototype, "delivered_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Delivery.prototype, "failed_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Delivery.prototype, "failure_reason", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    (0, typeorm_1.Index)('idx_deliveries_created'),
    __metadata("design:type", Date)
], Delivery.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Delivery.prototype, "updated_at", void 0);
exports.Delivery = Delivery = __decorate([
    (0, typeorm_1.Entity)('deliveries')
], Delivery);
//# sourceMappingURL=Delivery.js.map