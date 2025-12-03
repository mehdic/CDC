import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migration: Add GLN field to users table
 *
 * GLN (Global Location Number) is the Swiss healthcare professional ID
 * required for HIN e-ID integration (Phase 5)
 *
 * GLN format: 13-digit number (e.g., 7601234567890)
 * Source: HIN OAuth2 userinfo endpoint
 */
export class AddGlnField1733244000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add GLN column
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'gln',
        type: 'varchar',
        length: '13',
        isNullable: true,
        comment: 'Global Location Number (Swiss healthcare professional ID)',
      })
    );

    // Add index for GLN lookups
    await queryRunner.query(
      `CREATE INDEX idx_users_gln ON users (gln)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX idx_users_gln`);

    // Drop GLN column
    await queryRunner.dropColumn('users', 'gln');
  }
}
