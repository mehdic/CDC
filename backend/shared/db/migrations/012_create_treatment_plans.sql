-- Migration: Create treatment_plans table
-- Purpose: Generated medication schedule from approved prescription with adherence tracking
-- Based on: /specs/002-metapharm-platform/data-model.md
-- User Story 1 (P1): Prescription Processing & Validation (FR-017)

-- Create treatment_plans table
CREATE TABLE treatment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id),
    patient_id UUID NOT NULL REFERENCES users(id),

    -- Schedule (JSON for flexibility)
    medication_schedule JSONB NOT NULL,  -- [{medication, time, days, doses_taken: []}]

    -- Adherence Tracking
    start_date DATE NOT NULL,
    end_date DATE,
    total_doses INTEGER,
    doses_taken INTEGER DEFAULT 0,
    adherence_rate DECIMAL(5, 2),  -- Calculated: doses_taken / total_doses * 100

    -- Refill
    refill_due_date DATE,
    refill_reminder_sent BOOLEAN DEFAULT FALSE,

    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'discontinued')),

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Update prescriptions table to add FK to treatment_plans
ALTER TABLE prescriptions
    ADD CONSTRAINT fk_prescriptions_treatment_plan
    FOREIGN KEY (treatment_plan_id)
    REFERENCES treatment_plans(id)
    ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX idx_treatment_plans_patient ON treatment_plans(patient_id);
CREATE INDEX idx_treatment_plans_prescription ON treatment_plans(prescription_id);
CREATE INDEX idx_treatment_plans_status ON treatment_plans(status);

-- Composite index for refills due soon
CREATE INDEX idx_treatment_plans_refill_due
    ON treatment_plans(patient_id, refill_due_date)
    WHERE status = 'active' AND refill_due_date <= CURRENT_DATE + INTERVAL '7 days';

-- Comments for documentation
COMMENT ON TABLE treatment_plans IS 'Generated medication schedules from approved prescriptions with adherence tracking';
COMMENT ON COLUMN treatment_plans.medication_schedule IS 'Flexible JSON structure: [{medication, time, days, doses_taken: []}] for tracking';
COMMENT ON COLUMN treatment_plans.adherence_rate IS 'Calculated percentage: doses_taken / total_doses * 100 (FR-077)';
COMMENT ON COLUMN treatment_plans.refill_due_date IS 'Date when patient needs to refill prescription (triggers AI reminder)';
COMMENT ON COLUMN treatment_plans.refill_reminder_sent IS 'Flag to prevent duplicate reminder notifications';
COMMENT ON COLUMN treatment_plans.status IS 'active: ongoing treatment, completed: finished, discontinued: stopped early';
