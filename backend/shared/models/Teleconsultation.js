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
exports.TeleconsultationScheduleIndex = exports.Teleconsultation = exports.TeleconsultationStatus = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const Pharmacy_1 = require("./Pharmacy");
const Prescription_1 = require("./Prescription");
const ConsultationNote_1 = require("./ConsultationNote");
var TeleconsultationStatus;
(function (TeleconsultationStatus) {
    TeleconsultationStatus["SCHEDULED"] = "scheduled";
    TeleconsultationStatus["IN_PROGRESS"] = "in_progress";
    TeleconsultationStatus["COMPLETED"] = "completed";
    TeleconsultationStatus["CANCELLED"] = "cancelled";
    TeleconsultationStatus["NO_SHOW"] = "no_show";
})(TeleconsultationStatus || (exports.TeleconsultationStatus = TeleconsultationStatus = {}));
let Teleconsultation = class Teleconsultation {
    id;
    pharmacy_id;
    pharmacy;
    patient_id;
    patient;
    pharmacist_id;
    pharmacist;
    scheduled_at;
    duration_minutes;
    status;
    twilio_room_sid;
    started_at;
    ended_at;
    actual_duration_minutes;
    recording_consent;
    recording_url;
    prescription_created;
    prescription_id;
    prescription;
    consultation_note;
    created_at;
    updated_at;
    cancelled_at;
    cancellation_reason;
};
exports.Teleconsultation = Teleconsultation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Teleconsultation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)('idx_teleconsultations_pharmacy'),
    __metadata("design:type", String)
], Teleconsultation.prototype, "pharmacy_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Pharmacy_1.Pharmacy),
    (0, typeorm_1.JoinColumn)({ name: 'pharmacy_id' }),
    __metadata("design:type", Pharmacy_1.Pharmacy)
], Teleconsultation.prototype, "pharmacy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)('idx_teleconsultations_patient'),
    __metadata("design:type", String)
], Teleconsultation.prototype, "patient_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'patient_id' }),
    __metadata("design:type", User_1.User)
], Teleconsultation.prototype, "patient", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)('idx_teleconsultations_pharmacist'),
    __metadata("design:type", String)
], Teleconsultation.prototype, "pharmacist_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'pharmacist_id' }),
    __metadata("design:type", User_1.User)
], Teleconsultation.prototype, "pharmacist", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    (0, typeorm_1.Index)('idx_teleconsultations_scheduled'),
    __metadata("design:type", Date)
], Teleconsultation.prototype, "scheduled_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 15 }),
    __metadata("design:type", Number)
], Teleconsultation.prototype, "duration_minutes", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 50,
        default: TeleconsultationStatus.SCHEDULED,
    }),
    (0, typeorm_1.Index)('idx_teleconsultations_status'),
    __metadata("design:type", String)
], Teleconsultation.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Teleconsultation.prototype, "twilio_room_sid", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Teleconsultation.prototype, "started_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Teleconsultation.prototype, "ended_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], Teleconsultation.prototype, "actual_duration_minutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Teleconsultation.prototype, "recording_consent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], Teleconsultation.prototype, "recording_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Teleconsultation.prototype, "prescription_created", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Teleconsultation.prototype, "prescription_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Prescription_1.Prescription, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'prescription_id' }),
    __metadata("design:type", Prescription_1.Prescription)
], Teleconsultation.prototype, "prescription", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => ConsultationNote_1.ConsultationNote, (note) => note.teleconsultation, {
        nullable: true,
    }),
    __metadata("design:type", ConsultationNote_1.ConsultationNote)
], Teleconsultation.prototype, "consultation_note", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Teleconsultation.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Teleconsultation.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Teleconsultation.prototype, "cancelled_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Teleconsultation.prototype, "cancellation_reason", void 0);
exports.Teleconsultation = Teleconsultation = __decorate([
    (0, typeorm_1.Entity)('teleconsultations')
], Teleconsultation);
let TeleconsultationScheduleIndex = class TeleconsultationScheduleIndex {
};
exports.TeleconsultationScheduleIndex = TeleconsultationScheduleIndex;
exports.TeleconsultationScheduleIndex = TeleconsultationScheduleIndex = __decorate([
    (0, typeorm_1.Index)('idx_teleconsultations_pharmacist_scheduled', [
        'pharmacist_id',
        'scheduled_at',
    ])
], TeleconsultationScheduleIndex);
//# sourceMappingURL=Teleconsultation.js.map