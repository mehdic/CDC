/**
 * Encryption Service for Transcripts
 * Handles AES-256 encryption/decryption of medical transcripts (HIPAA compliant)
 * Task: T3-016
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Encrypted data structure
 */
export interface EncryptedData {
  encrypted: string; // Base64-encoded encrypted content
  iv: string; // Base64-encoded IV
  authTag: string; // Base64-encoded authentication tag
  keyId: string; // Reference to encryption key
}

/**
 * Encryption service for medical data
 * Uses AES-256-GCM for authenticated encryption
 */
export class EncryptionService {
  private masterKey: Buffer;
  private readonly keyId: string;

  constructor(masterKeyBase64?: string) {
    // In production, this should come from AWS KMS, Azure Key Vault, or similar
    // For development, use environment variable or generate
    const keyString = masterKeyBase64 || process.env.TRANSCRIPT_ENCRYPTION_KEY;

    if (keyString) {
      this.masterKey = Buffer.from(keyString, 'base64');
    } else {
      // Generate a random key for development (NOT for production!)
      console.warn('[EncryptionService] No encryption key provided. Generating random key (dev only).');
      this.masterKey = crypto.randomBytes(KEY_LENGTH);
    }

    // Validate key length
    if (this.masterKey.length !== KEY_LENGTH) {
      throw new Error(`Invalid encryption key length. Expected ${KEY_LENGTH} bytes, got ${this.masterKey.length}`);
    }

    this.keyId = this.generateKeyId();
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  encrypt(data: string): EncryptedData {
    try {
      // Generate random IV for each encryption
      const iv = crypto.randomBytes(IV_LENGTH);

      // Create cipher
      const cipher = crypto.createCipheriv(ALGORITHM, this.masterKey, iv);

      // Encrypt data
      let encrypted = cipher.update(data, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        keyId: this.keyId,
      };
    } catch (error) {
      console.error('[EncryptionService] Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  decrypt(encryptedData: EncryptedData): string {
    try {
      // Decode components
      const iv = Buffer.from(encryptedData.iv, 'base64');
      const authTag = Buffer.from(encryptedData.authTag, 'base64');

      // Create decipher
      const decipher = crypto.createDecipheriv(ALGORITHM, this.masterKey, iv);
      decipher.setAuthTag(authTag);

      // Decrypt data
      let decrypted = decipher.update(encryptedData.encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('[EncryptionService] Decryption failed:', error);
      throw new Error('Failed to decrypt data. Data may be corrupted or tampered with.');
    }
  }

  /**
   * Encrypt transcript object
   */
  encryptTranscript(transcript: any): EncryptedData {
    const json = JSON.stringify(transcript);
    return this.encrypt(json);
  }

  /**
   * Decrypt transcript object
   */
  decryptTranscript<T>(encryptedData: EncryptedData): T {
    const json = this.decrypt(encryptedData);
    return JSON.parse(json);
  }

  /**
   * Get current key ID
   */
  getKeyId(): string {
    return this.keyId;
  }

  /**
   * Generate key ID from master key
   */
  private generateKeyId(): string {
    const hash = crypto.createHash('sha256');
    hash.update(this.masterKey);
    return hash.digest('hex').substring(0, 16);
  }

  /**
   * Generate a new encryption key (for key rotation)
   */
  static generateKey(): string {
    const key = crypto.randomBytes(KEY_LENGTH);
    return key.toString('base64');
  }

  /**
   * Verify encrypted data integrity
   */
  verifyIntegrity(encryptedData: EncryptedData): boolean {
    try {
      // Try to decrypt - if authentication fails, it will throw
      this.decrypt(encryptedData);
      return true;
    } catch {
      return false;
    }
  }
}
