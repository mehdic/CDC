"use strict";
/**
 * Input Validation and Sanitization Middleware (T247)
 * Prevents injection attacks (SQL, XSS, NoSQL) and validates inputs
 * Based on OWASP Top 10 - A03:2021 Injection
 *
 * Features:
 * - SQL injection prevention
 * - XSS (Cross-Site Scripting) prevention
 * - NoSQL injection prevention
 * - File upload validation
 * - Schema-based validation using Zod
 * - Express-validator integration
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateString = exports.validateInteger = exports.validatePhone = exports.validateDate = exports.validateUUID = exports.validateEmail = void 0;
exports.handleValidationErrors = handleValidationErrors;
exports.validateSchema = validateSchema;
exports.sanitizeHTML = sanitizeHTML;
exports.sanitizeBody = sanitizeBody;
exports.detectSQLInjection = detectSQLInjection;
exports.preventSQLInjection = preventSQLInjection;
exports.detectNoSQLInjection = detectNoSQLInjection;
exports.preventNoSQLInjection = preventNoSQLInjection;
exports.validateUploadedFile = validateUploadedFile;
exports.validateFileUpload = validateFileUpload;
exports.validateMultipleFileUploads = validateMultipleFileUploads;
exports.getInputValidationMiddleware = getInputValidationMiddleware;
const express_validator_1 = require("express-validator");
const zod_1 = require("zod");
const security_1 = require("../config/security");
const path = __importStar(require("path"));
// ============================================================================
// Validation Error Handling
// ============================================================================
/**
 * Check validation results and return errors
 * Use this after express-validator middleware
 *
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
function handleValidationErrors(req, res, next) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            error: 'Validation Error',
            message: 'Invalid input data',
            code: 'VALIDATION_ERROR',
            details: errors.array().map((err) => ({
                field: err.param,
                message: err.msg,
                value: err.value,
            })),
        });
        return;
    }
    next();
}
// ============================================================================
// Zod Schema Validation Middleware
// ============================================================================
/**
 * Validate request using Zod schema
 * Modern alternative to express-validator
 *
 * Usage:
 * ```typescript
 * import { z } from 'zod';
 *
 * const loginSchema = z.object({
 *   email: z.string().email(),
 *   password: z.string().min(12),
 * });
 *
 * router.post('/login',
 *   validateSchema(loginSchema, 'body'),
 *   loginHandler
 * );
 * ```
 *
 * @param schema Zod schema
 * @param source Request property to validate ('body', 'query', 'params')
 * @returns Express middleware
 */
function validateSchema(schema, source = 'body') {
    return async (req, res, next) => {
        try {
            const data = req[source];
            const validated = await schema.parseAsync(data);
            // Replace request data with validated data
            req[source] = validated;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                res.status(400).json({
                    error: 'Validation Error',
                    message: 'Invalid input data',
                    code: 'VALIDATION_ERROR',
                    details: error.errors.map((err) => ({
                        field: err.path.join('.'),
                        message: err.message,
                        code: err.code,
                    })),
                });
                return;
            }
            // Unexpected error
            console.error('Schema validation error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Validation processing failed',
                code: 'VALIDATION_PROCESSING_ERROR',
            });
        }
    };
}
// ============================================================================
// XSS Prevention - HTML Sanitization
// ============================================================================
/**
 * Sanitize HTML to prevent XSS attacks
 * Removes script tags, event handlers, and dangerous attributes
 *
 * @param html HTML string to sanitize
 * @returns Sanitized HTML string
 */
function sanitizeHTML(html) {
    if (!html)
        return '';
    return html
        // Remove script tags
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove event handlers (onclick, onerror, etc.)
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
        // Remove javascript: protocol
        .replace(/javascript:/gi, '')
        // Remove data: protocol (can be used for XSS)
        .replace(/data:/gi, '')
        // Remove vbscript: protocol
        .replace(/vbscript:/gi, '')
        // Remove iframe tags
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        // Remove embed tags
        .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
        // Remove object tags
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
}
/**
 * Middleware to sanitize all string fields in request body
 * Prevents XSS attacks by removing dangerous HTML
 *
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
function sanitizeBody(req, res, next) {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }
    next();
}
/**
 * Recursively sanitize all string properties in an object
 *
 * @param obj Object to sanitize
 * @returns Sanitized object
 */
