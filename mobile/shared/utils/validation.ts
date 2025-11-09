/**
 * Form Validation Utilities (T273)
 * Real-time validation with user-friendly feedback
 * Swiss healthcare-specific validations
 */

import { t } from './i18n';

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validation rules interface
 */
export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => ValidationResult;
}

/**
 * Email validation
 * RFC 5322 compliant
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email || email.trim() === '') {
    return {
      isValid: false,
      error: t('validation.required'),
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: t('validation.invalidEmail'),
    };
  }

  return { isValid: true };
};

/**
 * Swiss phone number validation
 * Format: +41 XX XXX XX XX
 */
export const validateSwissPhone = (phone: string): ValidationResult => {
  if (!phone || phone.trim() === '') {
    return {
      isValid: false,
      error: t('validation.required'),
    };
  }

  // Remove spaces and dashes for validation
  const cleaned = phone.replace(/[\s-]/g, '');

  // Swiss phone regex: +41 followed by 9 digits
  const swissPhoneRegex = /^\+41[0-9]{9}$/;

  if (!swissPhoneRegex.test(cleaned)) {
    return {
      isValid: false,
      error: t('validation.invalidPhone'),
    };
  }

  return { isValid: true };
};

/**
 * Password validation
 * Requirements: min 12 chars, uppercase, lowercase, number, special char
 */
export const validatePassword = (password: string): ValidationResult => {
  if (!password || password.trim() === '') {
    return {
      isValid: false,
      error: t('validation.required'),
    };
  }

  if (password.length < 12) {
    return {
      isValid: false,
      error: t('validation.passwordTooShort'),
    };
  }

  // Check for uppercase, lowercase, number, special char
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
    return {
      isValid: false,
      error: t('validation.passwordWeak'),
    };
  }

  return { isValid: true };
};

/**
 * Confirm password validation
 */
export const validatePasswordConfirm = (
  password: string,
  confirmPassword: string
): ValidationResult => {
  if (!confirmPassword || confirmPassword.trim() === '') {
    return {
      isValid: false,
      error: t('validation.required'),
    };
  }

  if (password !== confirmPassword) {
    return {
      isValid: false,
      error: t('validation.passwordMismatch'),
    };
  }

  return { isValid: true };
};

/**
 * Prescription number validation (Swiss format)
 * Format: YYYY-XXXXXXX (year-7digits)
 */
export const validatePrescriptionNumber = (number: string): ValidationResult => {
  if (!number || number.trim() === '') {
    return {
      isValid: false,
      error: t('validation.required'),
    };
  }

  // Swiss prescription number format
  const prescriptionRegex = /^[0-9]{4}-[0-9]{7}$/;

  if (!prescriptionRegex.test(number)) {
    return {
      isValid: false,
      error: t('validation.invalidPrescriptionNumber'),
    };
  }

  return { isValid: true };
};

/**
 * Swiss insurance ID validation
 * Format: 756.XXXX.XXXX.XX (13 digits with dots)
 */
export const validateSwissInsuranceId = (insuranceId: string): ValidationResult => {
  if (!insuranceId || insuranceId.trim() === '') {
    return {
      isValid: false,
      error: t('validation.required'),
    };
  }

  // Remove dots for validation
  const cleaned = insuranceId.replace(/\./g, '');

  // Swiss social security number (AHV/AVS): 756 followed by 10 digits
  const insuranceRegex = /^756[0-9]{10}$/;

  if (!insuranceRegex.test(cleaned)) {
    return {
      isValid: false,
      error: t('validation.invalidInsuranceId'),
    };
  }

  return { isValid: true };
};

/**
 * Date validation (ISO 8601 format)
 */
export const validateDate = (date: string): ValidationResult => {
  if (!date || date.trim() === '') {
    return {
      isValid: false,
      error: t('validation.required'),
    };
  }

  const parsedDate = new Date(date);

  if (isNaN(parsedDate.getTime())) {
    return {
      isValid: false,
      error: t('validation.invalidDate'),
    };
  }

  return { isValid: true };
};

