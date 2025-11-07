/**
 * Migration: Audit Trail Triggers
 * Auto-generates audit trail entries for critical tables
 * Based on: /specs/002-metapharm-platform/data-model.md
 *
 * IMPORTANT: These triggers ensure EVERY change to prescriptions and teleconsultations
 * is automatically logged to the audit_trail_entries table for compliance.
 */

-- ==============================================================================
-- Helper Function: Create JSON changes object
-- ==============================================================================

CREATE OR REPLACE FUNCTION audit_changes_json(
  old_record RECORD,
  new_record RECORD,
  tracked_fields TEXT[]
) RETURNS JSONB AS $$
DECLARE
  changes JSONB := '{}';
  field TEXT;
  old_value TEXT;
  new_value TEXT;
BEGIN
  -- Loop through tracked fields
  FOREACH field IN ARRAY tracked_fields
  LOOP
    -- Get old and new values as text (for comparison)
    EXECUTE format('SELECT ($1).%I::TEXT', field) INTO old_value USING old_record;
    EXECUTE format('SELECT ($1).%I::TEXT', field) INTO new_value USING new_record;

    -- Only include if value changed
    IF old_value IS DISTINCT FROM new_value THEN
      changes := changes || jsonb_build_object(
        field,
        jsonb_build_object(
          'old', CASE WHEN old_value IS NULL THEN NULL ELSE to_jsonb(old_value) END,
          'new', CASE WHEN new_value IS NULL THEN NULL ELSE to_jsonb(new_value) END
        )
      );
    END IF;
  END LOOP;

  RETURN CASE WHEN changes = '{}'::JSONB THEN NULL ELSE changes END;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- Prescription Audit Trigger
-- ==============================================================================

/**
 * Trigger function for prescriptions table
 * Logs INSERT and UPDATE operations to audit_trail_entries
 *
 * Tracked fields:
 * - status (prescription validation status)
 * - pharmacist_id (assigned pharmacist)
 * - ai_confidence_score (AI transcription confidence)
 * - drug_interactions (safety warnings)
 * - allergy_warnings (safety warnings)
 * - approved_at (approval timestamp)
 * - rejection_reason (if rejected)
 */
CREATE OR REPLACE FUNCTION audit_prescription_changes()
RETURNS TRIGGER AS $$
DECLARE
  event_action TEXT;
  event_type TEXT;
  changes_json JSONB;
  tracked_fields TEXT[] := ARRAY[
    'status',
    'pharmacist_id',
    'ai_confidence_score',
    'drug_interactions',
    'allergy_warnings',
    'contraindications',
    'approved_at',
    'approved_by_pharmacist_id',
    'rejection_reason',
    'expiry_date'
  ];
