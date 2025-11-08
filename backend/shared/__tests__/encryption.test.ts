/**
 * Tests for AWS KMS Encryption Utilities (T036-T038)
 */

import {
  encryptField,
  decryptField,
  encryptFields,
  decryptFields,
  clearDataKeyCache,
  getDataKeyCacheSize,
} from '../utils/encryption';

describe('AWS KMS Encryption Utilities', () => {
  beforeEach(() => {
    clearDataKeyCache();
  });

  describe('encryptField', () => {
    it('should encrypt a string value', async () => {
      const plaintext = 'John Doe';
      const encrypted = await encryptField(plaintext);

      expect(encrypted).toBeInstanceOf(Buffer);
      expect(encrypted.length).toBeGreaterThan(plaintext.length);
    });

    it('should encrypt a buffer value', async () => {
      const plaintext = Buffer.from('Test Data');
      const encrypted = await encryptField(plaintext);

      expect(encrypted).toBeInstanceOf(Buffer);
      expect(encrypted.length).toBeGreaterThan(plaintext.length);
    });

    it('should throw error for empty string', async () => {
      await expect(encryptField('')).rejects.toThrow('Cannot encrypt empty value');
    });

    it('should produce different ciphertexts for same plaintext', async () => {
      const plaintext = 'sensitive data';
      const encrypted1 = await encryptField(plaintext);
      const encrypted2 = await encryptField(plaintext);

      // Should be different due to different IVs
      expect(encrypted1.equals(encrypted2)).toBe(false);
    });
  });

  describe('decryptField', () => {
    it('should decrypt an encrypted value', async () => {
      const plaintext = 'Secret Information';
      const encrypted = await encryptField(plaintext);
      const decrypted = await decryptField(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should decrypt unicode characters correctly', async () => {
      const plaintext = 'Zürich, Genève, François';
      const encrypted = await encryptField(plaintext);
      const decrypted = await decryptField(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should throw error for empty buffer', async () => {
      await expect(decryptField(Buffer.alloc(0))).rejects.toThrow('Cannot decrypt empty buffer');
    });

    it('should throw error for corrupted data', async () => {
      const corrupted = Buffer.from('invalid data');
      await expect(decryptField(corrupted)).rejects.toThrow();
    });
  });

  describe('data key caching', () => {
    it('should cache decrypted data keys', async () => {
      const plaintext = 'Test';
      const encrypted = await encryptField(plaintext);

      // First decryption
      await decryptField(encrypted);
      const cacheSize1 = getDataKeyCacheSize();

      // Second decryption (should use cache)
      await decryptField(encrypted);
      const cacheSize2 = getDataKeyCacheSize();

      expect(cacheSize1).toBeGreaterThan(0);
      expect(cacheSize2).toBe(cacheSize1); // Cache size unchanged
    });

    it('should clear cache when requested', async () => {
      const plaintext = 'Test';
      const encrypted = await encryptField(plaintext);
      await decryptField(encrypted);

      expect(getDataKeyCacheSize()).toBeGreaterThan(0);

      clearDataKeyCache();

      expect(getDataKeyCacheSize()).toBe(0);
    });
  });

  describe('batch operations', () => {
    it('should encrypt multiple fields', async () => {
      const fields = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+41791234567',
      };

      const encrypted = await encryptFields(fields);

      expect(encrypted.firstName).toBeInstanceOf(Buffer);
      expect(encrypted.lastName).toBeInstanceOf(Buffer);
      expect(encrypted.phone).toBeInstanceOf(Buffer);
    });

    it('should decrypt multiple fields', async () => {
      const fields = {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+41797654321',
      };

      const encrypted = await encryptFields(fields);
      const decrypted = await decryptFields(encrypted);

      expect(decrypted.firstName).toBe(fields.firstName);
      expect(decrypted.lastName).toBe(fields.lastName);
      expect(decrypted.phone).toBe(fields.phone);
    });
  });

  describe('round-trip encryption', () => {
    it('should preserve data through encrypt/decrypt cycle', async () => {
      const testCases = [
        'Simple text',
        'Text with numbers 123456',
        'Special chars !@#$%^&*()',
        'Unicode: 日本語',
        'Long text: ' + 'a'.repeat(1000),
      ];

      for (const plaintext of testCases) {
        const encrypted = await encryptField(plaintext);
        const decrypted = await decryptField(encrypted);
        expect(decrypted).toBe(plaintext);
      }
    });
  });
});
