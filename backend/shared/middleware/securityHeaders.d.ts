/**
 * Security Headers Middleware (T248)
 * Implements OWASP security headers for defense-in-depth protection
 * Based on OWASP Secure Headers Project
 *
 * Features:
 * - Content Security Policy (CSP)
 * - CORS configuration
 * - HTTP Strict Transport Security (HSTS)
 * - X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
 * - Referrer-Policy, Permissions-Policy
 */
import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
/**
 * CORS (Cross-Origin Resource Sharing) middleware
 * Configures which origins can access the API
 *
 * Security considerations:
 * - Production: Strictly validate allowed origins
 * - Development: Allow all origins for easier testing
 * - Credentials: Allow cookies/auth headers in cross-origin requests
 */
export declare function configureCORS(): (req: cors.CorsRequest, res: {
    statusCode?: number | undefined;
    setHeader(key: string, value: string): any;
    end(): any;
}, next: (err?: any) => any) => void;
/**
 * Content Security Policy (CSP) middleware
 * Prevents XSS, clickjacking, and other code injection attacks
 *
 * CSP directives explained:
 * - defaultSrc: Fallback for other fetch directives
 * - scriptSrc: Controls JavaScript sources
 * - styleSrc: Controls stylesheet sources
 * - imgSrc: Controls image sources
 * - connectSrc: Controls AJAX, WebSocket, EventSource connections
 * - fontSrc: Controls font sources
 * - objectSrc: Controls <object>, <embed>, <applet> elements
 * - mediaSrc: Controls <audio> and <video> sources
 * - frameSrc: Controls <frame> and <iframe> sources
 */
export declare function configureCSP(): (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: Error) => void) => void;
/**
 * Configure all security headers using Helmet
 *
 * Headers configured:
 * - HSTS (HTTP Strict Transport Security): Force HTTPS
 * - X-Frame-Options: Prevent clickjacking
 * - X-Content-Type-Options: Prevent MIME sniffing
 * - X-XSS-Protection: Enable browser XSS protection
 * - Referrer-Policy: Control referer header
 * - Permissions-Policy: Control browser features (camera, microphone, etc.)
 *
 * @returns Express middleware
 */
export declare function configureSecurityHeaders(): (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void;
/**
 * Add custom security headers not covered by Helmet
 *
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export declare function addCustomSecurityHeaders(req: Request, res: Response, next: NextFunction): void;
/**
 * Get complete security middleware stack
 * Apply this to Express app for comprehensive security
 *
 * Usage:
 * ```typescript
 * import express from 'express';
 * import { getSecurityMiddleware } from './shared/middleware/securityHeaders';
 *
 * const app = express();
 * const securityMiddleware = getSecurityMiddleware();
 * securityMiddleware.forEach(middleware => app.use(middleware));
 * ```
 *
 * @returns Array of security middleware
 */
export declare function getSecurityMiddleware(): (((req: cors.CorsRequest, res: {
    statusCode?: number | undefined;
    setHeader(key: string, value: string): any;
    end(): any;
}, next: (err?: any) => any) => void) | typeof addCustomSecurityHeaders)[];
/**
 * Strict CSP for authentication pages
 * No inline scripts, no eval, no external resources
 *
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export declare function strictCSPForAuth(req: Request, res: Response, next: NextFunction): void;
/**
 * CSP for file upload pages
 * Allows data URIs for image previews
 *
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export declare function cspForFileUpload(req: Request, res: Response, next: NextFunction): void;
/**
 * CSP for teleconsultation pages
 * Allows WebRTC connections for video calls
 *
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export declare function cspForTeleconsultation(req: Request, res: Response, next: NextFunction): void;
/**
 * Strict CORS for authentication endpoints
 * Only allow configured origins, no wildcard
 *
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export declare function strictCORSForAuth(req: Request, res: Response, next: NextFunction): void;
/**
 * Log security configuration
 * Useful for debugging
 */
export declare function logSecurityHeadersConfig(): void;
/**
 * Check if request is from allowed origin
 *
 * @param req Express request
 * @returns True if origin is allowed
 */
export declare function isAllowedOrigin(req: Request): boolean;
/**
 * Get CSP nonce for inline scripts
 * Use this to allow specific inline scripts while blocking others
 *
 * Usage:
 * ```typescript
 * app.use((req, res, next) => {
 *   res.locals.cspNonce = generateCSPNonce();
 *   next();
 * });
 *
 * // In your template:
 * <script nonce="<%= cspNonce %>">...</script>
 * ```
 *
 * @returns Random nonce string
 */
export declare function generateCSPNonce(): string;
//# sourceMappingURL=securityHeaders.d.ts.map