BEGIN
  -- Determine operation type
  IF TG_OP = 'INSERT' THEN
    event_action := 'create';
    event_type := 'prescription.created';
    changes_json := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    event_action := 'update';

    -- Determine specific event type based on status change
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      CASE NEW.status
        WHEN 'approved' THEN event_type := 'prescription.approved';
        WHEN 'rejected' THEN event_type := 'prescription.rejected';
        WHEN 'in_review' THEN event_type := 'prescription.in_review';
        WHEN 'clarification_needed' THEN event_type := 'prescription.clarification_needed';
        WHEN 'expired' THEN event_type := 'prescription.expired';
        ELSE event_type := 'prescription.updated';
      END CASE;
    ELSE
      event_type := 'prescription.updated';
    END IF;

    -- Generate changes JSON
    changes_json := audit_changes_json(OLD, NEW, tracked_fields);
  END IF;

  -- Insert audit trail entry
  INSERT INTO audit_trail_entries (
    pharmacy_id,
    user_id,
    event_type,
    action,
    resource_type,
    resource_id,
    changes,
    ip_address,
    user_agent,
    device_info
  ) VALUES (
    NEW.pharmacy_id,
    COALESCE(NEW.pharmacist_id, NEW.patient_id), -- User who triggered the change
    event_type,
    event_action,
    'prescription',
    NEW.id,
    changes_json,
    NULL, -- IP address set by application layer
    NULL, -- User agent set by application layer
    NULL  -- Device info set by application layer
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (for migration reruns)
DROP TRIGGER IF EXISTS prescription_audit_trigger ON prescriptions;

-- Create trigger on prescriptions table
CREATE TRIGGER prescription_audit_trigger
  AFTER INSERT OR UPDATE ON prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION audit_prescription_changes();

-- ==============================================================================
-- Teleconsultation Audit Trigger
-- ==============================================================================

/**
 * Trigger function for teleconsultations table
 * Logs INSERT and UPDATE operations to audit_trail_entries
 *
 * Tracked fields:
 * - status (consultation status)
 * - scheduled_at (appointment time)
 * - started_at (session start)
 * - ended_at (session end)
 * - recording_consent (patient consent)
 * - prescription_created (whether prescription was generated)
 * - cancellation_reason (if cancelled)
 */
CREATE OR REPLACE FUNCTION audit_teleconsultation_changes()
RETURNS TRIGGER AS $$
DECLARE
  event_action TEXT;
  event_type TEXT;
  changes_json JSONB;
  tracked_fields TEXT[] := ARRAY[
    'status',
    'scheduled_at',
    'started_at',
    'ended_at',
    'actual_duration_minutes',
    'recording_consent',
    'recording_url',
    'prescription_created',
    'prescription_id',
    'cancelled_at',
    'cancellation_reason'
  ];
BEGIN
  -- Determine operation type
  IF TG_OP = 'INSERT' THEN
    event_action := 'create';
    event_type := 'teleconsultation.scheduled';
    changes_json := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    event_action := 'update';

    -- Determine specific event type based on status change
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      CASE NEW.status
        WHEN 'in_progress' THEN event_type := 'teleconsultation.started';
        WHEN 'completed' THEN event_type := 'teleconsultation.completed';
        WHEN 'cancelled' THEN event_type := 'teleconsultation.cancelled';
        WHEN 'no_show' THEN event_type := 'teleconsultation.no_show';
        ELSE event_type := 'teleconsultation.updated';
      END CASE;
    ELSE
      event_type := 'teleconsultation.updated';
    END IF;

    -- Generate changes JSON
    changes_json := audit_changes_json(OLD, NEW, tracked_fields);
  END IF;

  -- Insert audit trail entry
  INSERT INTO audit_trail_entries (
    pharmacy_id,
    user_id,
    event_type,
    action,
    resource_type,
    resource_id,
    changes,
    ip_address,
    user_agent,
    device_info
  ) VALUES (
    NEW.pharmacy_id,
    NEW.pharmacist_id, -- Pharmacist is the healthcare professional responsible
    event_type,
    event_action,
    'teleconsultation',
    NEW.id,
    changes_json,
    NULL, -- IP address set by application layer
    NULL, -- User agent set by application layer
    NULL  -- Device info set by application layer
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (for migration reruns)
DROP TRIGGER IF EXISTS teleconsultation_audit_trigger ON teleconsultations;

-- Create trigger on teleconsultations table
CREATE TRIGGER teleconsultation_audit_trigger
  AFTER INSERT OR UPDATE ON teleconsultations
  FOR EACH ROW
  EXECUTE FUNCTION audit_teleconsultation_changes();

-- ==============================================================================
-- Indexes for Audit Performance
-- ==============================================================================

/**
 * Composite indexes for common audit trail queries
 * These optimize queries used in compliance reporting and audit dashboards
 */

-- Audit entries by pharmacy and date (for pharmacy-specific compliance reports)
CREATE INDEX IF NOT EXISTS idx_audit_trail_pharmacy_created
  ON audit_trail_entries(pharmacy_id, created_at DESC)
  WHERE pharmacy_id IS NOT NULL;

-- Audit entries by user and date (for user activity tracking)
CREATE INDEX IF NOT EXISTS idx_audit_trail_user_created
  ON audit_trail_entries(user_id, created_at DESC);

-- Audit entries by resource (for resource-specific audit history)
CREATE INDEX IF NOT EXISTS idx_audit_trail_resource_created
  ON audit_trail_entries(resource_type, resource_id, created_at DESC);

-- Audit entries by event type (for filtering specific events)
CREATE INDEX IF NOT EXISTS idx_audit_trail_event_created
  ON audit_trail_entries(event_type, created_at DESC);

-- ==============================================================================
-- Verification Queries (for testing)
-- ==============================================================================

-- Verify triggers exist
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name IN ('prescription_audit_trigger', 'teleconsultation_audit_trigger')
ORDER BY trigger_name;

-- Example: Test prescription audit trail
-- (This would be run manually after migration)
/*
-- Create a test prescription
INSERT INTO prescriptions (
  id,
  pharmacy_id,
  patient_id,
  source,
  status
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM pharmacies LIMIT 1),
  (SELECT id FROM users WHERE role = 'patient' LIMIT 1),
  'patient_upload',
  'pending'
);

-- Check audit trail
SELECT
  event_type,
  action,
  resource_type,
  resource_id,
  changes,
  created_at
FROM audit_trail_entries
WHERE resource_type = 'prescription'
ORDER BY created_at DESC
LIMIT 5;
*/

-- ==============================================================================
-- Migration Complete
-- ==============================================================================

COMMENT ON FUNCTION audit_changes_json IS 'Helper function to generate JSONB changes object for audit trail';
COMMENT ON FUNCTION audit_prescription_changes IS 'Trigger function to automatically audit prescription INSERT/UPDATE operations';
COMMENT ON FUNCTION audit_teleconsultation_changes IS 'Trigger function to automatically audit teleconsultation INSERT/UPDATE operations';
COMMENT ON TRIGGER prescription_audit_trigger ON prescriptions IS 'Automatically creates audit trail entries for all prescription changes';
COMMENT ON TRIGGER teleconsultation_audit_trigger ON teleconsultations IS 'Automatically creates audit trail entries for all teleconsultation changes';
