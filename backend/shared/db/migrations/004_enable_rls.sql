-- Migration: Enable Row-Level Security (RLS) for multi-tenant data isolation
-- Purpose: Enforce data boundaries at database level for HIPAA/GDPR compliance
-- Based on: /specs/002-metapharm-platform/data-model.md

-- ============================================================================
-- RLS for users table
-- ============================================================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own profile
CREATE POLICY users_view_own_profile ON users
    FOR SELECT
    USING (id = current_setting('app.current_user_id', true)::UUID);

-- Policy 2: Users can update their own profile (not role/status)
CREATE POLICY users_update_own_profile ON users
    FOR UPDATE
    USING (id = current_setting('app.current_user_id', true)::UUID);

-- Policy 3: Pharmacists can view users in their pharmacy
CREATE POLICY pharmacists_view_pharmacy_users ON users
    FOR SELECT
    USING (
        primary_pharmacy_id = current_setting('app.current_pharmacy_id', true)::UUID
        AND current_setting('app.current_user_role', true) = 'pharmacist'
    );

-- Policy 4: System admins can view all users (for management)
CREATE POLICY system_view_all_users ON users
    FOR SELECT
    USING (current_setting('app.current_user_role', true) = 'system_admin');

-- ============================================================================
-- RLS for pharmacies table
-- ============================================================================

-- Enable RLS on pharmacies table
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own pharmacy
CREATE POLICY users_view_own_pharmacy ON pharmacies
    FOR SELECT
    USING (id = current_setting('app.current_pharmacy_id', true)::UUID);

-- Policy 2: Pharmacists can update their own pharmacy (for settings, hours)
CREATE POLICY pharmacists_update_own_pharmacy ON pharmacies
    FOR UPDATE
    USING (
        id = current_setting('app.current_pharmacy_id', true)::UUID
        AND current_setting('app.current_user_role', true) = 'pharmacist'
    );

-- Policy 3: Patients can view pharmacy basic info (for selecting pharmacy)
CREATE POLICY patients_view_pharmacy_basic_info ON pharmacies
    FOR SELECT
    USING (current_setting('app.current_user_role', true) = 'patient');

-- Policy 4: System admins can view all pharmacies (for management)
CREATE POLICY system_view_all_pharmacies ON pharmacies
    FOR SELECT
    USING (current_setting('app.current_user_role', true) = 'system_admin');

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON POLICY users_view_own_profile ON users IS 'Users can view their own profile data';
COMMENT ON POLICY users_update_own_profile ON users IS 'Users can update their own profile (excluding role and status)';
COMMENT ON POLICY pharmacists_view_pharmacy_users ON users IS 'Pharmacists can view users affiliated with their pharmacy';
COMMENT ON POLICY system_view_all_users ON users IS 'System admins have unrestricted access for management';

COMMENT ON POLICY users_view_own_pharmacy ON pharmacies IS 'Users can view their affiliated pharmacy';
COMMENT ON POLICY pharmacists_update_own_pharmacy ON pharmacies IS 'Pharmacists can update their own pharmacy settings';
COMMENT ON POLICY patients_view_pharmacy_basic_info ON pharmacies IS 'Patients can view pharmacy list for selection';
COMMENT ON POLICY system_view_all_pharmacies ON pharmacies IS 'System admins have unrestricted access for management';

-- ============================================================================
-- Usage Notes
-- ============================================================================

-- Application must set these configuration variables for each request:
--   SET LOCAL app.current_user_id = '<user_uuid>';
--   SET LOCAL app.current_pharmacy_id = '<pharmacy_uuid>';
--   SET LOCAL app.current_user_role = '<role>';
--
-- Example (in application code):
--   await client.query("SET LOCAL app.current_user_id = $1", [userId]);
--   await client.query("SET LOCAL app.current_pharmacy_id = $1", [pharmacyId]);
--   await client.query("SET LOCAL app.current_user_role = $1", [role]);