function sanitizeObject(obj) {
    if (typeof obj === 'string') {
        return sanitizeHTML(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }
    if (obj !== null && typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
    }
    return obj;
}
// ============================================================================
// SQL Injection Prevention
// ============================================================================
/**
 * Detect potential SQL injection attempts
 * This is a defense-in-depth measure - parameterized queries are the primary defense
 *
 * @param input Input string to check
 * @returns True if suspicious SQL patterns detected
 */
function detectSQLInjection(input) {
    if (!input || typeof input !== 'string')
        return false;
    const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/i,
        /(--|\*|\/\*|\*\/)/,
        /('|(\\')|(;))/,
        /(\bOR\b.*=.*|1=1|1=2)/i,
        /(\bAND\b.*=.*)/i,
    ];
    return sqlPatterns.some((pattern) => pattern.test(input));
}
/**
 * Middleware to detect SQL injection attempts
 * Rejects requests with suspicious SQL patterns
 *
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
function preventSQLInjection(req, res, next) {
    const checkValue = (value, path) => {
        if (typeof value === 'string' && detectSQLInjection(value)) {
            console.warn('SQL injection attempt detected', {
                path,
                value: value.substring(0, 100), // Log first 100 chars
                ip: req.ip,
                userAgent: req.headers['user-agent'],
            });
            return true;
        }
        if (typeof value === 'object' && value !== null) {
            for (const [key, val] of Object.entries(value)) {
                if (checkValue(val, `${path}.${key}`)) {
                    return true;
                }
            }
        }
        return false;
    };
    // Check query parameters
    if (checkValue(req.query, 'query')) {
        res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid input detected',
            code: 'INVALID_INPUT',
        });
        return;
    }
    // Check body
    if (checkValue(req.body, 'body')) {
        res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid input detected',
            code: 'INVALID_INPUT',
        });
        return;
    }
    // Check params
    if (checkValue(req.params, 'params')) {
        res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid input detected',
            code: 'INVALID_INPUT',
        });
        return;
    }
    next();
}
// ============================================================================
// NoSQL Injection Prevention
// ============================================================================
/**
 * Detect potential NoSQL injection attempts
 * Prevents MongoDB operator injection ($where, $ne, etc.)
 *
 * @param obj Object to check
 * @returns True if suspicious NoSQL operators detected
 */
function detectNoSQLInjection(obj) {
    if (typeof obj === 'string') {
        // Check for MongoDB operators in strings
        return /\$where|\$ne|\$gt|\$lt|\$regex/.test(obj);
    }
    if (typeof obj === 'object' && obj !== null) {
        for (const key of Object.keys(obj)) {
            // Check for $ operators as keys
            if (key.startsWith('$')) {
                return true;
            }
            // Recursively check nested objects
            if (detectNoSQLInjection(obj[key])) {
                return true;
            }
        }
    }
    return false;
}
/**
 * Middleware to prevent NoSQL injection
 * Rejects requests with MongoDB operators
 *
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
function preventNoSQLInjection(req, res, next) {
    if (detectNoSQLInjection(req.body) || detectNoSQLInjection(req.query)) {
        console.warn('NoSQL injection attempt detected', {
            body: req.body,
            query: req.query,
            ip: req.ip,
        });
        res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid input detected',
            code: 'INVALID_INPUT',
        });
        return;
    }
    next();
}
// ============================================================================
// File Upload Validation
// ============================================================================
/**
 * Validate uploaded file
 * Checks file size, MIME type, and extension
 *
 * @param file Multer file object
 * @returns Validation result
 */
