import { Request, Response, NextFunction } from 'express';
import { ValidationChain } from 'express-validator';
import { AnyZodObject } from 'zod';
export declare function handleValidationErrors(req: Request, res: Response, next: NextFunction): void;
export declare function validateSchema(schema: AnyZodObject, source?: 'body' | 'query' | 'params'): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare function sanitizeHTML(html: string): string;
export declare function sanitizeBody(req: Request, res: Response, next: NextFunction): void;
export declare function detectSQLInjection(input: string): boolean;
export declare function preventSQLInjection(req: Request, res: Response, next: NextFunction): void;
export declare function detectNoSQLInjection(obj: any): boolean;
export declare function preventNoSQLInjection(req: Request, res: Response, next: NextFunction): void;
export declare function validateUploadedFile(file: Express.Multer.File): {
    isValid: boolean;
    errors: string[];
};
export declare function validateFileUpload(req: Request, res: Response, next: NextFunction): void;
export declare function validateMultipleFileUploads(req: Request, res: Response, next: NextFunction): void;
export declare const validateEmail: ValidationChain[];
export declare const validateUUID: (field: string, location?: "body" | "param" | "query") => ValidationChain;
export declare const validateDate: (field: string, location?: "body" | "param" | "query") => ValidationChain;
export declare const validatePhone: (field: string) => ValidationChain;
export declare const validateInteger: (field: string, location?: "body" | "param" | "query", options?: {
    min?: number;
    max?: number;
}) => ValidationChain;
export declare const validateString: (field: string, options?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
}) => ValidationChain;
export declare function getInputValidationMiddleware(): (typeof preventSQLInjection)[];
//# sourceMappingURL=validateInput.d.ts.map