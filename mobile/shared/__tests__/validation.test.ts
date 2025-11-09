/**
 * Validation Utilities Tests
 */

import {
  validateEmail,
  validateSwissPhone,
  validatePassword,
  validatePasswordConfirm,
  validatePrescriptionNumber,
  validateSwissInsuranceId,
  validateDate,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validatePattern,
  validateField,
  validateForm,
} from '../utils/validation';

// Mock i18n
jest.mock('../utils/i18n', () => ({
  t: (key: string, options?: Record<string, any>) => {
    if (options && options.count !== undefined) {
      return `${key} ${options.count}`;
    }
    return key;
  },
}));

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('validates correct email addresses', () => {
      expect(validateEmail('user@example.com').isValid).toBe(true);
      expect(validateEmail('test.user@domain.co.uk').isValid).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      expect(validateEmail('').isValid).toBe(false);
      expect(validateEmail('invalid').isValid).toBe(false);
      expect(validateEmail('@example.com').isValid).toBe(false);
      expect(validateEmail('user@').isValid).toBe(false);
    });

    it('returns correct error messages', () => {
      expect(validateEmail('').error).toBe('validation.required');
      expect(validateEmail('invalid').error).toBe('validation.invalidEmail');
    });
  });

  describe('validateSwissPhone', () => {
    it('validates correct Swiss phone numbers', () => {
      expect(validateSwissPhone('+41791234567').isValid).toBe(true);
      expect(validateSwissPhone('+41 79 123 45 67').isValid).toBe(true);
    });

    it('rejects invalid Swiss phone numbers', () => {
      expect(validateSwissPhone('').isValid).toBe(false);
      expect(validateSwissPhone('+1234567890').isValid).toBe(false);
      expect(validateSwissPhone('0791234567').isValid).toBe(false);
      expect(validateSwissPhone('+4179123456').isValid).toBe(false); // Too short
    });

    it('returns correct error messages', () => {
      expect(validateSwissPhone('').error).toBe('validation.required');
      expect(validateSwissPhone('1234567890').error).toBe('validation.invalidPhone');
    });
  });

  describe('validatePassword', () => {
    it('validates strong passwords', () => {
      expect(validatePassword('StrongPass123!').isValid).toBe(true);
      expect(validatePassword('MyP@ssw0rd123').isValid).toBe(true);
    });

    it('rejects weak passwords', () => {
      expect(validatePassword('').isValid).toBe(false);
      expect(validatePassword('short').isValid).toBe(false);
      expect(validatePassword('alllowercase123!').isValid).toBe(false); // No uppercase
      expect(validatePassword('ALLUPPERCASE123!').isValid).toBe(false); // No lowercase
      expect(validatePassword('NoNumbers!!!').isValid).toBe(false); // No numbers
      expect(validatePassword('NoSpecialChar123').isValid).toBe(false); // No special chars
    });

    it('returns correct error messages', () => {
      expect(validatePassword('').error).toBe('validation.required');
      expect(validatePassword('short').error).toBe('validation.passwordTooShort');
      expect(validatePassword('alllowercase123!').error).toBe('validation.passwordWeak');
    });
  });

  describe('validatePasswordConfirm', () => {
    it('validates matching passwords', () => {
      expect(validatePasswordConfirm('Password123!', 'Password123!').isValid).toBe(true);
    });

    it('rejects non-matching passwords', () => {
      expect(validatePasswordConfirm('Password123!', '').isValid).toBe(false);
      expect(validatePasswordConfirm('Password123!', 'Different123!').isValid).toBe(false);
    });

    it('returns correct error messages', () => {
      expect(validatePasswordConfirm('Password123!', '').error).toBe('validation.required');
      expect(validatePasswordConfirm('Password123!', 'Different123!').error).toBe(
        'validation.passwordMismatch'
      );
    });
  });

  describe('validatePrescriptionNumber', () => {
    it('validates correct prescription numbers', () => {
      expect(validatePrescriptionNumber('2024-1234567').isValid).toBe(true);
      expect(validatePrescriptionNumber('2025-9876543').isValid).toBe(true);
    });

    it('rejects invalid prescription numbers', () => {
      expect(validatePrescriptionNumber('').isValid).toBe(false);
      expect(validatePrescriptionNumber('1234567').isValid).toBe(false);
      expect(validatePrescriptionNumber('2024-123').isValid).toBe(false); // Too short
    });

    it('returns correct error messages', () => {
      expect(validatePrescriptionNumber('').error).toBe('validation.required');
      expect(validatePrescriptionNumber('invalid').error).toBe(
        'validation.invalidPrescriptionNumber'
      );
    });
  });

  describe('validateSwissInsuranceId', () => {
    it('validates correct Swiss insurance IDs', () => {
      expect(validateSwissInsuranceId('756.1234.5678.90').isValid).toBe(true);
      expect(validateSwissInsuranceId('7561234567890').isValid).toBe(true);
    });

    it('rejects invalid insurance IDs', () => {
      expect(validateSwissInsuranceId('').isValid).toBe(false);
      expect(validateSwissInsuranceId('123456789').isValid).toBe(false);
      expect(validateSwissInsuranceId('755.1234.5678.90').isValid).toBe(false); // Wrong prefix
    });

    it('returns correct error messages', () => {
      expect(validateSwissInsuranceId('').error).toBe('validation.required');
      expect(validateSwissInsuranceId('invalid').error).toBe('validation.invalidInsuranceId');
    });
  });

  describe('validateDate', () => {
    it('validates correct dates', () => {
      expect(validateDate('2024-01-15').isValid).toBe(true);
      expect(validateDate('2024-12-31T23:59:59Z').isValid).toBe(true);
    });

    it('rejects invalid dates', () => {
      expect(validateDate('').isValid).toBe(false);
      expect(validateDate('invalid-date').isValid).toBe(false);
      expect(validateDate('2024-13-01').isValid).toBe(false); // Invalid month
    });

    it('returns correct error messages', () => {
      expect(validateDate('').error).toBe('validation.required');
      expect(validateDate('invalid').error).toBe('validation.invalidDate');
    });
  });

  describe('validateRequired', () => {
    it('validates non-empty values', () => {
      expect(validateRequired('value').isValid).toBe(true);
      expect(validateRequired('  value  ').isValid).toBe(true);
    });

    it('rejects empty values', () => {
      expect(validateRequired('').isValid).toBe(false);
      expect(validateRequired('   ').isValid).toBe(false);
      expect(validateRequired(null).isValid).toBe(false);
      expect(validateRequired(undefined).isValid).toBe(false);
    });
  });

  describe('validateMinLength', () => {
    it('validates strings meeting minimum length', () => {
      expect(validateMinLength('12345', 5).isValid).toBe(true);
      expect(validateMinLength('123456', 5).isValid).toBe(true);
    });

    it('rejects strings below minimum length', () => {
      expect(validateMinLength('1234', 5).isValid).toBe(false);
      expect(validateMinLength('', 1).isValid).toBe(false);
    });
  });

  describe('validateMaxLength', () => {
    it('validates strings within maximum length', () => {
      expect(validateMaxLength('12345', 5).isValid).toBe(true);
      expect(validateMaxLength('1234', 5).isValid).toBe(true);
    });

    it('rejects strings exceeding maximum length', () => {
      expect(validateMaxLength('123456', 5).isValid).toBe(false);
    });
  });

  describe('validatePattern', () => {
    it('validates strings matching pattern', () => {
      expect(validatePattern('ABC123', /^[A-Z0-9]+$/).isValid).toBe(true);
    });

    it('rejects strings not matching pattern', () => {
      expect(validatePattern('abc123', /^[A-Z0-9]+$/).isValid).toBe(false);
      expect(validatePattern('', /^[A-Z0-9]+$/).isValid).toBe(false);
    });
  });

  describe('validateField', () => {
    it('validates field with multiple rules', () => {
      const rules = {
        required: true,
        minLength: 5,
        maxLength: 10,
      };

      expect(validateField('12345', rules).isValid).toBe(true);
      expect(validateField('1234567890', rules).isValid).toBe(true);

      expect(validateField('', rules).isValid).toBe(false);
      expect(validateField('1234', rules).isValid).toBe(false);
      expect(validateField('12345678901', rules).isValid).toBe(false);
    });

    it('skips validation for empty non-required fields', () => {
      const rules = {
        required: false,
        minLength: 5,
      };

      expect(validateField('', rules).isValid).toBe(true);
    });

    it('uses custom validation function', () => {
      const rules = {
        custom: (value: string) => {
          if (value === 'forbidden') {
            return { isValid: false, error: 'Forbidden value' };
          }
          return { isValid: true };
        },
      };

      expect(validateField('allowed', rules).isValid).toBe(true);
      expect(validateField('forbidden', rules).isValid).toBe(false);
      expect(validateField('forbidden', rules).error).toBe('Forbidden value');
    });
  });

  describe('validateForm', () => {
    it('validates entire form', () => {
      const values = {
        email: 'user@example.com',
        phone: '+41791234567',
        password: 'StrongPass123!',
      };

      const rules = {
        email: { required: true, custom: validateEmail },
        phone: { required: true, custom: validateSwissPhone },
        password: { required: true, custom: validatePassword },
      };

      const result = validateForm(values, rules);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('returns errors for invalid fields', () => {
      const values = {
        email: 'invalid',
        phone: '123',
        password: 'weak',
      };

      const rules = {
        email: { required: true, custom: validateEmail },
        phone: { required: true, custom: validateSwissPhone },
        password: { required: true, custom: validatePassword },
      };

      const result = validateForm(values, rules);
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('validation.invalidEmail');
      expect(result.errors.phone).toBe('validation.invalidPhone');
      expect(result.errors.password).toBe('validation.passwordTooShort');
    });
  });
});
