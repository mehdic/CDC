"use strict";
/**
 * Pharmacy Entity
 * Pharmacy locations serving as multi-tenant root entities
 * Based on: /specs/002-metapharm-platform/data-model.md
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
exports.Pharmacy = exports.SubscriptionStatus = exports.SubscriptionTier = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
var SubscriptionTier;
(function (SubscriptionTier) {
    SubscriptionTier["BASIC"] = "basic";
    SubscriptionTier["PROFESSIONAL"] = "professional";
    SubscriptionTier["ENTERPRISE"] = "enterprise";
})(SubscriptionTier || (exports.SubscriptionTier = SubscriptionTier = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["TRIAL"] = "trial";
    SubscriptionStatus["ACTIVE"] = "active";
    SubscriptionStatus["SUSPENDED"] = "suspended";
    SubscriptionStatus["CANCELLED"] = "cancelled";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
let Pharmacy = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('pharmacies')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _name_decorators;
    let _name_initializers = [];
    let _name_extraInitializers = [];
    let _license_number_decorators;
    let _license_number_initializers = [];
    let _license_number_extraInitializers = [];
    let _address_encrypted_decorators;
    let _address_encrypted_initializers = [];
    let _address_encrypted_extraInitializers = [];
    let _city_decorators;
    let _city_initializers = [];
    let _city_extraInitializers = [];
    let _canton_decorators;
    let _canton_initializers = [];
    let _canton_extraInitializers = [];
    let _postal_code_decorators;
    let _postal_code_initializers = [];
    let _postal_code_extraInitializers = [];
    let _latitude_decorators;
    let _latitude_initializers = [];
    let _latitude_extraInitializers = [];
    let _longitude_decorators;
    let _longitude_initializers = [];
    let _longitude_extraInitializers = [];
    let _phone_decorators;
    let _phone_initializers = [];
    let _phone_extraInitializers = [];
    let _email_decorators;
    let _email_initializers = [];
    let _email_extraInitializers = [];
    let _operating_hours_decorators;
    let _operating_hours_initializers = [];
    let _operating_hours_extraInitializers = [];
    let _subscription_tier_decorators;
    let _subscription_tier_initializers = [];
    let _subscription_tier_extraInitializers = [];
    let _subscription_status_decorators;
    let _subscription_status_initializers = [];
    let _subscription_status_extraInitializers = [];
    let _users_decorators;
    let _users_initializers = [];
    let _users_extraInitializers = [];
    let _created_at_decorators;
    let _created_at_initializers = [];
    let _created_at_extraInitializers = [];
    let _updated_at_decorators;
    let _updated_at_initializers = [];
    let _updated_at_extraInitializers = [];
    let _deleted_at_decorators;
    let _deleted_at_initializers = [];
    let _deleted_at_extraInitializers = [];
    var Pharmacy = _classThis = class {
        // ============================================================================
        // Helper Methods
        // ============================================================================
        /**
         * Check if pharmacy is soft deleted
         */
        isDeleted() {
            return this.deleted_at !== null;
        }
        /**
         * Check if pharmacy subscription is active
         */
        isActive() {
            return (this.subscription_status === SubscriptionStatus.ACTIVE && !this.isDeleted());
        }
        /**
         * Check if pharmacy is in trial period
         */
        isTrial() {
            return this.subscription_status === SubscriptionStatus.TRIAL;
        }
        /**
         * Check if pharmacy has enterprise subscription
         */
        isEnterprise() {
            return this.subscription_tier === SubscriptionTier.ENTERPRISE;
        }
        /**
         * Check if pharmacy is open on a given day
         */
        isOpenOnDay(day) {
            if (!this.operating_hours)
                return false;
            const hours = this.operating_hours[day];
            return hours !== undefined && hours.open !== null && hours.close !== null;
        }
        /**
         * Get operating hours for a specific day
         */
        getHoursForDay(day) {
            if (!this.operating_hours)
                return null;
            const hours = this.operating_hours[day];
            if (!hours || hours.open === null || hours.close === null)
                return null;
            return { open: hours.open, close: hours.close };
        }
        /**
         * Check if pharmacy has GPS coordinates for delivery routing
         */
        hasLocation() {
            return this.latitude !== null && this.longitude !== null;
        }
        /**
         * Soft delete pharmacy
         */
        softDelete() {
            this.deleted_at = new Date();
            this.subscription_status = SubscriptionStatus.CANCELLED;
        }
        /**
         * Suspend pharmacy subscription
         */
        suspend() {
            this.subscription_status = SubscriptionStatus.SUSPENDED;
        }
        /**
         * Activate pharmacy subscription
         */
        activate() {
            this.subscription_status = SubscriptionStatus.ACTIVE;
        }
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            // ============================================================================
            // Identity
            // ============================================================================
            this.name = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _name_initializers, void 0));
            this.license_number = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _license_number_initializers, void 0)); // Swiss pharmacy license
            // ============================================================================
            // Location (encrypted for privacy)
            // ============================================================================
            this.address_encrypted = (__runInitializers(this, _license_number_extraInitializers), __runInitializers(this, _address_encrypted_initializers, void 0)); // AWS KMS encrypted
            this.city = (__runInitializers(this, _address_encrypted_extraInitializers), __runInitializers(this, _city_initializers, void 0)); // Plaintext for reporting
            this.canton = (__runInitializers(this, _city_extraInitializers), __runInitializers(this, _canton_initializers, void 0)); // Swiss canton (VD, GE, ZH, etc.)
            this.postal_code = (__runInitializers(this, _canton_extraInitializers), __runInitializers(this, _postal_code_initializers, void 0));
            this.latitude = (__runInitializers(this, _postal_code_extraInitializers), __runInitializers(this, _latitude_initializers, void 0)); // For delivery routing
            this.longitude = (__runInitializers(this, _latitude_extraInitializers), __runInitializers(this, _longitude_initializers, void 0));
            // ============================================================================
            // Contact
            // ============================================================================
            this.phone = (__runInitializers(this, _longitude_extraInitializers), __runInitializers(this, _phone_initializers, void 0));
            this.email = (__runInitializers(this, _phone_extraInitializers), __runInitializers(this, _email_initializers, void 0));
            // ============================================================================
            // Operating Hours (JSON for flexibility)
            // ============================================================================
            this.operating_hours = (__runInitializers(this, _email_extraInitializers), __runInitializers(this, _operating_hours_initializers, void 0));
            // ============================================================================
            // Subscription
            // ============================================================================
            this.subscription_tier = (__runInitializers(this, _operating_hours_extraInitializers), __runInitializers(this, _subscription_tier_initializers, void 0));
            this.subscription_status = (__runInitializers(this, _subscription_tier_extraInitializers), __runInitializers(this, _subscription_status_initializers, void 0));
            // ============================================================================
            // Relationships
            // ============================================================================
            this.users = (__runInitializers(this, _subscription_status_extraInitializers), __runInitializers(this, _users_initializers, void 0));
            // TODO: Add relationships for Prescription, Teleconsultation, InventoryItem, etc. in later migrations
            // ============================================================================
            // Metadata
            // ============================================================================
            this.created_at = (__runInitializers(this, _users_extraInitializers), __runInitializers(this, _created_at_initializers, void 0));
            this.updated_at = (__runInitializers(this, _created_at_extraInitializers), __runInitializers(this, _updated_at_initializers, void 0));
            this.deleted_at = (__runInitializers(this, _updated_at_extraInitializers), __runInitializers(this, _deleted_at_initializers, void 0)); // Soft delete
            __runInitializers(this, _deleted_at_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "Pharmacy");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _name_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255 })];
        _license_number_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 100, unique: true })];
        _address_encrypted_decorators = [(0, typeorm_1.Column)({ type: 'blob' })];
        _city_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 100 })];
        _canton_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 50 }), (0, typeorm_1.Index)('idx_pharmacies_canton')];
        _postal_code_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 10 })];
        _latitude_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 8, nullable: true })];
        _longitude_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 11, scale: 8, nullable: true })];
        _phone_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true })];
        _email_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true })];
        _operating_hours_decorators = [(0, typeorm_1.Column)({ type: 'simple-json', nullable: true })];
        _subscription_tier_decorators = [(0, typeorm_1.Column)({
                type: 'varchar',
                length: 50,
                default: SubscriptionTier.BASIC,
            })];
        _subscription_status_decorators = [(0, typeorm_1.Column)({
                type: 'varchar',
                length: 50,
                default: SubscriptionStatus.ACTIVE,
            }), (0, typeorm_1.Index)('idx_pharmacies_status')];
        _users_decorators = [(0, typeorm_1.OneToMany)(() => User_1.User, (user) => user.primary_pharmacy)];
        _created_at_decorators = [(0, typeorm_1.CreateDateColumn)({ type: 'datetime' })];
        _updated_at_decorators = [(0, typeorm_1.UpdateDateColumn)({ type: 'datetime' })];
        _deleted_at_decorators = [(0, typeorm_1.Column)({ type: 'datetime', nullable: true })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: obj => "name" in obj, get: obj => obj.name, set: (obj, value) => { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
        __esDecorate(null, null, _license_number_decorators, { kind: "field", name: "license_number", static: false, private: false, access: { has: obj => "license_number" in obj, get: obj => obj.license_number, set: (obj, value) => { obj.license_number = value; } }, metadata: _metadata }, _license_number_initializers, _license_number_extraInitializers);
        __esDecorate(null, null, _address_encrypted_decorators, { kind: "field", name: "address_encrypted", static: false, private: false, access: { has: obj => "address_encrypted" in obj, get: obj => obj.address_encrypted, set: (obj, value) => { obj.address_encrypted = value; } }, metadata: _metadata }, _address_encrypted_initializers, _address_encrypted_extraInitializers);
        __esDecorate(null, null, _city_decorators, { kind: "field", name: "city", static: false, private: false, access: { has: obj => "city" in obj, get: obj => obj.city, set: (obj, value) => { obj.city = value; } }, metadata: _metadata }, _city_initializers, _city_extraInitializers);
        __esDecorate(null, null, _canton_decorators, { kind: "field", name: "canton", static: false, private: false, access: { has: obj => "canton" in obj, get: obj => obj.canton, set: (obj, value) => { obj.canton = value; } }, metadata: _metadata }, _canton_initializers, _canton_extraInitializers);
        __esDecorate(null, null, _postal_code_decorators, { kind: "field", name: "postal_code", static: false, private: false, access: { has: obj => "postal_code" in obj, get: obj => obj.postal_code, set: (obj, value) => { obj.postal_code = value; } }, metadata: _metadata }, _postal_code_initializers, _postal_code_extraInitializers);
        __esDecorate(null, null, _latitude_decorators, { kind: "field", name: "latitude", static: false, private: false, access: { has: obj => "latitude" in obj, get: obj => obj.latitude, set: (obj, value) => { obj.latitude = value; } }, metadata: _metadata }, _latitude_initializers, _latitude_extraInitializers);
        __esDecorate(null, null, _longitude_decorators, { kind: "field", name: "longitude", static: false, private: false, access: { has: obj => "longitude" in obj, get: obj => obj.longitude, set: (obj, value) => { obj.longitude = value; } }, metadata: _metadata }, _longitude_initializers, _longitude_extraInitializers);
        __esDecorate(null, null, _phone_decorators, { kind: "field", name: "phone", static: false, private: false, access: { has: obj => "phone" in obj, get: obj => obj.phone, set: (obj, value) => { obj.phone = value; } }, metadata: _metadata }, _phone_initializers, _phone_extraInitializers);
        __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: obj => "email" in obj, get: obj => obj.email, set: (obj, value) => { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
        __esDecorate(null, null, _operating_hours_decorators, { kind: "field", name: "operating_hours", static: false, private: false, access: { has: obj => "operating_hours" in obj, get: obj => obj.operating_hours, set: (obj, value) => { obj.operating_hours = value; } }, metadata: _metadata }, _operating_hours_initializers, _operating_hours_extraInitializers);
        __esDecorate(null, null, _subscription_tier_decorators, { kind: "field", name: "subscription_tier", static: false, private: false, access: { has: obj => "subscription_tier" in obj, get: obj => obj.subscription_tier, set: (obj, value) => { obj.subscription_tier = value; } }, metadata: _metadata }, _subscription_tier_initializers, _subscription_tier_extraInitializers);
        __esDecorate(null, null, _subscription_status_decorators, { kind: "field", name: "subscription_status", static: false, private: false, access: { has: obj => "subscription_status" in obj, get: obj => obj.subscription_status, set: (obj, value) => { obj.subscription_status = value; } }, metadata: _metadata }, _subscription_status_initializers, _subscription_status_extraInitializers);
        __esDecorate(null, null, _users_decorators, { kind: "field", name: "users", static: false, private: false, access: { has: obj => "users" in obj, get: obj => obj.users, set: (obj, value) => { obj.users = value; } }, metadata: _metadata }, _users_initializers, _users_extraInitializers);
        __esDecorate(null, null, _created_at_decorators, { kind: "field", name: "created_at", static: false, private: false, access: { has: obj => "created_at" in obj, get: obj => obj.created_at, set: (obj, value) => { obj.created_at = value; } }, metadata: _metadata }, _created_at_initializers, _created_at_extraInitializers);
        __esDecorate(null, null, _updated_at_decorators, { kind: "field", name: "updated_at", static: false, private: false, access: { has: obj => "updated_at" in obj, get: obj => obj.updated_at, set: (obj, value) => { obj.updated_at = value; } }, metadata: _metadata }, _updated_at_initializers, _updated_at_extraInitializers);
        __esDecorate(null, null, _deleted_at_decorators, { kind: "field", name: "deleted_at", static: false, private: false, access: { has: obj => "deleted_at" in obj, get: obj => obj.deleted_at, set: (obj, value) => { obj.deleted_at = value; } }, metadata: _metadata }, _deleted_at_initializers, _deleted_at_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Pharmacy = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Pharmacy = _classThis;
})();
exports.Pharmacy = Pharmacy;
//# sourceMappingURL=Pharmacy.js.map