"use strict";
/**
 * Driver Settlement Entity
 * Tracks daily driver COD collection settlements
 * Used for driver accountability and financial reconciliation
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
exports.DriverSettlement = exports.SettlementStatus = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
var SettlementStatus;
(function (SettlementStatus) {
    SettlementStatus["PENDING"] = "pending";
    SettlementStatus["APPROVED"] = "approved";
    SettlementStatus["DISPUTED"] = "disputed";
    SettlementStatus["RESOLVED"] = "resolved";
})(SettlementStatus || (exports.SettlementStatus = SettlementStatus = {}));
let DriverSettlement = class DriverSettlement {
    // ============================================================================
    // Business Logic Methods
    // ============================================================================
    /**
     * Calculate variance
     */
    calculateVariance() {
        this.variance = this.total_settled - this.total_expected;
    }
    /**
     * Approve settlement
     */
    approve(approvedBy, managerNotes) {
        this.status = SettlementStatus.APPROVED;
        this.approved_by = approvedBy;
        this.approved_at = new Date();
        if (managerNotes) {
            this.manager_notes = managerNotes;
        }
    }
    /**
     * Dispute settlement
     */
    dispute(disputedBy, reason) {
        this.status = SettlementStatus.DISPUTED;
        this.approved_by = disputedBy;
        this.manager_notes = reason;
        this.approved_at = new Date();
    }
    /**
     * Resolve dispute
     */
    resolve(resolvedBy, resolution) {
        this.status = SettlementStatus.RESOLVED;
        this.resolved_by = resolvedBy;
        this.resolved_at = new Date();
        this.manager_notes = (this.manager_notes || '') + '\n\nResolution: ' + resolution;
    }
    /**
     * Check if has deficit
     */
    hasDeficit() {
        return this.variance < 0;
    }
    /**
     * Check if has surplus
     */
    hasSurplus() {
        return this.variance > 0;
    }
    /**
     * Check if variance exceeds threshold (business rule: CHF 50)
     */
    requiresManagerApproval() {
        const THRESHOLD = 50;
        return Math.abs(this.variance) > THRESHOLD;
    }
    /**
     * Get variance percentage
     */
    getVariancePercentage() {
        if (this.total_expected === 0) {
            return 0;
        }
        return (this.variance / this.total_expected) * 100;
    }
    /**
     * Check if pending
     */
    isPending() {
        return this.status === SettlementStatus.PENDING;
    }
    /**
     * Check if approved
     */
    isApproved() {
        return this.status === SettlementStatus.APPROVED;
    }
    /**
     * Check if disputed
     */
    isDisputed() {
        return this.status === SettlementStatus.DISPUTED;
    }
    /**
     * Get settlement summary for driver dashboard
     */
    getSummary() {
        return {
            date: this.settlement_date,
            transactions: this.transaction_count,
            expected: this.total_expected,
            collected: this.total_settled,
            variance: this.variance,
            status: this.status,
        };
    }
};
exports.DriverSettlement = DriverSettlement;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DriverSettlement.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)('idx_driver_settlements_driver'),
    __metadata("design:type", String)
], DriverSettlement.prototype, "driver_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'driver_id' }),
    __metadata("design:type", User_1.User)
], DriverSettlement.prototype, "driver", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    (0, typeorm_1.Index)('idx_driver_settlements_date'),
    __metadata("design:type", Date)
], DriverSettlement.prototype, "settlement_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], DriverSettlement.prototype, "total_expected", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], DriverSettlement.prototype, "total_collected", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], DriverSettlement.prototype, "total_settled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], DriverSettlement.prototype, "variance", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], DriverSettlement.prototype, "transaction_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], DriverSettlement.prototype, "cash_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], DriverSettlement.prototype, "card_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: SettlementStatus,
        default: SettlementStatus.PENDING,
    }),
    (0, typeorm_1.Index)('idx_driver_settlements_status'),
    __metadata("design:type", String)
], DriverSettlement.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], DriverSettlement.prototype, "driver_notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], DriverSettlement.prototype, "manager_notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], DriverSettlement.prototype, "approved_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], DriverSettlement.prototype, "approved_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], DriverSettlement.prototype, "resolved_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], DriverSettlement.prototype, "resolved_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], DriverSettlement.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    (0, typeorm_1.Index)('idx_driver_settlements_created'),
    __metadata("design:type", Date)
], DriverSettlement.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], DriverSettlement.prototype, "updated_at", void 0);
exports.DriverSettlement = DriverSettlement = __decorate([
    (0, typeorm_1.Entity)('driver_settlements')
], DriverSettlement);
//# sourceMappingURL=DriverSettlement.js.map