"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMfaSecretEncrypted1730000000000 = void 0;
const typeorm_1 = require("typeorm");
/**
 * Migration: Add encrypted MFA secret field
 * Security enhancement for FR-104 (HIPAA compliance)
 *
 * Changes:
 * - Add mfa_secret_encrypted column (bytea) to users table
 * - Maintains backward compatibility with existing mfa_secret column
 *
 * Migration strategy:
 * - New MFA setups will use encrypted field
 * - Existing users with plaintext secrets continue to work
 * - On next MFA setup/reset, secrets are migrated to encrypted storage
 */
class AddMfaSecretEncrypted1730000000000 {
    async up(queryRunner) {
        // Add encrypted MFA secret column
        await queryRunner.addColumn('users', new typeorm_1.TableColumn({
            name: 'mfa_secret_encrypted',
            type: 'bytea',
            isNullable: true,
            comment: 'AWS KMS encrypted TOTP secret for MFA (FR-104)',
        }));
        // Note: We don't migrate existing plaintext secrets automatically
        // They will be re-encrypted on next MFA setup/reset
    }
    async down(queryRunner) {
        // Remove encrypted MFA secret column
        await queryRunner.dropColumn('users', 'mfa_secret_encrypted');
    }
}
exports.AddMfaSecretEncrypted1730000000000 = AddMfaSecretEncrypted1730000000000;
//# sourceMappingURL=1730000000000-add-mfa-secret-encrypted.js.map