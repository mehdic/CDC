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
exports.User = exports.UserStatus = exports.UserRole = void 0;
const typeorm_1 = require("typeorm");
const Pharmacy_1 = require("./Pharmacy");
const AuditTrailEntry_1 = require("./AuditTrailEntry");
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
let User = class User {
    id;
    email;
    email_verified;
    password_hash;
    hin_id;
    role;
    status;
    first_name_encrypted;
    last_name_encrypted;
    phone_encrypted;
    mfa_enabled;
    mfa_secret;
    mfa_secret_encrypted;
    primary_pharmacy_id;
    primary_pharmacy;
    audit_trail_entries;
    created_at;
    updated_at;
    last_login_at;
    deleted_at;
    isDeleted() {
        return this.deleted_at !== null;
    }
    isActive() {
        return this.status === UserStatus.ACTIVE && !this.isDeleted();
    }
    hasMFA() {
        return this.mfa_enabled && (this.mfa_secret_encrypted !== null || this.mfa_secret !== null);
    }
    isHealthcareProfessional() {
        return (this.role === UserRole.PHARMACIST ||
            this.role === UserRole.DOCTOR ||
            this.role === UserRole.NURSE);
    }
    hasHINAuth() {
        return this.hin_id !== null;
    }
    softDelete() {
        this.deleted_at = new Date();
        this.status = UserStatus.INACTIVE;
    }
    updateLastLogin() {
        this.last_login_at = new Date();
    }
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, unique: true }),
    (0, typeorm_1.Index)('idx_users_email'),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "email_verified", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "password_hash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, unique: true, nullable: true }),
    (0, typeorm_1.Index)('idx_users_hin_id'),
    __metadata("design:type", Object)
], User.prototype, "hin_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: UserRole,
    }),
    (0, typeorm_1.Index)('idx_users_role'),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: UserStatus,
        default: UserStatus.ACTIVE,
    }),
    __metadata("design:type", String)
], User.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bytea' }),
    __metadata("design:type", Buffer)
], User.prototype, "first_name_encrypted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bytea' }),
    __metadata("design:type", Buffer)
], User.prototype, "last_name_encrypted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bytea', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "phone_encrypted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "mfa_enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "mfa_secret", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bytea', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "mfa_secret_encrypted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    (0, typeorm_1.Index)('idx_users_pharmacy'),
    __metadata("design:type", Object)
], User.prototype, "primary_pharmacy_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Pharmacy_1.Pharmacy, (pharmacy) => pharmacy.users, {
        onDelete: 'SET NULL',
        nullable: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'primary_pharmacy_id' }),
    __metadata("design:type", Object)
], User.prototype, "primary_pharmacy", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => AuditTrailEntry_1.AuditTrailEntry, (auditEntry) => auditEntry.user),
    __metadata("design:type", Array)
], User.prototype, "audit_trail_entries", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], User.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], User.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "last_login_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "deleted_at", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users')
], User);
//# sourceMappingURL=User.js.map