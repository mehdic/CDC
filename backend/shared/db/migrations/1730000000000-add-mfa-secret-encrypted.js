"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMfaSecretEncrypted1730000000000 = void 0;
const typeorm_1 = require("typeorm");
class AddMfaSecretEncrypted1730000000000 {
    async up(queryRunner) {
        await queryRunner.addColumn('users', new typeorm_1.TableColumn({
            name: 'mfa_secret_encrypted',
            type: 'bytea',
            isNullable: true,
            comment: 'AWS KMS encrypted TOTP secret for MFA (FR-104)',
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropColumn('users', 'mfa_secret_encrypted');
    }
}
exports.AddMfaSecretEncrypted1730000000000 = AddMfaSecretEncrypted1730000000000;
//# sourceMappingURL=1730000000000-add-mfa-secret-encrypted.js.map