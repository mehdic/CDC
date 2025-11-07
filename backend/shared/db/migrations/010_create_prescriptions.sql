-- Migration: Create prescriptions table
-- Purpose: Medication orders from patients (upload) or doctors (direct send)
-- Based on: /specs/002-metapharm-platform/data-model.md
-- User Story 1 (P1): Prescription Processing & Validation (FR-008 to FR-020)

-- Create prescriptions table
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id UUID NOT NULL REFERENCES pharmacies(id),  -- Multi-tenant isolation

    -- Parties
    patient_id UUID NOT NULL REFERENCES users(id),
    prescribing_doctor_id UUID REFERENCES users(id),  -- Null if uploaded by patient
    pharmacist_id UUID REFERENCES users(id),  -- Assigned for validation

    -- Source
    source VARCHAR(50) NOT NULL CHECK (source IN ('patient_upload', 'doctor_direct', 'teleconsultation')),
    image_url VARCHAR(500),  -- S3 URL if patient uploaded

    -- AI Transcription
    ai_transcription_data JSONB,  -- Raw OCR results from AWS Textract
    ai_confidence_score DECIMAL(5, 2),  -- Overall confidence 0-100

    -- Validation Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',           -- Awaiting pharmacist review
        'in_review',         -- Pharmacist reviewing
        'clarification_needed',  -- Waiting for doctor response
        'approved',          -- Validated and approved
        'rejected',          -- Rejected with reason
        'expired'            -- Prescription validity expired
    )),
    rejection_reason TEXT,  -- Mandatory if status = rejected

    -- Safety Checks
    drug_interactions JSONB,  -- Array of {drug1, drug2, severity, description}
    allergy_warnings JSONB,   -- Array of {allergen, reaction_type, severity}
    contraindications JSONB,  -- Array of {condition, reason}

    -- Validity
    prescribed_date DATE,
    expiry_date DATE,  -- Swiss prescriptions valid 3 months typically

    -- Treatment Plan
    treatment_plan_id UUID,  -- FK to treatment_plans (will be set after table creation)

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMP,
    approved_by_pharmacist_id UUID REFERENCES users(id),

    -- Check constraint: rejection_reason required when rejected
    CONSTRAINT check_rejection_reason
        CHECK (status != 'rejected' OR rejection_reason IS NOT NULL)
);

-- Row-Level Security (RLS) for multi-tenant isolation
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY pharmacy_isolation_policy ON prescriptions
    USING (pharmacy_id = current_setting('app.current_pharmacy_id', true)::UUID);

-- Indexes for performance
CREATE INDEX idx_prescriptions_pharmacy ON prescriptions(pharmacy_id);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
CREATE INDEX idx_prescriptions_created ON prescriptions(created_at DESC);

-- Composite index for pharmacist queue (pending/in_review prescriptions ordered by creation)
CREATE INDEX idx_prescriptions_pharmacy_status_created
    ON prescriptions(pharmacy_id, status, created_at DESC)
    WHERE status IN ('pending', 'in_review', 'clarification_needed');

-- Composite index for patient prescription history (approved prescriptions by date)
CREATE INDEX idx_prescriptions_patient_approved_date
    ON prescriptions(patient_id, approved_at DESC)
    WHERE status = 'approved';

-- Comments for documentation
COMMENT ON TABLE prescriptions IS 'Medication orders from patients (upload) or doctors (direct send) with AI-powered validation';
COMMENT ON COLUMN prescriptions.pharmacy_id IS 'Multi-tenant isolation - all queries filtered by pharmacy';
COMMENT ON COLUMN prescriptions.source IS 'Origin of prescription: patient_upload, doctor_direct, or teleconsultation';
COMMENT ON COLUMN prescriptions.image_url IS 'S3 URL of uploaded prescription image (null if doctor_direct)';
COMMENT ON COLUMN prescriptions.ai_transcription_data IS 'Raw OCR results from AWS Textract including field-level confidence scores';
COMMENT ON COLUMN prescriptions.ai_confidence_score IS 'Overall AI confidence score 0-100 (< 80 triggers manual review warnings)';
COMMENT ON COLUMN prescriptions.status IS 'Workflow state: pending → in_review → approved/rejected/clarification_needed';
COMMENT ON COLUMN prescriptions.drug_interactions IS 'AI-detected drug interactions with severity levels';
COMMENT ON COLUMN prescriptions.allergy_warnings IS 'Warnings based on patient allergies from medical record';
COMMENT ON COLUMN prescriptions.contraindications IS 'Medical contraindications based on patient conditions';
COMMENT ON COLUMN prescriptions.expiry_date IS 'Swiss prescriptions typically valid for 3 months from prescribed_date';
