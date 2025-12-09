/**
 * Tests for Input Sanitization Middleware (T8-014)
 */

import { Request, Response, NextFunction } from 'express';
import {
  sanitizeInput,
  blockXSSPayloads,
  detectXSSPayload,
  testXSSProtection,
} from '../inputSanitizer';

describe('Input Sanitizer Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
      query: {},
      params: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('sanitizeInput', () => {
    it('should sanitize HTML entities in body', () => {
      mockReq.body = {
        name: '<script>alert("xss")</script>John',
        email: 'test@example.com',
      };

      sanitizeInput(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.name).not.toContain('<script>');
      expect(mockReq.body.name).not.toContain('</script>');
      expect(mockReq.body.email).toBe('test@example.com');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should sanitize nested objects', () => {
      mockReq.body = {
        user: {
          name: '<img src=x onerror=alert(1)>',
          profile: {
            bio: 'javascript:alert("xss")',
          },
        },
      };

      sanitizeInput(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.user.name).not.toContain('<img');
      expect(mockReq.body.user.profile.bio).not.toContain('javascript:');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should sanitize arrays', () => {
      mockReq.body = {
        items: ['<script>alert(1)</script>', 'safe text', '<iframe>'],
      };

      sanitizeInput(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.items[0]).not.toContain('<script>');
      expect(mockReq.body.items[1]).toBe('safe text');
      expect(mockReq.body.items[2]).not.toContain('<iframe>');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should sanitize query parameters', () => {
      mockReq.query = {
        search: '<svg onload=alert(1)>',
        page: '1',
      };

      sanitizeInput(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.query.search).not.toContain('<svg');
      expect(mockReq.query.page).toBe('1');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle null and undefined values', () => {
      mockReq.body = {
        name: null,
        email: undefined,
        age: 0,
      };

      sanitizeInput(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.name).toBeNull();
      expect(mockReq.body.email).toBeUndefined();
      expect(mockReq.body.age).toBe(0);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('blockXSSPayloads', () => {
    it('should block requests with XSS payloads in body', () => {
      mockReq.body = {
        comment: '<script>alert("xss")</script>',
      };

      blockXSSPayloads(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'Potentially dangerous input detected',
        code: 'XSS_DETECTED',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should block requests with XSS payloads in query', () => {
      mockReq.query = {
        search: 'javascript:alert(1)',
      };

      blockXSSPayloads(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow safe requests', () => {
      mockReq.body = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      blockXSSPayloads(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('detectXSSPayload', () => {
    it('should detect common XSS payloads', () => {
      expect(detectXSSPayload('<script>alert(1)</script>')).toBe(true);
      expect(detectXSSPayload('javascript:alert(1)')).toBe(true);
      expect(detectXSSPayload('<img src=x onerror=alert(1)>')).toBe(true);
      expect(detectXSSPayload('<svg onload=alert(1)>')).toBe(true);
      expect(detectXSSPayload('<iframe src="evil">')).toBe(true);
    });

    it('should not detect safe strings', () => {
      expect(detectXSSPayload('Hello, World!')).toBe(false);
      expect(detectXSSPayload('user@example.com')).toBe(false);
      expect(detectXSSPayload('This is a safe comment')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(detectXSSPayload('<SCRIPT>alert(1)</SCRIPT>')).toBe(true);
      expect(detectXSSPayload('JAVASCRIPT:alert(1)')).toBe(true);
    });
  });

  describe('testXSSProtection', () => {
    it('should detect all test payloads', () => {
      const results = testXSSProtection();

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.blocked)).toBe(true);
    });
  });
});
