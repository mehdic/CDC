"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMasterAccountFields1762971101000 = void 0;
const typeorm_1 = require("typeorm");
class AddMasterAccountFields1762971101000 {
    name = 'AddMasterAccountFields1762971101000';
    async up(queryRunner) {
        await queryRunner.addColumn('users', new typeorm_1.TableColumn({
            name: 'master_account_id',
            type: 'uuid',
            isNullable: true,
            comment: 'Reference to master account user (for sub-accounts)',
        }));
        await queryRunner.addColumn('users', new typeorm_1.TableColumn({
            name: 'permissions_override',
            type: 'jsonb',
            isNullable: true,
            default: null,
            comment: 'Custom permissions for sub-accounts (overrides default role permissions)',
        }));
        await queryRunner.createIndex('users', new typeorm_1.TableIndex({
            name: 'idx_users_master_account',
            columnNames: ['master_account_id'],
        }));
        await queryRunner.query(`
      ALTER TABLE users
      ADD CONSTRAINT fk_users_master_account
      FOREIGN KEY (master_account_id)
      REFERENCES users(id)
      ON DELETE RESTRICT
    `);
        await queryRunner.query(`
      ALTER TABLE users
      ADD CONSTRAINT chk_no_self_master
      CHECK (master_account_id IS NULL OR master_account_id != id)
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE users
      DROP CONSTRAINT IF EXISTS chk_no_self_master
    `);
        await queryRunner.query(`
      ALTER TABLE users
      DROP CONSTRAINT IF EXISTS fk_users_master_account
    `);
        await queryRunner.dropIndex('users', 'idx_users_master_account');
        await queryRunner.dropColumn('users', 'permissions_override');
        await queryRunner.dropColumn('users', 'master_account_id');
    }
}
exports.AddMasterAccountFields1762971101000 = AddMasterAccountFields1762971101000;
//# sourceMappingURL=1762971101000-add-master-account-fields.js.map