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
exports.PrescriptionItem = void 0;
const typeorm_1 = require("typeorm");
const Prescription_1 = require("./Prescription");
let PrescriptionItem = class PrescriptionItem {
    id;
    prescription_id;
    prescription;
    medication_name;
    medication_rxnorm_code;
    dosage;
    frequency;
    duration;
    quantity;
    medication_confidence;
    dosage_confidence;
    frequency_confidence;
    pharmacist_corrected;
    original_ai_value;
    inventory_item_id;
    created_at;
    updated_at;
    hasMedicationLowConfidence() {
        return this.medication_confidence !== null && this.medication_confidence < 80;
    }
    hasDosageLowConfidence() {
        return this.dosage_confidence !== null && this.dosage_confidence < 80;
    }
    hasFrequencyLowConfidence() {
        return this.frequency_confidence !== null && this.frequency_confidence < 80;
    }
    hasAnyLowConfidence() {
        return (this.hasMedicationLowConfidence() ||
            this.hasDosageLowConfidence() ||
            this.hasFrequencyLowConfidence());
    }
    getLowConfidenceFields() {
        const fields = [];
        if (this.hasMedicationLowConfidence()) {
            fields.push('medication_name');
        }
        if (this.hasDosageLowConfidence()) {
            fields.push('dosage');
        }
        if (this.hasFrequencyLowConfidence()) {
            fields.push('frequency');
        }
        return fields;
    }
    wasCorrectedByPharmacist() {
        return this.pharmacist_corrected === true;
    }
    getAverageConfidence() {
        const scores = [];
        if (this.medication_confidence !== null) {
            scores.push(this.medication_confidence);
        }
        if (this.dosage_confidence !== null) {
            scores.push(this.dosage_confidence);
        }
        if (this.frequency_confidence !== null) {
            scores.push(this.frequency_confidence);
        }
        if (scores.length === 0) {
            return null;
        }
        const sum = scores.reduce((acc, score) => acc + score, 0);
        return Number((sum / scores.length).toFixed(2));
    }
    markAsCorrected(originalValues) {
        this.pharmacist_corrected = true;
        this.original_ai_value = originalValues;
    }
};
exports.PrescriptionItem = PrescriptionItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PrescriptionItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)('idx_prescription_items_prescription'),
    __metadata("design:type", String)
], PrescriptionItem.prototype, "prescription_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Prescription_1.Prescription, (prescription) => prescription.items, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'prescription_id' }),
    __metadata("design:type", Prescription_1.Prescription)
], PrescriptionItem.prototype, "prescription", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], PrescriptionItem.prototype, "medication_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    (0, typeorm_1.Index)('idx_prescription_items_medication'),
    __metadata("design:type", String)
], PrescriptionItem.prototype, "medication_rxnorm_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], PrescriptionItem.prototype, "dosage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], PrescriptionItem.prototype, "frequency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], PrescriptionItem.prototype, "duration", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], PrescriptionItem.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], PrescriptionItem.prototype, "medication_confidence", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], PrescriptionItem.prototype, "dosage_confidence", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], PrescriptionItem.prototype, "frequency_confidence", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], PrescriptionItem.prototype, "pharmacist_corrected", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], PrescriptionItem.prototype, "original_ai_value", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], PrescriptionItem.prototype, "inventory_item_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], PrescriptionItem.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], PrescriptionItem.prototype, "updated_at", void 0);
exports.PrescriptionItem = PrescriptionItem = __decorate([
    (0, typeorm_1.Entity)('prescription_items')
], PrescriptionItem);
//# sourceMappingURL=PrescriptionItem.js.map