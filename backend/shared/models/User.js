"use strict";
/**
 * User Entity
 * All platform users across 5 roles: Pharmacist, Doctor, Nurse, Delivery Personnel, Patient
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
exports.User = exports.UserStatus = exports.UserRole = void 0;
const typeorm_1 = require("typeorm");
const Pharmacy_1 = require("./Pharmacy");
const AuditTrailEntry_1 = require("./AuditTrailEntry");
const Cart_1 = require("./Cart");
var UserRole;
(function (UserRole) {
    UserRole["PHARMACIST"] = "pharmacist";
    UserRole["DOCTOR"] = "doctor";
    UserRole["NURSE"] = "nurse";
    UserRole["DELIVERY"] = "delivery";
    UserRole["PATIENT"] = "patient";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "active";
    UserStatus["INACTIVE"] = "inactive";
    UserStatus["SUSPENDED"] = "suspended";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
let User = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('users')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _email_decorators;
    let _email_initializers = [];
    let _email_extraInitializers = [];
    let _email_verified_decorators;
    let _email_verified_initializers = [];
    let _email_verified_extraInitializers = [];
    let _password_hash_decorators;
    let _password_hash_initializers = [];
    let _password_hash_extraInitializers = [];
    let _hin_id_decorators;
    let _hin_id_initializers = [];
    let _hin_id_extraInitializers = [];
    let _role_decorators;
    let _role_initializers = [];
    let _role_extraInitializers = [];
    let _status_decorators;
    let _status_initializers = [];
    let _status_extraInitializers = [];
    let _first_name_encrypted_decorators;
    let _first_name_encrypted_initializers = [];
    let _first_name_encrypted_extraInitializers = [];
    let _last_name_encrypted_decorators;
    let _last_name_encrypted_initializers = [];
    let _last_name_encrypted_extraInitializers = [];
    let _phone_encrypted_decorators;
    let _phone_encrypted_initializers = [];
    let _phone_encrypted_extraInitializers = [];
    let _mfa_enabled_decorators;
    let _mfa_enabled_initializers = [];
    let _mfa_enabled_extraInitializers = [];
    let _mfa_secret_decorators;
    let _mfa_secret_initializers = [];
    let _mfa_secret_extraInitializers = [];
    let _mfa_secret_encrypted_decorators;
    let _mfa_secret_encrypted_initializers = [];
    let _mfa_secret_encrypted_extraInitializers = [];
    let _primary_pharmacy_id_decorators;
    let _primary_pharmacy_id_initializers = [];
    let _primary_pharmacy_id_extraInitializers = [];
    let _primary_pharmacy_decorators;
    let _primary_pharmacy_initializers = [];
    let _primary_pharmacy_extraInitializers = [];
    let _master_account_id_decorators;
    let _master_account_id_initializers = [];
    let _master_account_id_extraInitializers = [];
    let _master_account_decorators;
    let _master_account_initializers = [];
    let _master_account_extraInitializers = [];
    let _permissions_override_decorators;
    let _permissions_override_initializers = [];
    let _permissions_override_extraInitializers = [];
    let _sub_accounts_decorators;
    let _sub_accounts_initializers = [];
    let _sub_accounts_extraInitializers = [];
    let _audit_trail_entries_decorators;
    let _audit_trail_entries_initializers = [];
    let _audit_trail_entries_extraInitializers = [];
    let _carts_decorators;
    let _carts_initializers = [];
    let _carts_extraInitializers = [];
    let _created_at_decorators;
    let _created_at_initializers = [];
    let _created_at_extraInitializers = [];
    let _updated_at_decorators;
    let _updated_at_initializers = [];
    let _updated_at_extraInitializers = [];
    let _last_login_at_decorators;
    let _last_login_at_initializers = [];
    let _last_login_at_extraInitializers = [];
    let _deleted_at_decorators;
    let _deleted_at_initializers = [];
    let _deleted_at_extraInitializers = [];
    var User = _classThis = class {
        // ============================================================================
        // Helper Methods
        // ============================================================================
        /**
         * Check if user is soft deleted
         */
        isDeleted() {
            return this.deleted_at !== null;
        }
        /**
         * Check if user is active
         */
        isActive() {
            return this.status === UserStatus.ACTIVE && !this.isDeleted();
        }
        /**
         * Check if user has MFA enabled
         */
        hasMFA() {
            return this.mfa_enabled && (this.mfa_secret_encrypted !== null || this.mfa_secret !== null);
        }
        /**
         * Check if user is a healthcare professional (requires MFA)
         */
        isHealthcareProfessional() {
            return (this.role === UserRole.PHARMACIST ||
                this.role === UserRole.DOCTOR ||
                this.role === UserRole.NURSE);
        }
        /**
         * Check if user has HIN e-ID authentication
         */
        hasHINAuth() {
            return this.hin_id !== null;
        }
        /**
         * Soft delete user
         */
        softDelete() {
            this.deleted_at = new Date();
            this.status = UserStatus.INACTIVE;
        }
        /**
         * Update last login timestamp
         */
        updateLastLogin() {
            this.last_login_at = new Date();
        }
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            // ============================================================================
            // Identity
            // ============================================================================
            this.email = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _email_initializers, void 0));
            this.email_verified = (__runInitializers(this, _email_extraInitializers), __runInitializers(this, _email_verified_initializers, void 0));
            this.password_hash = (__runInitializers(this, _email_verified_extraInitializers), __runInitializers(this, _password_hash_initializers, void 0)); // Null if HIN e-ID only
            this.hin_id = (__runInitializers(this, _password_hash_extraInitializers), __runInitializers(this, _hin_id_initializers, void 0)); // Swiss HIN e-ID for doctors and pharmacists
            // ============================================================================
            // Role & Status
            // ============================================================================
            this.role = (__runInitializers(this, _hin_id_extraInitializers), __runInitializers(this, _role_initializers, void 0));
            this.status = (__runInitializers(this, _role_extraInitializers), __runInitializers(this, _status_initializers, void 0));
            // ============================================================================
            // Profile (encrypted with AWS KMS)
            // ============================================================================
            this.first_name_encrypted = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _first_name_encrypted_initializers, void 0)); // AWS KMS encrypted PHI
            this.last_name_encrypted = (__runInitializers(this, _first_name_encrypted_extraInitializers), __runInitializers(this, _last_name_encrypted_initializers, void 0)); // AWS KMS encrypted PHI
            this.phone_encrypted = (__runInitializers(this, _last_name_encrypted_extraInitializers), __runInitializers(this, _phone_encrypted_initializers, void 0)); // AWS KMS encrypted PHI
            // ============================================================================
            // MFA (Multi-Factor Authentication)
            // ============================================================================
            this.mfa_enabled = (__runInitializers(this, _phone_encrypted_extraInitializers), __runInitializers(this, _mfa_enabled_initializers, void 0));
            this.mfa_secret = (__runInitializers(this, _mfa_enabled_extraInitializers), __runInitializers(this, _mfa_secret_initializers, void 0)); // DEPRECATED: Use mfa_secret_encrypted instead
            this.mfa_secret_encrypted = (__runInitializers(this, _mfa_secret_extraInitializers), __runInitializers(this, _mfa_secret_encrypted_initializers, void 0)); // AWS KMS encrypted TOTP secret (FR-104)
            // ============================================================================
            // Affiliations
            // ============================================================================
            this.primary_pharmacy_id = (__runInitializers(this, _mfa_secret_encrypted_extraInitializers), __runInitializers(this, _primary_pharmacy_id_initializers, void 0));
            this.primary_pharmacy = (__runInitializers(this, _primary_pharmacy_id_extraInitializers), __runInitializers(this, _primary_pharmacy_initializers, void 0));
            // Master Account Management (for sub-accounts)
            this.master_account_id = (__runInitializers(this, _primary_pharmacy_extraInitializers), __runInitializers(this, _master_account_id_initializers, void 0)); // Reference to master account user
            this.master_account = (__runInitializers(this, _master_account_id_extraInitializers), __runInitializers(this, _master_account_initializers, void 0));
            this.permissions_override = (__runInitializers(this, _master_account_extraInitializers), __runInitializers(this, _permissions_override_initializers, void 0)); // Custom permissions (TypeORM auto-parses JSON)
            // ============================================================================
            // Relationships
            // ============================================================================
            this.sub_accounts = (__runInitializers(this, _permissions_override_extraInitializers), __runInitializers(this, _sub_accounts_initializers, void 0));
            this.audit_trail_entries = (__runInitializers(this, _sub_accounts_extraInitializers), __runInitializers(this, _audit_trail_entries_initializers, void 0));
            this.carts = (__runInitializers(this, _audit_trail_entries_extraInitializers), __runInitializers(this, _carts_initializers, void 0));
            // TODO: Add relationships for Prescription, Teleconsultation, etc. in later migrations
            // ============================================================================
            // Metadata
            // ============================================================================
            this.created_at = (__runInitializers(this, _carts_extraInitializers), __runInitializers(this, _created_at_initializers, void 0));
            this.updated_at = (__runInitializers(this, _created_at_extraInitializers), __runInitializers(this, _updated_at_initializers, void 0));
            this.last_login_at = (__runInitializers(this, _updated_at_extraInitializers), __runInitializers(this, _last_login_at_initializers, void 0));
            this.deleted_at = (__runInitializers(this, _last_login_at_extraInitializers), __runInitializers(this, _deleted_at_initializers, void 0)); // Soft delete
            __runInitializers(this, _deleted_at_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "User");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _email_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255, unique: true }), (0, typeorm_1.Index)('idx_users_email')];
        _email_verified_decorators = [(0, typeorm_1.Column)({ type: 'boolean', default: false })];
        _password_hash_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true })];
        _hin_id_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 100, unique: true, nullable: true }), (0, typeorm_1.Index)('idx_users_hin_id')];
        _role_decorators = [(0, typeorm_1.Column)({
                type: 'varchar',
                length: 50,
            }), (0, typeorm_1.Index)('idx_users_role')];
        _status_decorators = [(0, typeorm_1.Column)({
                type: 'varchar',
                length: 50,
                default: UserStatus.ACTIVE,
            })];
        _first_name_encrypted_decorators = [(0, typeorm_1.Column)({ type: 'blob' })];
        _last_name_encrypted_decorators = [(0, typeorm_1.Column)({ type: 'blob' })];
        _phone_encrypted_decorators = [(0, typeorm_1.Column)({ type: 'blob', nullable: true })];
        _mfa_enabled_decorators = [(0, typeorm_1.Column)({ type: 'boolean', default: false })];
        _mfa_secret_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true })];
        _mfa_secret_encrypted_decorators = [(0, typeorm_1.Column)({ type: 'blob', nullable: true })];
        _primary_pharmacy_id_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }), (0, typeorm_1.Index)('idx_users_pharmacy')];
        _primary_pharmacy_decorators = [(0, typeorm_1.ManyToOne)(() => Pharmacy_1.Pharmacy, (pharmacy) => pharmacy.users, {
                onDelete: 'SET NULL',
                nullable: true,
            }), (0, typeorm_1.JoinColumn)({ name: 'primary_pharmacy_id' })];
        _master_account_id_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }), (0, typeorm_1.Index)('idx_users_master_account')];
        _master_account_decorators = [(0, typeorm_1.ManyToOne)(() => User, (user) => user.sub_accounts, {
                onDelete: 'RESTRICT',
                nullable: true,
            }), (0, typeorm_1.JoinColumn)({ name: 'master_account_id' })];
        _permissions_override_decorators = [(0, typeorm_1.Column)({ type: 'simple-json', nullable: true })];
        _sub_accounts_decorators = [(0, typeorm_1.OneToMany)(() => User, (user) => user.master_account)];
        _audit_trail_entries_decorators = [(0, typeorm_1.OneToMany)(() => AuditTrailEntry_1.AuditTrailEntry, (auditEntry) => auditEntry.user)];
        _carts_decorators = [(0, typeorm_1.OneToMany)(() => Cart_1.Cart, (cart) => cart.user)];
        _created_at_decorators = [(0, typeorm_1.CreateDateColumn)({ type: 'datetime' })];
        _updated_at_decorators = [(0, typeorm_1.UpdateDateColumn)({ type: 'datetime' })];
        _last_login_at_decorators = [(0, typeorm_1.Column)({ type: 'datetime', nullable: true })];
        _deleted_at_decorators = [(0, typeorm_1.Column)({ type: 'datetime', nullable: true })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: obj => "email" in obj, get: obj => obj.email, set: (obj, value) => { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
        __esDecorate(null, null, _email_verified_decorators, { kind: "field", name: "email_verified", static: false, private: false, access: { has: obj => "email_verified" in obj, get: obj => obj.email_verified, set: (obj, value) => { obj.email_verified = value; } }, metadata: _metadata }, _email_verified_initializers, _email_verified_extraInitializers);
        __esDecorate(null, null, _password_hash_decorators, { kind: "field", name: "password_hash", static: false, private: false, access: { has: obj => "password_hash" in obj, get: obj => obj.password_hash, set: (obj, value) => { obj.password_hash = value; } }, metadata: _metadata }, _password_hash_initializers, _password_hash_extraInitializers);
        __esDecorate(null, null, _hin_id_decorators, { kind: "field", name: "hin_id", static: false, private: false, access: { has: obj => "hin_id" in obj, get: obj => obj.hin_id, set: (obj, value) => { obj.hin_id = value; } }, metadata: _metadata }, _hin_id_initializers, _hin_id_extraInitializers);
        __esDecorate(null, null, _role_decorators, { kind: "field", name: "role", static: false, private: false, access: { has: obj => "role" in obj, get: obj => obj.role, set: (obj, value) => { obj.role = value; } }, metadata: _metadata }, _role_initializers, _role_extraInitializers);
        __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: obj => "status" in obj, get: obj => obj.status, set: (obj, value) => { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
        __esDecorate(null, null, _first_name_encrypted_decorators, { kind: "field", name: "first_name_encrypted", static: false, private: false, access: { has: obj => "first_name_encrypted" in obj, get: obj => obj.first_name_encrypted, set: (obj, value) => { obj.first_name_encrypted = value; } }, metadata: _metadata }, _first_name_encrypted_initializers, _first_name_encrypted_extraInitializers);
        __esDecorate(null, null, _last_name_encrypted_decorators, { kind: "field", name: "last_name_encrypted", static: false, private: false, access: { has: obj => "last_name_encrypted" in obj, get: obj => obj.last_name_encrypted, set: (obj, value) => { obj.last_name_encrypted = value; } }, metadata: _metadata }, _last_name_encrypted_initializers, _last_name_encrypted_extraInitializers);
        __esDecorate(null, null, _phone_encrypted_decorators, { kind: "field", name: "phone_encrypted", static: false, private: false, access: { has: obj => "phone_encrypted" in obj, get: obj => obj.phone_encrypted, set: (obj, value) => { obj.phone_encrypted = value; } }, metadata: _metadata }, _phone_encrypted_initializers, _phone_encrypted_extraInitializers);
        __esDecorate(null, null, _mfa_enabled_decorators, { kind: "field", name: "mfa_enabled", static: false, private: false, access: { has: obj => "mfa_enabled" in obj, get: obj => obj.mfa_enabled, set: (obj, value) => { obj.mfa_enabled = value; } }, metadata: _metadata }, _mfa_enabled_initializers, _mfa_enabled_extraInitializers);
        __esDecorate(null, null, _mfa_secret_decorators, { kind: "field", name: "mfa_secret", static: false, private: false, access: { has: obj => "mfa_secret" in obj, get: obj => obj.mfa_secret, set: (obj, value) => { obj.mfa_secret = value; } }, metadata: _metadata }, _mfa_secret_initializers, _mfa_secret_extraInitializers);
        __esDecorate(null, null, _mfa_secret_encrypted_decorators, { kind: "field", name: "mfa_secret_encrypted", static: false, private: false, access: { has: obj => "mfa_secret_encrypted" in obj, get: obj => obj.mfa_secret_encrypted, set: (obj, value) => { obj.mfa_secret_encrypted = value; } }, metadata: _metadata }, _mfa_secret_encrypted_initializers, _mfa_secret_encrypted_extraInitializers);
        __esDecorate(null, null, _primary_pharmacy_id_decorators, { kind: "field", name: "primary_pharmacy_id", static: false, private: false, access: { has: obj => "primary_pharmacy_id" in obj, get: obj => obj.primary_pharmacy_id, set: (obj, value) => { obj.primary_pharmacy_id = value; } }, metadata: _metadata }, _primary_pharmacy_id_initializers, _primary_pharmacy_id_extraInitializers);
        __esDecorate(null, null, _primary_pharmacy_decorators, { kind: "field", name: "primary_pharmacy", static: false, private: false, access: { has: obj => "primary_pharmacy" in obj, get: obj => obj.primary_pharmacy, set: (obj, value) => { obj.primary_pharmacy = value; } }, metadata: _metadata }, _primary_pharmacy_initializers, _primary_pharmacy_extraInitializers);
        __esDecorate(null, null, _master_account_id_decorators, { kind: "field", name: "master_account_id", static: false, private: false, access: { has: obj => "master_account_id" in obj, get: obj => obj.master_account_id, set: (obj, value) => { obj.master_account_id = value; } }, metadata: _metadata }, _master_account_id_initializers, _master_account_id_extraInitializers);
        __esDecorate(null, null, _master_account_decorators, { kind: "field", name: "master_account", static: false, private: false, access: { has: obj => "master_account" in obj, get: obj => obj.master_account, set: (obj, value) => { obj.master_account = value; } }, metadata: _metadata }, _master_account_initializers, _master_account_extraInitializers);
        __esDecorate(null, null, _permissions_override_decorators, { kind: "field", name: "permissions_override", static: false, private: false, access: { has: obj => "permissions_override" in obj, get: obj => obj.permissions_override, set: (obj, value) => { obj.permissions_override = value; } }, metadata: _metadata }, _permissions_override_initializers, _permissions_override_extraInitializers);
        __esDecorate(null, null, _sub_accounts_decorators, { kind: "field", name: "sub_accounts", static: false, private: false, access: { has: obj => "sub_accounts" in obj, get: obj => obj.sub_accounts, set: (obj, value) => { obj.sub_accounts = value; } }, metadata: _metadata }, _sub_accounts_initializers, _sub_accounts_extraInitializers);
        __esDecorate(null, null, _audit_trail_entries_decorators, { kind: "field", name: "audit_trail_entries", static: false, private: false, access: { has: obj => "audit_trail_entries" in obj, get: obj => obj.audit_trail_entries, set: (obj, value) => { obj.audit_trail_entries = value; } }, metadata: _metadata }, _audit_trail_entries_initializers, _audit_trail_entries_extraInitializers);
        __esDecorate(null, null, _carts_decorators, { kind: "field", name: "carts", static: false, private: false, access: { has: obj => "carts" in obj, get: obj => obj.carts, set: (obj, value) => { obj.carts = value; } }, metadata: _metadata }, _carts_initializers, _carts_extraInitializers);
        __esDecorate(null, null, _created_at_decorators, { kind: "field", name: "created_at", static: false, private: false, access: { has: obj => "created_at" in obj, get: obj => obj.created_at, set: (obj, value) => { obj.created_at = value; } }, metadata: _metadata }, _created_at_initializers, _created_at_extraInitializers);
        __esDecorate(null, null, _updated_at_decorators, { kind: "field", name: "updated_at", static: false, private: false, access: { has: obj => "updated_at" in obj, get: obj => obj.updated_at, set: (obj, value) => { obj.updated_at = value; } }, metadata: _metadata }, _updated_at_initializers, _updated_at_extraInitializers);
        __esDecorate(null, null, _last_login_at_decorators, { kind: "field", name: "last_login_at", static: false, private: false, access: { has: obj => "last_login_at" in obj, get: obj => obj.last_login_at, set: (obj, value) => { obj.last_login_at = value; } }, metadata: _metadata }, _last_login_at_initializers, _last_login_at_extraInitializers);
        __esDecorate(null, null, _deleted_at_decorators, { kind: "field", name: "deleted_at", static: false, private: false, access: { has: obj => "deleted_at" in obj, get: obj => obj.deleted_at, set: (obj, value) => { obj.deleted_at = value; } }, metadata: _metadata }, _deleted_at_initializers, _deleted_at_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        User = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return User = _classThis;
})();
exports.User = User;
//# sourceMappingURL=User.js.map