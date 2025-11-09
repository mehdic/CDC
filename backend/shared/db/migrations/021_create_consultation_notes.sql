-- Migration: Create Consultation Notes Table
-- User Story 2 (P2): Secure Teleconsultation
-- Related: data-model.md, spec.md (FR-025, FR-025a, FR-028)

CREATE TABLE consultation_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teleconsultation_id UUID NOT NULL REFERENCES teleconsultations(id) ON DELETE CASCADE,

    -- AI Transcript (encrypted with AWS KMS)
    ai_transcript_encrypted BYTEA,  -- Full conversation transcript (PHI - HIPAA compliance)
    ai_summary TEXT,  -- AI-generated summary of key points
    ai_highlighted_terms JSONB,  -- Medical terms highlighted by AI: [{term, timestamp, confidence}]

    -- Pharmacist Edits (encrypted with AWS KMS)
    pharmacist_notes_encrypted BYTEA,  -- Manual notes added/edited by pharmacist (PHI)
    edited BOOLEAN DEFAULT FALSE,
    edit_history JSONB,  -- FR-025a: Audit trail [{timestamp, user_id, changes, original_ai_version}]

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_consultation_notes_teleconsultation ON consultation_notes(teleconsultation_id);

-- Constraints
-- Ensure one note per teleconsultation
CREATE UNIQUE INDEX idx_consultation_notes_unique_teleconsultation ON consultation_notes(teleconsultation_id);

-- Comments
COMMENT ON TABLE consultation_notes IS 'AI-transcribed and pharmacist-edited notes from teleconsultations';
COMMENT ON COLUMN consultation_notes.ai_transcript_encrypted IS 'AWS KMS encrypted AI transcript of consultation (PHI)';
COMMENT ON COLUMN consultation_notes.pharmacist_notes_encrypted IS 'AWS KMS encrypted pharmacist notes (PHI)';
COMMENT ON COLUMN consultation_notes.edit_history IS 'FR-025a: Immutable audit trail of all transcript edits with original AI version preserved';
COMMENT ON COLUMN consultation_notes.ai_highlighted_terms IS 'Medical terms detected by AI with confidence scores';
