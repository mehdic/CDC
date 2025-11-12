/**
 * AWS KMS Encryption Utilities (T036-T038)
 * Implements field-level encryption for PHI with data key caching
 * Based on: /specs/002-metapharm-platform/plan.md
 *
 * Security Requirements:
 * - HIPAA/GDPR compliant encryption at rest (FR-104)
 * - AWS KMS for key management
 * - Data key caching for performance optimization
 * - Immutable audit trail for key access (FR-106)
 */
/**
 * Encrypt a field value using AWS KMS data key encryption
 * Implements envelope encryption pattern:
 * 1. Generate data key from KMS
 * 2. Encrypt field with data key using AES-256-GCM
 * 3. Return encrypted field + encrypted data key + IV + auth tag
 *
 * Storage format (Buffer): [encrypted_data_key (variable)] + [iv (16 bytes)] + [auth_tag (16 bytes)] + [encrypted_data (variable)]
 *
 * @param plaintext - The plaintext value to encrypt (string or Buffer)
 * @returns Buffer containing encrypted data with metadata
 * @throws Error if encryption fails
 */
export declare function encryptField(plaintext: string | Buffer): Promise<Buffer>;
/**
 * Decrypt a field value using AWS KMS data key encryption
 * Reverses the envelope encryption:
 * 1. Extract encrypted data key, IV, auth tag, and encrypted data
 * 2. Decrypt data key using KMS (with caching)
 * 3. Decrypt field using AES-256-GCM with decrypted data key
 *
 * @param encryptedBuffer - Buffer containing encrypted data with metadata
 * @returns Decrypted plaintext as string
 * @throws Error if decryption fails or authentication fails
 */
export declare function decryptField(encryptedBuffer: Buffer): Promise<string>;
/**
 * Clear all cached data keys (useful for testing or key rotation)
 */
export declare function clearDataKeyCache(): void;
/**
 * Get current data key cache size (for monitoring)
 */
export declare function getDataKeyCacheSize(): number;
/**
 * Batch encrypt multiple fields
 * More efficient than encrypting individually
 *
 * @param fields - Object with field names and plaintext values
 * @returns Object with field names and encrypted buffers
 */
export declare function encryptFields(fields: Record<string, string | Buffer>): Promise<Record<string, Buffer>>;
/**
 * Batch decrypt multiple fields
 * More efficient than decrypting individually
 *
 * @param fields - Object with field names and encrypted buffers
 * @returns Object with field names and decrypted strings
 */
export declare function decryptFields(fields: Record<string, Buffer>): Promise<Record<string, string>>;
//# sourceMappingURL=encryption.d.ts.map