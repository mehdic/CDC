import { RateLimitRequestHandler } from 'express-rate-limit';
import { Request, Response } from 'express';
export declare function createRateLimiter(options: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    keyGenerator?: (req: Request) => string;
    handler?: (req: Request, res: Response) => void;
    message?: string;
    prefix?: string;
}): Promise<RateLimitRequestHandler>;
export declare function createGeneralRateLimiter(): Promise<RateLimitRequestHandler>;
export declare function createAuthRateLimiter(): Promise<RateLimitRequestHandler>;
export declare function createPasswordResetRateLimiter(): Promise<RateLimitRequestHandler>;
export declare function createMFARateLimiter(): Promise<RateLimitRequestHandler>;
export declare function createFileUploadRateLimiter(): Promise<RateLimitRequestHandler>;
export declare function resetRateLimit(prefix: string, key: string): Promise<void>;
export declare function getRateLimitStatus(prefix: string, key: string): Promise<{
    hits: number;
    ttl: number;
} | null>;
export declare function closeRateLimiterRedis(): Promise<void>;
//# sourceMappingURL=rateLimiter.d.ts.map