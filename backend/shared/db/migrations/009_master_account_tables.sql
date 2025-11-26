-- Migration 009: Master Account Management Tables
-- Purpose: Add tables and columns for master account management, user permissions, audit logging, and session tracking
-- Created: 2025-11-12

-- ============================================================================
-- 1. Extend users table for master account features
-- ============================================================================

-- Add master_account_id for sub-account relationships (pharmacist can create sub-accounts)
ALTER TABLE users ADD COLUMN IF NOT EXISTS master_account_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Add permissions_override for custom permission overrides (JSONB array of permission strings)
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions_override JSONB DEFAULT '[]'::jsonb;

-- Add index for master account queries
CREATE INDEX IF NOT EXISTS idx_users_master_account ON users(master_account_id);

-- Add comment for documentation
COMMENT ON COLUMN users.master_account_id IS 'Reference to parent account (for sub-accounts created by master pharmacist)';
COMMENT ON COLUMN users.permissions_override IS 'Custom permissions array overriding role defaults (e.g., ["prescriptions.view", "inventory.manage"])';

-- ============================================================================
-- 2. Create audit_logs table for user action tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(255) NOT NULL, -- e.g., 'user.created', 'permission.updated', 'settings.changed'
  resource VARCHAR(255), -- e.g., 'user', 'pharmacy', 'prescription'
  resource_id UUID, -- ID of the affected resource
  details JSONB DEFAULT '{}'::jsonb, -- Additional context (old values, new values, etc.)
  ip_address VARCHAR(45), -- IPv4 or IPv6
  user_agent TEXT, -- Browser/device information
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource, resource_id);

-- Comments for documentation
COMMENT ON TABLE audit_logs IS 'Audit trail for user actions in master account management';
COMMENT ON COLUMN audit_logs.action IS 'Action type (e.g., user.created, permission.updated, mfa.enabled)';
COMMENT ON COLUMN audit_logs.details IS 'Additional context as JSON (e.g., {"oldValue": "...", "newValue": "..."})';

-- ============================================================================
-- 3. Create user_sessions table for active session tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL, -- JWT token or session identifier
  expires_at TIMESTAMP NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_activity_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);

-- Comments for documentation
COMMENT ON TABLE user_sessions IS 'Active user sessions for session management and security';
COMMENT ON COLUMN user_sessions.token IS 'JWT token or unique session identifier';
COMMENT ON COLUMN user_sessions.is_active IS 'Whether session is currently active (false after logout)';

-- ============================================================================
-- 4. Create role_permissions reference table (read-only, for UI display)
-- ============================================================================

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(50) NOT NULL UNIQUE, -- 'pharmacist', 'doctor', 'nurse', 'delivery', 'patient'
  display_name VARCHAR(100) NOT NULL,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of permission strings
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default role permissions (based on MetaPharm Connect specs)
INSERT INTO role_permissions (role, display_name, permissions, description) VALUES
  ('pharmacist', 'Pharmacist',
   '["prescriptions.view", "prescriptions.approve", "inventory.manage", "users.view", "users.create", "teleconsult.access", "analytics.view", "marketing.manage", "delivery.coordinate"]'::jsonb,
   'Master account with full access to pharmacy operations'),
  ('doctor', 'Doctor',
   '["prescriptions.create", "prescriptions.view", "patients.view", "teleconsult.access", "messaging.secure"]'::jsonb,
   'Doctor with prescription creation and patient access'),
  ('nurse', 'Nurse',
   '["patients.view", "orders.create", "delivery.track", "prescriptions.view"]'::jsonb,
   'Nurse with patient care and order management'),
  ('delivery', 'Delivery Personnel',
   '["deliveries.view", "deliveries.update", "gps.access", "qr.scan"]'::jsonb,
   'Delivery personnel with route and tracking access'),
  ('patient', 'Patient',
   '["prescriptions.view", "orders.create", "teleconsult.book", "appointments.book", "profile.manage"]'::jsonb,
   'Patient with self-service access')
ON CONFLICT (role) DO UPDATE SET
  permissions = EXCLUDED.permissions,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description;

-- Comments for documentation
COMMENT ON TABLE role_permissions IS 'Default permissions for each user role (reference data for UI)';
COMMENT ON COLUMN role_permissions.permissions IS 'Array of permission strings (e.g., ["prescriptions.view", "inventory.manage"])';

-- ============================================================================
-- 5. Add helper function to get effective user permissions
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_role VARCHAR(50);
  v_override JSONB;
  v_default JSONB;
BEGIN
  -- Get user role and permissions override
  SELECT role, COALESCE(permissions_override, '[]'::jsonb)
  INTO v_role, v_override
  FROM users
  WHERE id = p_user_id;

  -- If user has permission overrides, return those
  IF jsonb_array_length(v_override) > 0 THEN
    RETURN v_override;
  END IF;

  -- Otherwise, return default role permissions
  SELECT permissions
  INTO v_default
  FROM role_permissions
  WHERE role = v_role;

  RETURN COALESCE(v_default, '[]'::jsonb);
END;
$$;

COMMENT ON FUNCTION get_user_permissions IS 'Get effective permissions for a user (override or default role permissions)';

-- ============================================================================
-- 6. Add helper function to clean up expired sessions
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete expired sessions
  DELETE FROM user_sessions
  WHERE expires_at < NOW();

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_expired_sessions IS 'Delete expired sessions (call periodically or via cron job)';

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 009 completed: Master Account Management tables created successfully';
END $$;
