-- Migration: Create prescription_items table
-- Purpose: Individual medications in a prescription with AI transcription confidence scores
-- Based on: /specs/002-metapharm-platform/data-model.md
-- User Story 1 (P1): Prescription Processing & Validation

-- Create prescription_items table
CREATE TABLE prescription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,

    -- Medication
    medication_name VARCHAR(255) NOT NULL,
    medication_rxnorm_code VARCHAR(50),  -- Normalized RxNorm code for drug database lookup
    dosage VARCHAR(100) NOT NULL,  -- e.g., "500mg"
    frequency VARCHAR(100) NOT NULL,  -- e.g., "twice daily"
    duration VARCHAR(100),  -- e.g., "7 days"
    quantity INTEGER,  -- Total pills/units to dispense

    -- AI Transcription Confidence (per field) - FR-013a requires highlighting low-confidence fields
    medication_confidence DECIMAL(5, 2),  -- 0-100, < 80 requires explicit pharmacist verification
    dosage_confidence DECIMAL(5, 2),      -- 0-100, < 80 requires explicit pharmacist verification
    frequency_confidence DECIMAL(5, 2),   -- 0-100, < 80 requires explicit pharmacist verification

    -- Pharmacist Corrections
    pharmacist_corrected BOOLEAN DEFAULT FALSE,
    original_ai_value JSONB,  -- Store original AI extraction if pharmacist corrects

    -- Inventory Link
    inventory_item_id UUID,  -- FK to inventory_items (will be set after inventory table creation)

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_prescription_items_prescription ON prescription_items(prescription_id);
CREATE INDEX idx_prescription_items_medication ON prescription_items(medication_rxnorm_code) WHERE medication_rxnorm_code IS NOT NULL;

-- Comments for documentation
COMMENT ON TABLE prescription_items IS 'Individual medications in a prescription with field-level AI confidence tracking';
COMMENT ON COLUMN prescription_items.medication_rxnorm_code IS 'Normalized RxNorm code for standardized drug identification';
COMMENT ON COLUMN prescription_items.medication_confidence IS 'AI confidence 0-100, < 80 triggers red/yellow warning in UI (FR-013a)';
COMMENT ON COLUMN prescription_items.dosage_confidence IS 'AI confidence 0-100, < 80 triggers red/yellow warning in UI (FR-013a)';
COMMENT ON COLUMN prescription_items.frequency_confidence IS 'AI confidence 0-100, < 80 triggers red/yellow warning in UI (FR-013a)';
COMMENT ON COLUMN prescription_items.pharmacist_corrected IS 'True if pharmacist manually corrected AI transcription';
COMMENT ON COLUMN prescription_items.original_ai_value IS 'Original AI-extracted values before pharmacist correction (audit trail)';
COMMENT ON COLUMN prescription_items.inventory_item_id IS 'Link to pharmacy inventory for dispensing and stock tracking';
