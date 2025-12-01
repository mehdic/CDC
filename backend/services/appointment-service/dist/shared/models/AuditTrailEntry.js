"use strict";
/**
 * AuditTrailEntry Entity
 * Immutable audit logs for compliance (HIPAA, GDPR, Swiss regulations)
 * Based on: /specs/002-metapharm-platform/data-model.md
 *
 * IMPORTANT: This is an append-only table. No UPDATE or DELETE operations allowed.
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
var AuditTrailEntry_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditTrailEntry = exports.AuditAction = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const Pharmacy_1 = require("./Pharmacy");
var AuditAction;
(function (AuditAction) {
    AuditAction["CREATE"] = "create";
    AuditAction["READ"] = "read";
    AuditAction["UPDATE"] = "update";
    AuditAction["DELETE"] = "delete";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
let AuditTrailEntry = AuditTrailEntry_1 = class AuditTrailEntry {
    // ============================================================================
    // Helper Methods
    // ============================================================================
    /**
     * Check if this is an UPDATE action with changes
     */
    hasChanges() {
        return this.action === AuditAction.UPDATE && this.changes !== null;
    }
    /**
     * Get list of changed fields
     */
    getChangedFields() {
        if (!this.hasChanges() || !this.changes)
            return [];
        return Object.keys(this.changes);
    }
    /**
     * Get old value for a specific field
     */
    getOldValue(field) {
        if (!this.hasChanges() || !this.changes)
            return null;
        return this.changes[field]?.old;
    }
    /**
     * Get new value for a specific field
     */
    getNewValue(field) {
        if (!this.hasChanges() || !this.changes)
            return null;
        return this.changes[field]?.new;
    }
    /**
     * Check if entry is from a specific pharmacy
     */
    isFromPharmacy(pharmacyId) {
        return this.pharmacy_id === pharmacyId;
    }
    /**
     * Check if entry is a global event (no pharmacy context)
     */
    isGlobalEvent() {
        return this.pharmacy_id === null;
    }
    /**
     * Get formatted event description
     */
    getEventDescription() {
        const actionVerb = {
            [AuditAction.CREATE]: 'created',
            [AuditAction.READ]: 'accessed',
            [AuditAction.UPDATE]: 'updated',
            [AuditAction.DELETE]: 'deleted',
        }[this.action];
        return `${this.resource_type} ${actionVerb}`;
    }
    /**
     * Get device platform from device_info
     */
    getDevicePlatform() {
        return this.device_info?.platform || null;
    }
    /**
     * Get browser from device_info
     */
    getBrowser() {
        return this.device_info?.browser || null;
    }
    /**
     * Static factory method for creating audit entries
     * (Use this instead of direct instantiation for consistency)
     */
    static create(params) {
        const entry = new AuditTrailEntry_1();
        entry.user_id = params.userId;
        entry.pharmacy_id = params.pharmacyId || null;
        entry.event_type = params.eventType;
        entry.action = params.action;
        entry.resource_type = params.resourceType;
        entry.resource_id = params.resourceId;
        entry.changes = params.changes || null;
        entry.ip_address = params.ipAddress || null;
        entry.user_agent = params.userAgent || null;
        entry.device_info = params.deviceInfo || null;
        return entry;
    }
};
exports.AuditTrailEntry = AuditTrailEntry;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AuditTrailEntry.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    (0, typeorm_1.Index)('idx_audit_trail_pharmacy'),
    __metadata("design:type", Object)
], AuditTrailEntry.prototype, "pharmacy_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Pharmacy_1.Pharmacy, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'pharmacy_id' }),
    __metadata("design:type", Object)
], AuditTrailEntry.prototype, "pharmacy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    (0, typeorm_1.Index)('idx_audit_trail_user'),
    __metadata("design:type", String)
], AuditTrailEntry.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, (user) => user.audit_trail_entries),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", User_1.User)
], AuditTrailEntry.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    (0, typeorm_1.Index)('idx_audit_trail_event'),
    __metadata("design:type", String)
], AuditTrailEntry.prototype, "event_type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 50,
    }),
    __metadata("design:type", String)
], AuditTrailEntry.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], AuditTrailEntry.prototype, "resource_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], AuditTrailEntry.prototype, "resource_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Object)
], AuditTrailEntry.prototype, "changes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 45, nullable: true }),
    __metadata("design:type", Object)
], AuditTrailEntry.prototype, "ip_address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], AuditTrailEntry.prototype, "user_agent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Object)
], AuditTrailEntry.prototype, "device_info", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime' }),
    (0, typeorm_1.Index)('idx_audit_trail_created'),
    __metadata("design:type", Date)
], AuditTrailEntry.prototype, "created_at", void 0);
exports.AuditTrailEntry = AuditTrailEntry = AuditTrailEntry_1 = __decorate([
    (0, typeorm_1.Entity)('audit_trail_entries'),
    (0, typeorm_1.Index)('idx_audit_trail_resource', ['resource_type', 'resource_id'])
], AuditTrailEntry);
//# sourceMappingURL=AuditTrailEntry.js.map