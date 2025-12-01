"use strict";
/**
 * Appointment Entity
 * Represents scheduled appointments between healthcare professionals and patients
 * Supports: teleconsultations, in-person visits, home visits
 * HIPAA/GDPR Compliant - Healthcare appointment data with audit logging
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
exports.Appointment = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("@shared/models/User");
const AppointmentReminder_1 = require("./AppointmentReminder");
const appointment_types_1 = require("../types/appointment.types");
let Appointment = class Appointment {
    // ============================================================================
    // Helper Methods
    // ============================================================================
    /**
     * Check if appointment is soft deleted
     */
    isDeleted() {
        return this.deleted_at !== null;
    }
    /**
     * Soft delete appointment
     */
    softDelete() {
        this.deleted_at = new Date();
    }
    /**
     * Check if appointment is in the future
     */
    isFuture() {
        return new Date() < this.scheduled_start;
    }
    /**
     * Check if appointment has passed
     */
    isPast() {
        return new Date() > this.scheduled_end;
    }
    /**
     * Check if appointment is currently happening
     */
    isNow() {
        const now = new Date();
        return now >= this.scheduled_start && now <= this.scheduled_end;
    }
    /**
     * Check if appointment can be cancelled
     */
    canBeCancelled() {
        return (!this.isDeleted() &&
            this.status !== appointment_types_1.AppointmentStatus.CANCELLED &&
            this.status !== appointment_types_1.AppointmentStatus.COMPLETED &&
            this.isFuture());
    }
    /**
     * Get duration in minutes
     */
    getDurationMinutes() {
        return ((this.scheduled_end.getTime() - this.scheduled_start.getTime()) / 60000);
    }
    /**
     * Check if appointment is within reminder window (hours before start)
     */
    isWithinReminderWindow(hoursBeforeStart) {
        const now = new Date();
        const reminderTime = new Date(this.scheduled_start.getTime() - hoursBeforeStart * 3600000);
        return now >= reminderTime && now < this.scheduled_start;
    }
};
exports.Appointment = Appointment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Appointment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)('idx_appointments_provider_id'),
    __metadata("design:type", String)
], Appointment.prototype, "provider_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'provider_id' }),
    __metadata("design:type", User_1.User)
], Appointment.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)('idx_appointments_patient_id'),
    __metadata("design:type", String)
], Appointment.prototype, "patient_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'patient_id' }),
    __metadata("design:type", User_1.User)
], Appointment.prototype, "patient", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: appointment_types_1.AppointmentType,
        default: appointment_types_1.AppointmentType.TELECONSULTATION,
    }),
    __metadata("design:type", String)
], Appointment.prototype, "appointment_type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: appointment_types_1.AppointmentStatus,
        default: appointment_types_1.AppointmentStatus.PENDING,
    }),
    __metadata("design:type", String)
], Appointment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], Appointment.prototype, "scheduled_start", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], Appointment.prototype, "scheduled_end", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Appointment.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Appointment.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", Object)
], Appointment.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'UTC' }),
    __metadata("design:type", String)
], Appointment.prototype, "timezone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Appointment.prototype, "is_recurring", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Appointment.prototype, "recurring_appointment_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], Appointment.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], Appointment.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", Object)
], Appointment.prototype, "confirmed_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", Object)
], Appointment.prototype, "started_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", Object)
], Appointment.prototype, "completed_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", Object)
], Appointment.prototype, "cancelled_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", Object)
], Appointment.prototype, "cancellation_reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp with time zone', nullable: true }),
    __metadata("design:type", Object)
], Appointment.prototype, "deleted_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => AppointmentReminder_1.AppointmentReminder, (reminder) => reminder.appointment, { cascade: true }),
    __metadata("design:type", Array)
], Appointment.prototype, "reminders", void 0);
exports.Appointment = Appointment = __decorate([
    (0, typeorm_1.Entity)('appointments'),
    (0, typeorm_1.Index)('idx_appointments_provider_patient', ['provider_id', 'patient_id']),
    (0, typeorm_1.Index)('idx_appointments_status', ['status']),
    (0, typeorm_1.Index)('idx_appointments_scheduled_start', ['scheduled_start'])
], Appointment);
//# sourceMappingURL=Appointment.js.map