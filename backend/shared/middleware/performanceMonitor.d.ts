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
export declare function recordDuration(duration: number): void;
export declare function getPerformanceStats(): {
    p50: number;
    p95: number;
    p99: number;
    avg: number;
    max: number;
    min: number;
};
export declare function trackDatabaseQuery(query: string, duration: number): void;
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
export declare function performanceMonitor(req: Request, res: Response, next: NextFunction): void;
export default performanceMonitor;
//# sourceMappingURL=performanceMonitor.d.ts.map