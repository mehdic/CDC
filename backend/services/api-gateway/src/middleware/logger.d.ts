import { Request, Response } from 'express';
export declare const requestLogger: (req: import("http").IncomingMessage, res: import("http").ServerResponse<import("http").IncomingMessage>, callback: (err?: Error) => void) => void;
export declare function logRequest(req: Request, message: string, metadata?: Record<string, any>): void;
export declare function logError(req: Request, error: Error, metadata?: Record<string, any>): void;
export declare function shouldSkipLogging(req: Request, _res: Response): boolean;
export declare const requestLoggerWithSkip: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, callback: (err?: Error) => void) => void;
//# sourceMappingURL=logger.d.ts.map