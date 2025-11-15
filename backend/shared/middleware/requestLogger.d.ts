import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            requestId: string;
            userId?: string;
            correlationId?: string;
        }
    }
}
export declare function requestLogger(req: Request, res: Response, next: NextFunction): void;
export declare function attachRequestIdToLogs(req: Request, res: Response, next: NextFunction): void;
export default requestLogger;
//# sourceMappingURL=requestLogger.d.ts.map