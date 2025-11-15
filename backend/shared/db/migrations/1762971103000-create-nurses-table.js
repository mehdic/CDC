"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateNursesTable1762971103000 = void 0;
class CreateNursesTable1762971103000 {
    name = 'CreateNursesTable1762971103000';
    async up(queryRunner) {
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
    async down(queryRunner) {
        await queryRunner.query(`
      DROP TRIGGER IF EXISTS trigger_update_nurses_updated_at ON nurses;
      DROP FUNCTION IF EXISTS update_nurses_updated_at();
    `);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_nurses_is_verified;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_nurses_specialization;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_nurses_license_number;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_nurses_user_id;`);
        await queryRunner.query(`DROP TABLE IF EXISTS nurses;`);
        console.log('✅ Dropped nurses table');
    }
}
exports.CreateNursesTable1762971103000 = CreateNursesTable1762971103000;
//# sourceMappingURL=1762971103000-create-nurses-table.js.map