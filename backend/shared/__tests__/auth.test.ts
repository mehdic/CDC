/**
 * Tests for Authentication Utilities (T039)
 */

import {
  hashPassword,
  comparePassword,
  validatePassword,
  needsRehash,
  estimatePasswordStrength,
  generateSecurePassword,
  getPasswordRequirements,
} from '../utils/auth';

describe('Authentication Utilities', () => {
  describe('validatePassword', () => {
    it('should accept valid passwords', () => {
      const validPasswords = [
        'MySecureP@ss123',
        'Zür1ch!Strong',
        'AnotherG00d#Pass',
      ];

      for (const password of validPasswords) {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });

    it('should reject passwords that are too short', () => {
      const result = validatePassword('Short1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 12 characters long');
    });

    it('should reject passwords without uppercase', () => {
      const result = validatePassword('nouppercase123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject passwords without lowercase', () => {
      const result = validatePassword('NOLOWERCASE123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject passwords without digits', () => {
      const result = validatePassword('NoDigitsHere!@#');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one digit');
    });

    it('should reject passwords without special characters', () => {
      const result = validatePassword('NoSpecialChar123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should reject common weak passwords', () => {
      const result = validatePassword('Password123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is too common or weak');
    });

    it('should reject empty passwords', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('hashPassword', () => {
    it('should hash a valid password', async () => {
      const password = 'MySecureP@ss123';
      const hash = await hashPassword(password);

      expect(hash).toBeTruthy();
      expect(hash).toContain('$2b$'); // bcrypt format
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should produce different hashes for same password', async () => {
      const password = 'SameP@ssw0rd';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2); // Different salts
    });

    it('should reject invalid passwords', async () => {
      const invalidPassword = 'short';
      await expect(hashPassword(invalidPassword)).rejects.toThrow('Invalid password');
    });

    it('should hash unicode passwords', async () => {
      const password = 'Zür1ch!Secur€';
      const hash = await hashPassword(password);

      expect(hash).toBeTruthy();
      expect(hash).toContain('$2b$');
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'MySecureP@ss123';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword(password, hash);

      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'MySecureP@ss123';
      const wrongPassword = 'WrongP@ssw0rd!';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword(wrongPassword, hash);

      expect(isMatch).toBe(false);
    });

    it('should return false for empty password', async () => {
      const hash = await hashPassword('ValidP@ssw0rd123');
      const isMatch = await comparePassword('', hash);

      expect(isMatch).toBe(false);
    });

    it('should return false for empty hash', async () => {
      const isMatch = await comparePassword('ValidP@ssw0rd123', '');

      expect(isMatch).toBe(false);
    });

    it('should handle unicode passwords correctly', async () => {
      const password = 'Pässwörd123!';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword(password, hash);

      expect(isMatch).toBe(true);
    });
  });

  describe('needsRehash', () => {
    it('should return false for hash with correct rounds', async () => {
      const password = 'TestP@ssw0rd123';
      const hash = await hashPassword(password);
      const needs = needsRehash(hash);

      expect(needs).toBe(false);
    });

    it('should return true for invalid hash format', () => {
      const invalidHash = 'not-a-valid-hash';
      const needs = needsRehash(invalidHash);

      expect(needs).toBe(true);
    });

    it('should detect hash with lower rounds', () => {
      // Simulated hash with 4 rounds (format: $2b$04$...)
      const lowRoundHash = '$2b$04$abcdefghijklmnopqrstuv';
      const needs = needsRehash(lowRoundHash);

      expect(needs).toBe(true);
    });
  });

  describe('estimatePasswordStrength', () => {
    it('should rate strong passwords highly', () => {
      const strongPassword = 'C0mpl3x!P@ssw0rd#123';
      const result = estimatePasswordStrength(strongPassword);

      expect(result.score).toBeGreaterThanOrEqual(3);
      expect(['Strong', 'Very strong']).toContain(result.description);
    });

    it('should rate weak passwords lowly', () => {
      const weakPassword = 'password';
      const result = estimatePasswordStrength(weakPassword);

      expect(result.score).toBeLessThan(3);
    });

    it('should handle empty passwords', () => {
      const result = estimatePasswordStrength('');

      expect(result.score).toBe(0);
      expect(result.description).toBe('No password');
    });

    it('should reward length', () => {
      const shortPassword = 'Ab1!';
      const longPassword = 'Ab1!xxxxxxxxxxxx';

      const shortResult = estimatePasswordStrength(shortPassword);
      const longResult = estimatePasswordStrength(longPassword);

      expect(longResult.score).toBeGreaterThanOrEqual(shortResult.score);
    });
  });

  describe('generateSecurePassword', () => {
    it('should generate password with default length', () => {
      const password = generateSecurePassword();

      expect(password).toBeTruthy();
      expect(password.length).toBe(16);
    });

    it('should generate password with custom length', () => {
      const length = 20;
      const password = generateSecurePassword(length);

      expect(password.length).toBe(length);
    });

    it('should generate password meeting all requirements', () => {
      const password = generateSecurePassword();
      const validation = validatePassword(password);

      expect(validation.isValid).toBe(true);
    });

    it('should generate different passwords each time', () => {
      const password1 = generateSecurePassword();
      const password2 = generateSecurePassword();

      expect(password1).not.toBe(password2);
    });

    it('should include all character types', () => {
      const password = generateSecurePassword();

      expect(/[a-z]/.test(password)).toBe(true);
      expect(/[A-Z]/.test(password)).toBe(true);
      expect(/\d/.test(password)).toBe(true);
      expect(/[!@#$%^&*()_+\-=\[\]{}]/.test(password)).toBe(true);
    });
  });

  describe('getPasswordRequirements', () => {
    it('should return list of requirements', () => {
      const requirements = getPasswordRequirements();

      expect(requirements).toBeInstanceOf(Array);
      expect(requirements.length).toBeGreaterThan(0);
      expect(requirements).toContain('At least 12 characters long');
    });
  });

  describe('password security best practices', () => {
    it('should use sufficient bcrypt rounds', async () => {
      const password = 'TestP@ssw0rd123';
      const startTime = Date.now();
      await hashPassword(password);
      const endTime = Date.now();

      // Should take some time (at least 50ms for 10 rounds)
      expect(endTime - startTime).toBeGreaterThan(50);
    });

    it('should be constant-time for comparison', async () => {
      const password = 'CorrectP@ss123!';
      const hash = await hashPassword(password);

      // Multiple comparisons should take similar time (timing attack prevention)
      const wrongPassword = 'WrongP@ssw0rd!';

      const start1 = Date.now();
      await comparePassword(password, hash);
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      await comparePassword(wrongPassword, hash);
      const time2 = Date.now() - start2;

      // Times should be similar (within reasonable variance)
      const timeDiff = Math.abs(time1 - time2);
      expect(timeDiff).toBeLessThan(50); // Less than 50ms difference
    });
  });
});
