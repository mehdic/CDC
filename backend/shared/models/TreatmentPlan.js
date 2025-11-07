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
exports.TreatmentPlan = exports.TreatmentPlanStatus = void 0;
const typeorm_1 = require("typeorm");
const Prescription_1 = require("./Prescription");
const User_1 = require("./User");
var TreatmentPlanStatus;
(function (TreatmentPlanStatus) {
    TreatmentPlanStatus["ACTIVE"] = "active";
    TreatmentPlanStatus["COMPLETED"] = "completed";
    TreatmentPlanStatus["DISCONTINUED"] = "discontinued";
})(TreatmentPlanStatus || (exports.TreatmentPlanStatus = TreatmentPlanStatus = {}));
let TreatmentPlan = class TreatmentPlan {
    id;
    prescription_id;
    prescription;
    patient_id;
    patient;
    medication_schedule;
    start_date;
    end_date;
    total_doses;
    doses_taken;
    adherence_rate;
    refill_due_date;
    refill_reminder_sent;
    status;
    created_at;
    updated_at;
    isActive() {
        return this.status === TreatmentPlanStatus.ACTIVE;
    }
    isCompleted() {
        return this.status === TreatmentPlanStatus.COMPLETED;
    }
    isDiscontinued() {
        return this.status === TreatmentPlanStatus.DISCONTINUED;
    }
    calculateAdherenceRate() {
        if (!this.total_doses || this.total_doses === 0) {
            return 0;
        }
        const rate = (this.doses_taken / this.total_doses) * 100;
        this.adherence_rate = Number(rate.toFixed(2));
        return this.adherence_rate;
    }
    recordDoseTaken() {
        this.doses_taken += 1;
        this.calculateAdherenceRate();
    }
    hasGoodAdherence() {
        if (this.adherence_rate === null) {
            return false;
        }
        return this.adherence_rate >= 80;
    }
    hasPoorAdherence() {
        if (this.adherence_rate === null) {
            return false;
        }
        return this.adherence_rate < 50;
    }
    isRefillDueSoon() {
        if (!this.refill_due_date) {
            return false;
        }
        const today = new Date();
        const dueDate = new Date(this.refill_due_date);
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(today.getDate() + 7);
        return dueDate <= sevenDaysFromNow;
    }
    isRefillOverdue() {
        if (!this.refill_due_date) {
            return false;
        }
        const today = new Date();
        const dueDate = new Date(this.refill_due_date);
        return dueDate < today;
    }
    shouldSendRefillReminder() {
        return this.isRefillDueSoon() && !this.refill_reminder_sent && this.isActive();
    }
    markRefillReminderSent() {
        this.refill_reminder_sent = true;
    }
    complete() {
        this.status = TreatmentPlanStatus.COMPLETED;
        this.end_date = new Date();
        this.calculateAdherenceRate();
    }
    discontinue() {
        this.status = TreatmentPlanStatus.DISCONTINUED;
        this.end_date = new Date();
        this.calculateAdherenceRate();
    }
    getDaysRemaining() {
        if (!this.end_date) {
            return null;
        }
        const today = new Date();
        const endDate = new Date(this.end_date);
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    }
    getDaysElapsed() {
        const today = new Date();
        const startDate = new Date(this.start_date);
        const diffTime = today.getTime() - startDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    }
};
exports.TreatmentPlan = TreatmentPlan;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TreatmentPlan.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)('idx_treatment_plans_prescription'),
    __metadata("design:type", String)
], TreatmentPlan.prototype, "prescription_id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Prescription_1.Prescription, (prescription) => prescription.treatment_plan, {
        onDelete: 'RESTRICT',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'prescription_id' }),
    __metadata("design:type", Prescription_1.Prescription)
], TreatmentPlan.prototype, "prescription", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)('idx_treatment_plans_patient'),
    __metadata("design:type", String)
], TreatmentPlan.prototype, "patient_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'patient_id' }),
    __metadata("design:type", User_1.User)
], TreatmentPlan.prototype, "patient", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], TreatmentPlan.prototype, "medication_schedule", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], TreatmentPlan.prototype, "start_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], TreatmentPlan.prototype, "end_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Object)
], TreatmentPlan.prototype, "total_doses", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], TreatmentPlan.prototype, "doses_taken", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], TreatmentPlan.prototype, "adherence_rate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], TreatmentPlan.prototype, "refill_due_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], TreatmentPlan.prototype, "refill_reminder_sent", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: TreatmentPlanStatus,
        default: TreatmentPlanStatus.ACTIVE,
    }),
    (0, typeorm_1.Index)('idx_treatment_plans_status'),
    __metadata("design:type", String)
], TreatmentPlan.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], TreatmentPlan.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], TreatmentPlan.prototype, "updated_at", void 0);
exports.TreatmentPlan = TreatmentPlan = __decorate([
    (0, typeorm_1.Entity)('treatment_plans')
], TreatmentPlan);
//# sourceMappingURL=TreatmentPlan.js.map