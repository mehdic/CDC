"use strict";
/**
 * AuditTrailEntry Entity
 * Immutable audit logs for compliance (HIPAA, GDPR, Swiss regulations)
 * Based on: /specs/002-metapharm-platform/data-model.md
 *
 * IMPORTANT: This is an append-only table. No UPDATE or DELETE operations allowed.
 */
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
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
let AuditTrailEntry = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('audit_trail_entries'), (0, typeorm_1.Index)('idx_audit_trail_resource', ['resource_type', 'resource_id'])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _pharmacy_id_decorators;
    let _pharmacy_id_initializers = [];
    let _pharmacy_id_extraInitializers = [];
    let _pharmacy_decorators;
    let _pharmacy_initializers = [];
    let _pharmacy_extraInitializers = [];
    let _user_id_decorators;
    let _user_id_initializers = [];
    let _user_id_extraInitializers = [];
    let _user_decorators;
    let _user_initializers = [];
    let _user_extraInitializers = [];
    let _event_type_decorators;
    let _event_type_initializers = [];
    let _event_type_extraInitializers = [];
    let _action_decorators;
    let _action_initializers = [];
    let _action_extraInitializers = [];
    let _resource_type_decorators;
    let _resource_type_initializers = [];
    let _resource_type_extraInitializers = [];
    let _resource_id_decorators;
    let _resource_id_initializers = [];
    let _resource_id_extraInitializers = [];
    let _changes_decorators;
    let _changes_initializers = [];
    let _changes_extraInitializers = [];
    let _ip_address_decorators;
    let _ip_address_initializers = [];
    let _ip_address_extraInitializers = [];
    let _user_agent_decorators;
    let _user_agent_initializers = [];
    let _user_agent_extraInitializers = [];
    let _device_info_decorators;
    let _device_info_initializers = [];
    let _device_info_extraInitializers = [];
    let _created_at_decorators;
    let _created_at_initializers = [];
    let _created_at_extraInitializers = [];
    var AuditTrailEntry = _classThis = class {
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
            const entry = new AuditTrailEntry();
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
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            // ============================================================================
            // Context
            // ============================================================================
            this.pharmacy_id = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _pharmacy_id_initializers, void 0)); // Nullable for global events
            this.pharmacy = (__runInitializers(this, _pharmacy_id_extraInitializers), __runInitializers(this, _pharmacy_initializers, void 0));
            this.user_id = (__runInitializers(this, _pharmacy_extraInitializers), __runInitializers(this, _user_id_initializers, void 0));
            this.user = (__runInitializers(this, _user_id_extraInitializers), __runInitializers(this, _user_initializers, void 0));
            // ============================================================================
            // Event
            // ============================================================================
            this.event_type = (__runInitializers(this, _user_extraInitializers), __runInitializers(this, _event_type_initializers, void 0)); // "prescription.approved", "record.accessed", "delivery.confirmed"
            this.action = (__runInitializers(this, _event_type_extraInitializers), __runInitializers(this, _action_initializers, void 0));
            this.resource_type = (__runInitializers(this, _action_extraInitializers), __runInitializers(this, _resource_type_initializers, void 0)); // "prescription", "patient_medical_record", "inventory_item"
            this.resource_id = (__runInitializers(this, _resource_type_extraInitializers), __runInitializers(this, _resource_id_initializers, void 0));
            // ============================================================================
            // Changes (for UPDATE actions)
            // ============================================================================
            this.changes = (__runInitializers(this, _resource_id_extraInitializers), __runInitializers(this, _changes_initializers, void 0)); // {field: {old: value, new: value}}
            // ============================================================================
            // Request Context
            // ============================================================================
            this.ip_address = (__runInitializers(this, _changes_extraInitializers), __runInitializers(this, _ip_address_initializers, void 0)); // IPv4 (15) or IPv6 (45)
            this.user_agent = (__runInitializers(this, _ip_address_extraInitializers), __runInitializers(this, _user_agent_initializers, void 0));
            this.device_info = (__runInitializers(this, _user_agent_extraInitializers), __runInitializers(this, _device_info_initializers, void 0));
            // ============================================================================
            // Timestamp (immutable)
            // ============================================================================
            this.created_at = (__runInitializers(this, _device_info_extraInitializers), __runInitializers(this, _created_at_initializers, void 0));
            __runInitializers(this, _created_at_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "AuditTrailEntry");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _pharmacy_id_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }), (0, typeorm_1.Index)('idx_audit_trail_pharmacy')];
        _pharmacy_decorators = [(0, typeorm_1.ManyToOne)(() => Pharmacy_1.Pharmacy, { nullable: true }), (0, typeorm_1.JoinColumn)({ name: 'pharmacy_id' })];
        _user_id_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 36 }), (0, typeorm_1.Index)('idx_audit_trail_user')];
        _user_decorators = [(0, typeorm_1.ManyToOne)(() => User_1.User, (user) => user.audit_trail_entries), (0, typeorm_1.JoinColumn)({ name: 'user_id' })];
        _event_type_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 100 }), (0, typeorm_1.Index)('idx_audit_trail_event')];
        _action_decorators = [(0, typeorm_1.Column)({
                type: 'varchar',
                length: 50,
            })];
        _resource_type_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 100 })];
        _resource_id_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 36 })];
        _changes_decorators = [(0, typeorm_1.Column)({ type: 'simple-json', nullable: true })];
        _ip_address_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 45, nullable: true })];
        _user_agent_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _device_info_decorators = [(0, typeorm_1.Column)({ type: 'simple-json', nullable: true })];
        _created_at_decorators = [(0, typeorm_1.CreateDateColumn)({ type: 'datetime' }), (0, typeorm_1.Index)('idx_audit_trail_created')];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _pharmacy_id_decorators, { kind: "field", name: "pharmacy_id", static: false, private: false, access: { has: obj => "pharmacy_id" in obj, get: obj => obj.pharmacy_id, set: (obj, value) => { obj.pharmacy_id = value; } }, metadata: _metadata }, _pharmacy_id_initializers, _pharmacy_id_extraInitializers);
        __esDecorate(null, null, _pharmacy_decorators, { kind: "field", name: "pharmacy", static: false, private: false, access: { has: obj => "pharmacy" in obj, get: obj => obj.pharmacy, set: (obj, value) => { obj.pharmacy = value; } }, metadata: _metadata }, _pharmacy_initializers, _pharmacy_extraInitializers);
        __esDecorate(null, null, _user_id_decorators, { kind: "field", name: "user_id", static: false, private: false, access: { has: obj => "user_id" in obj, get: obj => obj.user_id, set: (obj, value) => { obj.user_id = value; } }, metadata: _metadata }, _user_id_initializers, _user_id_extraInitializers);
        __esDecorate(null, null, _user_decorators, { kind: "field", name: "user", static: false, private: false, access: { has: obj => "user" in obj, get: obj => obj.user, set: (obj, value) => { obj.user = value; } }, metadata: _metadata }, _user_initializers, _user_extraInitializers);
        __esDecorate(null, null, _event_type_decorators, { kind: "field", name: "event_type", static: false, private: false, access: { has: obj => "event_type" in obj, get: obj => obj.event_type, set: (obj, value) => { obj.event_type = value; } }, metadata: _metadata }, _event_type_initializers, _event_type_extraInitializers);
        __esDecorate(null, null, _action_decorators, { kind: "field", name: "action", static: false, private: false, access: { has: obj => "action" in obj, get: obj => obj.action, set: (obj, value) => { obj.action = value; } }, metadata: _metadata }, _action_initializers, _action_extraInitializers);
        __esDecorate(null, null, _resource_type_decorators, { kind: "field", name: "resource_type", static: false, private: false, access: { has: obj => "resource_type" in obj, get: obj => obj.resource_type, set: (obj, value) => { obj.resource_type = value; } }, metadata: _metadata }, _resource_type_initializers, _resource_type_extraInitializers);
        __esDecorate(null, null, _resource_id_decorators, { kind: "field", name: "resource_id", static: false, private: false, access: { has: obj => "resource_id" in obj, get: obj => obj.resource_id, set: (obj, value) => { obj.resource_id = value; } }, metadata: _metadata }, _resource_id_initializers, _resource_id_extraInitializers);
        __esDecorate(null, null, _changes_decorators, { kind: "field", name: "changes", static: false, private: false, access: { has: obj => "changes" in obj, get: obj => obj.changes, set: (obj, value) => { obj.changes = value; } }, metadata: _metadata }, _changes_initializers, _changes_extraInitializers);
        __esDecorate(null, null, _ip_address_decorators, { kind: "field", name: "ip_address", static: false, private: false, access: { has: obj => "ip_address" in obj, get: obj => obj.ip_address, set: (obj, value) => { obj.ip_address = value; } }, metadata: _metadata }, _ip_address_initializers, _ip_address_extraInitializers);
        __esDecorate(null, null, _user_agent_decorators, { kind: "field", name: "user_agent", static: false, private: false, access: { has: obj => "user_agent" in obj, get: obj => obj.user_agent, set: (obj, value) => { obj.user_agent = value; } }, metadata: _metadata }, _user_agent_initializers, _user_agent_extraInitializers);
        __esDecorate(null, null, _device_info_decorators, { kind: "field", name: "device_info", static: false, private: false, access: { has: obj => "device_info" in obj, get: obj => obj.device_info, set: (obj, value) => { obj.device_info = value; } }, metadata: _metadata }, _device_info_initializers, _device_info_extraInitializers);
        __esDecorate(null, null, _created_at_decorators, { kind: "field", name: "created_at", static: false, private: false, access: { has: obj => "created_at" in obj, get: obj => obj.created_at, set: (obj, value) => { obj.created_at = value; } }, metadata: _metadata }, _created_at_initializers, _created_at_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AuditTrailEntry = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AuditTrailEntry = _classThis;
})();
exports.AuditTrailEntry = AuditTrailEntry;
//# sourceMappingURL=AuditTrailEntry.js.map