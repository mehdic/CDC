/**
 * PrescriptionItem Entity
 * Individual medications in a prescription with field-level AI confidence tracking
 * Based on: /specs/002-metapharm-platform/data-model.md
 * User Story 1 (P1): Prescription Processing & Validation
 */
import { Prescription } from './Prescription';
export declare class PrescriptionItem {
    id: string;
    prescription_id: string;
    prescription: Prescription;
    medication_name: string;
    medication_rxnorm_code: string | null;
    dosage: string;
    frequency: string;
    duration: string | null;
    quantity: number | null;
    medication_confidence: number | null;
    dosage_confidence: number | null;
    frequency_confidence: number | null;
    pharmacist_corrected: boolean;
    original_ai_value: any;
    inventory_item_id: string | null;
    created_at: Date;
    updated_at: Date;
    /**
     * Check if medication name has low AI confidence (< 80%)
     * FR-013a: Must be highlighted with visual warning in UI
     */
    hasMedicationLowConfidence(): boolean;
    /**
     * Check if dosage has low AI confidence (< 80%)
     * FR-013a: Must be highlighted with visual warning in UI
     */
    hasDosageLowConfidence(): boolean;
    /**
     * Check if frequency has low AI confidence (< 80%)
     * FR-013a: Must be highlighted with visual warning in UI
     */
    hasFrequencyLowConfidence(): boolean;
    /**
     * Check if any field has low AI confidence
     * Returns true if any confidence score < 80
     */
    hasAnyLowConfidence(): boolean;
    /**
     * Get list of fields with low confidence
     * Returns array of field names that have confidence < 80
     */
    getLowConfidenceFields(): string[];
    /**
     * Check if item was manually corrected by pharmacist
     */
    wasCorrectedByPharmacist(): boolean;
    /**
     * Get average confidence score across all fields
     * Returns null if no confidence scores available
     */
    getAverageConfidence(): number | null;
    /**
     * Mark item as corrected by pharmacist
     * Stores original AI values for audit trail
     */
    markAsCorrected(originalValues: any): void;
}
//# sourceMappingURL=PrescriptionItem.d.ts.map