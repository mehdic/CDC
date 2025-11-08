/**
 * Development Seed Data
 * Creates test users and pharmacies for local development
 *
 * Usage: ts-node dev-seed.ts
 */

import { Client } from 'pg';
import bcrypt from 'bcrypt';

/**
 * Get database connection from environment
 */
function getDatabaseConfig() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  return {
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  };
}

/**
 * Mock encryption for dev environment
 * In production, this would use AWS KMS
 */
function mockEncrypt(value: string): Buffer {
  // For dev purposes, just encode as buffer with a prefix
  // In production, replace with actual AWS KMS encryption
  return Buffer.from(`ENC:${value}`, 'utf-8');
}

/**
 * Hash password with bcrypt
 */
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Seed pharmacies
 */
async function seedPharmacies(client: Client): Promise<{ [key: string]: string }> {
  console.log('🏥 Seeding pharmacies...');

  const pharmacies = [
    {
      name: 'Pharmacie du Lac',
      license_number: 'CH-VD-12345',
      address_encrypted: mockEncrypt('Rue de la Paix 15'),
      city: 'Lausanne',
      canton: 'VD',
      postal_code: '1003',
      latitude: 46.5197,
      longitude: 6.6323,
      phone: '+41 21 555 0100',
      email: 'contact@pharmacie-du-lac.ch',
      operating_hours: JSON.stringify({
        monday: { open: '08:00', close: '18:30' },
        tuesday: { open: '08:00', close: '18:30' },
        wednesday: { open: '08:00', close: '18:30' },
        thursday: { open: '08:00', close: '18:30' },
        friday: { open: '08:00', close: '18:30' },
        saturday: { open: '09:00', close: '17:00' },
        sunday: { open: null, close: null },
      }),
      subscription_tier: 'professional',
      subscription_status: 'active',
    },
    {
      name: 'Pharmacie Centrale',
      license_number: 'CH-GE-67890',
      address_encrypted: mockEncrypt('Place du Molard 3'),
      city: 'Geneva',
      canton: 'GE',
      postal_code: '1204',
      latitude: 46.2044,
      longitude: 6.1432,
      phone: '+41 22 555 0200',
      email: 'info@pharmacie-centrale.ch',
      operating_hours: JSON.stringify({
        monday: { open: '08:30', close: '19:00' },
        tuesday: { open: '08:30', close: '19:00' },
        wednesday: { open: '08:30', close: '19:00' },
        thursday: { open: '08:30', close: '19:00' },
        friday: { open: '08:30', close: '19:00' },
        saturday: { open: '09:00', close: '17:00' },
        sunday: { open: null, close: null },
      }),
      subscription_tier: 'enterprise',
      subscription_status: 'active',
    },
    {
      name: 'Pharmacie des Alpes',
      license_number: 'CH-VS-11223',
      address_encrypted: mockEncrypt('Avenue de la Gare 45'),
      city: 'Sion',
      canton: 'VS',
      postal_code: '1950',
      latitude: 46.2314,
      longitude: 7.3603,
      phone: '+41 27 555 0300',
      email: 'contact@pharmacie-alpes.ch',
      operating_hours: JSON.stringify({
        monday: { open: '08:00', close: '18:00' },
        tuesday: { open: '08:00', close: '18:00' },
        wednesday: { open: '08:00', close: '18:00' },
        thursday: { open: '08:00', close: '18:00' },
        friday: { open: '08:00', close: '18:00' },
        saturday: { open: '09:00', close: '16:00' },
        sunday: { open: null, close: null },
      }),
      subscription_tier: 'basic',
      subscription_status: 'trial',
    },
  ];

  const pharmacyIds: { [key: string]: string } = {};

  for (const pharmacy of pharmacies) {
    const result = await client.query(
      `INSERT INTO pharmacies (
        name, license_number, address_encrypted, city, canton, postal_code,
        latitude, longitude, phone, email, operating_hours,
        subscription_tier, subscription_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id`,
      [
        pharmacy.name,
        pharmacy.license_number,
        pharmacy.address_encrypted,
        pharmacy.city,
        pharmacy.canton,
        pharmacy.postal_code,
        pharmacy.latitude,
        pharmacy.longitude,
        pharmacy.phone,
        pharmacy.email,
        pharmacy.operating_hours,
        pharmacy.subscription_tier,
        pharmacy.subscription_status,
      ]
    );

    pharmacyIds[pharmacy.name] = result.rows[0].id;
    console.log(`  ✅ Created pharmacy: ${pharmacy.name} (${result.rows[0].id})`);
  }

  return pharmacyIds;
}

