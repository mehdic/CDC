/**
 * Encryption Service Tests
 * Task: T3-018
 */

import { EncryptionService } from '../encryption-service';
import crypto from 'crypto';

describe('EncryptionService', () => {
  let encryptionService: EncryptionService;
  const testKey = crypto.randomBytes(32).toString('base64');

  beforeEach(() => {
    encryptionService = new EncryptionService(testKey);
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt text successfully', () => {
      const plaintext = 'This is a secret medical transcript';

      const encrypted = encryptionService.encrypt(plaintext);

      expect(encrypted.encrypted).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.authTag).toBeDefined();
      expect(encrypted.keyId).toBeDefined();

      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt JSON objects', () => {
      const transcript = {
        id: 'transcript-123',
        consultation_id: 'consultation-456',
        segments: [
          { text: 'Bonjour', timestamp: 0 },
          { text: 'Comment allez-vous?', timestamp: 5 },
        ],
      };

      const encrypted = encryptionService.encryptTranscript(transcript);

      expect(encrypted.encrypted).toBeDefined();

      const decrypted = encryptionService.decryptTranscript(encrypted);

      expect(decrypted).toEqual(transcript);
    });

    it('should produce different ciphertext for same plaintext (due to random IV)', () => {
      const plaintext = 'Same text';

      const encrypted1 = encryptionService.encrypt(plaintext);
      const encrypted2 = encryptionService.encrypt(plaintext);

      // Different IVs
      expect(encrypted1.iv).not.toBe(encrypted2.iv);

      // Different ciphertexts
      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);

      // But both decrypt to same plaintext
      expect(encryptionService.decrypt(encrypted1)).toBe(plaintext);
      expect(encryptionService.decrypt(encrypted2)).toBe(plaintext);
    });

    it('should handle empty strings', () => {
      const plaintext = '';

      const encrypted = encryptionService.encrypt(plaintext);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle special characters', () => {
      const plaintext = 'Spécial çhàractères: émojis 😀, symbols @#$%^&*()';

      const encrypted = encryptionService.encrypt(plaintext);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle large text', () => {
      const plaintext = 'A'.repeat(10000);

      const encrypted = encryptionService.encrypt(plaintext);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('authentication and integrity', () => {
    it('should detect tampered ciphertext', () => {
      const plaintext = 'Original text';
      const encrypted = encryptionService.encrypt(plaintext);

      // Tamper with ciphertext
      const tamperedEncrypted = {
        ...encrypted,
        encrypted: Buffer.from(encrypted.encrypted, 'base64')
          .toString('hex')
          .replace('a', 'b'),
      };

      expect(() => encryptionService.decrypt(tamperedEncrypted as any)).toThrow();
    });

    it('should detect tampered authentication tag', () => {
      const plaintext = 'Original text';
      const encrypted = encryptionService.encrypt(plaintext);

      // Tamper with auth tag
      const tamperedEncrypted = {
        ...encrypted,
        authTag: crypto.randomBytes(16).toString('base64'),
      };

      expect(() => encryptionService.decrypt(tamperedEncrypted)).toThrow(
        'Failed to decrypt data'
      );
    });

    it('should detect corrupted data', () => {
      const plaintext = 'Original text';
      const encrypted = encryptionService.encrypt(plaintext);

      // Corrupt IV
      const corruptedEncrypted = {
        ...encrypted,
        iv: crypto.randomBytes(16).toString('base64'),
      };

      expect(() => encryptionService.decrypt(corruptedEncrypted)).toThrow();
    });
  });

  describe('verifyIntegrity', () => {
    it('should verify integrity of valid encrypted data', () => {
      const plaintext = 'Test data';
      const encrypted = encryptionService.encrypt(plaintext);

      const isValid = encryptionService.verifyIntegrity(encrypted);

      expect(isValid).toBe(true);
    });

    it('should detect integrity violation', () => {
      const plaintext = 'Test data';
      const encrypted = encryptionService.encrypt(plaintext);

      // Tamper with data
      const tamperedEncrypted = {
        ...encrypted,
        authTag: crypto.randomBytes(16).toString('base64'),
      };

      const isValid = encryptionService.verifyIntegrity(tamperedEncrypted);

      expect(isValid).toBe(false);
    });
  });

  describe('key management', () => {
    it('should generate unique key ID', () => {
      const service1 = new EncryptionService(testKey);
      const service2 = new EncryptionService(crypto.randomBytes(32).toString('base64'));

      expect(service1.getKeyId()).not.toBe(service2.getKeyId());
    });

    it('should generate same key ID for same key', () => {
      const service1 = new EncryptionService(testKey);
      const service2 = new EncryptionService(testKey);

      expect(service1.getKeyId()).toBe(service2.getKeyId());
    });

    it('should generate valid encryption key', () => {
      const key = EncryptionService.generateKey();

      expect(key).toBeDefined();

      // Should be valid base64
      const buffer = Buffer.from(key, 'base64');
      expect(buffer.length).toBe(32); // 256 bits
    });

    it('should reject invalid key length', () => {
      const shortKey = crypto.randomBytes(16).toString('base64'); // Only 128 bits

      expect(() => new EncryptionService(shortKey)).toThrow(
        'Invalid encryption key length'
      );
    });
  });

  describe('cross-service compatibility', () => {
    it('should decrypt data encrypted by different instance with same key', () => {
      const plaintext = 'Cross-service test';

      const service1 = new EncryptionService(testKey);
      const encrypted = service1.encrypt(plaintext);

      const service2 = new EncryptionService(testKey);
      const decrypted = service2.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });
});
