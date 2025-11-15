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
exports.InventoryAlert = exports.AlertStatus = exports.AlertSeverity = exports.AlertType = void 0;
const typeorm_1 = require("typeorm");
const Pharmacy_1 = require("./Pharmacy");
const InventoryItem_1 = require("./InventoryItem");
const User_1 = require("./User");
var AlertType;
(function (AlertType) {
    AlertType["LOW_STOCK"] = "low_stock";
    AlertType["EXPIRING_SOON"] = "expiring_soon";
    AlertType["EXPIRED"] = "expired";
    AlertType["REORDER_SUGGESTED"] = "reorder_suggested";
})(AlertType || (exports.AlertType = AlertType = {}));
var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["LOW"] = "low";
    AlertSeverity["MEDIUM"] = "medium";
    AlertSeverity["HIGH"] = "high";
    AlertSeverity["CRITICAL"] = "critical";
})(AlertSeverity || (exports.AlertSeverity = AlertSeverity = {}));
var AlertStatus;
(function (AlertStatus) {
    AlertStatus["ACTIVE"] = "active";
    AlertStatus["ACKNOWLEDGED"] = "acknowledged";
    AlertStatus["RESOLVED"] = "resolved";
    AlertStatus["DISMISSED"] = "dismissed";
})(AlertStatus || (exports.AlertStatus = AlertStatus = {}));
let InventoryAlert = class InventoryAlert {
    id;
    pharmacy_id;
    pharmacy;
    inventory_item_id;
    inventory_item;
    alert_type;
    severity;
    message;
    ai_suggested_action;
    ai_suggested_quantity;
    status;
    acknowledged_by_user_id;
    acknowledged_by_user;
    acknowledged_at;
    created_at;
    resolved_at;
    get isActive() {
        return this.status === AlertStatus.ACTIVE;
    }
    get hasAiRecommendation() {
        return this.ai_suggested_action !== null && this.ai_suggested_quantity !== null;
    }
    get isHighPriority() {
        return this.severity === AlertSeverity.HIGH || this.severity === AlertSeverity.CRITICAL;
    }
    get ageInHours() {
        const now = new Date();
        const diffMs = now.getTime() - this.created_at.getTime();
        return Math.floor(diffMs / (1000 * 60 * 60));
    }
};
exports.InventoryAlert = InventoryAlert;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], InventoryAlert.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)('idx_inventory_alerts_pharmacy'),
    __metadata("design:type", String)
], InventoryAlert.prototype, "pharmacy_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Pharmacy_1.Pharmacy, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'pharmacy_id' }),
    __metadata("design:type", Pharmacy_1.Pharmacy)
], InventoryAlert.prototype, "pharmacy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)('idx_inventory_alerts_item'),
    __metadata("design:type", String)
], InventoryAlert.prototype, "inventory_item_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => InventoryItem_1.InventoryItem, (item) => item.alerts, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'inventory_item_id' }),
    __metadata("design:type", InventoryItem_1.InventoryItem)
], InventoryAlert.prototype, "inventory_item", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 50,
    }),
    (0, typeorm_1.Index)('idx_inventory_alerts_type'),
    __metadata("design:type", String)
], InventoryAlert.prototype, "alert_type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 50,
        default: AlertSeverity.MEDIUM,
    }),
    (0, typeorm_1.Index)('idx_inventory_alerts_severity'),
    __metadata("design:type", String)
], InventoryAlert.prototype, "severity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], InventoryAlert.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], InventoryAlert.prototype, "ai_suggested_action", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], InventoryAlert.prototype, "ai_suggested_quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 50,
        default: AlertStatus.ACTIVE,
    }),
    (0, typeorm_1.Index)('idx_inventory_alerts_status'),
    __metadata("design:type", String)
], InventoryAlert.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], InventoryAlert.prototype, "acknowledged_by_user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'acknowledged_by_user_id' }),
    __metadata("design:type", User_1.User)
], InventoryAlert.prototype, "acknowledged_by_user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], InventoryAlert.prototype, "acknowledged_at", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], InventoryAlert.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], InventoryAlert.prototype, "resolved_at", void 0);
exports.InventoryAlert = InventoryAlert = __decorate([
    (0, typeorm_1.Entity)('inventory_alerts')
], InventoryAlert);
//# sourceMappingURL=InventoryAlert.js.map