-- ============================================================================
-- 013_create_field_corrections.sql
-- Audit trail for low-confidence field corrections during prescription approval
-- Phase 3: GROUP_API_3 - Low-Confidence Field Verification
-- ============================================================================

-- Create field_corrections table
CREATE TABLE IF NOT EXISTS field_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Prescription reference
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,

  -- Item reference (nullable if correction is at prescription level)
  prescription_item_id UUID REFERENCES prescription_items(id) ON DELETE CASCADE,

  -- Pharmacist who made the correction
  pharmacist_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  -- Field details
  field_name VARCHAR(100) NOT NULL,
  original_value TEXT,
  corrected_value TEXT NOT NULL,
  original_confidence DECIMAL(5,2),

  -- Verification details
  was_corrected BOOLEAN DEFAULT FALSE,
  correction_notes TEXT,
  correction_type VARCHAR(50) NOT NULL,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT valid_correction_type CHECK (correction_type IN ('verification', 'correction', 'clarification_needed')),
  CONSTRAINT valid_confidence CHECK (original_confidence IS NULL OR (original_confidence >= 0 AND original_confidence <= 100))
);

-- Create indexes for performance
CREATE INDEX idx_field_corrections_prescription ON field_corrections(prescription_id);
CREATE INDEX idx_field_corrections_item ON field_corrections(prescription_item_id);
CREATE INDEX idx_field_corrections_pharmacist ON field_corrections(pharmacist_id);
CREATE INDEX idx_field_corrections_created ON field_corrections(created_at);

-- Add RLS (Row-Level Security) for multi-tenant isolation
ALTER TABLE field_corrections ENABLE ROW LEVEL SECURITY;

-- Policy: Pharmacists can only see corrections from their pharmacy
CREATE POLICY field_corrections_pharmacy_isolation ON field_corrections
  FOR ALL
  USING (
    prescription_id IN (
      SELECT id FROM prescriptions WHERE pharmacy_id = current_setting('app.current_pharmacy_id', TRUE)::UUID
    )
  );

-- Grant permissions
GRANT SELECT, INSERT ON field_corrections TO authenticated_user;
GRANT SELECT, INSERT ON field_corrections TO pharmacist_role;

-- Add comment
COMMENT ON TABLE field_corrections IS 'Audit trail for low-confidence field corrections during prescription approval (Phase 3: GROUP_API_3)';
