/**
 * Seed Test Users Script
 * Creates 3 test users for E2E testing: pharmacist, doctor, patient
 *
 * Usage: npm run seed:test-users
 *
 * Idempotent: Safe to run multiple times (upsert logic)
 * Database: PostgreSQL via TypeORM
 */

import dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
import { User, UserRole, UserStatus } from '../../../shared/models/User';
import { Pharmacy } from '../../../shared/models/Pharmacy';
import { AuditTrailEntry } from '../../../shared/models/AuditTrailEntry';
import { hashPassword } from '../../../shared/utils/auth';

// ============================================================================
// Database Connection
// ============================================================================

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'metapharm',
  password: process.env.DATABASE_PASSWORD || 'metapharm_dev_password',
  database: process.env.DATABASE_NAME || 'metapharm',
  entities: [User, Pharmacy, AuditTrailEntry],
  synchronize: false,
  logging: false,
});

// ============================================================================
// Test User Definitions
// ============================================================================

const TEST_USERS = [
  {
    email: 'pharmacist@test.metapharm.ch',
    password: 'TestPass123!',
    role: UserRole.PHARMACIST,
    firstName: 'Test',
    lastName: 'Pharmacist',
  },
  {
    email: 'doctor@test.metapharm.ch',
    password: 'TestPass123!',
    role: UserRole.DOCTOR,
    firstName: 'Test',
    lastName: 'Doctor',
  },
  {
    email: 'patient@test.metapharm.ch',
    password: 'TestPass123!',
    role: UserRole.PATIENT,
    firstName: 'Test',
    lastName: 'Patient',
  },
];

// ============================================================================
// Encryption Helpers (For encrypted fields)
// ============================================================================

/**
 * Create a simple encryption buffer for test users
 * In production, this would use AWS KMS
 * For E2E tests, we use simple Buffer encoding
 */
function createEncryptedBuffer(value: string): Buffer {
  // For test users, we'll store the plaintext in a Buffer
  // This is acceptable because:
  // 1. These are test-only accounts with fake data
  // 2. E2E tests don't validate encryption
  // 3. Real production users would use AWS KMS encryption
  return Buffer.from(value, 'utf-8');
}

// ============================================================================
// Seed Logic
// ============================================================================

async function seedTestUsers() {
  console.log('🌱 Starting test user seeding...\n');

  try {
    // Connect to database
    console.log('📊 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    const userRepository = AppDataSource.getRepository(User);

    for (const testUser of TEST_USERS) {
      console.log(`📝 Processing: ${testUser.email}`);

      // Hash password
      const passwordHash = await hashPassword(testUser.password);

      // Check if user already exists
      let user = await userRepository.findOne({
        where: { email: testUser.email },
      });

      if (user) {
        // Update existing user
        console.log(`   ↳ User exists - updating...`);

        user.password_hash = passwordHash;
        user.role = testUser.role;
        user.status = UserStatus.ACTIVE;
        user.email_verified = true;
        user.mfa_enabled = false; // Disable MFA for test users
        user.mfa_secret = null;
        user.mfa_secret_encrypted = null;
        user.first_name_encrypted = createEncryptedBuffer(testUser.firstName);
        user.last_name_encrypted = createEncryptedBuffer(testUser.lastName);
        user.deleted_at = null; // Un-soft-delete if previously deleted

        await userRepository.save(user);
        console.log(`   ✅ Updated: ${testUser.email}`);
      } else {
        // Create new user
        console.log(`   ↳ User does not exist - creating...`);

        user = userRepository.create({
          email: testUser.email,
          email_verified: true,
          password_hash: passwordHash,
          role: testUser.role,
          status: UserStatus.ACTIVE,
          first_name_encrypted: createEncryptedBuffer(testUser.firstName),
          last_name_encrypted: createEncryptedBuffer(testUser.lastName),
          phone_encrypted: null,
          mfa_enabled: false, // No MFA for test users
          mfa_secret: null,
          mfa_secret_encrypted: null,
          hin_id: null,
          primary_pharmacy_id: null,
          master_account_id: null,
          permissions_override: null,
          last_login_at: null,
          deleted_at: null,
        });

        await userRepository.save(user);
        console.log(`   ✅ Created: ${testUser.email}`);
      }
    }

    console.log('\n✅ Test users seeded successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Total users: ${TEST_USERS.length}`);
    console.log(`   - Pharmacist: pharmacist@test.metapharm.ch`);
    console.log(`   - Doctor: doctor@test.metapharm.ch`);
    console.log(`   - Patient: patient@test.metapharm.ch`);
    console.log(`   - Password: TestPass123!`);
    console.log(`   - MFA: Disabled (for E2E testing)`);

    // Close database connection
    await AppDataSource.destroy();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Failed to seed test users:', error);

    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }

    process.exit(1);
  }
}

// ============================================================================
// Execute
// ============================================================================

seedTestUsers();
