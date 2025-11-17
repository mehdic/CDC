-- Create E2E test user for automated tests
-- Email: test@test.com, Password: password
-- Run this: psql -h localhost -U metapharm_user -d metapharm_connect -f create-e2e-test-user.sql

-- Delete existing test user if exists
DELETE FROM users WHERE email = 'test@test.com';

-- Create test user
-- Password hash for 'password' generated with bcrypt (10 rounds)
INSERT INTO users (
  email,
  password_hash,
  role,
  first_name_encrypted,
  last_name_encrypted,
  phone_encrypted,
  mfa_enabled,
  primary_pharmacy_id,
  email_verified,
  status,
  created_at,
  updated_at
) VALUES (
  'test@test.com',
  '$2b$10$nXmQqj5cJ/IiEa5dCV3lmOPElAVrcSn0PUA42sFBsSqZHLwbPPkVC', -- password
  'patient',
  E'ENC:Test'::bytea,
  E'ENC:User'::bytea,
  E'ENC:+41 79 999 9999'::bytea,
  false,
  NULL,
  true,
  'active',
  NOW(),
  NOW()
);

SELECT 'E2E test user created successfully!' as status,
       email, role
FROM users
WHERE email = 'test@test.com';
