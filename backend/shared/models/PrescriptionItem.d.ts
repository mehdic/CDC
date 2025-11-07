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
    hasMedicationLowConfidence(): boolean;
    hasDosageLowConfidence(): boolean;
    hasFrequencyLowConfidence(): boolean;
    hasAnyLowConfidence(): boolean;
    getLowConfidenceFields(): string[];
    wasCorrectedByPharmacist(): boolean;
    getAverageConfidence(): number | null;
    markAsCorrected(originalValues: any): void;
}
//# sourceMappingURL=PrescriptionItem.d.ts.map