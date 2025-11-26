import {
  parseError,
  createRetryableError,
  validateField,
  validateForm,
} from '../errorHandler';

describe('T2-050: Error Handler Utility', () => {
  describe('parseError', () => {
    it('should parse HTTP 400 error', () => {
      const error = { response: { status: 400 } };
      const result = parseError(error);
      expect(result.severity).toBe('warning');
      expect(result.title).toBe('Invalid Request');
      expect(result.retryable).toBe(true);
    });

    it('should parse HTTP 401 error', () => {
      const error = { response: { status: 401 } };
      const result = parseError(error);
      expect(result.severity).toBe('warning');
      expect(result.title).toBe('Authentication Required');
      expect(result.errorCode).toBe('UNAUTHORIZED');
    });

    it('should parse HTTP 403 error', () => {
      const error = { response: { status: 403 } };
      const result = parseError(error);
      expect(result.severity).toBe('warning');
      expect(result.title).toBe('Access Denied');
      expect(result.retryable).toBe(false);
    });

    it('should parse HTTP 404 error', () => {
      const error = { response: { status: 404 } };
      const result = parseError(error);
      expect(result.title).toBe('Not Found');
      expect(result.retryable).toBe(true);
    });

    it('should parse HTTP 500 error', () => {
      const error = { response: { status: 500 } };
      const result = parseError(error);
      expect(result.severity).toBe('critical');
      expect(result.title).toBe('Server Error');
    });

    it('should parse error code NETWORK_ERROR', () => {
      const error = { code: 'NETWORK_ERROR' };
      const result = parseError(error);
      expect(result.title).toBe('Connection Error');
      expect(result.errorCode).toBe('NETWORK_ERROR');
    });

    it('should parse error code OFFLINE_ERROR', () => {
      const error = { code: 'OFFLINE_ERROR' };
      const result = parseError(error);
      expect(result.title).toBe('You Are Offline');
      expect(result.errorCode).toBe('OFFLINE_ERROR');
    });

    it('should parse error code SESSION_EXPIRED', () => {
      const error = { code: 'SESSION_EXPIRED' };
      const result = parseError(error);
      expect(result.title).toBe('Session Expired');
      expect(result.retryable).toBe(true);
    });

    it('should parse PRESCRIPTION_NOT_FOUND domain error', () => {
      const error = { code: 'PRESCRIPTION_NOT_FOUND' };
      const result = parseError(error);
      expect(result.title).toBe('Prescription Not Found');
      expect(result.errorCode).toBe('PRESCRIPTION_NOT_FOUND');
    });

    it('should parse CONSULTATION_CONFLICT domain error', () => {
      const error = { code: 'CONSULTATION_CONFLICT' };
      const result = parseError(error);
      expect(result.title).toBe('Time Conflict');
    });

    it('should parse error message with network keyword', () => {
      const error = { message: 'Network connection failed' };
      const result = parseError(error);
      expect(result.title).toBe('Connection Error');
    });

    it('should parse error message with offline keyword', () => {
      const error = { message: 'You are offline' };
      const result = parseError(error);
      expect(result.title).toBe('You Are Offline');
    });

    it('should parse error message with timeout keyword', () => {
      const error = { message: 'Request timeout exceeded' };
      const result = parseError(error);
      expect(result.title).toBe('Connection Error');
    });

    it('should use custom error message when provided', () => {
      const error = { message: 'Custom error message' };
      const result = parseError(error);
      expect(result.message).toBe('Custom error message');
    });

    it('should return unknown error as fallback', () => {
      const error = {};
      const result = parseError(error);
      expect(result.title).toBe('Something Went Wrong');
      expect(result.errorCode).toBe('UNKNOWN_ERROR');
    });
  });

  describe('createRetryableError', () => {
    it('should add retry action to retryable errors', () => {
      const error = { response: { status: 408 } };
      const retryHandler = jest.fn();
      const result = createRetryableError(error, retryHandler);

      expect(result.action).toBeDefined();
      expect(result.action?.label).toBe('Retry');
      expect(result.retryable).toBe(true);
    });

    it('should not add retry action to non-retryable errors', () => {
      const error = { response: { status: 403 } };
      const retryHandler = jest.fn();
      const result = createRetryableError(error, retryHandler);

      expect(result.action).toBeUndefined();
      expect(result.retryable).toBe(false);
    });

    it('should call retry handler when action pressed', () => {
      const error = { response: { status: 408 } };
      const retryHandler = jest.fn();
      const result = createRetryableError(error, retryHandler);

      result.action?.handler();
      expect(retryHandler).toHaveBeenCalled();
    });
  });

  describe('validateField', () => {
    const rules = {
      name: { required: true, minLength: 2, maxLength: 50 },
      email: { required: true, email: true },
      phone: { required: true, phone: true },
      password: { required: true, minLength: 8 },
      website: { pattern: '^https?://', patternMessage: 'Must be a valid URL' },
    };

    it('should validate required field', () => {
      const error = validateField('name', '', rules);
      expect(error).toBe('name is required');
    });

    it('should pass required field validation when filled', () => {
      const error = validateField('name', 'John', rules);
      expect(error).toBeNull();
    });

    it('should validate email format', () => {
      const error = validateField('email', 'invalid-email', rules);
      expect(error).toBe('Please enter a valid email address');
    });

    it('should pass valid email', () => {
      const error = validateField('email', 'test@example.com', rules);
      expect(error).toBeNull();
    });

    it('should validate phone format', () => {
      const error = validateField('phone', 'not-a-phone', rules);
      expect(error).toBe('Please enter a valid phone number');
    });

    it('should pass valid phone number', () => {
      const error = validateField('phone', '+41 79 123 45 67', rules);
      expect(error).toBeNull();
    });

    it('should validate min length', () => {
      const error = validateField('name', 'A', rules);
      expect(error).toBe('name must be at least 2 characters');
    });

    it('should validate max length', () => {
      const error = validateField('name', 'A'.repeat(51), rules);
      expect(error).toBe('name must not exceed 50 characters');
    });

    it('should validate pattern', () => {
      const error = validateField('website', 'ftp://example.com', rules);
      expect(error).toBe('Must be a valid URL');
    });

    it('should pass valid pattern', () => {
      const error = validateField('website', 'https://example.com', rules);
      expect(error).toBeNull();
    });
  });

  describe('validateForm', () => {
    const rules = {
      email: { required: true, email: true },
      password: { required: true, minLength: 8 },
      name: { required: true, minLength: 2 },
    };

    it('should validate entire form', () => {
      const formData = {
        email: 'invalid',
        password: '123',
        name: 'J',
      };

      const errors = validateForm(formData, rules);
      expect(Object.keys(errors).length).toBeGreaterThan(0);
    });

    it('should return empty object for valid form', () => {
      const formData = {
        email: 'test@example.com',
        password: 'SecurePassword123',
        name: 'John Doe',
      };

      const errors = validateForm(formData, rules);
      expect(Object.keys(errors).length).toBe(0);
    });

    it('should identify specific field errors', () => {
      const formData = {
        email: 'invalid-email',
        password: 'valid_password_123',
        name: 'John',
      };

      const errors = validateForm(formData, rules);
      expect(errors.email).toBeDefined();
      expect(errors.password).toBeUndefined();
      expect(errors.name).toBeUndefined();
    });
  });
});
