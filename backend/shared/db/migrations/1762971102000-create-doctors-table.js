"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateDoctorsTable1762971102000 = void 0;
class CreateDoctorsTable1762971102000 {
    name = 'CreateDoctorsTable1762971102000';
    async up(queryRunner) {
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
    async down(queryRunner) {
        await queryRunner.query(`
      DROP TRIGGER IF EXISTS trigger_update_doctors_updated_at ON doctors;
      DROP FUNCTION IF EXISTS update_doctors_updated_at();
    `);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_doctors_is_verified;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_doctors_specialization;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_doctors_license_number;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_doctors_user_id;`);
        await queryRunner.query(`DROP TABLE IF EXISTS doctors;`);
        console.log('✅ Dropped doctors table');
    }
}
exports.CreateDoctorsTable1762971102000 = CreateDoctorsTable1762971102000;
//# sourceMappingURL=1762971102000-create-doctors-table.js.map