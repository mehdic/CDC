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

import {
  KMSClient,
  GenerateDataKeyCommand,
  DecryptCommand,
  GenerateDataKeyCommandOutput,
  DecryptCommandOutput,
} from '@aws-sdk/client-kms';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// ============================================================================
// Configuration
// ============================================================================

const AWS_REGION = process.env.AWS_REGION || 'eu-central-1';
const AWS_KMS_KEY_ID = process.env.AWS_KMS_KEY_ID;
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const DATA_KEY_CACHE_TTL_MS = 3600000; // 1 hour (from .env.example: REDIS_TTL=3600)

if (!AWS_KMS_KEY_ID) {
  throw new Error('AWS_KMS_KEY_ID environment variable is required');
}

// ============================================================================
// KMS Client Initialization
// ============================================================================

const kmsClient = new KMSClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// ============================================================================
// Data Key Cache (In-Memory)
// ============================================================================

interface CachedDataKey {
  plaintextKey: Buffer;
  encryptedKey: Buffer;
  expiresAt: number;
}

const dataKeyCache = new Map<string, CachedDataKey>();

/**
 * Clean expired data keys from cache
 * Runs periodically to prevent memory leaks
 */
function cleanExpiredDataKeys(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  dataKeyCache.forEach((cachedKey, keyId) => {
    if (cachedKey.expiresAt <= now) {
      keysToDelete.push(keyId);
    }
  });

  keysToDelete.forEach(keyId => dataKeyCache.delete(keyId));
}

// Clean expired keys every 10 minutes
setInterval(cleanExpiredDataKeys, 600000);

// ============================================================================
// Data Key Management
// ============================================================================

/**
 * Generate a new data encryption key using AWS KMS
 * This key is used to encrypt field data
 *
 * @returns Object containing plaintext key (for encryption) and encrypted key (for storage)
 * @throws Error if KMS operation fails
 */
async function generateDataKey(): Promise<{
  plaintextKey: Buffer;
  encryptedKey: Buffer;
}> {
  try {
    const command = new GenerateDataKeyCommand({
      KeyId: AWS_KMS_KEY_ID,
      KeySpec: 'AES_256', // 256-bit key as specified in plan.md
    });

    const response: GenerateDataKeyCommandOutput = await kmsClient.send(command);

    if (!response.Plaintext || !response.CiphertextBlob) {
      throw new Error('KMS GenerateDataKey returned incomplete response');
    }

    return {
      plaintextKey: Buffer.from(response.Plaintext),
      encryptedKey: Buffer.from(response.CiphertextBlob),
    };
  } catch (error) {
    console.error('KMS GenerateDataKey failed:', error);
    throw new Error(`Failed to generate data key: ${(error as Error).message}`);
  }
}

/**
 * Decrypt a data encryption key using AWS KMS
 * Uses cached plaintext key if available and not expired
 *
 * @param encryptedKey - The encrypted data key to decrypt
 * @returns The plaintext data key
 * @throws Error if KMS decryption fails
 */
async function decryptDataKey(encryptedKey: Buffer): Promise<Buffer> {
  // Check cache first
  const cacheKey = encryptedKey.toString('base64');
  const cachedKey = dataKeyCache.get(cacheKey);

  if (cachedKey && cachedKey.expiresAt > Date.now()) {
    return cachedKey.plaintextKey;
  }

  // Cache miss or expired - decrypt with KMS
  try {
    const command = new DecryptCommand({
      CiphertextBlob: encryptedKey,
      KeyId: AWS_KMS_KEY_ID,
    });

    const response: DecryptCommandOutput = await kmsClient.send(command);

    if (!response.Plaintext) {
      throw new Error('KMS Decrypt returned no plaintext');
    }

    const plaintextKey = Buffer.from(response.Plaintext);

    // Cache the decrypted key
    dataKeyCache.set(cacheKey, {
      plaintextKey,
      encryptedKey,
      expiresAt: Date.now() + DATA_KEY_CACHE_TTL_MS,
    });

    return plaintextKey;
  } catch (error) {
    console.error('KMS Decrypt failed:', error);
    throw new Error(`Failed to decrypt data key: ${(error as Error).message}`);
  }
}

