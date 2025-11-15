import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
export declare function configureCORS(): (req: cors.CorsRequest, res: {
    statusCode?: number | undefined;
    setHeader(key: string, value: string): any;
    end(): any;
}, next: (err?: any) => any) => void;
export declare function configureCSP(): (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: Error) => void) => void;
export declare function configureSecurityHeaders(): (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void;
export declare function addCustomSecurityHeaders(req: Request, res: Response, next: NextFunction): void;
export declare function getSecurityMiddleware(): (((req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void) | ((req: cors.CorsRequest, res: {
    statusCode?: number | undefined;
    setHeader(key: string, value: string): any;
    end(): any;
}, next: (err?: any) => any) => void))[];
export declare function strictCSPForAuth(req: Request, res: Response, next: NextFunction): void;
export declare function cspForFileUpload(req: Request, res: Response, next: NextFunction): void;
export declare function cspForTeleconsultation(req: Request, res: Response, next: NextFunction): void;
export declare function strictCORSForAuth(req: Request, res: Response, next: NextFunction): void;
export declare function logSecurityHeadersConfig(): void;
export declare function isAllowedOrigin(req: Request): boolean;
export declare function generateCSPNonce(): string;
//# sourceMappingURL=securityHeaders.d.ts.map