/**
 * Performance Monitoring Middleware (T255)
 * Application Performance Monitoring (APM) and metrics collection
 * Based on: /specs/002-metapharm-platform/plan.md
 *
 * Features:
 * - Track request duration (latency)
 * - Identify slow endpoints (>1s)
 * - Database query duration tracking
 * - Memory usage monitoring
 * - Database connection pool statistics
 * - Response time percentiles (p50, p95, p99)
 * - Slow query detection and logging
 *
 * Usage:
 * app.use(performanceMonitor);
 */
import { Request, Response, NextFunction } from 'express';
export interface PerformanceMetrics {
    requestId: string;
    method: string;
    path: string;
    statusCode: number;
    duration: number;
    isSlowRequest: boolean;
    memory?: {
        heapUsed: number;
        heapTotal: number;
        external: number;
    };
    timestamp: string;
}
export interface QueryMetrics {
    query: string;
    duration: number;
    isSlowQuery: boolean;
    timestamp: string;
}
export interface ConnectionPoolStats {
    totalConnections: number;
    availableConnections: number;
    waitingRequests: number;
    averageConnectionTime: number;
}
/**
 * Record request duration and calculate percentiles
 */
export declare function recordDuration(duration: number): void;
/**
 * Get current performance statistics
 */
export declare function getPerformanceStats(): {
    p50: number;
    p95: number;
    p99: number;
    avg: number;
    max: number;
    min: number;
};
/**
 * Track database query performance
 */
export declare function trackDatabaseQuery(query: string, duration: number): void;
/**
 * Get memory statistics
 */
export declare function getMemoryStats(): {
    heapUsed: number;
    heapTotal: number;
    external: number;
    heapUsedPercent: number;
    rss: number;
};
export declare function checkForMemoryLeak(): {
    isLeaking: boolean;
    growth: number;
    growthPercent: number;
};
/**
 * Performance monitoring middleware
 * Tracks request duration and identifies slow requests
 */
export declare function performanceMonitor(req: Request, res: Response, next: NextFunction): void;
export default performanceMonitor;
//# sourceMappingURL=performanceMonitor.d.ts.map