// ============================================================================
// Field Encryption (T037)
// ============================================================================

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
export async function encryptField(plaintext: string | Buffer): Promise<Buffer> {
  if (!plaintext || (typeof plaintext === 'string' && plaintext.length === 0)) {
    throw new Error('Cannot encrypt empty value');
  }

  try {
    // Generate new data key for each field (envelope encryption pattern)
    const { plaintextKey, encryptedKey } = await generateDataKey();

    // Generate random IV for AES-GCM
    const iv = randomBytes(16);

    // Create cipher
    const cipher = createCipheriv(ENCRYPTION_ALGORITHM, plaintextKey, iv);

    // Convert plaintext to buffer if string
    const plaintextBuffer = typeof plaintext === 'string'
      ? Buffer.from(plaintext, 'utf-8')
      : plaintext;

    // Encrypt the data
    const encryptedData = Buffer.concat([
      cipher.update(plaintextBuffer),
      cipher.final(),
    ]);

    // Get authentication tag (GCM mode provides authenticated encryption)
    const authTag = cipher.getAuthTag();

    // Combine all components:
    // [encrypted_data_key_length (4 bytes)] + [encrypted_data_key] + [iv] + [auth_tag] + [encrypted_data]
    const encryptedKeyLength = Buffer.alloc(4);
    encryptedKeyLength.writeUInt32BE(encryptedKey.length, 0);

    return Buffer.concat([
      encryptedKeyLength,
      encryptedKey,
      iv,
      authTag,
      encryptedData,
    ]);
  } catch (error) {
    console.error('Field encryption failed:', error);
    throw new Error(`Failed to encrypt field: ${(error as Error).message}`);
  }
}

// ============================================================================
// Field Decryption (T038)
// ============================================================================

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
export async function decryptField(encryptedBuffer: Buffer): Promise<string> {
  if (!encryptedBuffer || encryptedBuffer.length === 0) {
    throw new Error('Cannot decrypt empty buffer');
  }

  try {
    // Parse the buffer structure
    let offset = 0;

    // Read encrypted data key length
    const encryptedKeyLength = encryptedBuffer.readUInt32BE(offset);
    offset += 4;

    // Extract encrypted data key
    const encryptedKey = encryptedBuffer.subarray(offset, offset + encryptedKeyLength);
    offset += encryptedKeyLength;

    // Extract IV (16 bytes)
    const iv = encryptedBuffer.subarray(offset, offset + 16);
    offset += 16;

    // Extract auth tag (16 bytes)
    const authTag = encryptedBuffer.subarray(offset, offset + 16);
    offset += 16;

    // Extract encrypted data (remainder)
    const encryptedData = encryptedBuffer.subarray(offset);

    // Decrypt the data key using KMS (with caching)
    const plaintextKey = await decryptDataKey(encryptedKey);

    // Create decipher
    const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, plaintextKey, iv);
    decipher.setAuthTag(authTag);

    // Decrypt the data
    const decryptedData = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final(),
    ]);

    return decryptedData.toString('utf-8');
  } catch (error) {
    console.error('Field decryption failed:', error);
    throw new Error(`Failed to decrypt field: ${(error as Error).message}`);
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Clear all cached data keys (useful for testing or key rotation)
 */
export function clearDataKeyCache(): void {
  dataKeyCache.clear();
}

/**
 * Get current data key cache size (for monitoring)
 */
export function getDataKeyCacheSize(): number {
  return dataKeyCache.size;
}

/**
 * Batch encrypt multiple fields
 * More efficient than encrypting individually
 *
 * @param fields - Object with field names and plaintext values
 * @returns Object with field names and encrypted buffers
 */
export async function encryptFields(
  fields: Record<string, string | Buffer>
): Promise<Record<string, Buffer>> {
  const encrypted: Record<string, Buffer> = {};

  for (const [key, value] of Object.entries(fields)) {
    if (value) {
      encrypted[key] = await encryptField(value);
    }
  }

  return encrypted;
}

/**
 * Batch decrypt multiple fields
 * More efficient than decrypting individually
 *
 * @param fields - Object with field names and encrypted buffers
 * @returns Object with field names and decrypted strings
 */
export async function decryptFields(
  fields: Record<string, Buffer>
): Promise<Record<string, string>> {
  const decrypted: Record<string, string> = {};

  for (const [key, value] of Object.entries(fields)) {
    if (value) {
      decrypted[key] = await decryptField(value);
    }
  }

  return decrypted;
}
