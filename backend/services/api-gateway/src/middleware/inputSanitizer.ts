/**
 * Input Sanitization Middleware (T8-014)
 * Implements XSS protection through input sanitization
 * Based on OWASP recommendations
 *
 * Features:
 * - HTML entity encoding
 * - Script tag stripping
 * - Attribute sanitization
 * - Deep object sanitization
 */

import { Request, Response, NextFunction } from 'express';

/**
 * HTML entities map for encoding
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Dangerous patterns that should be stripped
 */
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
  /javascript:/gi, // JavaScript protocol
  /on\w+\s*=/gi, // Event handlers (onclick, onload, etc.)
  /<iframe/gi, // Iframes
  /<object/gi, // Objects
  /<embed/gi, // Embeds
  /<applet/gi, // Applets
  /vbscript:/gi, // VBScript protocol
  /data:text\/html/gi, // Data URIs
];

/**
 * Encode HTML entities to prevent XSS
 */
function encodeHTMLEntities(str: string): string {
  return str.replace(/[&<>"'\/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Strip dangerous patterns from string
 */
function stripDangerousPatterns(str: string): string {
  let sanitized = str;
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }
  return sanitized;
}

/**
 * Sanitize a single value (string)
 */
function sanitizeValue(value: any): any {
  if (typeof value === 'string') {
    // Strip dangerous patterns first
    let sanitized = stripDangerousPatterns(value);
    // Then encode HTML entities
    sanitized = encodeHTMLEntities(sanitized);
    return sanitized;
  }
  return value;
}

/**
 * Recursively sanitize an object or array
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Sanitize the key itself
        const sanitizedKey = sanitizeValue(key);
        // Recursively sanitize the value
        sanitized[sanitizedKey] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  // Primitive value - sanitize if string
  return sanitizeValue(obj);
}

/**
 * Middleware to sanitize request body, query params, and params
 *
 * IMPORTANT: This should be applied AFTER body parsing middleware
 *
 * Usage:
 * ```typescript
 * app.use(express.json());
 * app.use(sanitizeInput);
 * ```
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction): void {
  try {
    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }

    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    console.error('Error sanitizing input:', error);
    // Don't block the request if sanitization fails
    // But log it for investigation
    next();
  }
}

/**
 * Stricter sanitization for authentication endpoints
 * Completely removes any HTML/script content
 */
export function strictSanitizeAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    if (req.body && typeof req.body === 'object') {
      // For auth endpoints, we only expect specific fields
      // Anything else should be rejected
      const allowedFields = ['email', 'password', 'username', 'mfaCode', 'token'];
      const sanitized: any = {};

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          // For passwords, don't sanitize (user might use special chars intentionally)
          if (field === 'password') {
            sanitized[field] = req.body[field];
          } else {
            // For other fields, strict sanitization
            sanitized[field] = sanitizeValue(req.body[field]);
          }
        }
      }

      req.body = sanitized;
    }

    next();
  } catch (error) {
    console.error('Error in strict auth sanitization:', error);
    res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid input data',
      code: 'INVALID_INPUT',
    });
  }
}

/**
 * Validate that input doesn't contain known XSS payloads
 * This is an additional layer of defense beyond sanitization
 *
 * Returns true if input is safe, false if dangerous payload detected
 */
export function detectXSSPayload(input: string): boolean {
  const xssPayloads = [
    '<script>alert(',
    'javascript:',
    'onerror=',
    'onload=',
    '<img src=x onerror=',
    '<svg onload=',
    'eval(',
    'expression(',
    '<iframe',
  ];

  const lowerInput = input.toLowerCase();
  for (const payload of xssPayloads) {
    if (lowerInput.includes(payload.toLowerCase())) {
      return true; // Dangerous payload detected
    }
  }

  return false; // Safe
}

/**
 * Middleware to block requests with detected XSS payloads
 * Use this in addition to sanitization for extra security
 */
export function blockXSSPayloads(req: Request, res: Response, next: NextFunction): void {
  try {
    // Check body
    if (req.body && typeof req.body === 'object') {
      const bodyString = JSON.stringify(req.body);
      if (detectXSSPayload(bodyString)) {
        console.warn('XSS payload detected in request body:', {
          ip: req.ip,
          path: req.path,
          body: req.body,
        });
        res.status(400).json({
          error: 'Bad Request',
          message: 'Potentially dangerous input detected',
          code: 'XSS_DETECTED',
        });
        return;
      }
    }

    // Check query params
    if (req.query && typeof req.query === 'object') {
      const queryString = JSON.stringify(req.query);
      if (detectXSSPayload(queryString)) {
        console.warn('XSS payload detected in query parameters:', {
          ip: req.ip,
          path: req.path,
          query: req.query,
        });
        res.status(400).json({
          error: 'Bad Request',
          message: 'Potentially dangerous input detected',
          code: 'XSS_DETECTED',
        });
        return;
      }
    }

    next();
  } catch (error) {
    console.error('Error in XSS detection:', error);
    next();
  }
}

/**
 * Test function to validate XSS protection
 * Returns array of test results
 */
export function testXSSProtection(): Array<{ payload: string; blocked: boolean }> {
  const testPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    '<svg onload=alert("XSS")>',
    'javascript:alert("XSS")',
    '<iframe src="javascript:alert(\'XSS\')">',
    '"><script>alert(String.fromCharCode(88,83,83))</script>',
    "<script>eval('ale'+'rt(1)')</script>",
    '<IMG SRC="javascript:alert(\'XSS\');">',
  ];

  return testPayloads.map((payload) => ({
    payload,
    blocked: detectXSSPayload(payload),
  }));
}
