-- Migration: Add Master Account Management Fields
-- Purpose: Enable multi-tenancy master account management with sub-accounts
-- Part of: Batch 3 Phase 3a - Dependency Resolution

-- Add master_account_id column
ALTER TABLE users
ADD COLUMN master_account_id UUID;

-- Add permissions_override column
ALTER TABLE users
ADD COLUMN permissions_override JSONB;

-- Add index on master_account_id for query performance
CREATE INDEX idx_users_master_account ON users(master_account_id)
WHERE master_account_id IS NOT NULL;

-- Add foreign key constraint (master_account_id references users.id)
-- Using RESTRICT to comply with healthcare data retention requirements (HIPAA/GDPR)
ALTER TABLE users
ADD CONSTRAINT fk_users_master_account
FOREIGN KEY (master_account_id)
REFERENCES users(id)
ON DELETE RESTRICT;

-- Prevent circular references (user cannot be their own master)
ALTER TABLE users
ADD CONSTRAINT chk_no_self_master
CHECK (master_account_id IS NULL OR master_account_id != id);

-- Comments for documentation
COMMENT ON COLUMN users.master_account_id IS 'Reference to master account user (for sub-accounts)';
COMMENT ON COLUMN users.permissions_override IS 'Custom permissions for sub-accounts (overrides default role permissions)';

-- Example permissions_override structure:
-- {
--   "prescriptions": {"read": true, "write": false},
--   "inventory": {"read": true, "write": true},
--   "users": {"read": false, "write": false}
-- }
