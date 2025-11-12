-- Create test users matching E2E test expectations
-- Run this from the backend directory: psql -h localhost -U postgres -d metapharm_dev -f create-test-users.sql

-- First, delete existing test users if they exist
DELETE FROM users WHERE email IN (
  'pharmacist@test.metapharm.ch',
  'doctor@test.metapharm.ch',
  'patient@test.metapharm.ch'
);

-- Create test pharmacist user
-- Password hash for 'TestPass123!' generated with bcrypt (10 rounds)
INSERT INTO users (
  email,
  password_hash,
  role,
  first_name_encrypted,
  last_name_encrypted,
  phone_encrypted,
  hin_id,
  mfa_enabled,
  primary_pharmacy_id,
  email_verified,
  status
) VALUES (
  'pharmacist@test.metapharm.ch',
  '$2b$10$4s76KfW7t3gaymxCMZP5tO.o9A1nWDkLz1REhUrxwimYrxdhLYxpe', -- TestPass123!
  'pharmacist',
  E'ENC:Marie'::bytea,
  E'ENC:Dupont'::bytea,
  E'ENC:+41 79 123 4567'::bytea,
  'HIN-CH-E2E-PHARMACIST',
  false,
  (SELECT id FROM pharmacies LIMIT 1),
  true,
  'active'
);

-- Create test doctor user
INSERT INTO users (
  email,
  password_hash,
  role,
  first_name_encrypted,
  last_name_encrypted,
  phone_encrypted,
  hin_id,
  mfa_enabled,
  primary_pharmacy_id,
  email_verified,
  status
) VALUES (
  'doctor@test.metapharm.ch',
  '$2b$10$4s76KfW7t3gaymxCMZP5tO.o9A1nWDkLz1REhUrxwimYrxdhLYxpe', -- TestPass123!
  'doctor',
  E'ENC:Jean'::bytea,
  E'ENC:Martin'::bytea,
  E'ENC:+41 79 234 5678'::bytea,
  'HIN-CH-E2E-DOCTOR',
  false,
  NULL,
  true,
  'active'
);

-- Create test patient user
INSERT INTO users (
  email,
  password_hash,
  role,
  first_name_encrypted,
  last_name_encrypted,
  phone_encrypted,
  hin_id,
  mfa_enabled,
  primary_pharmacy_id,
  email_verified,
  status
) VALUES (
  'patient@test.metapharm.ch',
  '$2b$10$4s76KfW7t3gaymxCMZP5tO.o9A1nWDkLz1REhUrxwimYrxdhLYxpe', -- TestPass123!
  'patient',
  E'ENC:Sophie'::bytea,
  E'ENC:Bernard'::bytea,
  E'ENC:+41 79 345 6789'::bytea,
  NULL,
  false,
  (SELECT id FROM pharmacies LIMIT 1),
  true,
  'active'
);

SELECT 'Test users created successfully!' as status;
