import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

/**
 * Migration: Add Master Account Management Fields
 * Purpose: Enable multi-tenancy master account management with sub-accounts
 *
 * Adds:
 * - master_account_id: UUID foreign key to identify master account
 * - permissions_override: JSONB field for custom sub-account permissions
 *
 * Part of: Batch 3 Phase 3a - Dependency Resolution
 */
export class AddMasterAccountFields1762971101000 implements MigrationInterface {
  name = 'AddMasterAccountFields1762971101000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add master_account_id column
    await queryRunner.addColumn('users', new TableColumn({
      name: 'master_account_id',
      type: 'uuid',
      isNullable: true,
      comment: 'Reference to master account user (for sub-accounts)',
    }));

    // Add permissions_override column
    await queryRunner.addColumn('users', new TableColumn({
      name: 'permissions_override',
      type: 'jsonb',
      isNullable: true,
      default: null,
      comment: 'Custom permissions for sub-accounts (overrides default role permissions)',
    }));

    // Add index on master_account_id for query performance
    await queryRunner.createIndex('users', new TableIndex({
      name: 'idx_users_master_account',
      columnNames: ['master_account_id'],
    }));

    // Add foreign key constraint (master_account_id references users.id)
    // Note: Using raw SQL as TypeORM's TableForeignKey doesn't support partial indexes
    await queryRunner.query(`
      ALTER TABLE users
      ADD CONSTRAINT fk_users_master_account
      FOREIGN KEY (master_account_id)
      REFERENCES users(id)
      ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key constraint
    await queryRunner.query(`
      ALTER TABLE users
      DROP CONSTRAINT IF EXISTS fk_users_master_account
    `);

    // Remove index
    await queryRunner.dropIndex('users', 'idx_users_master_account');

    // Remove columns
    await queryRunner.dropColumn('users', 'permissions_override');
    await queryRunner.dropColumn('users', 'master_account_id');
  }
}
