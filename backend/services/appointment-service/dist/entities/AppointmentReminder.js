"use strict";
/**
 * AppointmentReminder Entity
 * Tracks reminders sent to patients and providers for upcoming appointments
 * Supports multiple reminder types: email, SMS, in-app, notifications
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
exports.AppointmentReminder = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("@shared/models/User");
const Appointment_1 = require("./Appointment");
const appointment_types_1 = require("../types/appointment.types");
let AppointmentReminder = class AppointmentReminder {
    // ============================================================================
    // Helper Methods
    // ============================================================================
    /**
     * Check if reminder is soft deleted
     */
    isDeleted() {
        return this.deleted_at !== null;
    }
    /**
     * Soft delete reminder
     */
    softDelete() {
        this.deleted_at = new Date();
    }
    /**
     * Check if reminder is due to be sent
     */
    isDue() {
        const now = new Date();
        return (this.status === appointment_types_1.ReminderStatus.PENDING &&
            now >= this.scheduled_at &&
            !this.isDeleted());
    }
    /**
     * Check if reminder has been sent
     */
    hasBeenSent() {
        return this.status === appointment_types_1.ReminderStatus.SENT && this.sent_at !== null;
    }
    /**
     * Check if reminder failed to send
     */
    hasFailed() {
        return this.status === appointment_types_1.ReminderStatus.FAILED;
    }
    /**
     * Mark reminder as sent
     */
    markAsSent() {
        this.status = appointment_types_1.ReminderStatus.SENT;
        this.sent_at = new Date();
    }
    /**
     * Mark reminder as failed
     */
    markAsFailed(reason) {
        this.status = appointment_types_1.ReminderStatus.FAILED;
        this.failed_reason = reason;
    }
    /**
     * Reset reminder for retry
     */
    resetForRetry() {
        this.status = appointment_types_1.ReminderStatus.PENDING;
        this.sent_at = null;
        this.failed_reason = null;
        this.retry_count = (this.retry_count || 0) + 1;
    }
};
exports.AppointmentReminder = AppointmentReminder;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AppointmentReminder.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], AppointmentReminder.prototype, "appointment_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Appointment_1.Appointment, (appointment) => appointment.reminders, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'appointment_id' }),
    __metadata("design:type", Appointment_1.Appointment)
], AppointmentReminder.prototype, "appointment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], AppointmentReminder.prototype, "recipient_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'recipient_id' }),
    __metadata("design:type", User_1.User)
], AppointmentReminder.prototype, "recipient", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: appointment_types_1.ReminderType,
        default: appointment_types_1.ReminderType.IN_APP,
    }),
    __metadata("design:type", String)
], AppointmentReminder.prototype, "reminder_type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: appointment_types_1.ReminderStatus,
        default: appointment_types_1.ReminderStatus.PENDING,
    }),
    __metadata("design:type", String)
], AppointmentReminder.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer' }),
    __metadata("design:type", Number)
], AppointmentReminder.prototype, "hours_before_start", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], AppointmentReminder.prototype, "scheduled_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", Object)
], AppointmentReminder.prototype, "sent_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], AppointmentReminder.prototype, "failed_reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], AppointmentReminder.prototype, "retry_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", Object)
], AppointmentReminder.prototype, "deleted_at", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], AppointmentReminder.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], AppointmentReminder.prototype, "updated_at", void 0);
exports.AppointmentReminder = AppointmentReminder = __decorate([
    (0, typeorm_1.Entity)('appointment_reminders'),
    (0, typeorm_1.Index)('idx_appointment_reminders_appointment_id', ['appointment_id']),
    (0, typeorm_1.Index)('idx_appointment_reminders_recipient_id', ['recipient_id']),
    (0, typeorm_1.Index)('idx_appointment_reminders_status', ['status']),
    (0, typeorm_1.Index)('idx_appointment_reminders_scheduled_at', ['scheduled_at'])
], AppointmentReminder);
//# sourceMappingURL=AppointmentReminder.js.map