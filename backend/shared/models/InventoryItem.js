"use strict";
/**
 * InventoryItem Entity
 * Medication stock tracking in pharmacies with QR traceability and AI-powered alerts
 * Based on: /specs/002-metapharm-platform/data-model.md
 * User Story 3 (P3): Real-Time Inventory Management (FR-031 to FR-040)
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
exports.InventoryItem = void 0;
const typeorm_1 = require("typeorm");
const Pharmacy_1 = require("./Pharmacy");
const InventoryTransaction_1 = require("./InventoryTransaction");
const InventoryAlert_1 = require("./InventoryAlert");
let InventoryItem = class InventoryItem {
    // ============================================================================
    // Virtual Getters
    // ============================================================================
    /**
     * Check if item is low stock (quantity <= reorder_threshold)
     */
    get isLowStock() {
        return this.reorder_threshold !== null && this.quantity <= this.reorder_threshold;
    }
    /**
     * Check if item is critical stock (quantity <= reorder_threshold / 2)
     */
    get isCriticalStock() {
        return this.reorder_threshold !== null && this.quantity <= Math.floor(this.reorder_threshold / 2);
    }
    /**
     * Check if item is out of stock
     */
    get isOutOfStock() {
        return this.quantity === 0;
    }
    /**
     * Check if item is expiring soon (within 60 days)
     */
    get isExpiringSoon() {
        if (!this.expiry_date)
            return false;
        const today = new Date();
        const sixtyDaysFromNow = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
        return this.expiry_date <= sixtyDaysFromNow;
    }
    /**
     * Check if item is expired
     */
    get isExpired() {
        if (!this.expiry_date)
            return false;
        return this.expiry_date < new Date();
    }
};
exports.InventoryItem = InventoryItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], InventoryItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)('idx_inventory_items_pharmacy'),
    __metadata("design:type", String)
], InventoryItem.prototype, "pharmacy_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Pharmacy_1.Pharmacy, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'pharmacy_id' }),
    __metadata("design:type", Pharmacy_1.Pharmacy)
], InventoryItem.prototype, "pharmacy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], InventoryItem.prototype, "medication_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    (0, typeorm_1.Index)('idx_inventory_items_medication'),
    __metadata("design:type", Object)
], InventoryItem.prototype, "medication_rxnorm_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    (0, typeorm_1.Index)('idx_inventory_items_gtin'),
    __metadata("design:type", Object)
], InventoryItem.prototype, "medication_gtin", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], InventoryItem.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], InventoryItem.prototype, "unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Object)
], InventoryItem.prototype, "reorder_threshold", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Object)
], InventoryItem.prototype, "optimal_stock_level", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], InventoryItem.prototype, "batch_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], InventoryItem.prototype, "expiry_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], InventoryItem.prototype, "supplier_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], InventoryItem.prototype, "cost_per_unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], InventoryItem.prototype, "is_controlled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, nullable: true }),
    __metadata("design:type", Object)
], InventoryItem.prototype, "substance_schedule", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], InventoryItem.prototype, "storage_location", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], InventoryItem.prototype, "requires_refrigeration", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], InventoryItem.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], InventoryItem.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], InventoryItem.prototype, "last_restocked_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => InventoryTransaction_1.InventoryTransaction, (transaction) => transaction.inventory_item),
    __metadata("design:type", Array)
], InventoryItem.prototype, "transactions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => InventoryAlert_1.InventoryAlert, (alert) => alert.inventory_item),
    __metadata("design:type", Array)
], InventoryItem.prototype, "alerts", void 0);
exports.InventoryItem = InventoryItem = __decorate([
    (0, typeorm_1.Entity)('inventory_items')
], InventoryItem);
//# sourceMappingURL=InventoryItem.js.map