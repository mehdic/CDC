/**
 * Migration: Create Doctors Table
 * Creates doctors table for healthcare professional profiles
 * HIPAA/GDPR Compliant - Medical professional data with audit logging
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDoctorsTable1762971102000 implements MigrationInterface {
  name = 'CreateDoctorsTable1762971102000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create doctors table
    await queryRunner.query(`
      CREATE TABLE doctors (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
        specialization VARCHAR(100) NOT NULL,
        license_number VARCHAR(50) NOT NULL UNIQUE,
        license_country VARCHAR(50) NOT NULL DEFAULT 'CH',
        qualifications JSONB NULL,
        is_verified BOOLEAN NOT NULL DEFAULT false,
        bio TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMP NULL
      );
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX idx_doctors_user_id ON doctors(user_id);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_doctors_license_number ON doctors(license_number);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_doctors_specialization ON doctors(specialization);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_doctors_is_verified ON doctors(is_verified);
    `);

    // Add trigger for updated_at
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_doctors_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trigger_update_doctors_updated_at
      BEFORE UPDATE ON doctors
      FOR EACH ROW
      EXECUTE FUNCTION update_doctors_updated_at();
    `);

    console.log('✅ Created doctors table with indexes and triggers');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trigger_update_doctors_updated_at ON doctors;
      DROP FUNCTION IF EXISTS update_doctors_updated_at();
    `);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_doctors_is_verified;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_doctors_specialization;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_doctors_license_number;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_doctors_user_id;`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS doctors;`);

    console.log('✅ Dropped doctors table');
  }
}
