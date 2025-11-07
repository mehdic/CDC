-- Migration: Create audit_trail_entries table
-- Purpose: Immutable audit logs for compliance (HIPAA, GDPR, Swiss regulations)
-- Based on: /specs/002-metapharm-platform/data-model.md

-- Create audit_trail_entries table
CREATE TABLE audit_trail_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Context
    pharmacy_id UUID REFERENCES pharmacies(id),  -- Nullable for global events
    user_id UUID NOT NULL REFERENCES users(id),

    -- Event
    event_type VARCHAR(100) NOT NULL,  -- "prescription.approved", "record.accessed", "delivery.confirmed"
    action VARCHAR(50) NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete')),
    resource_type VARCHAR(100) NOT NULL,  -- "prescription", "patient_medical_record", "inventory_item"
    resource_id UUID NOT NULL,

    -- Changes (for UPDATE actions)
    changes JSONB,  -- {field: {old: value, new: value}}

    -- Request Context
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,

    -- Timestamp (immutable)
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for compliance reporting and auditing
CREATE INDEX idx_audit_trail_pharmacy ON audit_trail_entries(pharmacy_id) WHERE pharmacy_id IS NOT NULL;
CREATE INDEX idx_audit_trail_user ON audit_trail_entries(user_id);
CREATE INDEX idx_audit_trail_resource ON audit_trail_entries(resource_type, resource_id);
CREATE INDEX idx_audit_trail_event ON audit_trail_entries(event_type);
CREATE INDEX idx_audit_trail_created ON audit_trail_entries(created_at DESC);

-- No UPDATE or DELETE permissions (append-only log for immutability)
REVOKE UPDATE, DELETE ON audit_trail_entries FROM PUBLIC;

-- Comments for documentation
COMMENT ON TABLE audit_trail_entries IS 'Immutable audit logs for HIPAA, GDPR, and Swiss regulatory compliance';
COMMENT ON COLUMN audit_trail_entries.event_type IS 'Dot-notation event type (e.g., prescription.approved, record.accessed)';
COMMENT ON COLUMN audit_trail_entries.action IS 'CRUD action performed (create, read, update, delete)';
COMMENT ON COLUMN audit_trail_entries.resource_type IS 'Entity type being audited (prescription, patient_medical_record, etc.)';
COMMENT ON COLUMN audit_trail_entries.changes IS 'JSON object with field-level changes for UPDATE actions';
COMMENT ON COLUMN audit_trail_entries.ip_address IS 'Client IP address for security auditing';
COMMENT ON COLUMN audit_trail_entries.user_agent IS 'Browser/app user agent string';
COMMENT ON COLUMN audit_trail_entries.device_info IS 'JSON with device details (OS, browser, app version)';