function validateUploadedFile(file) {
    const errors = [];
    const config = (0, security_1.getFileUploadConfig)();
    // Check file size
    if (file.size > config.maxFileSize) {
        errors.push(`File size exceeds maximum allowed size of ${config.maxFileSize / 1024 / 1024}MB`);
    }
    // Check MIME type
    if (!config.allowedMimeTypes.includes(file.mimetype)) {
        errors.push(`File type ${file.mimetype} is not allowed. Allowed types: ${config.allowedMimeTypes.join(', ')}`);
    }
    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!config.allowedExtensions.includes(ext)) {
        errors.push(`File extension ${ext} is not allowed. Allowed extensions: ${config.allowedExtensions.join(', ')}`);
    }
    // Check for suspicious file names
    if (file.originalname.includes('..') || file.originalname.includes('/')) {
        errors.push('Invalid file name');
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
}
/**
 * Middleware to validate file uploads
 * Use after multer middleware
 *
 * Usage:
 * ```typescript
 * router.post('/upload',
 *   upload.single('file'),
 *   validateFileUpload,
 *   uploadHandler
 * );
 * ```
 *
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
function validateFileUpload(req, res, next) {
    const file = req.file;
    if (!file) {
        res.status(400).json({
            error: 'Bad Request',
            message: 'No file uploaded',
            code: 'NO_FILE',
        });
        return;
    }
    const validation = validateUploadedFile(file);
    if (!validation.isValid) {
        res.status(400).json({
            error: 'Validation Error',
            message: 'Invalid file upload',
            code: 'INVALID_FILE',
            details: validation.errors,
        });
        return;
    }
    next();
}
/**
 * Middleware to validate multiple file uploads
 *
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
function validateMultipleFileUploads(req, res, next) {
    const files = req.files;
    if (!files || files.length === 0) {
        res.status(400).json({
            error: 'Bad Request',
            message: 'No files uploaded',
            code: 'NO_FILES',
        });
        return;
    }
    const allErrors = [];
    for (const file of files) {
        const validation = validateUploadedFile(file);
        if (!validation.isValid) {
            allErrors.push({
                file: file.originalname,
                errors: validation.errors,
            });
        }
    }
    if (allErrors.length > 0) {
        res.status(400).json({
            error: 'Validation Error',
            message: 'Invalid file uploads',
            code: 'INVALID_FILES',
            details: allErrors,
        });
        return;
    }
    next();
}
// ============================================================================
// Common Validation Chains (express-validator)
// ============================================================================
/**
 * Validate email address
 */
exports.validateEmail = [
    (0, express_validator_1.body)('email')
        .trim()
        .isEmail()
        .withMessage('Invalid email address')
        .normalizeEmail()
        .isLength({ max: 255 })
        .withMessage('Email too long'),
];
/**
 * Validate UUID
 */
const validateUUID = (field, location = 'param') => {
    const validator = location === 'param' ? express_validator_1.param : location === 'query' ? express_validator_1.query : express_validator_1.body;
    return validator(field)
        .trim()
        .isUUID()
        .withMessage(`${field} must be a valid UUID`);
};
exports.validateUUID = validateUUID;
/**
 * Validate date
 */
const validateDate = (field, location = 'body') => {
    const validator = location === 'param' ? express_validator_1.param : location === 'query' ? express_validator_1.query : express_validator_1.body;
    return validator(field)
        .trim()
        .isISO8601()
        .withMessage(`${field} must be a valid ISO 8601 date`);
};
exports.validateDate = validateDate;
/**
 * Validate phone number (international format)
 */
const validatePhone = (field) => {
    return (0, express_validator_1.body)(field)
        .trim()
        .isMobilePhone('any', { strictMode: false })
        .withMessage(`${field} must be a valid phone number`);
};
exports.validatePhone = validatePhone;
/**
 * Validate integer
 */
const validateInteger = (field, location = 'body', options) => {
    const validator = location === 'param' ? express_validator_1.param : location === 'query' ? express_validator_1.query : express_validator_1.body;
    let chain = validator(field).trim().isInt();
    if (options?.min !== undefined) {
        chain = chain.isInt({ min: options.min });
    }
    if (options?.max !== undefined) {
        chain = chain.isInt({ max: options.max });
    }
    return chain.withMessage(`${field} must be a valid integer`);
};
exports.validateInteger = validateInteger;
/**
 * Validate string length
 */
const validateString = (field, options = {}) => {
    let chain = (0, express_validator_1.body)(field).trim();
    if (options.min !== undefined) {
        chain = chain.isLength({ min: options.min });
    }
    if (options.max !== undefined) {
        chain = chain.isLength({ max: options.max });
    }
    if (options.pattern) {
        chain = chain.matches(options.pattern);
    }
    return chain.withMessage(`${field} validation failed`);
};
exports.validateString = validateString;
// ============================================================================
// Complete Input Validation Middleware Stack
// ============================================================================
/**
 * Get complete input validation middleware stack
 * Apply this before all route handlers for defense-in-depth
 *
 * @returns Array of validation middleware
 */
function getInputValidationMiddleware() {
    return [
        preventSQLInjection,
        preventNoSQLInjection,
        sanitizeBody,
    ];
}
//# sourceMappingURL=validateInput.js.map