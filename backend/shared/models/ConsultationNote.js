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
exports.ConsultationNote = void 0;
const typeorm_1 = require("typeorm");
const Teleconsultation_1 = require("./Teleconsultation");
let ConsultationNote = class ConsultationNote {
    id;
    teleconsultation_id;
    teleconsultation;
    ai_transcript_encrypted;
    ai_summary;
    ai_highlighted_terms;
    pharmacist_notes_encrypted;
    edited;
    edit_history;
    created_at;
    updated_at;
};
exports.ConsultationNote = ConsultationNote;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ConsultationNote.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', unique: true }),
    (0, typeorm_1.Index)('idx_consultation_notes_teleconsultation'),
    __metadata("design:type", String)
], ConsultationNote.prototype, "teleconsultation_id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Teleconsultation_1.Teleconsultation, (tc) => tc.consultation_note, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'teleconsultation_id' }),
    __metadata("design:type", Teleconsultation_1.Teleconsultation)
], ConsultationNote.prototype, "teleconsultation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bytea', nullable: true }),
    __metadata("design:type", Buffer)
], ConsultationNote.prototype, "ai_transcript_encrypted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ConsultationNote.prototype, "ai_summary", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], ConsultationNote.prototype, "ai_highlighted_terms", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bytea', nullable: true }),
    __metadata("design:type", Buffer)
], ConsultationNote.prototype, "pharmacist_notes_encrypted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], ConsultationNote.prototype, "edited", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], ConsultationNote.prototype, "edit_history", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ConsultationNote.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ConsultationNote.prototype, "updated_at", void 0);
exports.ConsultationNote = ConsultationNote = __decorate([
    (0, typeorm_1.Entity)('consultation_notes')
], ConsultationNote);
//# sourceMappingURL=ConsultationNote.js.map