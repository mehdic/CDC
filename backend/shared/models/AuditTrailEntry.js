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
    id;
    pharmacy_id;
    pharmacy;
    user_id;
    user;
    event_type;
    action;
    resource_type;
    resource_id;
    _resourceIndex;
    changes;
    ip_address;
    user_agent;
    device_info;
    created_at;
    hasChanges() {
        return this.action === AuditAction.UPDATE && this.changes !== null;
    }
    getChangedFields() {
        if (!this.hasChanges() || !this.changes)
            return [];
        return Object.keys(this.changes);
    }
    getOldValue(field) {
        if (!this.hasChanges() || !this.changes)
            return null;
        return this.changes[field]?.old;
    }
    getNewValue(field) {
        if (!this.hasChanges() || !this.changes)
            return null;
        return this.changes[field]?.new;
    }
    isFromPharmacy(pharmacyId) {
        return this.pharmacy_id === pharmacyId;
    }
    isGlobalEvent() {
        return this.pharmacy_id === null;
    }
    getEventDescription() {
        const actionVerb = {
            [AuditAction.CREATE]: 'created',
            [AuditAction.READ]: 'accessed',
            [AuditAction.UPDATE]: 'updated',
            [AuditAction.DELETE]: 'deleted',
        }[this.action];
        return `${this.resource_type} ${actionVerb}`;
    }
    getDevicePlatform() {
        return this.device_info?.platform || null;
    }
    getBrowser() {
        return this.device_info?.browser || null;
    }
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
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    (0, typeorm_1.Index)('idx_audit_trail_pharmacy'),
    __metadata("design:type", Object)
], AuditTrailEntry.prototype, "pharmacy_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Pharmacy_1.Pharmacy, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'pharmacy_id' }),
    __metadata("design:type", Object)
], AuditTrailEntry.prototype, "pharmacy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
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
        type: 'enum',
        enum: AuditAction,
    }),
    __metadata("design:type", String)
], AuditTrailEntry.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], AuditTrailEntry.prototype, "resource_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], AuditTrailEntry.prototype, "resource_id", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_audit_trail_resource', ['resource_type', 'resource_id']),
    __metadata("design:type", void 0)
], AuditTrailEntry.prototype, "_resourceIndex", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], AuditTrailEntry.prototype, "changes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'inet', nullable: true }),
    __metadata("design:type", Object)
], AuditTrailEntry.prototype, "ip_address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], AuditTrailEntry.prototype, "user_agent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], AuditTrailEntry.prototype, "device_info", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    (0, typeorm_1.Index)('idx_audit_trail_created'),
    __metadata("design:type", Date)
], AuditTrailEntry.prototype, "created_at", void 0);
exports.AuditTrailEntry = AuditTrailEntry = AuditTrailEntry_1 = __decorate([
    (0, typeorm_1.Entity)('audit_trail_entries')
], AuditTrailEntry);
//# sourceMappingURL=AuditTrailEntry.js.map