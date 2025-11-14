/**
 * Migration: Create Nurses Table
 * Creates nurses table for healthcare professional profiles
 * HIPAA/GDPR Compliant - Medical professional data with audit logging
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNursesTable1762971103000 implements MigrationInterface {
  name = 'CreateNursesTable1762971103000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create nurses table
    await queryRunner.query(`
      CREATE TABLE nurses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
        specialization VARCHAR(100) NOT NULL,
        license_number VARCHAR(50) NOT NULL UNIQUE,
        license_country VARCHAR(50) NOT NULL DEFAULT 'CH',
        certifications JSONB NULL,
        is_verified BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMP NULL
      );
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX idx_nurses_user_id ON nurses(user_id);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_nurses_license_number ON nurses(license_number);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_nurses_specialization ON nurses(specialization);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_nurses_is_verified ON nurses(is_verified);
    `);

    // Add trigger for updated_at
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_nurses_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trigger_update_nurses_updated_at
      BEFORE UPDATE ON nurses
      FOR EACH ROW
      EXECUTE FUNCTION update_nurses_updated_at();
    `);

    console.log('✅ Created nurses table with indexes and triggers');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trigger_update_nurses_updated_at ON nurses;
      DROP FUNCTION IF EXISTS update_nurses_updated_at();
    `);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_nurses_is_verified;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_nurses_specialization;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_nurses_license_number;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_nurses_user_id;`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS nurses;`);

    console.log('✅ Dropped nurses table');
  }
}