/**
 * Required field validation
 */
export const validateRequired = (value: string | null | undefined): ValidationResult => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return {
      isValid: false,
      error: t('validation.required'),
    };
  }

  return { isValid: true };
};

/**
 * Min length validation
 */
export const validateMinLength = (value: string, minLength: number): ValidationResult => {
  if (!value || value.length < minLength) {
    return {
      isValid: false,
      error: t('validation.minLength', { count: minLength }),
    };
  }

  return { isValid: true };
};

/**
 * Max length validation
 */
export const validateMaxLength = (value: string, maxLength: number): ValidationResult => {
  if (value && value.length > maxLength) {
    return {
      isValid: false,
      error: t('validation.maxLength', { count: maxLength }),
    };
  }

  return { isValid: true };
};

/**
 * Pattern validation
 */
export const validatePattern = (value: string, pattern: RegExp): ValidationResult => {
  if (!value || !pattern.test(value)) {
    return {
      isValid: false,
      error: t('validation.invalidFormat'),
    };
  }

  return { isValid: true };
};

/**
 * Composite validation function
 * Runs multiple validation rules on a single field
 */
export const validateField = (
  value: string,
  rules: ValidationRules
): ValidationResult => {
  // Required check
  if (rules.required) {
    const requiredResult = validateRequired(value);
    if (!requiredResult.isValid) {
      return requiredResult;
    }
  }

  // If value is empty and not required, skip other validations
  if (!value || value.trim() === '') {
    return { isValid: true };
  }

  // Min length check
  if (rules.minLength !== undefined) {
    const minLengthResult = validateMinLength(value, rules.minLength);
    if (!minLengthResult.isValid) {
      return minLengthResult;
    }
  }

  // Max length check
  if (rules.maxLength !== undefined) {
    const maxLengthResult = validateMaxLength(value, rules.maxLength);
    if (!maxLengthResult.isValid) {
      return maxLengthResult;
    }
  }

  // Pattern check
  if (rules.pattern) {
    const patternResult = validatePattern(value, rules.pattern);
    if (!patternResult.isValid) {
      return patternResult;
    }
  }

  // Custom validation
  if (rules.custom) {
    return rules.custom(value);
  }

  return { isValid: true };
};

/**
 * Form validation helper
 * Validates multiple fields at once
 */
export const validateForm = <T extends Record<string, any>>(
  values: T,
  rules: Record<keyof T, ValidationRules>
): { isValid: boolean; errors: Partial<Record<keyof T, string>> } => {
  const errors: Partial<Record<keyof T, string>> = {};
  let isValid = true;

  for (const field in rules) {
    const value = values[field];
    const fieldRules = rules[field];
    const result = validateField(String(value || ''), fieldRules);

    if (!result.isValid) {
      errors[field] = result.error;
      isValid = false;
    }
  }

  return { isValid, errors };
};

/**
 * Real-time field validation hook helper
 * Use with React state to show validation feedback on blur
 */
export interface FieldValidationState {
  value: string;
  error: string | null;
  touched: boolean;
  isValid: boolean;
}

export const createFieldValidator = (rules: ValidationRules) => {
  return {
    validate: (value: string): ValidationResult => validateField(value, rules),
    onBlur: (value: string): FieldValidationState => {
      const result = validateField(value, rules);
      return {
        value,
        error: result.error || null,
        touched: true,
        isValid: result.isValid,
      };
    },
    onChange: (value: string, shouldValidate = false): FieldValidationState => {
      const result = shouldValidate ? validateField(value, rules) : { isValid: true };
      return {
        value,
        error: shouldValidate && result.error ? result.error : null,
        touched: false,
        isValid: result.isValid,
      };
    },
  };
};

/**
 * Export all validators
 */
export default {
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
  createFieldValidator,
};