/**
 * Seed users
 */
async function seedUsers(client: Client, pharmacyIds: { [key: string]: string }): Promise<void> {
  console.log('👥 Seeding users...');

  const users = [
    // Pharmacist
    {
      email: 'pharmacist@test.com',
      password: 'Test123!',
      role: 'pharmacist',
      first_name: 'Marie',
      last_name: 'Dubois',
      phone: '+41 79 123 4567',
      hin_id: 'HIN-CH-12345',
      mfa_enabled: true,
      primary_pharmacy_id: pharmacyIds['Pharmacie du Lac'],
    },
    // Doctor
    {
      email: 'doctor@test.com',
      password: 'Test123!',
      role: 'doctor',
      first_name: 'Jean',
      last_name: 'Martin',
      phone: '+41 79 234 5678',
      hin_id: 'HIN-CH-67890',
      mfa_enabled: true,
      primary_pharmacy_id: null,
    },
    // Nurse
    {
      email: 'nurse@test.com',
      password: 'Test123!',
      role: 'nurse',
      first_name: 'Sophie',
      last_name: 'Lemoine',
      phone: '+41 79 345 6789',
      hin_id: null,
      mfa_enabled: false,
      primary_pharmacy_id: null,
    },
    // Delivery Personnel
    {
      email: 'delivery@test.com',
      password: 'Test123!',
      role: 'delivery',
      first_name: 'Luc',
      last_name: 'Bernard',
      phone: '+41 79 456 7890',
      hin_id: null,
      mfa_enabled: false,
      primary_pharmacy_id: pharmacyIds['Pharmacie du Lac'],
    },
    // Patient 1
    {
      email: 'patient1@test.com',
      password: 'Test123!',
      role: 'patient',
      first_name: 'Claire',
      last_name: 'Petit',
      phone: '+41 79 567 8901',
      hin_id: null,
      mfa_enabled: false,
      primary_pharmacy_id: pharmacyIds['Pharmacie du Lac'],
    },
    // Patient 2
    {
      email: 'patient2@test.com',
      password: 'Test123!',
      role: 'patient',
      first_name: 'Pierre',
      last_name: 'Blanc',
      phone: '+41 79 678 9012',
      hin_id: null,
      mfa_enabled: false,
      primary_pharmacy_id: pharmacyIds['Pharmacie Centrale'],
    },
    // Pharmacist 2 (for Pharmacie Centrale)
    {
      email: 'pharmacist2@test.com',
      password: 'Test123!',
      role: 'pharmacist',
      first_name: 'Isabelle',
      last_name: 'Rousseau',
      phone: '+41 79 789 0123',
      hin_id: 'HIN-CH-11223',
      mfa_enabled: true,
      primary_pharmacy_id: pharmacyIds['Pharmacie Centrale'],
    },
  ];

  for (const user of users) {
    const passwordHash = await hashPassword(user.password);

    const result = await client.query(
      `INSERT INTO users (
        email, password_hash, role, first_name_encrypted, last_name_encrypted,
        phone_encrypted, hin_id, mfa_enabled, primary_pharmacy_id, email_verified, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id`,
      [
        user.email,
        passwordHash,
        user.role,
        mockEncrypt(user.first_name),
        mockEncrypt(user.last_name),
        mockEncrypt(user.phone),
        user.hin_id,
        user.mfa_enabled,
        user.primary_pharmacy_id,
        true, // email_verified
        'active', // status
      ]
    );

    console.log(`  ✅ Created user: ${user.email} (${user.role}) - ${result.rows[0].id}`);
  }
}

/**
 * Main seed function
 */
async function seed(): Promise<void> {
  const dbConfig = getDatabaseConfig();
  const client = new Client(dbConfig);

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database');

    // Start transaction
    await client.query('BEGIN');

    // Seed data
    const pharmacyIds = await seedPharmacies(client);
    await seedUsers(client, pharmacyIds);

    // Commit transaction
    await client.query('COMMIT');

    console.log('\n✅ Seed data created successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('  Pharmacist: pharmacist@test.com / Test123!');
    console.log('  Doctor: doctor@test.com / Test123!');
    console.log('  Nurse: nurse@test.com / Test123!');
    console.log('  Delivery: delivery@test.com / Test123!');
    console.log('  Patient 1: patient1@test.com / Test123!');
    console.log('  Patient 2: patient2@test.com / Test123!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

/**
 * Run seed if executed directly
 */
if (require.main === module) {
  seed()
    .then(() => {
      console.log('✅ Seed command completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed command failed:', error);
      process.exit(1);
    });
}

export { seed };
