"use strict";
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
function validateSchema(schema, source = 'body') {
    return async (req, res, next) => {
        try {
            const data = req[source];
            const validated = await schema.parseAsync(data);
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
            console.error('Schema validation error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Validation processing failed',
                code: 'VALIDATION_PROCESSING_ERROR',
            });
        }
    };
}
function sanitizeHTML(html) {
    if (!html)
        return '';
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/data:/gi, '')
        .replace(/vbscript:/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
}
function sanitizeBody(req, res, next) {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }
    next();
}
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
function preventSQLInjection(req, res, next) {
    const checkValue = (value, path) => {
        if (typeof value === 'string' && detectSQLInjection(value)) {
            console.warn('SQL injection attempt detected', {
                path,
                value: value.substring(0, 100),
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
    if (checkValue(req.query, 'query')) {
        res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid input detected',
            code: 'INVALID_INPUT',
        });
        return;
    }
    if (checkValue(req.body, 'body')) {
        res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid input detected',
            code: 'INVALID_INPUT',
        });
        return;
    }
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
function detectNoSQLInjection(obj) {
    if (typeof obj === 'string') {
        return /\$where|\$ne|\$gt|\$lt|\$regex/.test(obj);
    }
    if (typeof obj === 'object' && obj !== null) {
        for (const key of Object.keys(obj)) {
            if (key.startsWith('$')) {
                return true;
            }
            if (detectNoSQLInjection(obj[key])) {
                return true;
            }
        }
    }
    return false;
}
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
function validateUploadedFile(file) {
    const errors = [];
    const config = (0, security_1.getFileUploadConfig)();
    if (file.size > config.maxFileSize) {
        errors.push(`File size exceeds maximum allowed size of ${config.maxFileSize / 1024 / 1024}MB`);
    }
    if (!config.allowedMimeTypes.includes(file.mimetype)) {
        errors.push(`File type ${file.mimetype} is not allowed. Allowed types: ${config.allowedMimeTypes.join(', ')}`);
    }
    const ext = path.extname(file.originalname).toLowerCase();
    if (!config.allowedExtensions.includes(ext)) {
        errors.push(`File extension ${ext} is not allowed. Allowed extensions: ${config.allowedExtensions.join(', ')}`);
    }
    if (file.originalname.includes('..') || file.originalname.includes('/')) {
        errors.push('Invalid file name');
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
}
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
exports.validateEmail = [
    (0, express_validator_1.body)('email')
        .trim()
        .isEmail()
        .withMessage('Invalid email address')
        .normalizeEmail()
        .isLength({ max: 255 })
        .withMessage('Email too long'),
];
const validateUUID = (field, location = 'param') => {
    const validator = location === 'param' ? express_validator_1.param : location === 'query' ? express_validator_1.query : express_validator_1.body;
    return validator(field)
        .trim()
        .isUUID()
        .withMessage(`${field} must be a valid UUID`);
};
exports.validateUUID = validateUUID;
const validateDate = (field, location = 'body') => {
    const validator = location === 'param' ? express_validator_1.param : location === 'query' ? express_validator_1.query : express_validator_1.body;
    return validator(field)
        .trim()
        .isISO8601()
        .withMessage(`${field} must be a valid ISO 8601 date`);
};
exports.validateDate = validateDate;
const validatePhone = (field) => {
    return (0, express_validator_1.body)(field)
        .trim()
        .isMobilePhone('any', { strictMode: false })
        .withMessage(`${field} must be a valid phone number`);
};
exports.validatePhone = validatePhone;
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
function getInputValidationMiddleware() {
    return [
        preventSQLInjection,
        preventNoSQLInjection,
        sanitizeBody,
    ];
}
//# sourceMappingURL=validateInput.js.map