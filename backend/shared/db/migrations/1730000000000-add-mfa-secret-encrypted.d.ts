import { MigrationInterface, QueryRunner } from 'typeorm';
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
export declare class AddMfaSecretEncrypted1730000000000 implements MigrationInterface {
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
//# sourceMappingURL=1730000000000-add-mfa-secret-encrypted.d.ts.map