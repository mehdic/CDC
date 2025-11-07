-- Migration: Create users table
-- Purpose: All platform users across 5 roles (Pharmacist, Doctor, Nurse, Delivery Personnel, Patient)
-- Based on: /specs/002-metapharm-platform/data-model.md

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255),  -- bcrypt hash (null if HIN e-ID only)
    hin_id VARCHAR(100) UNIQUE,  -- Swiss HIN e-ID (doctors, pharmacists)

    -- Role & Status
    role VARCHAR(50) NOT NULL CHECK (role IN ('pharmacist', 'doctor', 'nurse', 'delivery', 'patient')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),

    -- Profile (encrypted with AWS KMS)
    first_name_encrypted BYTEA NOT NULL,  -- AWS KMS encrypted
    last_name_encrypted BYTEA NOT NULL,
    phone_encrypted BYTEA,

    -- MFA
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),  -- TOTP secret for MFA

    -- Affiliations
    primary_pharmacy_id UUID,  -- FK to pharmacies (added later, will be set after pharmacies table exists)

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMP,
    deleted_at TIMESTAMP  -- Soft delete
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_hin_id ON users(hin_id) WHERE hin_id IS NOT NULL;
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_pharmacy ON users(primary_pharmacy_id) WHERE primary_pharmacy_id IS NOT NULL;

-- Comments for documentation
COMMENT ON TABLE users IS 'All platform users across 5 roles with role-based access control';
COMMENT ON COLUMN users.email IS 'Plaintext for login lookup (not encrypted for index performance)';
COMMENT ON COLUMN users.hin_id IS 'Swiss HIN e-ID for doctors and pharmacists (regulatory compliance)';
COMMENT ON COLUMN users.first_name_encrypted IS 'AWS KMS encrypted PHI field';
COMMENT ON COLUMN users.last_name_encrypted IS 'AWS KMS encrypted PHI field';
COMMENT ON COLUMN users.phone_encrypted IS 'AWS KMS encrypted PHI field';
COMMENT ON COLUMN users.mfa_secret IS 'TOTP secret for two-factor authentication';
COMMENT ON COLUMN users.deleted_at IS 'Soft delete timestamp for data retention compliance';
