-- Migration: Create pharmacies table
-- Purpose: Pharmacy locations (multi-tenant root entity)
-- Based on: /specs/002-metapharm-platform/data-model.md

-- Create pharmacies table
CREATE TABLE pharmacies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,  -- Swiss pharmacy license

    -- Location (encrypted for privacy)
    address_encrypted BYTEA NOT NULL,  -- AWS KMS encrypted
    city VARCHAR(100) NOT NULL,  -- Plaintext for reporting
    canton VARCHAR(50) NOT NULL,  -- Swiss canton (VD, GE, ZH, etc.)
    postal_code VARCHAR(10) NOT NULL,
    latitude DECIMAL(10, 8),  -- For delivery routing
    longitude DECIMAL(11, 8),

    -- Contact
    phone VARCHAR(50),
    email VARCHAR(255),

    -- Operating Hours (JSON for flexibility)
    operating_hours JSONB,  -- {"monday": {"open": "08:00", "close": "18:00"}, ...}

    -- Subscription
    subscription_tier VARCHAR(50) DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'professional', 'enterprise')),
    subscription_status VARCHAR(50) DEFAULT 'active' CHECK (subscription_status IN ('trial', 'active', 'suspended', 'cancelled')),

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP  -- Soft delete
);

-- Indexes for performance
CREATE INDEX idx_pharmacies_canton ON pharmacies(canton);
CREATE INDEX idx_pharmacies_status ON pharmacies(subscription_status);

-- Comments for documentation
COMMENT ON TABLE pharmacies IS 'Pharmacy locations serving as multi-tenant root entities';
COMMENT ON COLUMN pharmacies.license_number IS 'Swiss pharmacy license number for regulatory compliance';
COMMENT ON COLUMN pharmacies.address_encrypted IS 'AWS KMS encrypted for patient privacy';
COMMENT ON COLUMN pharmacies.canton IS 'Swiss canton for e-santé API integration (varies by region)';
COMMENT ON COLUMN pharmacies.operating_hours IS 'JSON object with days of week and open/close times';
COMMENT ON COLUMN pharmacies.subscription_tier IS 'Subscription level determining feature access';

-- Now add the foreign key constraint to users table (referencing pharmacies)
ALTER TABLE users
    ADD CONSTRAINT fk_users_pharmacy
    FOREIGN KEY (primary_pharmacy_id)
    REFERENCES pharmacies(id)
    ON DELETE SET NULL;
