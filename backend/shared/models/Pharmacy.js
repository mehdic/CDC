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
let Pharmacy = class Pharmacy {
    id;
    name;
    license_number;
    address_encrypted;
    city;
    canton;
    postal_code;
    latitude;
    longitude;
    phone;
    email;
    operating_hours;
    subscription_tier;
    subscription_status;
    users;
    created_at;
    updated_at;
    deleted_at;
    isDeleted() {
        return this.deleted_at !== null;
    }
    isActive() {
        return (this.subscription_status === SubscriptionStatus.ACTIVE && !this.isDeleted());
    }
    isTrial() {
        return this.subscription_status === SubscriptionStatus.TRIAL;
    }
    isEnterprise() {
        return this.subscription_tier === SubscriptionTier.ENTERPRISE;
    }
    isOpenOnDay(day) {
        if (!this.operating_hours)
            return false;
        const hours = this.operating_hours[day];
        return hours !== undefined && hours.open !== null && hours.close !== null;
    }
    getHoursForDay(day) {
        if (!this.operating_hours)
            return null;
        const hours = this.operating_hours[day];
        if (!hours || hours.open === null || hours.close === null)
            return null;
        return { open: hours.open, close: hours.close };
    }
    hasLocation() {
        return this.latitude !== null && this.longitude !== null;
    }
    softDelete() {
        this.deleted_at = new Date();
        this.subscription_status = SubscriptionStatus.CANCELLED;
    }
    suspend() {
        this.subscription_status = SubscriptionStatus.SUSPENDED;
    }
    activate() {
        this.subscription_status = SubscriptionStatus.ACTIVE;
    }
};
exports.Pharmacy = Pharmacy;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Pharmacy.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Pharmacy.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, unique: true }),
    __metadata("design:type", String)
], Pharmacy.prototype, "license_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bytea' }),
    __metadata("design:type", Buffer)
], Pharmacy.prototype, "address_encrypted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], Pharmacy.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    (0, typeorm_1.Index)('idx_pharmacies_canton'),
    __metadata("design:type", String)
], Pharmacy.prototype, "canton", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10 }),
    __metadata("design:type", String)
], Pharmacy.prototype, "postal_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 8, nullable: true }),
    __metadata("design:type", Number)
], Pharmacy.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 11, scale: 8, nullable: true }),
    __metadata("design:type", Number)
], Pharmacy.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], Pharmacy.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Pharmacy.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Pharmacy.prototype, "operating_hours", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: SubscriptionTier,
        default: SubscriptionTier.BASIC,
    }),
    __metadata("design:type", String)
], Pharmacy.prototype, "subscription_tier", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: SubscriptionStatus,
        default: SubscriptionStatus.ACTIVE,
    }),
    (0, typeorm_1.Index)('idx_pharmacies_status'),
    __metadata("design:type", String)
], Pharmacy.prototype, "subscription_status", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => User_1.User, (user) => user.primary_pharmacy),
    __metadata("design:type", Array)
], Pharmacy.prototype, "users", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Pharmacy.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Pharmacy.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Pharmacy.prototype, "deleted_at", void 0);
exports.Pharmacy = Pharmacy = __decorate([
    (0, typeorm_1.Entity)('pharmacies')
], Pharmacy);
//# sourceMappingURL=Pharmacy.js.map