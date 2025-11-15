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
exports.Notification = exports.NotificationStatus = exports.NotificationType = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
var NotificationType;
(function (NotificationType) {
    NotificationType["EMAIL"] = "email";
    NotificationType["SMS"] = "sms";
    NotificationType["PUSH"] = "push";
    NotificationType["IN_APP"] = "in_app";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var NotificationStatus;
(function (NotificationStatus) {
    NotificationStatus["PENDING"] = "pending";
    NotificationStatus["SENT"] = "sent";
    NotificationStatus["DELIVERED"] = "delivered";
    NotificationStatus["FAILED"] = "failed";
    NotificationStatus["READ"] = "read";
})(NotificationStatus || (exports.NotificationStatus = NotificationStatus = {}));
let Notification = class Notification {
    id;
    user_id;
    user;
    type;
    subject;
    message;
    status;
    metadata;
    sent_at;
    delivered_at;
    read_at;
    error_message;
    created_at;
    markAsSent() {
        this.status = NotificationStatus.SENT;
        this.sent_at = new Date();
    }
    markAsDelivered() {
        this.status = NotificationStatus.DELIVERED;
        this.delivered_at = new Date();
    }
    markAsRead() {
        this.status = NotificationStatus.READ;
        this.read_at = new Date();
    }
    markAsFailed(errorMessage) {
        this.status = NotificationStatus.FAILED;
        this.error_message = errorMessage;
    }
    isPending() {
        return this.status === NotificationStatus.PENDING;
    }
    isDelivered() {
        return this.status === NotificationStatus.DELIVERED || this.status === NotificationStatus.READ;
    }
    isFailed() {
        return this.status === NotificationStatus.FAILED;
    }
};
exports.Notification = Notification;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Notification.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)('idx_notifications_user'),
    __metadata("design:type", String)
], Notification.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", User_1.User)
], Notification.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: NotificationType,
    }),
    (0, typeorm_1.Index)('idx_notifications_type'),
    __metadata("design:type", String)
], Notification.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Notification.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Notification.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: NotificationStatus,
        default: NotificationStatus.PENDING,
    }),
    (0, typeorm_1.Index)('idx_notifications_status'),
    __metadata("design:type", String)
], Notification.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Notification.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Notification.prototype, "sent_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Notification.prototype, "delivered_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Notification.prototype, "read_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Notification.prototype, "error_message", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    (0, typeorm_1.Index)('idx_notifications_created'),
    __metadata("design:type", Date)
], Notification.prototype, "created_at", void 0);
exports.Notification = Notification = __decorate([
    (0, typeorm_1.Entity)('notifications')
], Notification);
//# sourceMappingURL=Notification.js.map