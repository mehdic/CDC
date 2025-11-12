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
import { Request, Response, NextFunction } from 'express';
import { ValidationChain } from 'express-validator';
import { AnyZodObject } from 'zod';
/**
 * Check validation results and return errors
 * Use this after express-validator middleware
 *
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export declare function handleValidationErrors(req: Request, res: Response, next: NextFunction): void;
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
export declare function validateSchema(schema: AnyZodObject, source?: 'body' | 'query' | 'params'): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Sanitize HTML to prevent XSS attacks
 * Removes script tags, event handlers, and dangerous attributes
 *
 * @param html HTML string to sanitize
 * @returns Sanitized HTML string
 */
export declare function sanitizeHTML(html: string): string;
/**
 * Middleware to sanitize all string fields in request body
 * Prevents XSS attacks by removing dangerous HTML
 *
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export declare function sanitizeBody(req: Request, res: Response, next: NextFunction): void;
/**
 * Detect potential SQL injection attempts
 * This is a defense-in-depth measure - parameterized queries are the primary defense
 *
 * @param input Input string to check
 * @returns True if suspicious SQL patterns detected
 */
export declare function detectSQLInjection(input: string): boolean;
/**
 * Middleware to detect SQL injection attempts
 * Rejects requests with suspicious SQL patterns
 *
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export declare function preventSQLInjection(req: Request, res: Response, next: NextFunction): void;
/**
 * Detect potential NoSQL injection attempts
 * Prevents MongoDB operator injection ($where, $ne, etc.)
 *
 * @param obj Object to check
 * @returns True if suspicious NoSQL operators detected
 */
export declare function detectNoSQLInjection(obj: any): boolean;
/**
 * Middleware to prevent NoSQL injection
 * Rejects requests with MongoDB operators
 *
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export declare function preventNoSQLInjection(req: Request, res: Response, next: NextFunction): void;
/**
 * Validate uploaded file
 * Checks file size, MIME type, and extension
 *
 * @param file Multer file object
 * @returns Validation result
 */
export declare function validateUploadedFile(file: Express.Multer.File): {
    isValid: boolean;
    errors: string[];
};
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
export declare function validateFileUpload(req: Request, res: Response, next: NextFunction): void;
/**
 * Middleware to validate multiple file uploads
 *
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export declare function validateMultipleFileUploads(req: Request, res: Response, next: NextFunction): void;
/**
 * Validate email address
 */
export declare const validateEmail: ValidationChain[];
/**
 * Validate UUID
 */
export declare const validateUUID: (field: string, location?: "body" | "param" | "query") => ValidationChain;
/**
 * Validate date
 */
export declare const validateDate: (field: string, location?: "body" | "param" | "query") => ValidationChain;
/**
 * Validate phone number (international format)
 */
export declare const validatePhone: (field: string) => ValidationChain;
/**
 * Validate integer
 */
export declare const validateInteger: (field: string, location?: "body" | "param" | "query", options?: {
    min?: number;
    max?: number;
}) => ValidationChain;
/**
 * Validate string length
 */
export declare const validateString: (field: string, options?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
}) => ValidationChain;
/**
 * Get complete input validation middleware stack
 * Apply this before all route handlers for defense-in-depth
 *
 * @returns Array of validation middleware
 */
export declare function getInputValidationMiddleware(): (typeof preventSQLInjection)[];
//# sourceMappingURL=validateInput.d.ts.map