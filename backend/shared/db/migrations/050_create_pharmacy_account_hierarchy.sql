-- Migration 050: Pharmacy Account Hierarchy (T6-009)
-- Purpose: Comprehensive pharmacy account hierarchy with master/sub-account relationships
-- Features: Multi-level hierarchy (up to 3 levels), RBAC, data isolation, cross-account reporting
-- Security: Tenant isolation, permission boundaries, audit trail
-- Created: 2025-12-03

-- ============================================================================
-- 1. Create pharmacy_accounts table
-- ============================================================================

CREATE TABLE IF NOT EXISTS pharmacy_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Hierarchy fields
  account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('master', 'sub')),
  level INT NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 3), -- Max 3 levels
  parent_id UUID REFERENCES pharmacy_accounts(id) ON DELETE RESTRICT,
  root_master_id UUID REFERENCES pharmacy_accounts(id) ON DELETE CASCADE,

  -- Account identity
  name VARCHAR(255) NOT NULL,
  pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending_transfer')),
  suspension_reason TEXT,
  suspended_at TIMESTAMP,
  suspended_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Data isolation & sharing configuration
  data_sharing_mode VARCHAR(50) NOT NULL DEFAULT 'isolated' CHECK (
    data_sharing_mode IN ('isolated', 'shared_products', 'shared_pricing', 'full_shared')
  ),
  cross_account_reporting_enabled BOOLEAN NOT NULL DEFAULT FALSE,

  -- Transfer management
  pending_transfer_to_account_id UUID REFERENCES pharmacy_accounts(id) ON DELETE SET NULL,
  transfer_requested_at TIMESTAMP,
  transfer_requested_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP, -- Soft delete
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pharmacy_accounts_type ON pharmacy_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_pharmacy_accounts_level ON pharmacy_accounts(level);
CREATE INDEX IF NOT EXISTS idx_pharmacy_accounts_parent ON pharmacy_accounts(parent_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_accounts_root ON pharmacy_accounts(root_master_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_accounts_pharmacy ON pharmacy_accounts(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_accounts_status ON pharmacy_accounts(status);

-- TypeORM tree (closure-table) support
CREATE TABLE IF NOT EXISTS pharmacy_accounts_closure (
  id_ancestor UUID NOT NULL REFERENCES pharmacy_accounts(id) ON DELETE CASCADE,
  id_descendant UUID NOT NULL REFERENCES pharmacy_accounts(id) ON DELETE CASCADE,
  PRIMARY KEY (id_ancestor, id_descendant)
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_accounts_closure_ancestor ON pharmacy_accounts_closure(id_ancestor);
CREATE INDEX IF NOT EXISTS idx_pharmacy_accounts_closure_descendant ON pharmacy_accounts_closure(id_descendant);

-- Comments for documentation
COMMENT ON TABLE pharmacy_accounts IS 'Pharmacy account hierarchy supporting master/sub-account relationships (T6-009)';
COMMENT ON COLUMN pharmacy_accounts.level IS 'Hierarchy level: 1=master, 2=first sub, 3=nested sub (max 3 levels)';
COMMENT ON COLUMN pharmacy_accounts.data_sharing_mode IS 'Data sharing with master: isolated, shared_products, shared_pricing, full_shared';
COMMENT ON COLUMN pharmacy_accounts.cross_account_reporting_enabled IS 'Allow master account to view aggregated reports from sub-accounts';

-- ============================================================================
-- 2. Create account_roles table (RBAC)
-- ============================================================================

CREATE TABLE IF NOT EXISTS account_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Account association
  account_id UUID NOT NULL REFERENCES pharmacy_accounts(id) ON DELETE CASCADE,

  -- Role definition
  name VARCHAR(100) NOT NULL, -- Display name (e.g., "Pharmacy Manager")
  role_type VARCHAR(50) NOT NULL CHECK (
    role_type IN ('master_admin', 'sub_account_manager', 'staff', 'read_only')
  ),
  description TEXT,

  -- Permissions (JSONB for flexibility)
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Inheritance
  inherits_from_role_id UUID REFERENCES account_roles(id) ON DELETE SET NULL,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_system_role BOOLEAN NOT NULL DEFAULT FALSE, -- System roles cannot be deleted

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_account_roles_account ON account_roles(account_id);
CREATE INDEX IF NOT EXISTS idx_account_roles_type ON account_roles(role_type);
CREATE INDEX IF NOT EXISTS idx_account_roles_inherits FROM ON account_roles(inherits_from_role_id);

-- Comments for documentation
COMMENT ON TABLE account_roles IS 'RBAC roles for pharmacy account hierarchy (T6-009)';
COMMENT ON COLUMN account_roles.permissions IS 'Permission set as JSONB (e.g., {"accounts.create": true, "users.view": true})';
COMMENT ON COLUMN account_roles.inherits_from_role_id IS 'Inherit permissions from another role';
COMMENT ON COLUMN account_roles.is_system_role IS 'System-defined roles cannot be deleted by users';

-- ============================================================================
-- 3. Create account_users junction table (many-to-many with roles)
-- ============================================================================

CREATE TABLE IF NOT EXISTS account_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES pharmacy_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES account_roles(id) ON DELETE RESTRICT,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  assigned_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Ensure user is assigned only once per account (with active role)
  UNIQUE (account_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_account_users_account ON account_users(account_id);
CREATE INDEX IF NOT EXISTS idx_account_users_user ON account_users(user_id);
CREATE INDEX IF NOT EXISTS idx_account_users_role ON account_users(role_id);

COMMENT ON TABLE account_users IS 'User assignments to accounts with specific roles (T6-009)';
COMMENT ON COLUMN account_users.is_active IS 'Active assignment (user may have inactive/historical assignments)';

-- ============================================================================
-- 4. Create account_audit_log table (security audit trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS account_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Account context
  account_id UUID NOT NULL REFERENCES pharmacy_accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Action details
  action VARCHAR(255) NOT NULL, -- e.g., 'account.created', 'account.suspended', 'role.assigned'
  resource_type VARCHAR(100), -- e.g., 'account', 'role', 'user_assignment'
  resource_id UUID,

  -- Context
  details JSONB DEFAULT '{}'::jsonb,
  ip_address VARCHAR(45),
  user_agent TEXT,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_account_audit_log_account ON account_audit_log(account_id);
CREATE INDEX IF NOT EXISTS idx_account_audit_log_user ON account_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_account_audit_log_action ON account_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_account_audit_log_created_at ON account_audit_log(created_at DESC);

COMMENT ON TABLE account_audit_log IS 'Audit trail for account hierarchy operations (T6-009 security requirement)';
COMMENT ON COLUMN account_audit_log.details IS 'Additional context as JSON (e.g., {"old_value": "...", "new_value": "..."})';

-- ============================================================================
-- 5. Helper Functions
-- ============================================================================

-- Function: Get all ancestor accounts for a given account
CREATE OR REPLACE FUNCTION get_ancestor_accounts(p_account_id UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  level INT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE ancestors AS (
    -- Base case: the account itself
    SELECT a.id, a.name, a.level, a.parent_id
    FROM pharmacy_accounts a
    WHERE a.id = p_account_id

    UNION ALL

    -- Recursive case: parent accounts
    SELECT a.id, a.name, a.level, a.parent_id
    FROM pharmacy_accounts a
    INNER JOIN ancestors anc ON a.id = anc.parent_id
  )
  SELECT a.id, a.name, a.level
  FROM ancestors a
  ORDER BY a.level ASC;
END;
$$;

COMMENT ON FUNCTION get_ancestor_accounts IS 'Get all ancestor accounts in hierarchy (T6-009)';

-- Function: Get all descendant accounts for a given account
CREATE OR REPLACE FUNCTION get_descendant_accounts(p_account_id UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  level INT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE descendants AS (
    -- Base case: the account itself
    SELECT a.id, a.name, a.level
    FROM pharmacy_accounts a
    WHERE a.id = p_account_id

    UNION ALL

    -- Recursive case: child accounts
    SELECT a.id, a.name, a.level
    FROM pharmacy_accounts a
    INNER JOIN descendants d ON a.parent_id = d.id
  )
  SELECT d.id, d.name, d.level
  FROM descendants d
  ORDER BY d.level ASC;
END;
$$;

COMMENT ON FUNCTION get_descendant_accounts IS 'Get all descendant accounts in hierarchy (T6-009)';

-- Function: Check if user has permission in account
CREATE OR REPLACE FUNCTION user_has_account_permission(
  p_user_id UUID,
  p_account_id UUID,
  p_permission VARCHAR(100)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_has_permission BOOLEAN := FALSE;
BEGIN
  -- Check if user is assigned to account with a role that has the permission
  SELECT EXISTS(
    SELECT 1
    FROM account_users au
    INNER JOIN account_roles ar ON au.role_id = ar.id
    WHERE au.user_id = p_user_id
      AND au.account_id = p_account_id
      AND au.is_active = TRUE
      AND ar.is_active = TRUE
      AND (ar.permissions->p_permission)::BOOLEAN = TRUE
  ) INTO v_has_permission;

  RETURN v_has_permission;
END;
$$;

COMMENT ON FUNCTION user_has_account_permission IS 'Check if user has specific permission in account (T6-009 RBAC)';

-- Function: Get user's effective permissions for an account
CREATE OR REPLACE FUNCTION get_user_account_permissions(
  p_user_id UUID,
  p_account_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_permissions JSONB := '{}'::jsonb;
BEGIN
  -- Get permissions from user's role in the account
  SELECT COALESCE(ar.permissions, '{}'::jsonb)
  INTO v_permissions
  FROM account_users au
  INNER JOIN account_roles ar ON au.role_id = ar.id
  WHERE au.user_id = p_user_id
    AND au.account_id = p_account_id
    AND au.is_active = TRUE
    AND ar.is_active = TRUE
  LIMIT 1;

  RETURN v_permissions;
END;
$$;

COMMENT ON FUNCTION get_user_account_permissions IS 'Get all permissions for user in account (T6-009 RBAC)';

-- ============================================================================
-- 6. Triggers
-- ============================================================================

-- Trigger: Update updated_at on pharmacy_accounts change
CREATE OR REPLACE FUNCTION update_pharmacy_account_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_pharmacy_accounts_updated_at
BEFORE UPDATE ON pharmacy_accounts
FOR EACH ROW
EXECUTE FUNCTION update_pharmacy_account_timestamp();

-- Trigger: Update updated_at on account_roles change
CREATE TRIGGER trigger_account_roles_updated_at
BEFORE UPDATE ON account_roles
FOR EACH ROW
EXECUTE FUNCTION update_pharmacy_account_timestamp();

-- Trigger: Auto-populate root_master_id on insert
CREATE OR REPLACE FUNCTION set_root_master_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If this is a master account (no parent), root_master_id is itself
  IF NEW.parent_id IS NULL THEN
    NEW.root_master_id = NEW.id;
  ELSE
    -- Otherwise, inherit root_master_id from parent
    SELECT root_master_id INTO NEW.root_master_id
    FROM pharmacy_accounts
    WHERE id = NEW.parent_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_root_master_id
BEFORE INSERT ON pharmacy_accounts
FOR EACH ROW
EXECUTE FUNCTION set_root_master_id();

-- ============================================================================
-- 7. Security: Row-Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on pharmacy_accounts
ALTER TABLE pharmacy_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see accounts they have access to
CREATE POLICY pharmacy_accounts_user_access ON pharmacy_accounts
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM account_users au
    WHERE au.account_id = pharmacy_accounts.id
      AND au.user_id = current_setting('app.current_user_id')::UUID
      AND au.is_active = TRUE
  )
);

-- Policy: Master admins can manage accounts
CREATE POLICY pharmacy_accounts_admin_manage ON pharmacy_accounts
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM account_users au
    INNER JOIN account_roles ar ON au.role_id = ar.id
    WHERE au.account_id = pharmacy_accounts.root_master_id
      AND au.user_id = current_setting('app.current_user_id')::UUID
      AND au.is_active = TRUE
      AND ar.role_type = 'master_admin'
  )
);

COMMENT ON POLICY pharmacy_accounts_user_access ON pharmacy_accounts IS 'RLS: Users see only accounts they are assigned to';
COMMENT ON POLICY pharmacy_accounts_admin_manage ON pharmacy_accounts IS 'RLS: Master admins can manage all accounts in hierarchy';

-- ============================================================================
-- 8. Seed Data: System Roles
-- ============================================================================

-- Insert system roles (will be created for each account during setup)
-- These are reference templates, actual roles will be account-specific

-- Note: Actual role creation happens in application code during account creation
-- This migration only creates the schema

-- ============================================================================
-- Migration Complete
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 050 completed: Pharmacy Account Hierarchy tables created successfully (T6-009)';
  RAISE NOTICE 'Features: Multi-level hierarchy, RBAC, data isolation, audit trail';
  RAISE NOTICE 'Security: RLS policies, permission boundaries, tenant isolation';
END $$;
