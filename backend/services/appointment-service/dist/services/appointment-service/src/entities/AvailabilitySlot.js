"use strict";
/**
 * AvailabilitySlot Entity
 * Defines when healthcare professionals are available for appointments
 * Supports recurring slots (same time every week) and blocked time periods
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
exports.AvailabilitySlot = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("@shared/models/User");
let AvailabilitySlot = class AvailabilitySlot {
    // ============================================================================
    // Helper Methods
    // ============================================================================
    /**
     * Check if slot is soft deleted
     */
    isDeleted() {
        return this.deleted_at !== null;
    }
    /**
     * Soft delete slot
     */
    softDelete() {
        this.deleted_at = new Date();
    }
    /**
     * Check if slot is available for booking
     */
    isAvailable() {
        return (!this.isDeleted() &&
            this.is_active &&
            !this.is_blocked &&
            (this.booked_count < this.capacity));
    }
    /**
     * Check if slot capacity is full
     */
    isFull() {
        return this.booked_count >= this.capacity;
    }
    /**
     * Get available spaces in slot
     */
    getAvailableSpaces() {
        return Math.max(0, this.capacity - this.booked_count);
    }
    /**
     * Check if slot should still be available (for recurring slots with end_date)
     */
    isStillRecurring() {
        if (!this.is_recurring || !this.end_date) {
            return this.is_recurring;
        }
        return new Date() <= this.end_date;
    }
    /**
     * Get day name for this slot
     */
    getDayName() {
        const days = [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
        ];
        return days[this.day_of_week];
    }
    /**
     * Check if slot matches a specific date and day of week
     */
    matchesDate(date) {
        return date.getDay() === this.day_of_week;
    }
    /**
     * Reserve a spot in this slot
     */
    reserve() {
        if (!this.isFull()) {
            this.booked_count++;
        }
    }
    /**
     * Cancel a reservation in this slot
     */
    cancelReservation() {
        if (this.booked_count > 0) {
            this.booked_count--;
        }
    }
    /**
     * Block this slot with a reason
     */
    block(reason) {
        this.is_blocked = true;
        this.blocked_reason = reason;
    }
    /**
     * Unblock this slot
     */
    unblock() {
        this.is_blocked = false;
        this.blocked_reason = null;
    }
};
exports.AvailabilitySlot = AvailabilitySlot;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AvailabilitySlot.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)('idx_availability_slots_provider_id_active'),
    __metadata("design:type", String)
], AvailabilitySlot.prototype, "provider_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'provider_id' }),
    __metadata("design:type", User_1.User)
], AvailabilitySlot.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer' }),
    __metadata("design:type", Number)
], AvailabilitySlot.prototype, "day_of_week", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time' }),
    __metadata("design:type", String)
], AvailabilitySlot.prototype, "start_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time' }),
    __metadata("design:type", String)
], AvailabilitySlot.prototype, "end_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 1 }),
    __metadata("design:type", Number)
], AvailabilitySlot.prototype, "capacity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'UTC' }),
    __metadata("design:type", String)
], AvailabilitySlot.prototype, "timezone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], AvailabilitySlot.prototype, "is_recurring", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], AvailabilitySlot.prototype, "end_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], AvailabilitySlot.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], AvailabilitySlot.prototype, "booked_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", Object)
], AvailabilitySlot.prototype, "full_until", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], AvailabilitySlot.prototype, "is_blocked", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], AvailabilitySlot.prototype, "blocked_reason", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], AvailabilitySlot.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], AvailabilitySlot.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", Object)
], AvailabilitySlot.prototype, "deleted_at", void 0);
exports.AvailabilitySlot = AvailabilitySlot = __decorate([
    (0, typeorm_1.Entity)('availability_slots'),
    (0, typeorm_1.Index)('idx_availability_slots_provider_id', ['provider_id']),
    (0, typeorm_1.Index)('idx_availability_slots_day_of_week', ['day_of_week']),
    (0, typeorm_1.Index)('idx_availability_slots_is_active', ['is_active'])
], AvailabilitySlot);
//# sourceMappingURL=AvailabilitySlot.js.map