/**
 * Distributed Tracing Middleware (T257)
 * Implements OpenTelemetry distributed tracing
 * Based on: /specs/002-metapharm-platform/plan.md
 *
 * Features:
 * - Trace API requests across services
 * - Trace database queries
 * - Correlate logs with traces
 * - Span attributes: service, operation, userId, requestId
 * - Trace context propagation via W3C Trace Context
 * - Automatic instrumentation of common operations
 *
 * Usage:
 * // Initialize tracing at app startup
 * initializeTracing();
 *
 * // Use tracing middleware
 * app.use(tracingMiddleware);
 *
 * // Create spans for operations
 * const span = createSpan('operation_name');
 * // ... do work ...
 * span.end();
 *
 * // Or use async context
 * await withSpan('operation_name', async (span) => {
 *   span.setAttribute('userId', userId);
 *   // ... do work ...
 * });
 */
import { Request, Response, NextFunction } from 'express';
import * as api from '@opentelemetry/api';
export interface SpanAttributes {
    [key: string]: string | number | boolean | string[] | number[] | boolean[];
}
/**
 * Initialize OpenTelemetry tracing
 * Should be called at application startup (before creating any spans)
 */
export declare function initializeTracing(options?: {
    serviceName?: string;
    environment?: string;
    exporterUrl?: string;
    enableConsoleExporter?: boolean;
}): void;
/**
 * Get the global tracer instance
 */
export declare function getTracer(): api.Tracer;
/**
 * Get current span
 */
export declare function getCurrentSpan(): api.Span | undefined;
/**
 * Create a new span
 */
export declare function createSpan(name: string, attributes?: SpanAttributes): api.Span;
/**
 * Run code within a span context
 */
export declare function withSpan<T>(name: string, fn: (span: api.Span) => Promise<T>, attributes?: SpanAttributes): Promise<T>;
/**
 * Run synchronous code within a span context
 */
export declare function withSpanSync<T>(name: string, fn: (span: api.Span) => T, attributes?: SpanAttributes): T;
/**
 * Trace a database query
 */
export declare function traceDbQuery<T>(query: string, operation: string, table: string, fn: () => Promise<T>): Promise<T>;
/**
 * Tracing middleware for Express
 * Creates a span for each HTTP request
 */
export declare function tracingMiddleware(req: Request, res: Response, next: NextFunction): void;
/**
 * Trace an external HTTP call
 */
export declare function traceExternalCall<T>(service: string, method: string, url: string, fn: () => Promise<T>): Promise<T>;
/**
 * Trace a cache operation
 */
export declare function traceCacheOperation<T>(operation: 'get' | 'set' | 'delete', key: string, cacheName: string, fn: () => Promise<T>): Promise<T>;
/**
 * Add event to current span
 */
export declare function addSpanEvent(name: string, attributes?: SpanAttributes): void;
/**
 * Set attribute on current span
 */
export declare function setSpanAttribute(key: string, value: any): void;
/**
 * Record exception in current span
 */
export declare function recordException(error: Error): void;
declare const _default: {
    initializeTracing: typeof initializeTracing;
    getTracer: typeof getTracer;
    getCurrentSpan: typeof getCurrentSpan;
    createSpan: typeof createSpan;
    withSpan: typeof withSpan;
    withSpanSync: typeof withSpanSync;
    traceDbQuery: typeof traceDbQuery;
    traceExternalCall: typeof traceExternalCall;
    traceCacheOperation: typeof traceCacheOperation;
    tracingMiddleware: typeof tracingMiddleware;
    addSpanEvent: typeof addSpanEvent;
    setSpanAttribute: typeof setSpanAttribute;
    recordException: typeof recordException;
};
export default _default;
//# sourceMappingURL=tracing.d.ts.map