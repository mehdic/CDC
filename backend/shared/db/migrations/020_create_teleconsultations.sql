-- Migration: Create Teleconsultations Table
-- User Story 2 (P2): Secure Teleconsultation
-- Related: data-model.md, spec.md (FR-021 to FR-030)

CREATE TABLE teleconsultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id UUID NOT NULL REFERENCES pharmacies(id),

    -- Participants
    patient_id UUID NOT NULL REFERENCES users(id),
    pharmacist_id UUID NOT NULL REFERENCES users(id),

    -- Scheduling
    scheduled_at TIMESTAMP NOT NULL,
    duration_minutes INTEGER DEFAULT 15,

    -- Session
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN (
        'scheduled',
        'in_progress',
        'completed',
        'cancelled',
        'no_show'
    )),
    twilio_room_sid VARCHAR(255),  -- Twilio Video Room SID
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    actual_duration_minutes INTEGER,

    -- Recording
    recording_consent BOOLEAN DEFAULT FALSE,
    recording_url VARCHAR(500),  -- S3 URL if recorded

    -- Outcome
    prescription_created BOOLEAN DEFAULT FALSE,
    prescription_id UUID REFERENCES prescriptions(id),

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT
);

-- Row-Level Security for multi-tenant isolation
ALTER TABLE teleconsultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY pharmacy_isolation_policy ON teleconsultations
    USING (pharmacy_id = current_setting('app.current_pharmacy_id')::UUID);

-- Indexes for performance
CREATE INDEX idx_teleconsultations_pharmacy ON teleconsultations(pharmacy_id);
CREATE INDEX idx_teleconsultations_patient ON teleconsultations(patient_id);
CREATE INDEX idx_teleconsultations_pharmacist ON teleconsultations(pharmacist_id);
CREATE INDEX idx_teleconsultations_scheduled ON teleconsultations(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_teleconsultations_pharmacist_scheduled
    ON teleconsultations(pharmacist_id, scheduled_at)
    WHERE status = 'scheduled';

-- Comments
COMMENT ON TABLE teleconsultations IS 'Video consultation appointments between pharmacists and patients';
COMMENT ON COLUMN teleconsultations.twilio_room_sid IS 'Twilio Video Room SID for session tracking';
COMMENT ON COLUMN teleconsultations.recording_consent IS 'Patient consent for session recording (HIPAA compliance)';
COMMENT ON COLUMN teleconsultations.status IS 'Consultation state: scheduled → in_progress → completed | cancelled | no_show';
