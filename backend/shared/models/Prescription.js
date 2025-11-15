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
exports.Prescription = exports.PrescriptionStatus = exports.PrescriptionSource = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const Pharmacy_1 = require("./Pharmacy");
const PrescriptionItem_1 = require("./PrescriptionItem");
const TreatmentPlan_1 = require("./TreatmentPlan");
var PrescriptionSource;
(function (PrescriptionSource) {
    PrescriptionSource["PATIENT_UPLOAD"] = "patient_upload";
    PrescriptionSource["DOCTOR_DIRECT"] = "doctor_direct";
    PrescriptionSource["TELECONSULTATION"] = "teleconsultation";
})(PrescriptionSource || (exports.PrescriptionSource = PrescriptionSource = {}));
var PrescriptionStatus;
(function (PrescriptionStatus) {
    PrescriptionStatus["PENDING"] = "pending";
    PrescriptionStatus["IN_REVIEW"] = "in_review";
    PrescriptionStatus["CLARIFICATION_NEEDED"] = "clarification_needed";
    PrescriptionStatus["APPROVED"] = "approved";
    PrescriptionStatus["REJECTED"] = "rejected";
    PrescriptionStatus["EXPIRED"] = "expired";
})(PrescriptionStatus || (exports.PrescriptionStatus = PrescriptionStatus = {}));
let Prescription = class Prescription {
    id;
    pharmacy_id;
    pharmacy;
    patient_id;
    patient;
    prescribing_doctor_id;
    prescribing_doctor;
    pharmacist_id;
    pharmacist;
    source;
    image_url;
    ai_transcription_data;
    ai_confidence_score;
    status;
    rejection_reason;
    drug_interactions;
    allergy_warnings;
    contraindications;
    prescribed_date;
    expiry_date;
    treatment_plan_id;
    treatment_plan;
    items;
    created_at;
    updated_at;
    approved_at;
    approved_by_pharmacist_id;
    approved_by_pharmacist;
    isPending() {
        return this.status === PrescriptionStatus.PENDING;
    }
    isInReview() {
        return this.status === PrescriptionStatus.IN_REVIEW;
    }
    isApproved() {
        return this.status === PrescriptionStatus.APPROVED;
    }
    isRejected() {
        return this.status === PrescriptionStatus.REJECTED;
    }
    isExpired() {
        return this.status === PrescriptionStatus.EXPIRED;
    }
    canBeEdited() {
        return (this.status === PrescriptionStatus.PENDING ||
            this.status === PrescriptionStatus.IN_REVIEW ||
            this.status === PrescriptionStatus.CLARIFICATION_NEEDED);
    }
    hasLowConfidence() {
        return this.ai_confidence_score !== null && this.ai_confidence_score < 80;
    }
    hasSafetyWarnings() {
        return ((this.drug_interactions && Array.isArray(this.drug_interactions) && this.drug_interactions.length > 0) ||
            (this.allergy_warnings && Array.isArray(this.allergy_warnings) && this.allergy_warnings.length > 0) ||
            (this.contraindications && Array.isArray(this.contraindications) && this.contraindications.length > 0));
    }
    needsClarification() {
        return this.status === PrescriptionStatus.CLARIFICATION_NEEDED;
    }
    isFromDoctor() {
        return (this.source === PrescriptionSource.DOCTOR_DIRECT ||
            this.source === PrescriptionSource.TELECONSULTATION);
    }
    isFromPatientUpload() {
        return this.source === PrescriptionSource.PATIENT_UPLOAD;
    }
    isPastExpiryDate() {
        if (!this.expiry_date) {
            return false;
        }
        return new Date(this.expiry_date) < new Date();
    }
    approve(pharmacistId) {
        this.status = PrescriptionStatus.APPROVED;
        this.approved_at = new Date();
        this.approved_by_pharmacist_id = pharmacistId;
    }
    reject(reason) {
        this.status = PrescriptionStatus.REJECTED;
        this.rejection_reason = reason;
    }
    requestClarification(reason) {
        this.status = PrescriptionStatus.CLARIFICATION_NEEDED;
        this.rejection_reason = reason;
    }
};
exports.Prescription = Prescription;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Prescription.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)('idx_prescriptions_pharmacy'),
    __metadata("design:type", String)
], Prescription.prototype, "pharmacy_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Pharmacy_1.Pharmacy, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'pharmacy_id' }),
    __metadata("design:type", Pharmacy_1.Pharmacy)
], Prescription.prototype, "pharmacy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)('idx_prescriptions_patient'),
    __metadata("design:type", String)
], Prescription.prototype, "patient_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'patient_id' }),
    __metadata("design:type", User_1.User)
], Prescription.prototype, "patient", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Prescription.prototype, "prescribing_doctor_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'prescribing_doctor_id' }),
    __metadata("design:type", User_1.User)
], Prescription.prototype, "prescribing_doctor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Prescription.prototype, "pharmacist_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'pharmacist_id' }),
    __metadata("design:type", User_1.User)
], Prescription.prototype, "pharmacist", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: PrescriptionSource,
    }),
    __metadata("design:type", String)
], Prescription.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], Prescription.prototype, "image_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Prescription.prototype, "ai_transcription_data", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Prescription.prototype, "ai_confidence_score", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: PrescriptionStatus,
        default: PrescriptionStatus.PENDING,
    }),
    (0, typeorm_1.Index)('idx_prescriptions_status'),
    __metadata("design:type", String)
], Prescription.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Prescription.prototype, "rejection_reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Prescription.prototype, "drug_interactions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Prescription.prototype, "allergy_warnings", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Prescription.prototype, "contraindications", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Prescription.prototype, "prescribed_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Prescription.prototype, "expiry_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Prescription.prototype, "treatment_plan_id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => TreatmentPlan_1.TreatmentPlan, (treatmentPlan) => treatmentPlan.prescription, {
        nullable: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'treatment_plan_id' }),
    __metadata("design:type", TreatmentPlan_1.TreatmentPlan)
], Prescription.prototype, "treatment_plan", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => PrescriptionItem_1.PrescriptionItem, (item) => item.prescription, {
        cascade: true,
        eager: false,
    }),
    __metadata("design:type", Array)
], Prescription.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    (0, typeorm_1.Index)('idx_prescriptions_created'),
    __metadata("design:type", Date)
], Prescription.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Prescription.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Prescription.prototype, "approved_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Prescription.prototype, "approved_by_pharmacist_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'approved_by_pharmacist_id' }),
    __metadata("design:type", User_1.User)
], Prescription.prototype, "approved_by_pharmacist", void 0);
exports.Prescription = Prescription = __decorate([
    (0, typeorm_1.Entity)('prescriptions')
], Prescription);
//# sourceMappingURL=Prescription.js.map